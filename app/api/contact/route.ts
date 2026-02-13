import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, email, whatsapp, mensagem } = body;

    console.log("📥 Novo lead recebido:", body);

    if (!nome || !email || !whatsapp) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios ausentes." },
        { status: 400 }
      );
    }

    // =============================
    // 1️⃣ SALVAR NO SUPABASE
    // =============================
    const { error: supabaseError } = await supabase
      .from("leads")
      .insert([{ nome, email, whatsapp, mensagem }]);

    if (supabaseError) {
      console.error("❌ Erro Supabase:", supabaseError);
      throw new Error("Erro ao salvar no banco.");
    }

    console.log("✅ Lead salvo no Supabase");

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
          text: `🚀 Novo lead!

Nome: ${nome}
Email: ${email}
WhatsApp: ${whatsapp}
Mensagem: ${mensagem}`,
        }),
      }
    );

    const evolutionData = await evolutionResponse.text();

    console.log("📲 Evolution status:", evolutionResponse.status);
    console.log("📲 Evolution resposta:", evolutionData);

    if (!evolutionResponse.ok) {
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
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>WhatsApp:</strong> ${whatsapp}</p>
          <p><strong>Mensagem:</strong> ${mensagem}</p>
        `,
      }),
    });

    const resendData = await resendResponse.text();

    console.log("📧 Resend status:", resendResponse.status);
    console.log("📧 Resend resposta:", resendData);

    if (!resendResponse.ok) {
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
