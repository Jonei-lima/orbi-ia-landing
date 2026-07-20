import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ID do pixel "Orbi Contador" no Business Manager ORBI IA 2026.
// NÃO reutilizar com outro nicho — cada LP tem o próprio pixel e o próprio token CAPI.
const META_PIXEL_ID = "3122808851241867";

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// Normaliza telefone BR pro formato que o Meta espera pra hash: só dígitos,
// com código do país (55) na frente. Ex: "(66) 98132-0667" -> "5566981320667"
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
  const accessToken = process.env.META_CAPI_TOKEN_CONTADOR;
  if (!accessToken) {
    console.error("META_CAPI_TOKEN_CONTADOR não configurado — pulando envio CAPI (pixel do navegador continua funcionando normal).");
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
        event_source_url: "https://agenteorbiia.com/contador",
        user_data: userData,
        custom_data: {
          content_name: "Lead Contador ORBI",
          content_category: "Lead Qualificado",
          value: 100.0,
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
      escritorio,
      municipio,
      quantidade_clientes_aproximada,
      perfil_carteira,
      event_id,
      fbp,
      fbc,
    } = body;

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
        segment: "contador",
        source: "chat_landing_contador",
        escritorio: escritorio || null,
        municipio: municipio || null,
        quantidade_clientes_aproximada: quantidade_clientes_aproximada || null,
        perfil_carteira: perfil_carteira || null,
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
        subject: `🧮 Novo Lead - Contador: ${escritorio || nome}`,
        html: `
          <h2>🧮 Novo Lead - Contador</h2>
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Telefone:</strong> ${telefone}</p>
          <p><strong>Escritório/Empresa:</strong> ${escritorio || "não informado ainda"}</p>
          <p><strong>Município:</strong> ${municipio || "não informado ainda"}</p>
          <p><strong>Qtd. clientes (aprox.):</strong> ${quantidade_clientes_aproximada || "não informado ainda"}</p>
          <p><strong>Perfil da carteira:</strong> ${perfil_carteira || "não informado ainda"}</p>
        `,
      }),
    });
    console.log("RESEND STATUS:", resendResponse.status);

    // =====================
    // 3️⃣ ENVIAR WHATSAPP (EVOLUTION) - notifica VOCÊ
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
          text: `🧮 Novo Lead - Contador\n\nNome: ${nome}\nTelefone: ${telefone}\nEscritório/Empresa: ${escritorio || "não informado ainda"}\nMunicípio: ${municipio || "não informado ainda"}\nQtd. clientes: ${quantidade_clientes_aproximada || "não informado ainda"}\nPerfil da carteira: ${perfil_carteira || "não informado ainda"}`,
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
