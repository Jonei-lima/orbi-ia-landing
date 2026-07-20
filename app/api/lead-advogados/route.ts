import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, telefone, area_atuacao, cidade, clientes_ativos_aproximado } = body;

    // Lead vem de conversa em andamento (igual ao agro) — campos chegam aos
    // poucos. Mínimo pra um contato ser útil: nome e telefone.
    if (!nome || !telefone) {
      return NextResponse.json(
        { success: false, error: "Nome e telefone são obrigatórios." },
        { status: 400 }
      );
    }

    // =====================
    // 1️⃣ SALVAR NO BANCO (tabela compartilhada "leads")
    // ⚠️ ANTES DO PRIMEIRO DEPLOY: rodar no SQL Editor do Supabase:
    //
    //   ALTER TABLE leads
    //     ADD COLUMN IF NOT EXISTS area_atuacao text,
    //     ADD COLUMN IF NOT EXISTS cidade text,
    //     ADD COLUMN IF NOT EXISTS clientes_ativos_aproximado text;
    //
    // Sem isso, o insert abaixo FALHA (coluna inexistente) e o lead se perde
    // silenciosamente do banco (o e-mail e o WhatsApp ainda saem — ver ordem
    // abaixo: por isso o insert vem primeiro e retorna 500 se falhar).
    // =====================
    const { error } = await supabase
      .from("leads")
      .insert([{
        name: nome,
        phone: telefone,
        segment: "advogados",
        source: "chat_landing_advogados",
        area_atuacao: area_atuacao || null,
        cidade: cidade || null,
        clientes_ativos_aproximado: clientes_ativos_aproximado || null,
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
        subject: `⚖️ Novo Lead - Advogados: ${nome}${area_atuacao ? " (" + area_atuacao + ")" : ""}`,
        html: `
          <h2>⚖️ Novo Lead - Advogados</h2>
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Telefone:</strong> ${telefone}</p>
          <p><strong>Área de atuação:</strong> ${area_atuacao || "não informado ainda"}</p>
          <p><strong>Cidade/UF:</strong> ${cidade || "não informado ainda"}</p>
          <p><strong>Clientes ativos (aprox.):</strong> ${clientes_ativos_aproximado || "não informado ainda"}</p>
        `,
      }),
    });
    console.log("RESEND STATUS:", resendResponse.status);

    // =====================
    // 3️⃣ ENVIAR WHATSAPP (EVOLUTION) — notifica VOCÊ
    // ⚠️ ATENÇÃO: a instância ORBI_Trafego está com restrição da Meta
    // (falha silenciosa, status PENDING). Enquanto isso não for resolvido,
    // este aviso pode não chegar — o e-mail acima é o canal confiável.
    // Se tiver outra instância saudável, troque o nome na URL abaixo.
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
          text: `⚖️ Novo Lead - Advogados\n\nNome: ${nome}\nTelefone: ${telefone}\nÁrea: ${area_atuacao || "não informado ainda"}\nCidade: ${cidade || "não informado ainda"}\nClientes ativos: ${clientes_ativos_aproximado || "não informado ainda"}`,
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
