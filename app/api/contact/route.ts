import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =============================
// SUPABASE CLIENT (SERVER SIDE)
// =============================
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================
// UTIL
// =============================
function sanitizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function ensure55(phone: string) {
  return phone.startsWith("55") ? phone : `55${phone}`;
}

// =============================
// API
// =============================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      nome,
      empresa,
      cargo,
      desafio,
      email,
      telefone,
      canal_preferido
    } = body;

    // =============================
    // VALIDAÇÃO
    // =============================
    if (
      !nome ||
      !empresa ||
      !cargo ||
      !desafio ||
      !email ||
      !telefone ||
      !canal_preferido
    ) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios ausentes." },
        { status: 400 }
      );
    }

    const telefoneLimpo = ensure55(sanitizePhone(telefone));

    // =============================
    // 1️⃣ SALVAR NO SUPABASE
    // =============================
    const { data, error } = await supabase
      .from("leads")
      .insert([{
        nome,
        empresa,
        cargo,
        desafio,
        email,
        telefone: telefoneLimpo,
        canal_preferido
      }])
      .select()
      .single();

    if (error) {
      console.error("Erro Supabase:", error);
      return NextResponse.json(
        { success: false, error: "Erro ao salvar no banco." },
        { status: 500 }
      );
    }

    // =============================
    // 2️⃣ ENVIAR WHATSAPP
    // =============================
    if (!process.env.EVOLUTION_API_KEY) {
      console.error("EVOLUTION_API_KEY não configurada");
    } else {
      try {
        const evolutionResponse = await fetch(
          "http://168.138.148.254:8080/message/sendText/orbi_ia_landing",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.EVOLUTION_API_KEY,
            },
            body: JSON.stringify({
              number: "5566981320667",
              text: `🚀 Novo Lead

Nome: ${nome}
Empresa: ${empresa}
Cargo: ${cargo}
Desafio: ${desafio}
Email: ${email}
Telefone: ${telefoneLimpo}
Canal: ${canal_preferido}`
            }),
          }
        );

        if (!evolutionResponse.ok) {
          console.error("Erro Evolution:", await evolutionResponse.text());
        }
      } catch (err) {
        console.error("Falha WhatsApp:", err);
      }
    }

    // =============================
    // 3️⃣ ENVIAR EMAIL (RESEND)
    // =============================
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY não configurada");
    } else {
      try {
        const resendResponse = await fetch(
          "https://api.resend.com/emails",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "contato@agenteorbiia.com",
              to: ["contato@agenteorbiia.com"],
              subject: "🚀 Novo Lead Recebido",
              html: `
                <h2>Novo Lead</h2>
                <p><strong>Nome:</strong> ${nome}</p>
                <p><strong>Empresa:</strong> ${empresa}</p>
                <p><strong>Cargo:</strong> ${cargo}</p>
                <p><strong>Desafio:</strong> ${desafio}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Telefone:</strong> ${telefoneLimpo}</p>
                <p><strong>Canal:</strong> ${canal_preferido}</p>
              `
            }),
          }
        );

        if (!resendResponse.ok) {
          console.error("Erro Resend:", await resendResponse.text());
        }
      } catch (err) {
        console.error("Falha Email:", err);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro geral:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
