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

function montaResumo(
  clinica?: string,
  sinalForaHorario?: boolean | null,
  sinalPerdeuPaciente?: boolean | null,
  sinalConfirmacaoManual?: boolean | null
) {
  const sinais = [
    sinalForaHorario === true && "sem atendimento fora do expediente",
    sinalPerdeuPaciente === true && "já perdeu paciente por demora",
    sinalConfirmacaoManual === true && "confirmação de consulta ainda é manual",
  ].filter(Boolean);

  const totalRespondido = [sinalForaHorario, sinalPerdeuPaciente, sinalConfirmacaoManual].filter(
    (v) => v !== null && v !== undefined
  ).length;

  const partes = [
    clinica && `Clínica: ${clinica}`,
    totalRespondido > 0 &&
      `Diagnóstico: ${sinais.length} de ${totalRespondido} sinais de risco confirmados${sinais.length ? " (" + sinais.join("; ") + ")" : ""}`,
  ].filter(Boolean);

  return partes.length ? partes.join(" | ") : null;
}

function montaDiagnosticoResumido(
  sinalForaHorario?: boolean | null,
  sinalPerdeuPaciente?: boolean | null,
  sinalConfirmacaoManual?: boolean | null
) {
  const sinais = [
    sinalForaHorario === true && "sem atendimento fora do expediente",
    sinalPerdeuPaciente === true && "já perdeu paciente por demora",
    sinalConfirmacaoManual === true && "confirmação de consulta ainda é manual",
  ].filter(Boolean);
  const totalRespondido = [sinalForaHorario, sinalPerdeuPaciente, sinalConfirmacaoManual].filter(
    (v) => v !== null && v !== undefined
  ).length;
  if (totalRespondido === 0) return "não concluído";
  return `${sinais.length} de ${totalRespondido} sinais de risco confirmados${sinais.length ? " (" + sinais.join("; ") + ")" : ""}`;
}

function normalizarTelefone(raw: string) {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return "55" + digits;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nome, telefone, segmento, clinica, sinal_fora_horario, sinal_perdeu_paciente, sinal_confirmacao_manual, encerrar } = body;

    if (!nome || !telefone || !segmento) {
      return NextResponse.json(
        { success: false, error: "Nome, telefone e segmento são obrigatórios." },
        { status: 400 }
      );
    }

    const persona = PERSONAS[segmento] || "nossa equipe";

    // Busca se esse telefone já existe (tabela "leads" é compartilhada, UNIQUE em phone)
    const { data: existente } = await supabase
      .from("leads")
      .select("id, handoff_enviado")
      .eq("phone", telefone)
      .maybeSingle();

    // =====================
    // SEMPRE salva/atualiza — protege contra perder o lead se a pessoa sumir
    // no meio da conversa, mesmo antes de "encerrar" virar true.
    // =====================
    if (existente) {
      await supabase
        .from("leads")
        .update({ name: nome, segment: segmento, resumo_conversa: montaResumo(clinica, sinal_fora_horario, sinal_perdeu_paciente, sinal_confirmacao_manual) })
        .eq("id", existente.id);
    } else {
      await supabase.from("leads").insert([
        {
          name: nome,
          phone: telefone,
          segment: segmento,
          source: "chat_landing_clinicas",
          resumo_conversa: montaResumo(clinica, sinal_fora_horario, sinal_perdeu_paciente, sinal_confirmacao_manual),
        },
      ]);
    }

    // =====================
    // Só dispara e-mail + WhatsApp (notify + handoff) quando a IA sinalizar
    // "encerrar":true, E só uma vez (confere status pra não duplicar).
    // =====================
    const jaNotificado = existente?.handoff_enviado === true;
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
          <p><strong>Diagnóstico:</strong> ${montaDiagnosticoResumido(sinal_fora_horario, sinal_perdeu_paciente, sinal_confirmacao_manual)}</p>
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
          text: `🩺 Novo Lead - ORBI Plena\n\nNome: ${nome}\nTelefone: ${telefone}\nÁrea: ${segmento}\nClínica: ${clinica || "não informado"}\nDiagnóstico: ${montaDiagnosticoResumido(sinal_fora_horario, sinal_perdeu_paciente, sinal_confirmacao_manual)}\n\nLink de test-drive já mostrado pro lead no site.`,
        }),
      }
    );
    console.log("EVOLUTION NOTIFY STATUS:", evolutionNotifyJonei.status);

    // =====================
    // Link de WhatsApp pra PESSOA clicar e mandar a primeira mensagem —
    // em vez da automação mandar primeiro (isso estava disparando bloqueio
    // de spam da Meta/WhatsApp em contas não-oficiais como o Evolution).
    // A mensagem pré-preenchida já carrega nome/clinica/segmento no texto,
    // pro prompt de cada persona (Lari/Ana/Beatriz/Duda) já saber quem é.
    // =====================
    const segmentoLegivel: Record<string, string> = {
      estetica: "estética",
      odontologica: "odontológica",
      medica: "médica",
      fisioterapia: "fisioterapia",
    };
    const mensagemPreenchida = `Oi! Sou ${nome}${clinica ? `, da ${clinica}` : ""}. Quero testar como funcionaria pra uma clínica de ${segmentoLegivel[segmento] || segmento}.`;
    const whatsappLink = `https://wa.me/${558388584946}?text=${encodeURIComponent(mensagemPreenchida)}`;

    // Marca como notificado (coluna própria), pra nunca reenviar/reexibir de novo
    const { error: marcaError } = await supabase
      .from("leads")
      .update({ handoff_enviado: true })
      .eq("phone", telefone);
    if (marcaError) console.error("ERRO AO MARCAR handoff_enviado:", marcaError);

    return NextResponse.json({ success: true, notified: true, whatsappLink, persona });

    return NextResponse.json({ success: true, notified: true });
  } catch (error: any) {
    console.error("ERRO GERAL:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}
