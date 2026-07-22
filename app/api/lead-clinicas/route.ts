import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const META_PIXEL_ID = "1772566967429029";
const META_CAPI_TOKEN = process.env.META_CAPI_TOKEN_CLINICAS;
const EVENT_SOURCE_URL = "https://www.agenteorbiia.com/clinicas";

function sha256(value: string) {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizarTelefone(raw: string) {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return "55" + digits;
}

// Divide "João da Silva" em primeiro/último nome pra Advanced Matching (fn/ln).
// OBS: clínicas não coleta cidade no chat hoje — por isso não dá pra mandar "ct"
// aqui como fizemos em agro/adv/contador. Se quiser mandar cidade também, precisa
// acrescentar essa pergunta no fluxo do chat-clinicas.
function splitNome(nomeCompleto: string) {
  const partes = (nomeCompleto || "").trim().split(/\s+/).filter(Boolean);
  const primeiro = partes[0] || "";
  const ultimo = partes.length > 1 ? partes[partes.length - 1] : "";
  return { primeiro, ultimo };
}

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

async function sendMetaCAPI(params: {
  nome: string;
  telefoneNormalizado: string;
  eventId: string;
  fbp?: string | null;
  fbc?: string | null;
  clientIp?: string;
  userAgent?: string;
}) {
  if (!META_CAPI_TOKEN) {
    console.error("META_CAPI_TOKEN_CLINICAS não configurado — pulando CAPI.");
    return;
  }
  const { nome, telefoneNormalizado, eventId, fbp, fbc, clientIp, userAgent } = params;
  const { primeiro, ultimo } = splitNome(nome);

  const userData: Record<string, any> = {
    ph: [sha256(telefoneNormalizado)],
  };
  if (primeiro) userData.fn = [sha256(primeiro)];
  if (ultimo) userData.ln = [sha256(ultimo)];
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;
  if (clientIp) userData.client_ip_address = clientIp;
  if (userAgent) userData.client_user_agent = userAgent;

  const payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "chat",
        event_source_url: EVENT_SOURCE_URL,
        user_data: userData,
        custom_data: {
          content_name: "Lead Clinicas ORBI",
          content_category: "Lead Qualificado",
          value: 65.0,
          currency: "BRL",
        },
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${META_CAPI_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      console.error("META CAPI ERRO:", data);
    } else {
      console.log("META CAPI OK:", data);
    }
  } catch (err) {
    console.error("META CAPI FALHA:", err);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      nome,
      telefone,
      segmento,
      clinica,
      sinal_fora_horario,
      sinal_perdeu_paciente,
      sinal_confirmacao_manual,
      email,
      encerrar,
      event_id,
      fbp,
      fbc,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      fbclid,
    } = body;

    if (!nome || !telefone || !segmento) {
      return NextResponse.json(
        { success: false, error: "Nome, telefone e segmento são obrigatórios." },
        { status: 400 }
      );
    }

    const telefoneNormalizado = normalizarTelefone(telefone);

    // Busca se esse telefone já existe (tabela "leads" é compartilhada, UNIQUE em phone)
    const { data: existente } = await supabase
      .from("leads")
      .select("id, handoff_enviado")
      .eq("phone", telefoneNormalizado)
      .maybeSingle();

    // =====================
    // SEMPRE salva/atualiza — protege contra perder o lead se a pessoa sumir
    // no meio da conversa, mesmo antes de "encerrar" virar true.
    // Também grava UTM/fbclid (só na criação — se o lead já existe, mantemos
    // a origem original em vez de sobrescrever com uma sessão nova).
    // Email é atualizado nas duas situações, pois normalmente só chega
    // no fim da conversa, quando o registro já existe.
    // =====================
    if (existente) {
      await supabase
        .from("leads")
        .update({
          name: nome,
          segment: segmento,
          email: email || null,
          resumo_conversa: montaResumo(clinica, sinal_fora_horario, sinal_perdeu_paciente, sinal_confirmacao_manual),
          last_seen_at: new Date().toISOString(),
        })
        .eq("id", existente.id);
    } else {
      await supabase.from("leads").insert([
        {
          name: nome,
          phone: telefoneNormalizado,
          segment: segmento,
          source: "chat_landing_clinicas",
          email: email || null,
          resumo_conversa: montaResumo(clinica, sinal_fora_horario, sinal_perdeu_paciente, sinal_confirmacao_manual),
          utm_source: utm_source || null,
          utm_medium: utm_medium || null,
          utm_campaign: utm_campaign || null,
          utm_content: utm_content || null,
          utm_term: utm_term || null,
          fbclid: fbclid || null,
          last_seen_at: new Date().toISOString(),
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
          <p><strong>E-mail:</strong> ${email || "não informado ainda"}</p>
          <p><strong>Diagnóstico:</strong> ${montaDiagnosticoResumido(sinal_fora_horario, sinal_perdeu_paciente, sinal_confirmacao_manual)}</p>
          <p><strong>Origem:</strong> ${utm_source || "direto/não identificado"} ${utm_campaign ? `· Campanha: ${utm_campaign}` : ""}</p>
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
          text: `🩺 Novo Lead - ORBI Plena\n\nNome: ${nome}\nTelefone: ${telefone}\nÁrea: ${segmento}\nClínica: ${clinica || "não informado"}\nE-mail: ${email || "não informado ainda"}\nDiagnóstico: ${montaDiagnosticoResumido(sinal_fora_horario, sinal_perdeu_paciente, sinal_confirmacao_manual)}`,
        }),
      }
    );
    console.log("EVOLUTION NOTIFY STATUS:", evolutionNotifyJonei.status);

    // Marca como notificado (coluna própria), pra nunca reenviar/reexibir de novo
    const { error: marcaError } = await supabase
      .from("leads")
      .update({ handoff_enviado: true })
      .eq("phone", telefoneNormalizado);
    if (marcaError) console.error("ERRO AO MARCAR handoff_enviado:", marcaError);

    // =====================
    // Meta CAPI — dispara no mesmo momento exato em que o cliente dispara o fbq('track','Lead'),
    // usando o mesmo event_id (dedup) e Advanced Matching: telefone + nome (fn/ln) hasheados,
    // + fbp/fbc + IP/user-agent quando disponíveis.
    // =====================
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const userAgent = req.headers.get("user-agent") || undefined;
    const eventId = event_id || crypto.randomUUID();

    await sendMetaCAPI({
      nome,
      telefoneNormalizado,
      eventId,
      fbp,
      fbc,
      clientIp,
      userAgent,
    });

    // Não devolve mais link/persona — igual ao ADV/Contador, o botão de
    // WhatsApp no frontend é fixo (mesmo número real, sem simulação de atendente).
    return NextResponse.json({ success: true, notified: true, eventId });
  } catch (error: any) {
    console.error("ERRO GERAL:", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}
