import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rótulo legível por vertical (coluna "segment" na tabela leads).
// Clínicas usa o nome da área (estetica/odontologica/medica/fisioterapia)
// direto no "segment", então cai no "outro" e mostra o valor cru.
const SEGMENT_LABEL: Record<string, string> = {
  agro: "🌾 Agro",
  contador: "📊 Contador",
  advogados: "⚖️ Advogados",
};

// Monta a lista de campos já coletados, pulando os que ainda são nulos —
// evita repetir "não informado ainda" que já causou confusão antes.
function montaCamposColetados(lead: Record<string, any>) {
  const campos: [string, any][] = [
    ["Fazenda", lead.fazenda],
    ["Município", lead.municipio],
    ["Hectares (aprox.)", lead.hectares_aproximado],
    ["Culturas", lead.culturas],
    ["Escritório/Empresa", lead.escritorio],
    ["Qtd. clientes (aprox.)", lead.quantidade_clientes_aproximada],
    ["Perfil de carteira", lead.perfil_carteira],
    ["Área de atuação", lead.area_atuacao],
    ["Cidade", lead.cidade],
    ["Clínica", lead.clinica],
    ["Diagnóstico", lead.resumo_conversa],
    ["E-mail", lead.email],
  ];
  return campos
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([label, v]) => `${label}: ${v}`)
    .join("\n");
}

function autorizado(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // sem secret configurado, bloqueia por padrão
  const url = new URL(req.url);
  const tokenQuery = url.searchParams.get("token");
  const authHeader = req.headers.get("authorization");
  const tokenHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return tokenQuery === secret || tokenHeader === secret;
}

export async function GET(req: Request) {
  if (!autorizado(req)) {
    return NextResponse.json({ success: false, error: "Não autorizado." }, { status: 401 });
  }

  try {
    const limiteMs = 10 * 60 * 1000; // 10 minutos
    const cutoff = new Date(Date.now() - limiteMs).toISOString();

    const { data: leadsAbandonados, error } = await supabase
      .from("leads")
      .select("*")
      // handoff_enviado ainda não é true (nulo ou false — cobre linhas antigas
      // que nunca tiveram a coluna setada)
      .or("handoff_enviado.is.null,handoff_enviado.eq.false")
      .eq("abandono_notificado", false)
      .lt("last_seen_at", cutoff)
      .not("name", "is", null)
      .not("phone", "is", null);

    if (error) {
      console.error("SUPABASE ERROR (check-abandoned-leads):", error);
      return NextResponse.json({ success: false, error: "Erro banco." }, { status: 500 });
    }

    const leads = leadsAbandonados || [];
    let notificados = 0;

    for (const lead of leads) {
      const segmentoLabel = SEGMENT_LABEL[lead.segment] || lead.segment || "não informado";
      const camposColetados = montaCamposColetados(lead);

      const texto =
        `⚠️ Lead abandonado (${segmentoLabel})\n\n` +
        `Entrou em contato mas parou no meio da conversa.\n\n` +
        `Nome: ${lead.name}\n` +
        `Telefone: ${lead.phone}` +
        (camposColetados ? `\n${camposColetados}` : "");

      try {
        const zapiResponse = await fetch(
          `${process.env.ZAPI_URL}/send-text`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Client-Token": process.env.ZAPI_CLIENT_TOKEN!,
            },
            body: JSON.stringify({
              phone: "5566981320667",
              message: texto,
            }),
          }
        );
        console.log(`ZAPI ABANDONO STATUS (${lead.phone}):`, zapiResponse.status);

        const { error: marcaError } = await supabase
          .from("leads")
          .update({ abandono_notificado: true })
          .eq("id", lead.id);
        if (marcaError) {
          console.error("ERRO AO MARCAR abandono_notificado:", marcaError);
          continue;
        }
        notificados++;
      } catch (err) {
        console.error(`ERRO ao notificar abandono do lead ${lead.id}:`, err);
        // Não marca abandono_notificado — tenta de novo na próxima rodada do cron.
      }
    }

    return NextResponse.json({ success: true, verificados: leads.length, notificados });
  } catch (error: any) {
    console.error("ERRO GERAL (check-abandoned-leads):", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}
