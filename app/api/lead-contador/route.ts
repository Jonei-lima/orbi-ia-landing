import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, telefone, escritorio, municipio, quantidade_clientes_aproximada, perfil_carteira } = body;

    // Igual ao lead-agro: lead vem de uma conversa em andamento, campos chegam
    // aos poucos. Exigimos só o mínimo pra um contato ser útil: nome e telefone.
    if (!nome || !telefone) {
      return NextResponse.json(
        { success: false, error: "Nome e telefone são obrigatórios." },
        { status: 400 }
      );
    }

    // =====================
    // 1️⃣ SALVAR NO BANCO (tabela compartilhada "leads")
    // Mesma tabela usada por agro/adv/clinicas — colunas em inglês
    // (name, phone, segment, source) + campos específicos do contador.
    // =====================
    const { error } = await supabase
      .from("leads")
      .insert([{
        name: nome,
        phone: telefone,
        segment: "contador",
        source: "chat_landing_contador",
        escritorio: escritorio || null,
        municipio: municipio || null,
        quantidade_clientes_aproximada: quantidade_clientes_aproximada || null,
        perfil_carteira: perfil_carteira || null,
      }]);

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
    // Mesma instância usada nos outros nichos: ORBI_Trafego.
    // ATENÇÃO: precisa estar CONECTADA no Evolution pra isso funcionar.
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ERRO GERAL:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
