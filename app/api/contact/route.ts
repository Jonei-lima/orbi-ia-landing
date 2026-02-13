import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
  console.log("EVOLUTION_URL:", process.env.EVOLUTION_URL);
export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("BODY:", body);

    const {
      nome,
      empresa,
      cargo,
      desafio,
      email,
      telefone,
      canal_preferido
    } = body;

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
    const { data, error } = await supabase
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

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return NextResponse.json(
        { success: false, error: "Erro banco." },
        { status: 500 }
      );
    }

    console.log("SALVO:", data);

    // =====================
    // 2️⃣ TESTE RESEND DIRETO
    // =====================
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "contato@agenteorbiia.com",
        to: ["jonei.lima@gmail.com"],
        subject: "TESTE ORBI IA",
        html: `<h1>Email funcionando</h1>`,
      }),
    });

    console.log("RESEND STATUS:", resendResponse.status);
    console.log("RESEND BODY:", await resendResponse.text());

    // =====================
    // 3️⃣ TESTE EVOLUTION
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
          number: `55${telefone}`,
          text: `Novo lead: ${nome} - ${empresa}`,
        }),
      }
    );

    console.log("EVOLUTION STATUS:", evolutionResponse.status);
    console.log("EVOLUTION BODY:", await evolutionResponse.text());

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("ERRO GERAL:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
