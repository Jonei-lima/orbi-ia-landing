import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { nome, empresa, cargo, desafio, email, telefone, canal_preferido } = body;

    if (!nome || !empresa || !cargo || !desafio || !email || !telefone || !canal_preferido) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios ausentes." },
        { status: 400 }
      );
    }

    // =====================
    // 1️⃣ SALVAR NO BANCO
    // =====================
    const { error } = await supabase
      .from("leads")
      .insert([{ nome, empresa, cargo, desafio, email, telefone, canal_preferido, origem: "clinicas" }]);

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
        subject: `🏥 Novo Lead - Clínica: ${empresa}`,
        html: `
          <h2>🏥 Novo Lead - Clínicas</h2>
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Clínica:</strong> ${empresa}</p>
          <p><strong>Cargo:</strong> ${cargo}</p>
          <p><strong>Desafio:</strong> ${desafio}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${telefone}</p>
          <p><strong>Canal:</strong> ${canal_preferido}</p>
        `,
      }),
    });

    console.log("RESEND STATUS:", resendResponse.status);

    // =====================
    // 3️⃣ ENVIAR WHATSAPP (EVOLUTION) - notifica VOCÊ
    // =====================
    const evolutionResponse = await fetch(
      `${process.env.EVOLUTION_URL}/message/sendText/orbi_ia_landing`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.EVOLUTION_API_KEY!,
        },
        body: JSON.stringify({
          number: "5566981320667",
          text: `🏥 Novo Lead - Clínicas\n\nNome: ${nome}\nClínica: ${empresa}\nCargo: ${cargo}\nWhatsApp: ${telefone}\nEmail: ${email}\nDesafio: ${desafio}`,
        }),
      }
    );

    console.log("EVOLUTION STATUS:", evolutionResponse.status);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("ERRO GERAL:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}