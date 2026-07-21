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

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// Normaliza telefone BR pro formato que o Meta espera pra hash: só dígitos,
// com código do país (55) na frente.
function normalizePhoneBR(raw?: string | null) {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (!digits.startsWith("55")) digits = "55" + digits;
  return digits;
}

async function sendMetaCAPI(params: {
  telefone?: string;
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

  const phoneDigits = normalizePhoneBR(params.telefone);
  const userData: Record<string, any> = {};
  if (phoneDigits) userData.ph = [sha256(phoneDigits)];
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

    // =====================
    // 1️⃣ SALVAR NO BANCO (tabela compartilhada "leads")
    // Agora também gravando email + utm_source/utm_medium/utm_campaign/utm_content/utm_term/fbclid
    // (mesma tabela usada por agro/contador/clinicas — colunas já existem via
    // add-colunas-agro-utm.sql, rodado uma vez só).
    // =====================
    const { error } = await supabase.from("leads").insert([
      {
        name: nome,
        phone: telefone,
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
      },
    ]);

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
          <p><strong>E-mail:</strong> ${email || "não informado ainda"}</p>
          <p><strong>Origem:</strong> ${utm_source || "direto/não identificado"} ${utm_campaign ? `· Campanha: ${utm_campaign}` : ""}</p>
        `,
      }),
    });
    console.log("RESEND STATUS:", resendResponse.status);

    // =====================
    // 3️⃣ ENVIAR WHATSAPP (EVOLUTION) — notifica VOCÊ
    // ⚠️ ATENÇÃO: a instância ORBI_Trafego estava com restrição da Meta
    // (falha silenciosa, status PENDING/500). Confirme que reconectou antes
    // de contar com esse canal — o e-mail acima é o canal confiável hoje.
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
          text: `⚖️ Novo Lead - Advogados\n\nNome: ${nome}\nTelefone: ${telefone}\nÁrea: ${area_atuacao || "não informado ainda"}\nCidade: ${cidade || "não informado ainda"}\nClientes ativos: ${clientes_ativos_aproximado || "não informado ainda"}\nE-mail: ${email || "não informado ainda"}`,
        }),
      }
    );
    console.log("EVOLUTION STATUS:", evolutionResponse.status);

    // =====================
    // 4️⃣ META CONVERSIONS API — evento Lead server-side
    // Resiliente a ad blocker / Safari ITP / cookie bloqueado no navegador.
    // Usa o MESMO event_id que o fbq() do navegador manda, pra Meta deduplicar
    // e não contar o lead 2x.
    // =====================
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    await sendMetaCAPI({
      telefone,
      eventId: event_id,
      fbp,
      fbc,
      clientIp,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ERRO GERAL:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
