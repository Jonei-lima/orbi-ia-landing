import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ID do pixel "Orbi Agro" no Business Manager ORBI IA 2026.
// NÃO reutilizar com outro nicho — cada LP tem o próprio pixel e o próprio token CAPI.
const META_PIXEL_ID = "1029192646552967";

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
  const accessToken = process.env.META_CAPI_TOKEN_AGRO;
  if (!accessToken) {
    console.error("META_CAPI_TOKEN_AGRO não configurado — pulando envio CAPI (pixel do navegador continua funcionando normal).");
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
        event_source_url: "https://agenteorbiia.com/agro",
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
      fazenda,
      municipio,
      hectares_aproximado,
      culturas,
      event_id,
      fbp,
      fbc,
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

    // =====================
    // 1️⃣ SALVAR NO BANCO (tabela compartilhada "leads")
    // =====================
    const { error } = await supabase.from("leads").insert([
      {
        name: nome,
        phone: telefone,
        segment: "agro",
        source: "chat_landing_agro",
        fazenda: fazenda || null,
        municipio: municipio || null,
        hectares_aproximado: hectares_aproximado || null,
        culturas: culturas || null,
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
        subject: `🌾 Novo Lead - Agro: ${fazenda || nome}`,
        html: `
          <h2>🌾 Novo Lead - Agro</h2>
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Telefone:</strong> ${telefone}</p>
          <p><strong>Fazenda:</strong> ${fazenda || "não informado ainda"}</p>
          <p><strong>Município:</strong> ${municipio || "não informado ainda"}</p>
          <p><strong>Hectares (aprox.):</strong> ${hectares_aproximado || "não informado ainda"}</p>
          <p><strong>Culturas:</strong> ${culturas || "não informado ainda"}</p>
        `,
      }),
    });
    console.log("RESEND STATUS:", resendResponse.status);

    // =====================
    // 3️⃣ ENVIAR WHATSAPP (EVOLUTION) - notifica VOCÊ
    // Instância: ORBI_Trafego
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
          text: `🌾 Novo Lead - Agro\n\nNome: ${nome}\nTelefone: ${telefone}\nFazenda: ${fazenda || "não informado ainda"}\nMunicípio: ${municipio || "não informado ainda"}\nHectares: ${hectares_aproximado || "não informado ainda"}\nCulturas: ${culturas || "não informado ainda"}`,
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
