import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ID do pixel "Orbi ADV" no Business Manager ORBI IA 2026.
// NÃO reutilizar com outro nicho — cada LP tem o próprio pixel e o próprio token CAPI.
const META_PIXEL_ID = "1030105936066490";

// Trim + lowercase antes de hashear — Meta espera exatamente essa normalização
// pra bater com o hash que ele calcula do lado dele (email/nome/cidade). Sem
// isso, fn/ln/ct podem sair "preenchidos" no payload mas não terem match nenhum.
function sha256(input: string) {
  return crypto.createHash("sha256").update(input.trim().toLowerCase()).digest("hex");
}

// Normaliza telefone BR pro formato que o Meta espera pra hash, e também pro
// formato ÚNICO usado na coluna "phone" da tabela compartilhada: só dígitos,
// com código do país (55) na frente. Antes esse arquivo salvava o telefone
// cru (sem normalizar) no banco — diferente de Agro/Contador/Clínicas, o que
// quebrava a ideia de "telefone único" entre os 4 verticais.
function normalizePhoneBR(raw?: string | null) {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (!digits.startsWith("55")) digits = "55" + digits;
  return digits;
}

// Divide "João da Silva" em primeiro/último nome pra Advanced Matching (fn/ln).
function splitNome(nomeCompleto?: string | null) {
  const partes = (nomeCompleto || "").trim().split(/\s+/).filter(Boolean);
  const primeiro = partes[0] || "";
  const ultimo = partes.length > 1 ? partes[partes.length - 1] : "";
  return { primeiro, ultimo };
}

async function sendMetaCAPI(params: {
  nome?: string;
  telefoneNormalizado?: string | null;
  cidade?: string | null;
  eventId?: string;
  fbp?: string;
  fbc?: string;
  clientIp?: string;
  userAgent?: string;
}) {
  const accessToken = process.env.META_CAPI_TOKEN_ADV;
  if (!accessToken) {
    console.error("META_CAPI_TOKEN_ADV não configurado — pulando envio CAPI (pixel do navegador continua funcionando normal).");
    return;
  }

  const { primeiro, ultimo } = splitNome(params.nome);

  const userData: Record<string, any> = {};
  if (params.telefoneNormalizado) userData.ph = [sha256(params.telefoneNormalizado)];
  if (primeiro) userData.fn = [sha256(primeiro)];
  if (ultimo) userData.ln = [sha256(ultimo)];
  if (params.cidade) userData.ct = [sha256(params.cidade)];
  if (params.fbp) userData.fbp = params.fbp;
  if (params.fbc) userData.fbc = params.fbc;
  if (params.clientIp) userData.client_ip_address = params.clientIp;
  if (params.userAgent) userData.client_user_agent = params.userAgent;

  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: params.eventId, // mesmo event_id do fbq() no navegador -> evita contar o lead 2x
        action_source: "chat",
        event_source_url: "https://agenteorbiia.com/advogados",
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
      `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    if (!res.ok) {
      console.error("META CAPI ERROR:", res.status, json);
    } else {
      console.log("META CAPI OK:", json);
    }
  } catch (err) {
    console.error("META CAPI FETCH FAILED:", err);
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

    // Lead vem de conversa em andamento (igual ao agro) — campos chegam aos
    // poucos. Mínimo pra um contato ser útil: nome e telefone.
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
    // QUALQUER vertical — e a função morre ali, sem notificar nada.
    const { data: existente } = await supabase
      .from("leads")
      .select("id, handoff_enviado")
      .eq("phone", telefoneNormalizado)
      .maybeSingle();

    // =====================
    // SEMPRE salva/atualiza — protege contra perder o lead e evita o erro de
    // chave duplicada. UTM/fbclid só são gravados na criação. Telefone agora
    // normalizado (igual Agro/Contador/Clínicas), não mais salvo cru.
    // =====================
    if (existente) {
      const { error } = await supabase
        .from("leads")
        .update({
          name: nome,
          area_atuacao: area_atuacao || null,
          cidade: cidade || null,
          clientes_ativos_aproximado: clientes_ativos_aproximado || null,
          email: email || null,
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", existente.id);
      if (error) {
        console.error("SUPABASE ERROR:", error);
        return NextResponse.json({ success: false, error: "Erro banco." }, { status: 500 });
      }
    } else {
      const { error } = await supabase.from("leads").insert([
        {
          name: nome,
          phone: telefoneNormalizado,
          segment: "advogados",
          source: "chat_landing_advogados",
          area_atuacao: area_atuacao || null,
          cidade: cidade || null,
          clientes_ativos_aproximado: clientes_ativos_aproximado || null,
          email: email || null,
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          utm_content: utm_content || null,
          utm_term: utm_term || null,
          fbclid: fbclid || null,
          last_seen_at: new Date().toISOString(),
        },
      ]);
      if (error) {
        console.error("SUPABASE ERROR:", error);
        return NextResponse.json({ success: false, error: "Erro banco." }, { status: 500 });
      }
    }

    // =====================
    // Só dispara e-mail + WhatsApp + CAPI quando a IA sinalizar "mostrar_link":true,
    // e só uma vez por telefone (reaproveita handoff_enviado, mesma coluna da Clínicas).
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
        subject: `⚖️ Novo Lead - Advogados: ${nome}${area_atuacao ? " (" + area_atuacao + ")" : ""}`,
        html: `
          <h2>⚖️ Novo Lead - Advogados</h2>
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Telefone:</strong> ${telefone}</p>
          <p><strong>Área de atuação:</strong> ${area_atuacao || "não informado ainda"}</p>
          <p><strong>Cidade/UF:</strong> ${cidade || "não informado ainda"}</p>
          <p><strong>Clientes ativos (aprox.):</strong> ${clientes_ativos_aproximado || "não informado ainda"}</p>
          <p><strong>E-mail:</strong> ${email || "não informado ainda"}</p>
          <p><strong>Origem:</strong> ${utm_source || "direto/não identificado"} ${utm_campaign ? `· Campanha: ${utm_campaign}` : ""}</p>
        `,
      }),
    });
    console.log("RESEND STATUS:", resendResponse.status);

    // =====================
    // 3️⃣ ENVIAR WHATSAPP (Z-API) — notifica VOCÊ
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
          message: `⚖️ Novo Lead - Advogados\n\nNome: ${nome}\nTelefone: ${telefone}\nÁrea: ${area_atuacao || "não informado ainda"}\nCidade: ${cidade || "não informado ainda"}\nClientes ativos: ${clientes_ativos_aproximado || "não informado ainda"}\nE-mail: ${email || "não informado ainda"}`,
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
    // 4️⃣ META CONVERSIONS API — evento Lead server-side
    // Advanced Matching agora com telefone + nome (fn/ln) + cidade (ct) hasheados
    // — igual ao Agro/Contador/Clínicas.
    // =====================
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    await sendMetaCAPI({
      nome,
      telefoneNormalizado,
      cidade,
      eventId: event_id,
      fbp,
      fbc,
      clientIp,
      userAgent,
    });

    return NextResponse.json({ success: true, notified: true });
  } catch (error: any) {
    console.error("ERRO GERAL:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
