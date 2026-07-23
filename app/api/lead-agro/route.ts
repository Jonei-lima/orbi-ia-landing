import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const META_PIXEL_ID = "1029192646552967";
const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN_AGRO;
const EVENT_SOURCE_URL = "https://www.agenteorbiia.com/agro";

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
  municipio?: string | null;
  eventId: string;
  fbp?: string | null;
  fbc?: string | null;
  clientIp?: string;
  userAgent?: string;
}) {
  if (!META_CAPI_TOKEN) {
    console.error("META_CAPI_TOKEN_AGRO não configurado — pulando CAPI.");
    return;
  }
  const { nome, telefoneNormalizado, municipio, eventId, fbp, fbc, clientIp, userAgent } = params;
  const { primeiro, ultimo } = splitNome(nome);

  const userData: Record<string, any> = {
    ph: [sha256(telefoneNormalizado)],
  };
  if (primeiro) userData.fn = [sha256(primeiro)];
  if (ultimo) userData.ln = [sha256(ultimo)];
  if (municipio) userData.ct = [sha256(municipio)];
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
          content_name: "Lead Agro ORBI",
          content_category: "Lead Qualificado",
          value: 85.0,
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
      fazenda,
      municipio,
      hectares_aproximado,
      culturas,
      email,
      mostrar_link,
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

    // Diferente do lead-clinicas (formulário preenchido de uma vez só),
    // aqui o lead vem de uma conversa em andamento — os campos chegam aos
    // poucos. Exigimos só o mínimo pra um contato ser útil: nome e telefone.
    if (!nome || !telefone) {
      return NextResponse.json(
        { success: false, error: "Nome e telefone são obrigatórios." },
        { status: 400 }
      );
    }

    const telefoneNormalizado = normalizePhoneBR(telefone);

    // Busca se esse telefone já existe (tabela "leads" é compartilhada entre os
    // 4 verticais, UNIQUE em phone). Sem essa checagem, um insert() cego quebra
    // com "duplicate key" toda vez que o telefone já apareceu antes — em
    // QUALQUER vertical, não só no Agro — e a função morre ali, sem notificar
    // nada. Foi exatamente isso que aconteceu com o Contador no teste de hoje.
    const { data: existente } = await supabase
      .from("leads")
      .select("id, handoff_enviado")
      .eq("phone", telefoneNormalizado)
      .maybeSingle();

    // =====================
    // SEMPRE salva/atualiza — protege contra perder o lead se a pessoa sumir
    // no meio da conversa, e evita o erro de chave duplicada. UTM/fbclid só
    // são gravados na criação, pra manter a origem original do lead.
    // =====================
    if (existente) {
      const { error } = await supabase
        .from("leads")
        .update({
          name: nome,
          fazenda: fazenda || null,
          municipio: municipio || null,
          hectares_aproximado: hectares_aproximado || null,
          culturas: culturas || null,
          email: email || null,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", existente.id);
      if (error) {
        console.error("SUPABASE ERROR:", error);
        return NextResponse.json({ success: false, error: "Erro banco." }, { status: 500 });
      }
    } else {
      const { error } = await supabase
        .from("leads")
        .insert([{
          name: nome,
          phone: telefoneNormalizado,
          segment: "agro",
          source: "chat_landing_agro",
          fazenda: fazenda || null,
          municipio: municipio || null,
          hectares_aproximado: hectares_aproximado || null,
          culturas: culturas || null,
          email: email || null,
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          utm_content: utm_content || null,
          utm_term: utm_term || null,
          fbclid: fbclid || null,
          last_seen_at: new Date().toISOString(),
        }]);
      if (error) {
        console.error("SUPABASE ERROR:", error);
        return NextResponse.json({ success: false, error: "Erro banco." }, { status: 500 });
      }
    }

    // =====================
    // Só dispara e-mail + WhatsApp + CAPI quando a IA sinalizar "mostrar_link":true
    // (ela só faz isso depois da pergunta/confirmação final — ver chat-agro-route),
    // e só uma vez por telefone (reaproveita handoff_enviado, mesma coluna da Clínicas).
    // Sem isso, todo turno da conversa (nome+telefone já capturados) disparava
    // notificação completa com o resto ainda em branco.
    // =====================
    const jaNotificado = existente?.handoff_enviado === true;
    if (!mostrar_link || jaNotificado) {
      return NextResponse.json({ success: true, notified: false });
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
        subject: `🌾 Novo Lead - Agro: ${fazenda || nome}`,
        html: `
          <h2>🌾 Novo Lead - Agro</h2>
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Telefone:</strong> ${telefone}</p>
          <p><strong>Fazenda:</strong> ${fazenda || "não informado ainda"}</p>
          <p><strong>Município:</strong> ${municipio || "não informado ainda"}</p>
          <p><strong>Hectares (aprox.):</strong> ${hectares_aproximado || "não informado ainda"}</p>
          <p><strong>Culturas:</strong> ${culturas || "não informado ainda"}</p>
          <p><strong>E-mail:</strong> ${email || "não informado ainda"}</p>
          <p><strong>Origem:</strong> ${utm_source || "direto/não identificado"} ${utm_campaign ? `· Campanha: ${utm_campaign}` : ""}</p>
        `,
      }),
    });
    console.log("RESEND STATUS:", resendResponse.status);

    // =====================
    // 3️⃣ ENVIAR WHATSAPP (Z-API) - notifica VOCÊ
    // =====================
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
          message: `🌾 Novo Lead - Agro\n\nNome: ${nome}\nTelefone: ${telefone}\nFazenda: ${fazenda || "não informado ainda"}\nMunicípio: ${municipio || "não informado ainda"}\nHectares: ${hectares_aproximado || "não informado ainda"}\nCulturas: ${culturas || "não informado ainda"}\nE-mail: ${email || "não informado ainda"}`,
        }),
      }
    );
    console.log("ZAPI STATUS:", zapiResponse.status);

    // Marca como notificado, pra nunca reenviar de novo pro mesmo telefone
    const { error: marcaError } = await supabase
      .from("leads")
      .update({ handoff_enviado: true })
      .eq("phone", telefoneNormalizado);
    if (marcaError) console.error("ERRO AO MARCAR handoff_enviado:", marcaError);

    // =====================
    // 4️⃣ Meta CAPI — mesmo event_id do fbq disparado no navegador (dedup),
    // Advanced Matching com telefone + nome (fn/ln) + município (ct) hasheados,
    // + fbp/fbc + IP/user-agent quando disponíveis.
    // =====================
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const userAgent = req.headers.get("user-agent") || undefined;
    const eventId = event_id || crypto.randomUUID();

    await sendMetaCAPI({
      nome,
      telefoneNormalizado,
      municipio,
      eventId,
      fbp,
      fbc,
      clientIp,
      userAgent,
    });

    return NextResponse.json({ success: true, notified: true, eventId });
  } catch (error: any) {
    console.error("ERRO GERAL:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
