// Recebe o pré-diagnóstico preenchido pelo empresário (página /anamnese/anamnese.html).
// Responde na hora para o empresário; a análise roda depois, em segundo plano,
// e só o Jonei recebe o resultado (e-mail + aviso no WhatsApp), com link para /analise.

import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { gerarAnalise } from "@/lib/analise";

export const maxDuration = 300;

const SITE = "https://agenteorbiia.com";
const AVISO_WHATSAPP = "5566981320667";

function db() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Celular BR: tira +55 / 0 na frente; resultado DDD + 9 dígitos
function normalizaFone(v) {
  let d = String(v || "").replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d;
}

const txt = (v, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function limparLista(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .slice(0, 20)
    .map((x) => ({ pergunta: txt(x?.pergunta, 200), resposta: txt(x?.resposta, 2000) }))
    .filter((x) => x.pergunta && x.resposta);
}

function montarFicha(d) {
  const c = d.contato;
  const out = [
    "PRÉ-DIAGNÓSTICO (formulário preenchido pelo próprio empresário)",
    `Empresa: ${c.empresa}${c.cidade ? `, ${c.cidade}` : ""}`,
    `Contato: ${c.nome}${c.cargo ? `, ${c.cargo}` : ""}`,
    `Ramo: ${c.ramo}${c.atividade ? ` — atividade descrita: ${c.atividade}` : ""}`,
    c.porte ? `Pessoas na empresa: ${c.porte}` : "",
    `Origem: ${d.origem}`,
  ].filter(Boolean);
  for (const [titulo, lista] of [["ATENDIMENTO", d.atendimento], ["RAMO", d.ramo], ["PRIORIDADE", d.prioridade]]) {
    out.push("", titulo);
    for (const x of lista) out.push(`- ${x.pergunta}: ${x.resposta}`);
  }
  return out.join("\n");
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

async function enviarEmail({ c, link, analise, erro }) {
  if (!process.env.RESEND_API_KEY) return;
  const gargalos = (analise?.gargalos || []).slice(0, 3)
    .map((g) => `<li><strong>${esc(g.titulo)}</strong> — ${esc(g.impacto)}</li>`).join("");
  const corpo = analise
    ? `<p style="font-size:16px;line-height:1.5">${esc(analise.sintese)}</p>
       ${gargalos ? `<p><strong>Principais gargalos</strong></p><ol>${gargalos}</ol>` : ""}`
    : `<p>A análise automática falhou (${esc(erro || "sem detalhe")}). As respostas estão salvas; abra o link e gere de novo.</p>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: "contato@agenteorbiia.com",
      to: ["contato@agenteorbiia.com"],
      subject: `Pré-diagnóstico: ${c.empresa} (${c.atividade || c.ramo})`,
      html: `<div style="font-family:Arial,sans-serif;color:#16212C;max-width:600px">
        <p style="color:#677685;margin:0">Novo pré-diagnóstico ORBI IA</p>
        <h2 style="margin:4px 0 16px">${esc(c.empresa)}</h2>
        <p style="margin:0 0 16px">${esc(c.nome)}${c.cargo ? `, ${esc(c.cargo)}` : ""} · WhatsApp ${esc(c.whatsapp)}${c.email ? ` · ${esc(c.email)}` : ""}<br>
        Ramo: ${esc(c.ramo)}${c.atividade ? ` (${esc(c.atividade)})` : ""}${c.porte ? ` · ${esc(c.porte)} pessoas` : ""}</p>
        ${corpo}
        <p style="margin:24px 0"><a href="${link}" style="background:#16212C;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none">Abrir diagnóstico e desenho</a></p>
        <p style="color:#677685;font-size:12px">Uso interno. Revise antes de falar com o cliente.</p>
      </div>`,
    }),
  });
  if (!r.ok) console.error("E-mail falhou:", r.status, (await r.text()).slice(0, 500));
}

async function avisarWhatsApp({ c, link, ok }) {
  if (!process.env.EVOLUTION_URL || !process.env.EVOLUTION_API_KEY) return;
  const r = await fetch(`${process.env.EVOLUTION_URL}/message/sendText/orbi_ia_landing`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: process.env.EVOLUTION_API_KEY },
    body: JSON.stringify({
      number: AVISO_WHATSAPP,
      text: `Novo pré-diagnóstico\n\n${c.empresa} (${c.atividade || c.ramo})\n${c.nome} · ${c.whatsapp}${c.email ? `\n${c.email}` : ""}\n\n${ok ? "Análise pronta" : "Análise falhou, gere de novo"}: ${link}`,
    }),
  });
  if (!r.ok) console.error("Aviso WhatsApp falhou:", r.status, (await r.text()).slice(0, 500));
  else console.log("Aviso WhatsApp enviado");
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return Response.json({ ok: false }, { status: 400 }); }

  // Armadilha para robôs: campo escondido preenchido ou envio rápido demais
  if (txt(body?.site) || (typeof body?.segundos === "number" && body.segundos < 20)) {
    return Response.json({ ok: true });
  }

  const c = body?.contato || {};
  const dados = {
    origem: txt(body?.origem, 200) || "direto",
    contato: {
      nome: txt(c.nome, 120), cargo: txt(c.cargo, 120), empresa: txt(c.empresa, 160),
      cidade: txt(c.cidade, 120), whatsapp: normalizaFone(txt(c.whatsapp, 30)), email: (() => { const e = txt(c.email, 160).toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? e : ""; })(),
      ramo: txt(c.ramo, 80), porte: txt(c.porte, 40), atividade: txt(c.atividade, 200),
    },
    atendimento: limparLista(body?.atendimento),
    ramo: limparLista(body?.ramo),
    prioridade: limparLista(body?.prioridade),
  };
  const k = dados.contato;
  if (!k.nome || !k.empresa || !/^[1-9][1-9]9\d{8}$/.test(k.whatsapp) || !k.ramo || body?.consentimentoLGPD !== true) {
    return Response.json({ ok: false, error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  const supabase = db();
  if (!supabase) return Response.json({ ok: false, error: "Banco não configurado." }, { status: 500 });

  const ficha = montarFicha(dados);
  const { data: row, error } = await supabase
    .from("pre_diagnosticos")
    .insert([{
      origem: dados.origem, nome: k.nome, cargo: k.cargo, empresa: k.empresa, cidade: k.cidade,
      whatsapp: k.whatsapp, email: k.email, ramo: k.ramo, atividade: k.atividade, porte: k.porte,
      respostas: { atendimento: dados.atendimento, ramo: dados.ramo, prioridade: dados.prioridade },
      ficha, consentimento_lgpd: true,
    }])
    .select("id")
    .single();

  if (error || !row) {
    console.error("Erro ao salvar pré-diagnóstico:", error);
    return Response.json({ ok: false, error: "Não foi possível salvar." }, { status: 500 });
  }

  const link = `${SITE}/analise/index.html?id=${row.id}`;

  // Depois de responder ao empresário: análise, gravação e avisos ao Jonei
  after(async () => {
    let analise = null, erro = null;
    try {
      const r = await gerarAnalise(ficha, "");
      if (r.analise) analise = r.analise;
      else erro = r.error || (r.truncada ? "resposta cortada por tamanho" : "resposta fora do formato");
    } catch (e) {
      erro = e?.message || "erro desconhecido";
    }
    const { error: upErr } = await supabase
      .from("pre_diagnosticos")
      .update(analise ? { analise, analise_em: new Date().toISOString(), analise_erro: null } : { analise_erro: erro })
      .eq("id", row.id);
    if (upErr) console.error("Erro ao gravar análise:", upErr);

    try { await enviarEmail({ c: k, link, analise, erro }); } catch (e) { console.error("Erro no e-mail:", e); }
    try { await avisarWhatsApp({ c: k, link, ok: !!analise }); } catch (e) { console.error("Erro no WhatsApp:", e); }
  });

  return Response.json({ ok: true });
}
