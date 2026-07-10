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

function montaResumo(clinica?: string, desafio?: string) {
  return [clinica && `Clínica: ${clinica}`, desafio && `Desafio: ${desafio}`]
    .filter(Boolean)
    .join(" | ") || null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, nome, telefone, segmento, clinica, desafio } = body;

    // =====================
    // CASO 1: já existe um lead (id veio do primeiro save) — só ATUALIZA,
    // sem reenviar e-mail/WhatsApp/handoff de novo.
    // =====================
    if (id) {
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          name: nome,
          segment: segmento,
          resumo_conversa: montaResumo(clinica, desafio),
        })
        .eq("id", id);

      if (updateError) {
        console.error("SUPABASE UPDATE ERROR:", updateError);
        return NextResponse.json({ success: false, error: "Erro ao atualizar." }, { status: 500 });
      }
      return NextResponse.json({ success: true, id });
    }

    // =====================
    // CASO 2: primeiro save — exige só o mínimo (nome + telefone + segmento)
    // =====================
    if (!nome || !telefone || !segmento) {
      return NextResponse.json(
        { success: false, error: "Nome, telefone e segmento são obrigatórios." },
        { status: 400 }
      );
    }

    const persona = PERSONAS[segmento] || "nossa equipe";

    const { data: inserted, error } = await supabase
      .from("leads")
      .insert([
        {
          name: nome,
          phone: telefone,
          segment: segmento,
          source: "chat_landing_clinicas",
          resumo_conversa: montaResumo(clinica, desafio),
        },
      ])
      .select("id")
      .single();

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      return NextResponse.json({ success: false, error: "Erro banco." }, { status: 500 });
    }

    // =====================
    // ENVIAR EMAIL (RESEND) — notifica Jonei, só na primeira vez
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
          <p><strong>Clínica:</strong> ${clinica || "ainda não informado — confere o Supabase depois, a conversa pode revelar mais"}</p>
          <p><strong>Desafio:</strong> ${desafio || "ainda não informado — confere o Supabase depois"}</p>
        `,
      }),
    });
    console.log("RESEND STATUS:", resendResponse.status);

    // =====================
    // NOTIFICAR VOCÊ NO WHATSAPP (Evolution — instância ORBI_Trafego)
    // =====================
    const evolutionNotifyJonei = await fetch(
      `${process.env.EVOLUTION_URL}/message/sendText/ORBI_Trafego`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: process.env.EVOLUTION_API_KEY! },
        body: JSON.stringify({
          number: "5566981320667",
          text: `🩺 Novo Lead - ORBI Plena\n\nNome: ${nome}\nTelefone: ${telefone}\nÁrea: ${segmento}\n\nObs: a conversa pode revelar mais dado (nome da clínica, desafio) depois deste aviso — confere o Supabase mais tarde pra ver o resumo completo.\n\nHandoff disparado pra ${persona}.`,
        }),
      }
    );
    console.log("EVOLUTION NOTIFY STATUS:", evolutionNotifyJonei.status);

    // =====================
    // HANDOFF AUTOMÁTICO — dispara mensagem de abertura pro PRÓPRIO LEAD, só na primeira vez
    // =====================
    const aberturaPorSegmento: Record<string, string> = {
      estetica: `Oi, ${nome}! Aqui é a Lari, da ORBI 🌿 Vi que você conversou no site sobre sua clínica de estética. Me conta, qual é o maior gargalo hoje — agenda, falta de paciente ou demora no WhatsApp?`,
      odontologica: `Oi, ${nome}! Aqui é a Ana, da ORBI 🦷 Vi que você conversou no site sobre sua clínica odontológica. Me conta, qual é o maior gargalo hoje — agenda, falta de paciente ou demora no WhatsApp?`,
      medica: `Oi, ${nome}! Aqui é a Beatriz, da ORBI ⚕️ Vi que você conversou no site sobre sua clínica médica. Me conta, qual é o maior gargalo hoje — agenda, falta de paciente ou demora no WhatsApp?`,
      fisioterapia: `Oi, ${nome}! Aqui é a Duda, da ORBI 🤸 Vi que você conversou no site sobre sua clínica de fisioterapia. Me conta, qual é o maior gargalo hoje — agenda, falta de paciente ou demora no WhatsApp?`,
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
    const handoffBody = await evolutionHandoff.text();
    console.log("EVOLUTION HANDOFF STATUS:", evolutionHandoff.status, handoffBody);

    return NextResponse.json({ success: true, id: inserted?.id });
  } catch (error: any) {
    console.error("ERRO GERAL:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}
