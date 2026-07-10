import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

function normalizarTelefone(raw: string) {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return "55" + digits;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, telefone, segmento, clinica, desafio, encerrar } = body;

    if (!nome || !telefone || !segmento) {
      return NextResponse.json(
        { success: false, error: "Nome, telefone e segmento são obrigatórios." },
        { status: 400 }
      );
    }

    const phoneNormalizado = normalizarTelefone(telefone);
    const persona = PERSONAS[segmento] || "nossa equipe";

    // Busca se esse telefone já existe (tabela "leads" é compartilhada, UNIQUE em phone)
    const { data: existente } = await supabase
      .from("leads")
      .select("id, status")
      .eq("phone", telefone)
      .maybeSingle();

    // =====================
    // SEMPRE salva/atualiza — protege contra perder o lead se a pessoa sumir
    // no meio da conversa, mesmo antes de "encerrar" virar true.
    // =====================
    if (existente) {
      await supabase
        .from("leads")
        .update({ name: nome, segment: segmento, resumo_conversa: montaResumo(clinica, desafio) })
        .eq("id", existente.id);
    } else {
      await supabase.from("leads").insert([
        {
          name: nome,
          phone: telefone,
          segment: segmento,
          source: "chat_landing_clinicas",
          resumo_conversa: montaResumo(clinica, desafio),
        },
      ]);
    }

    // =====================
    // Só dispara e-mail + WhatsApp (notify + handoff) quando a IA sinalizar
    // "encerrar":true, E só uma vez (confere status pra não duplicar).
    // =====================
    const jaNotificado = existente?.status === "notificado";
    if (!encerrar || jaNotificado) {
      return NextResponse.json({ success: true, notified: false });
    }

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

    const evolutionNotifyJonei = await fetch(
      `${process.env.EVOLUTION_URL}/message/sendText/ORBI_Trafego`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: process.env.EVOLUTION_API_KEY! },
        body: JSON.stringify({
          number: "5566981320667",
          text: `🩺 Novo Lead - ORBI Plena\n\nNome: ${nome}\nTelefone: ${telefone}\nÁrea: ${segmento}\nClínica: ${clinica || "não informado"}\nDesafio: ${desafio || "não informado"}\n\nHandoff disparado pra ${persona}.`,
        }),
      }
    );
    console.log("EVOLUTION NOTIFY STATUS:", evolutionNotifyJonei.status);

    const aberturaPorSegmento: Record<string, string> = {
      estetica: `Oi, ${nome}! Bom te ver por aqui 🌿 Sou a Lari — aqui você faz um test drive de verdade: eu simulo como seria o atendimento de uma clínica de estética. Nada é real, viu? Sem custo, sem agendamento de verdade, seus dados ficam protegidos (LGPD). O que você quer testar — marcar uma consulta, tirar uma dúvida, remarcar horário?`,
      odontologica: `Oi, ${nome}! Bom te ver por aqui 🦷 Sou a Ana — aqui você faz um test drive de verdade: eu simulo como seria o atendimento de uma clínica odontológica. Nada é real, viu? Sem custo, sem agendamento de verdade, seus dados ficam protegidos (LGPD). O que você quer testar — marcar uma consulta, tirar uma dúvida, remarcar horário?`,
      medica: `Oi, ${nome}! Bom te ver por aqui ⚕️ Sou a Beatriz — aqui você faz um test drive de verdade: eu simulo como seria o atendimento de uma clínica médica. Nada é real, viu? Sem custo, sem agendamento de verdade, seus dados ficam protegidos (LGPD). O que você quer testar — marcar uma consulta, tirar uma dúvida, remarcar horário?`,
      fisioterapia: `Oi, ${nome}! Bom te ver por aqui 🤸 Sou a Duda — aqui você faz um test drive de verdade: eu simulo como seria o atendimento de uma clínica de fisioterapia. Nada é real, viu? Sem custo, sem agendamento de verdade, seus dados ficam protegidos (LGPD). O que você quer testar — marcar uma sessão, tirar uma dúvida, remarcar horário?`,
    };

    const evolutionHandoff = await fetch(
      `${process.env.EVOLUTION_URL}/message/sendText/ORBI_Trafego_Demo`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: process.env.EVOLUTION_API_KEY! },
        body: JSON.stringify({
          number: phoneNormalizado,
          text: aberturaPorSegmento[segmento] || `Oi, ${nome}! Aqui é a equipe da ORBI, vi seu interesse no site.`,
        }),
      }
    );
    const handoffBody = await evolutionHandoff.text();
    console.log("EVOLUTION HANDOFF STATUS:", evolutionHandoff.status, handoffBody);

    // Marca como notificado, pra nunca reenviar de novo pra esse telefone
    await supabase.from("leads").update({ status: "notificado" }).eq("phone", telefone);

    return NextResponse.json({ success: true, notified: true });
  } catch (error: any) {
    console.error("ERRO GERAL:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}
