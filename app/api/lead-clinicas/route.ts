import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Mapeia segmento -> persona do agente de demo (mesma instância ORBI_Trafego_Demo,
// prompts diferentes por segmento já configurados no n8n).
const PERSONAS: Record<string, string> = {
  estetica: "Lari",
  odontologica: "Ana",
  medica: "Beatriz",
  fisioterapia: "Duda",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, telefone, segmento, clinica, desafio } = body;

    // Captura conversacional e progressiva — exige só o mínimo útil (nome + telefone + segmento).
    if (!nome || !telefone || !segmento) {
      return NextResponse.json(
        { success: false, error: "Nome, telefone e segmento são obrigatórios." },
        { status: 400 }
      );
    }

    const persona = PERSONAS[segmento] || "nossa equipe";

    // =====================
    // 1️⃣ SALVAR NO BANCO (tabela compartilhada "leads" — schema real: name/phone/segment/source)
    // =====================
    const { error } = await supabase.from("leads").insert([
      {
        name: nome,
        phone: telefone,
        segment: segmento,
        source: "chat_landing_clinicas",
        resumo_conversa: [clinica && `Clínica: ${clinica}`, desafio && `Desafio: ${desafio}`]
          .filter(Boolean)
          .join(" | ") || null,
      },
    ]);

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return NextResponse.json({ success: false, error: "Erro banco." }, { status: 500 });
    }

    // =====================
    // 2️⃣ ENVIAR EMAIL (RESEND) — notifica Jonei
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
        subject: `🩺 Novo Lead - ORBI Plena (${segmento}): ${clinica || nome}`,
        html: `
          <h2>🩺 Novo Lead - ORBI Plena</h2>
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Telefone:</strong> ${telefone}</p>
          <p><strong>Área:</strong> ${segmento}</p>
          <p><strong>Clínica:</strong> ${clinica || "não informado"}</p>
          <p><strong>Desafio:</strong> ${desafio || "não informado"}</p>
        `,
      }),
    });
    console.log("RESEND STATUS:", resendResponse.status);

    // =====================
    // 3️⃣ NOTIFICAR VOCÊ NO WHATSAPP (Evolution — instância ORBI_Trafego)
    // =====================
    const evolutionNotifyJonei = await fetch(
      `${process.env.EVOLUTION_URL}/message/sendText/ORBI_Trafego`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: process.env.EVOLUTION_API_KEY! },
        body: JSON.stringify({
          number: "5566981320667",
          text: `🩺 Novo Lead - ORBI Plena\n\nNome: ${nome}\nTelefone: ${telefone}\nÁrea: ${segmento}\nClínica: ${clinica || "não informado"}\nDesafio: ${desafio || "não informado"}\n\nHandoff automático disparado pra ${persona}.`,
        }),
      }
    );
    console.log("EVOLUTION NOTIFY STATUS:", evolutionNotifyJonei.status);

    // =====================
    // 4️⃣ HANDOFF AUTOMÁTICO — dispara mensagem de abertura pro PRÓPRIO LEAD,
    // via a persona certa (Opção A). A instância ORBI_Trafego_Demo já tem o
    // prompt de cada persona configurado no n8n; aqui só disparamos a primeira
    // mensagem pra continuar a conversa sem o lead precisar chamar sozinho.
    // AJUSTE: confirma o nome exato da instância no Evolution antes de subir
    // (deve ser "ORBI_Trafego_Demo", conforme combinado).
    // =====================
    const aberturaPorSegmento: Record<string, string> = {
      estetica: `Oi, ${nome}! Aqui é a Lari, da ORBI 🌿 Vi que você conversou no site sobre sua clínica de estética${clinica ? ` (${clinica})` : ""}. Me conta, qual é o maior gargalo hoje — agenda, falta de paciente ou demora no WhatsApp?`,
      odontologica: `Oi, ${nome}! Aqui é a Ana, da ORBI 🦷 Vi que você conversou no site sobre sua clínica odontológica${clinica ? ` (${clinica})` : ""}. Me conta, qual é o maior gargalo hoje — agenda, falta de paciente ou demora no WhatsApp?`,
      medica: `Oi, ${nome}! Aqui é a Beatriz, da ORBI ⚕️ Vi que você conversou no site sobre sua clínica médica${clinica ? ` (${clinica})` : ""}. Me conta, qual é o maior gargalo hoje — agenda, falta de paciente ou demora no WhatsApp?`,
      fisioterapia: `Oi, ${nome}! Aqui é a Duda, da ORBI 🤸 Vi que você conversou no site sobre sua clínica de fisioterapia${clinica ? ` (${clinica})` : ""}. Me conta, qual é o maior gargalo hoje — agenda, falta de paciente ou demora no WhatsApp?`,
    };

    const evolutionHandoff = await fetch(
      `${process.env.EVOLUTION_URL}/message/sendText/ORBI_Trafego_Demo`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: process.env.EVOLUTION_API_KEY! },
        body: JSON.stringify({
          number: telefone,
          text: aberturaPorSegmento[segmento] || `Oi, ${nome}! Aqui é a equipe da ORBI, vi seu interesse no site. Como posso ajudar?`,
        }),
      }
    );
    console.log("EVOLUTION HANDOFF STATUS:", evolutionHandoff.status);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ERRO GERAL:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}
