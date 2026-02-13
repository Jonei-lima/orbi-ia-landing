import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🔐 Cliente Supabase (server-side)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, email, whatsapp, mensagem } = body;

    // 🔎 Validação básica
    if (!nome || !email || !whatsapp) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios ausentes." },
        { status: 400 }
      );
    }

    // 1️⃣ Salvar no Supabase
    const { error: supabaseError } = await supabase
      .from("leads")
      .insert([
        {
          nome,
          email,
          whatsapp,
          mensagem,
        },
      ]);

    if (supabaseError) {
      console.error("Erro Supabase:", supabaseError);
      throw new Error("Erro ao salvar no banco.");
    }

    // 2️⃣ Enviar WhatsApp via Evolution
    await fetch(
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

    // 3️⃣ Enviar Email via Resend
    await fetch("https://api.resend.com/emails", {
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

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Erro ao processar lead:", error);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
