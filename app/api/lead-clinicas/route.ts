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
    const { nome, telefone, segmento, clinica, desafio } = body;

    if (!nome || !telefone || !segmento) {
      return NextResponse.json(
        { success: false, error: "Nome, telefone e segmento são obrigatórios." },
        { status: 400 }
      );
    }

    const phoneNormalizado = normalizarTelefone(telefone);
    const persona = PERSONAS[segmento] || "nossa equipe";

    // =====================
    // Verifica se esse telefone já existe (tabela "leads" tem UNIQUE em phone,
    // compartilhada com outras origens de lead — não é exclusiva do site).
    // =====================
    const { data: existente } = await supabase
      .from("leads")
      .select("id")
      .eq("phone", telefone) // mantém o formato como já está salvo, se já existir
      .maybeSingle();

    if (existente) {
      // Já existe — só ATUALIZA, sem reenviar e-mail/WhatsApp/handoff de novo.
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          name: nome,
          segment: segmento,
          resumo_conversa: montaResumo(clinica, desafio),
        })
        .eq("id", existente.id);

      if (updateError) {
        console.error("SUPABASE UPDATE ERROR:", updateError);
        return NextResponse.json({ success: false, error: "Erro ao atualizar." }, { status: 500 });
      }
      return NextResponse.json({ success: true, updated: true });
    }

    // =====================
    // Não existe — cria a linha nova e dispara as notificações (só aqui, uma vez)
    // =====================
    const { error } = await supabase.from("leads").insert([
      {
        name: nome,
        phone: telefone,
        segment: segmento,
        source: "chat_landing_clinicas",
        resumo_conversa: montaResumo(clinica, desafio),
      },
    ]);

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      return NextResponse.json({ success: false, error: "Erro banco." }, { status: 500 });
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
          <p><strong>Clínica:</strong> ${clinica || "ainda não informado"}</p>
          <p><strong>Desafio:</strong> ${desafio || "ainda não informado"}</p>
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
          text: `🩺 Novo Lead - ORBI Plena\n\nNome: ${nome}\nTelefone: ${telefone}\nÁrea: ${segmento}\n\nHandoff disparado pra ${persona}.`,
        }),
      }
    );
    console.log("EVOLUTION NOTIFY STATUS:", evolutionNotifyJonei.status);

    const aberturaPorSegmento: Record<string, string> = {
      estetica: `Oi, ${nome}! Aqui é a Lari, da ORBI 🌿 Vi seu interesse em automatizar sua clínica de estética. Qual é o maior gargalo hoje — agenda, falta de paciente ou demora no WhatsApp?`,
      odontologica: `Oi, ${nome}! Aqui é a Ana, da ORBI 🦷 Vi seu interesse em automatizar sua clínica odontológica. Qual é o maior gargalo hoje — agenda, falta de paciente ou demora no WhatsApp?`,
      medica: `Oi, ${nome}! Aqui é a Beatriz, da ORBI ⚕️ Vi seu interesse em automatizar sua clínica médica. Qual é o maior gargalo hoje — agenda, falta de paciente ou demora no WhatsApp?`,
      fisioterapia: `Oi, ${nome}! Aqui é a Duda, da ORBI 🤸 Vi seu interesse em automatizar sua clínica de fisioterapia. Qual é o maior gargalo hoje — agenda, falta de paciente ou demora no WhatsApp?`,
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ERRO GERAL:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}
