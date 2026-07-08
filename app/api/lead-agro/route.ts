import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, telefone, fazenda, municipio, hectares_aproximado, culturas } = body;

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
    // IMPORTANTE: a tabela usa nomes em inglês (name, phone, source) —
    // diferente do que o lead-clinicas original usava (nome, telefone,
    // origem), que na verdade não existiam como colunas. Aqui já mapeado certo.
    // =====================
    const { error } = await supabase
      .from("leads")
      .insert([{
        name: nome,
        phone: telefone,
        segment: "agro",
        source: "chat_landing_agro",
        fazenda: fazenda || null,
        municipio: municipio || null,
        hectares_aproximado: hectares_aproximado || null,
        culturas: culturas || null,
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
    // Instância: ORBI_Trafego (a antiga "orbi_ia_landing" não existe mais)
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
          text: `🌾 Novo Lead - Agro\n\nNome: ${nome}\nTelefone: ${telefone}\nFazenda: ${fazenda || "não informado ainda"}\nMunicípio: ${municipio || "não informado ainda"}\nHectares: ${hectares_aproximado || "não informado ainda"}\nCulturas: ${culturas || "não informado ainda"}`,
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
