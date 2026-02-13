import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// =============================
// SUPABASE CLIENT (SERVER SIDE)
// =============================
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("📥 BODY RECEBIDO:", body);

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
    // VALIDAÇÃO REAL (ALINHADA COM BANCO)
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
      console.log("❌ Validação falhou");
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios ausentes." },
        { status: 400 }
      );
    }

    console.log("✅ Validação passou");

    // =============================
    // 1️⃣ SALVAR NO SUPABASE
    // =============================
    const { data, error: supabaseError } = await supabase
      .from("leads")
      .insert([{
        nome,
        empresa,
        cargo,
        desafio,
        email,
        telefone,
        canal_preferido
      }])
      .select();

    if (supabaseError) {
      console.error("❌ ERRO SUPABASE:", supabaseError);
      throw new Error("Erro ao salvar no banco.");
    }

    console.log("✅ Lead salvo:", data);

    // =============================
    // 2️⃣ ENVIAR WHATSAPP (EVOLUTION)
    // =============================
    const evolutionResponse = await fetch(
      "http://168.138.148.254:8080/message/sendText/orbi_ia_landing",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.EVOLUTION_API_KEY!,
        },
        body: JSON.stringify({
          number: "5566981320667",
          text: `🚀 Novo Lead Recebido

Nome: ${nome}
Empresa: ${empresa}
Cargo: ${cargo}
Desafio: ${desafio}
Email: ${email}
Telefone: ${telefone}
Canal Preferido: ${canal_preferido}`,
        }),
      }
    );

    const evolutionData = await evolutionResponse.text();

    console.log("📲 Evolution status:", evolutionResponse.status);
    console.log("📲 Evolution resposta:", evolutionData);

    if (!evolutionResponse.ok) {
      console.error("❌ ERRO EVOLUTION");
      throw new Error("Erro ao enviar WhatsApp.");
    }

    // =============================
    // 3️⃣ ENVIAR EMAIL (RESEND)
    // =============================
    const resendResponse = await fetch("https://api.resend.com/emails", {
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
          <p><strong>Telefone:</strong> ${telefone}</p>
          <p><strong>Canal Preferido:</strong> ${canal_preferido}</p>
        `,
      }),
    });

    const resendData = await resendResponse.text();

    console.log("📧 Resend status:", resendResponse.status);
    console.log("📧 Resend resposta:", resendData);

    if (!resendResponse.ok) {
      console.error("❌ ERRO RESEND");
      throw new Error("Erro ao enviar email.");
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("🔥 ERRO GERAL:", error.message);

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
