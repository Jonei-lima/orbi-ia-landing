import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function sanitizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const {
      nome,
      empresa,
      cargo,
      desafio,
      email,
      telefone,
      canal_preferido
    } = await req.json();

    // Validação básica
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

    // =====================
    // 1️⃣ SALVAR NO BANCO
    // =====================
    const { error } = await supabase.from("leads").insert([
      {
        nome,
        empresa,
        cargo,
        desafio,
        email,
        telefone,
        canal_preferido
      }
    ]);

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return NextResponse.json(
        { success: false, error: "Erro banco." },
        { status: 500 }
      );
    }

    // =====================
    // 2️⃣ ENVIAR WHATSAPP
    // =====================
    const telefoneLimpo = sanitizePhone(telefone);

    const numeroFinal = telefoneLimpo.startsWith("55")
      ? telefoneLimpo
      : `55${telefoneLimpo}`;

    const evolutionResponse = await fetch(
      `${process.env.EVOLUTION_URL}/message/sendText/orbi_ia_landing`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.EVOLUTION_API_KEY!
        },
        body: JSON.stringify({
          number: numeroFinal,
          text: `🚀 Novo Lead

Nome: ${nome}
Empresa: ${empresa}
Email: ${email}
Telefone: ${numeroFinal}`
        })
      }
    );

    console.log("EVOLUTION STATUS:", evolutionResponse.status);
    console.log("EVOLUTION BODY:", await evolutionResponse.text());

    // =====================
    // 3️⃣ ENVIAR EMAIL
    // =====================
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "contato@agenteorbiia.com",
        to: ["jonei.lima@gmail.com"],
        subject: "Novo Lead ORBI IA",
        html: `
          <h2>Novo Lead</h2>
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Empresa:</strong> ${empresa}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${numeroFinal}</p>
        `
      })
    });

    console.log("RESEND STATUS:", resendResponse.status);
    console.log("RESEND BODY:", await resendResponse.text());

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("ERRO GERAL:", err);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
