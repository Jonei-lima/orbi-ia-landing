import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const META_PIXEL_ID = "1030105936066490";
const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN_ADV;
const EVENT_SOURCE_URL = "https://www.agenteorbiia.com/advogados";

function sha256(value: string) {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizePhoneBR(raw: string) {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return "55" + digits;
}

// Divide "João da Silva" em primeiro/último nome pra Advanced Matching (fn/ln).
function splitNome(nomeCompleto: string) {
  const partes = (nomeCompleto || "").trim().split(/\s+/).filter(Boolean);
  const primeiro = partes[0] || "";
  const ultimo = partes.length > 1 ? partes[partes.length - 1] : "";
  return { primeiro, ultimo };
}

async function sendMetaCAPI(params: {
  nome: string;
  telefoneNormalizado: string;
  cidade?: string | null;
  eventId: string;
  fbp?: string | null;
  fbc?: string | null;
  clientIp?: string;
  userAgent?: string;
}) {
  if (!META_CAPI_TOKEN) {
    console.error("META_CAPI_TOKEN_ADV não configurado — pulando CAPI.");
    return;
  }
  const { nome, telefoneNormalizado, cidade, eventId, fbp, fbc, clientIp, userAgent } = params;
  const { primeiro, ultimo } = splitNome(nome);

  const userData: Record<string, any> = {
    ph: [sha256(telefoneNormalizado)],
  };
  if (primeiro) userData.fn = [sha256(primeiro)];
  if (ultimo) userData.ln = [sha256(ultimo)];
  if (cidade) userData.ct = [sha256(cidade)];
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;
  if (clientIp) userData.client_ip_address = clientIp;
  if (userAgent) userData.client_user_agent = userAgent;

  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "chat",
        event_source_url: EVENT_SOURCE_URL,
        user_data: userData,
        custom_data: {
          content_name: "Lead Advogados ORBI",
          content_category: "Lead Qualificado",
          value: 120.0,
          currency: "BRL",
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      console.error("META CAPI ERRO:", data);
    } else {
      console.log("META CAPI OK:", data);
    }
  } catch (err) {
    console.error("META CAPI FALHA:", err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      nome,
      telefone,
      area_atuacao,
      cidade,
      clientes_ativos_aproximado,
      event_id,
      fbp,
      fbc,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      fbclid,
    } = body;

    // Lead vem de conversa em andamento (igual ao agro) — campos chegam aos
    // poucos. Mínimo pra um contato ser útil: nome e telefone.
    if (!nome || !telefone) {
      return NextResponse.json(
        { success: false, error: "Nome e telefone são obrigatórios." },
        { status: 400 }
      );
    }

    const telefoneNormalizado = normalizePhoneBR(telefone);

    // =====================
    // 1️⃣ SALVAR NO BANCO (tabela compartilhada "leads")
    // ⚠️ ANTES DO PRIMEIRO DEPLOY: confirmar que já rodou (uma única vez, serve
    // pra todas as verticais, é a mesma tabela):
    //
    //   ALTER TABLE leads
    //     ADD COLUMN IF NOT EXISTS area_atuacao text,
    //     ADD COLUMN IF NOT EXISTS cidade text,
    //     ADD COLUMN IF NOT EXISTS clientes_ativos_aproximado text,
    //     ADD COLUMN IF NOT EXISTS utm_source text,
    //     ADD COLUMN IF NOT EXISTS utm_medium text,
    //     ADD COLUMN IF NOT EXISTS utm_campaign text,
    //     ADD COLUMN IF NOT EXISTS utm_content text,
    //     ADD COLUMN IF NOT EXISTS utm_term text,
    //     ADD COLUMN IF NOT EXISTS fbclid text;
    //
    // Sem isso, o insert abaixo FALHA (coluna inexistente) e o lead se perde
    // silenciosamente do banco.
    // =====================
    const { error } = await supabase
      .from("leads")
      .insert([{
        name: nome,
        phone: telefoneNormalizado,
        segment: "advogados",
        source: "chat_landing_advogados",
        area_atuacao: area_atuacao || null,
        cidade: cidade || null,
        clientes_ativos_aproximado: clientes_ativos_aproximado || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_content: utm_content || null,
        utm_term: utm_term || null,
        fbclid: fbclid || null,
      }]);

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return NextResponse.json(
        { success: false, error: "Erro banco." },
        { status: 500 }
      );
    }

    // =====================
    // 2️⃣ ENVIAR EMAIL (RESEND)
    // =====================
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "contato@agenteorbiia.com",
        to: ["contato@agenteorbiia.com"],
        subject: `⚖️ Novo Lead - Advogados: ${nome}${area_atuacao ? " (" + area_atuacao + ")" : ""}`,
        html: `
          <h2>⚖️ Novo Lead - Advogados</h2>
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Telefone:</strong> ${telefone}</p>
          <p><strong>Área de atuação:</strong> ${area_atuacao || "não informado ainda"}</p>
          <p><strong>Cidade/UF:</strong> ${cidade || "não informado ainda"}</p>
          <p><strong>Clientes ativos (aprox.):</strong> ${clientes_ativos_aproximado || "não informado ainda"}</p>
          <p><strong>Origem:</strong> ${utm_source || "direto/não identificado"} ${utm_campaign ? `· Campanha: ${utm_campaign}` : ""}</p>
        `,
      }),
    });
    console.log("RESEND STATUS:", resendResponse.status);

    // =====================
    // 3️⃣ ENVIAR WHATSAPP (EVOLUTION) — notifica VOCÊ
    // ⚠️ ATENÇÃO: a instância ORBI_Trafego está com restrição da Meta
    // (falha silenciosa, status PENDING). Enquanto isso não for resolvido,
    // este aviso pode não chegar — o e-mail acima é o canal confiável.
    // Se tiver outra instância saudável, troque o nome na URL abaixo.
    // =====================
    const evolutionResponse = await fetch(
      `${process.env.EVOLUTION_URL}/message/sendText/ORBI_Trafego`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.EVOLUTION_API_KEY!,
        },
        body: JSON.stringify({
          number: "5566981320667",
          text: `⚖️ Novo Lead - Advogados\n\nNome: ${nome}\nTelefone: ${telefone}\nÁrea: ${area_atuacao || "não informado ainda"}\nCidade: ${cidade || "não informado ainda"}\nClientes ativos: ${clientes_ativos_aproximado || "não informado ainda"}`,
        }),
      }
    );
    console.log("EVOLUTION STATUS:", evolutionResponse.status);

    // =====================
    // 4️⃣ Meta CAPI — mesmo event_id do fbq disparado no navegador (dedup),
    // Advanced Matching com telefone + nome (fn/ln) + cidade (ct) hasheados,
    // + fbp/fbc + IP/user-agent quando disponíveis.
    // =====================
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const userAgent = req.headers.get("user-agent") || undefined;
    const eventId = event_id || crypto.randomUUID();

    await sendMetaCAPI({
      nome,
      telefoneNormalizado,
      cidade,
      eventId,
      fbp,
      fbc,
      clientIp,
      userAgent,
    });

    return NextResponse.json({ success: true, eventId });
  } catch (error: any) {
    console.error("ERRO GERAL:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
