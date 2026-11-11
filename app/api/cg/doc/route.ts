import { NextResponse } from "next/server";
import { createHash, randomInt } from "crypto";
import { supabase, whatsBR, getEvento } from "../_lib";
import { gerar, extenso, moeda, MODELOS, type Clausula } from "./_modelos";

// Cada modelo pertence a uma marca: Cozinha Gourmet (padrão) ou ORBI IA (modelos com marca "orbi")
const ehOrbi = (modelo: string) => MODELOS[modelo]?.marca === "orbi";
const baseDe = (modelo: string) => `https://www.agenteorbiia.com/${ehOrbi(modelo) ? "orbi" : "cozinhagourmet"}/contrato`;
const doDe = (modelo: string) => (ehOrbi(modelo) ? "da ORBI IA" : "do Cozinha Gourmet");
const linkParte = (d: { modelo: string; token: string }) => `${baseDe(d.modelo)}?t=${d.token}`;
const linkAdmin = (d: { modelo: string; admin_token: string }) => `${baseDe(d.modelo)}/admin?a=${d.admin_token}`;

type Doc = {
  id: string; token: string; admin_token: string; modelo: string; titulo: string;
  parte: Record<string, string>; valor: number; clausulas: Clausula[]; versao: number; status: string;
  proposta: null | { itens: Record<string, string>; comentario?: string; em: string; versao: number };
  ultima_decisao: unknown; hash: string | null; created_at: string; updated_at: string;
};

const err = (msg: string, status = 400) => NextResponse.json({ ok: false, error: msg }, { status });
const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const ipDe = (req: Request) => (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;

async function config(): Promise<Record<string, string>> {
  const { data } = await supabase.from("cg_config").select("chave,valor");
  return Object.fromEntries((data || []).map((r: { chave: string; valor: string }) => [r.chave, r.valor]));
}

async function evento(doc: Doc, req: Request, tipo: string, detalhe: unknown = null) {
  await supabase.from("cg_doc_eventos").insert({ doc_id: doc.id, tipo, detalhe, ip: ipDe(req) });
}

// WhatsApp pela instância da Clara, sem registrar no histórico de conversa dela
async function whats(number: string, text: string) {
  const url = process.env.EVOLUTION_URL, key = process.env.EVOLUTION_API_KEY, inst = process.env.CG_EVOLUTION_INSTANCE;
  if (!url || !key || !inst || !number) return;
  // Marca o envio como da Clara (sem texto) para o n8n não tratar como resposta manual
  // e para o código de assinatura não entrar no histórico de conversa dela
  await supabase.from("cg_mensagens").insert({ whatsapp: number, direcao: "out", tipo: "documento", conteudo: null });
  try {
    await fetch(`${url}/message/sendText/${inst}`, {
      method: "POST", headers: { "Content-Type": "application/json", apikey: key },
      body: JSON.stringify({ number, text }),
    });
  } catch (e) { console.error("CG doc whats", e); }
}
const admin = () => process.env.CG_ADMIN_NUMBER || "";

function hashDoc(doc: Doc, orbi: Record<string, string>) {
  return sha(JSON.stringify({ titulo: doc.titulo, parte: doc.parte, valor: doc.valor, clausulas: doc.clausulas, versao: doc.versao,
    orbi: { razao: orbi.orbi_razao, cnpj: orbi.orbi_cnpj } }));
}

function cpfOk(c: string) {
  const d = c.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  for (const t of [9, 10]) {
    let s = 0; for (let i = 0; i < t; i++) s += +d[i] * (t + 1 - i);
    if (((s * 10) % 11) % 10 !== +d[t]) return false;
  }
  return true;
}
const mascaraCpf = (c: string) => { const d = c.replace(/\D/g, ""); return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`; };

function itemTexto(doc: Doc, n: string) {
  for (const c of doc.clausulas) for (const i of c.itens) if (i.n === n) return i.texto;
  return null;
}
const corta = (s: string, n = 220) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

async function porToken(t: string) {
  const { data } = await supabase.from("cg_docs").select("*").eq("token", t).maybeSingle();
  return data as Doc | null;
}
async function porAdmin(a: string) {
  const { data } = await supabase.from("cg_docs").select("*").eq("admin_token", a).maybeSingle();
  return data as Doc | null;
}
async function assinaturas(doc: Doc) {
  const { data } = await supabase.from("cg_doc_assinaturas").select("papel,nome,cpf,whatsapp,versao,hash,ip,assinado_em").eq("doc_id", doc.id);
  return (data || []) as { papel: string; nome: string; cpf: string; whatsapp: string; versao: number; hash: string; ip: string; assinado_em: string }[];
}

async function enviarCodigo(doc: Doc, papel: string, numero: string) {
  const desde = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase.from("cg_doc_codigos").select("id", { count: "exact", head: true }).eq("doc_id", doc.id).gte("created_at", desde);
  if ((count || 0) >= 6) throw new Error("Muitos códigos pedidos. Tente de novo daqui a uma hora.");
  const codigo = String(randomInt(100000, 1000000));
  await supabase.from("cg_doc_codigos").update({ usado: true }).eq("doc_id", doc.id).eq("papel", papel).eq("usado", false);
  await supabase.from("cg_doc_codigos").insert({ doc_id: doc.id, papel, whatsapp: numero, codigo_hash: sha(doc.id + codigo),
    expira_em: new Date(Date.now() + 10 * 60_000).toISOString() });
  await whats(numero, `Seu código para assinar o documento "${doc.titulo}" ${doDe(doc.modelo)} é ${codigo}. Ele vale por 10 minutos. Não compartilhe com ninguém.`);
}

async function conferirCodigo(doc: Doc, papel: string, codigo: string) {
  const { data } = await supabase.from("cg_doc_codigos").select("*").eq("doc_id", doc.id).eq("papel", papel).eq("usado", false)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!data) throw new Error("Peça um código primeiro.");
  if (new Date(data.expira_em) < new Date()) throw new Error("O código expirou. Peça um novo.");
  if (data.tentativas >= 5) throw new Error("Muitas tentativas. Peça um novo código.");
  if (data.codigo_hash !== sha(doc.id + String(codigo).trim())) {
    await supabase.from("cg_doc_codigos").update({ tentativas: data.tentativas + 1 }).eq("id", data.id);
    throw new Error("Código incorreto.");
  }
  await supabase.from("cg_doc_codigos").update({ usado: true }).eq("id", data.id);
  return data.whatsapp as string;
}

function publico(doc: Doc, orbi: Record<string, string>, ass: Awaited<ReturnType<typeof assinaturas>>) {
  return {
    titulo: doc.titulo, parte: doc.parte, valor: moeda(Number(doc.valor)), clausulas: doc.clausulas, versao: doc.versao,
    status: doc.status, proposta: doc.proposta, ultima_decisao: doc.ultima_decisao, hash: doc.hash,
    orbi: { razao: orbi.orbi_razao, fantasia: orbi.orbi_fantasia, cnpj: orbi.orbi_cnpj, endereco: orbi.orbi_endereco, representante: orbi.orbi_representante },
    assinaturas: ass.map(a => ({ papel: a.papel, nome: a.nome, cpf: mascaraCpf(a.cpf), assinado_em: a.assinado_em, ip: a.ip, hash: a.hash, versao: a.versao })),
  };
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const acao = String(b?.acao || "");
    const orbi = await config();

    // ---------- Criação (chave do Jonei) ----------
    if (acao === "novo" || acao === "listar") {
      if (!b?.k || b.k !== orbi.docs_chave) return err("Acesso negado.", 403);
      if (acao === "listar") {
        const { data } = await supabase.from("cg_docs").select("modelo,titulo,parte,valor,status,admin_token,created_at").order("created_at", { ascending: false }).limit(100);
        const querOrbi = b.marca === "orbi";
        const docs = ((data || []) as { modelo: string; admin_token: string }[]).filter(d => ehOrbi(d.modelo) === querOrbi);
        return NextResponse.json({ ok: true, docs: docs.slice(0, 50).map(d => ({ ...d, admin: linkAdmin(d) })) });
      }
      const modelo = String(b.modelo || "");
      if (!MODELOS[modelo]) return err("Escolha o modelo.");
      const p = b.parte || {};
      const orbiDoc = ehOrbi(modelo);
      const parte: Record<string, string> = {
        razao: String(p.razao || "").trim(), fantasia: String(p.fantasia || "").trim(), cnpj: String(p.cnpj || "").trim(),
        endereco: String(p.endereco || "").trim(), representante: String(p.representante || "").trim(),
        whatsapp: whatsBR(String(p.whatsapp || "")), segmento: String(p.segmento || (orbiDoc ? "-" : "")).trim(),
      };
      if (!parte.razao || !parte.fantasia || !parte.cnpj || !parte.endereco || !parte.representante || !parte.whatsapp || !parte.segmento)
        return err("Preencha todos os dados da empresa.");
      const valor = Number(String(b.valor || "").replace(/\./g, "").replace(",", "."));
      if (!valor || valor <= 0) return err("Informe o valor.");
      const ev = await getEvento(String(b.evento || ""));
      const data = ev ? new Date(ev.data_hora).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }) : "[data do episódio]";
      // Contratos da ORBI: mensalidade, renovação, vencimento, volume, CNAEs e foro
      let extras: Record<string, string> | undefined;
      if (orbiDoc) {
        const num = (v: unknown) => Number(String(v || "").replace(/\./g, "").replace(",", "."));
        const x = b.extras || {};
        const mens = num(x.mensalidade), ren = num(x.renovacao);
        if (!mens || !ren) return err("Informe a mensalidade e a renovação.");
        const foro = String(x.foro || "").trim();
        if (!foro) return err("Informe o foro (cidade/UF).");
        const venc = String(x.vencimento || "10").replace(/\D/g, "") || "10";
        const vol = String(x.volume || "30").replace(/\D/g, "") || "30";
        const cn = String(x.cnaes || "5").replace(/\D/g, "") || "5";
        extras = { MENSALIDADE: moeda(mens), MENSALIDADE_EXTENSO: extenso(mens), RENOVACAO: moeda(ren), RENOVACAO_EXTENSO: extenso(ren),
          VENCIMENTO: venc, FORO: foro, VOLUME: `${vol} (${extenso(Number(vol)).replace(/ rea(l|is)$/, "")})`, CNAES: `${cn} (${extenso(Number(cn)).replace(/ rea(l|is)$/, "")})` };
        parte.mensalidade = moeda(mens); parte.renovacao = moeda(ren);
      }
      const g = gerar(modelo, { empresa: parte.fantasia, cota: MODELOS[modelo].cota, data, valor: moeda(valor), extenso: extenso(valor),
        pagamento: String(b.pagamento || "").trim() || (orbiDoc ? "à vista ou em até 3 (três) vezes no cartão de crédito" : "à vista, até 5 (cinco) dias antes do evento, por PIX ou transferência bancária"),
        segmento: parte.segmento, extras });
      const { data: novo, error } = await supabase.from("cg_docs").insert({ modelo, titulo: g.titulo, parte, valor, clausulas: g.clausulas }).select("*").single();
      if (error) throw error;
      await evento(novo as Doc, req, "criado", { modelo });
      return NextResponse.json({ ok: true, admin: linkAdmin(novo as Doc) });
    }

    // ---------- Patrocinador (link com t=) ----------
    if (["ver", "propor", "codigo", "assinar"].includes(acao)) {
      const doc = await porToken(String(b?.t || ""));
      if (!doc || doc.status === "rascunho") return err("Documento não encontrado.", 404);
      const ass = await assinaturas(doc);

      if (acao === "ver") {
        await evento(doc, req, "visualizado");
        return NextResponse.json({ ok: true, doc: publico(doc, orbi, ass) });
      }
      if (doc.status !== "enviado") return err(doc.status === "alteracao" ? "Suas sugestões estão em análise. Você será avisado pelo WhatsApp." : "Este documento não está mais aberto para alterações ou assinatura.");
      if (Number(b.versao) !== doc.versao) return err("O documento foi atualizado. Recarregue a página.");

      if (acao === "propor") {
        const itens: Record<string, string> = {};
        for (const [n, t] of Object.entries(b.itens || {})) {
          const atual = itemTexto(doc, n), novo = String(t || "").trim();
          if (atual !== null && novo && novo !== atual) itens[n] = novo.slice(0, 3000);
        }
        const comentario = String(b.comentario || "").trim().slice(0, 2000);
        if (!Object.keys(itens).length && !comentario) return err("Nenhuma alteração encontrada.");
        const proposta = { itens, comentario, em: new Date().toISOString(), versao: doc.versao };
        await supabase.from("cg_docs").update({ proposta, status: "alteracao", updated_at: new Date().toISOString() }).eq("id", doc.id);
        await evento(doc, req, "alteracao_sugerida", proposta);
        const linhas = Object.entries(itens).map(([n, t]) => `• Item ${n}\nAntes: ${corta(itemTexto(doc, n) || "")}\nSugerido: ${corta(t)}`);
        await whats(admin(), `${doc.parte.fantasia} sugeriu alterações no "${doc.titulo}" e não pode assinar até você analisar.\n\n${linhas.join("\n\n")}${comentario ? `\n\nComentário: ${corta(comentario, 400)}` : ""}\n\nAnalise aqui: ${linkAdmin(doc)}`);
        return NextResponse.json({ ok: true });
      }

      if (acao === "codigo") {
        const numero = whatsBR(String(b.whatsapp || ""));
        if (!numero) return err("Digite o WhatsApp com DDD.");
        await enviarCodigo(doc, "parte", numero);
        await evento(doc, req, "codigo_enviado", { papel: "parte", whatsapp: numero });
        return NextResponse.json({ ok: true });
      }

      if (acao === "assinar") {
        const nome = String(b.nome || "").trim(), cpf = String(b.cpf || "").replace(/\D/g, "");
        if (nome.length < 5) return err("Digite seu nome completo.");
        if (!cpfOk(cpf)) return err("CPF inválido.");
        if (!b.aceite) return err("Marque que leu e concorda com o documento.");
        const numero = await conferirCodigo(doc, "parte", String(b.codigo || ""));
        const hash = hashDoc(doc, orbi);
        const { error } = await supabase.from("cg_doc_assinaturas").insert({ doc_id: doc.id, papel: "parte", nome, cpf, whatsapp: numero, versao: doc.versao,
          hash, ip: ipDe(req), user_agent: (req.headers.get("user-agent") || "").slice(0, 300) });
        if (error) throw error;
        await supabase.from("cg_docs").update({ status: "assinado_parte", hash, updated_at: new Date().toISOString() }).eq("id", doc.id);
        await evento(doc, req, "assinado_parte", { nome, versao: doc.versao, hash });
        await whats(admin(), `${doc.parte.fantasia} assinou o "${doc.titulo}" (versão ${doc.versao}, assinado por ${nome}).\n\nFalta a sua assinatura pela ORBI: ${linkAdmin(doc)}`);
        await whats(numero, `Recebemos a sua assinatura no "${doc.titulo}" ${doDe(doc.modelo)}. Assim que a ORBI assinar, você recebe o link do documento final.`);
        return NextResponse.json({ ok: true });
      }
    }

    // ---------- Jonei (link com a=) ----------
    if (acao.startsWith("admin_")) {
      const doc = await porAdmin(String(b?.a || ""));
      if (!doc) return err("Documento não encontrado.", 404);
      const ass = await assinaturas(doc);

      if (acao === "admin_ver") {
        const { data: evs } = await supabase.from("cg_doc_eventos").select("tipo,detalhe,ip,created_at").eq("doc_id", doc.id).order("created_at", { ascending: false }).limit(40);
        return NextResponse.json({ ok: true, doc: { ...publico(doc, orbi, ass), modelo: doc.modelo, link: linkParte(doc) }, eventos: evs || [] });
      }

      if (acao === "admin_salvar") {
        if (ass.length) return err("O documento já tem assinatura e não pode mais ser editado.");
        if (doc.status === "alteracao") return err("Analise as sugestões do patrocinador antes de editar.");
        const clausulas = b.clausulas as Clausula[];
        if (!Array.isArray(clausulas) || !clausulas.length) return err("Cláusulas inválidas.");
        const limpas = clausulas.map((c, i) => ({ n: String(i + 1), titulo: String(c.titulo || "").trim(),
          itens: (c.itens || []).filter(it => String(it.texto || "").trim()).map((it, j) => ({ n: `${i + 1}.${j + 1}`, texto: String(it.texto).trim() })) }));
        const versao = doc.status === "rascunho" ? doc.versao : doc.versao + 1;
        await supabase.from("cg_docs").update({ clausulas: limpas, versao, updated_at: new Date().toISOString() }).eq("id", doc.id);
        await evento(doc, req, "editado_orbi", { versao });
        return NextResponse.json({ ok: true });
      }

      if (acao === "admin_enviar") {
        if (doc.status !== "rascunho") return err("Este documento já foi liberado.");
        await supabase.from("cg_docs").update({ status: "enviado", updated_at: new Date().toISOString() }).eq("id", doc.id);
        await evento(doc, req, "liberado");
        return NextResponse.json({ ok: true, link: linkParte(doc) });
      }

      if (acao === "admin_decidir") {
        if (doc.status !== "alteracao" || !doc.proposta) return err("Não há sugestões pendentes.");
        const dec = (b.decisoes || {}) as Record<string, string>;
        const finais = (b.finais || {}) as Record<string, string>;
        const resumo: { n: string; decisao: string; texto: string }[] = [];
        const clausulas = doc.clausulas.map(c => ({ ...c, itens: c.itens.map(it => {
          if (!(it.n in doc.proposta!.itens)) return it;
          const d = dec[it.n] || "recusar";
          let texto = it.texto;
          if (d === "aceitar") texto = doc.proposta!.itens[it.n];
          if (d === "editar" && String(finais[it.n] || "").trim()) texto = String(finais[it.n]).trim();
          resumo.push({ n: it.n, decisao: d, texto });
          return { ...it, texto };
        }) }));
        const nota = String(b.nota || "").trim().slice(0, 2000);
        const ultima = { em: new Date().toISOString(), resumo, nota };
        await supabase.from("cg_docs").update({ clausulas, versao: doc.versao + 1, proposta: null, ultima_decisao: ultima, status: "enviado", updated_at: new Date().toISOString() }).eq("id", doc.id);
        await evento(doc, req, "alteracao_analisada", ultima);
        const nomes: Record<string, string> = { aceitar: "sugestão aceita", recusar: "mantido como estava", editar: "ajustado pela organização" };
        const linhas = resumo.map(r => `• Item ${r.n}: ${nomes[r.decisao] || "mantido como estava"}`);
        await whats(doc.parte.whatsapp, `Analisamos as suas sugestões no "${doc.titulo}" ${doDe(doc.modelo)}:\n${linhas.join("\n")}${nota ? `\n\n${nota}` : ""}\n\nA versão atualizada já está no link. Se estiver tudo certo, é só assinar: ${linkParte(doc)}`);
        return NextResponse.json({ ok: true });
      }

      if (acao === "admin_codigo") {
        if (doc.status !== "assinado_parte") return err("O patrocinador ainda não assinou.");
        await enviarCodigo(doc, "orbi", admin());
        await evento(doc, req, "codigo_enviado", { papel: "orbi" });
        return NextResponse.json({ ok: true });
      }

      if (acao === "admin_assinar") {
        if (doc.status !== "assinado_parte") return err("O patrocinador ainda não assinou.");
        if (!b.aceite) return err("Marque que leu e concorda com o documento.");
        if (!cpfOk(orbi.orbi_cpf || "") || /\[/.test(orbi.orbi_representante || "[")) return err("Preencha o nome e o CPF do representante da ORBI no Supabase (tabela cg_config) antes de assinar.");
        const numero = await conferirCodigo(doc, "orbi", String(b.codigo || ""));
        const hash = hashDoc(doc, orbi);
        const { error } = await supabase.from("cg_doc_assinaturas").insert({ doc_id: doc.id, papel: "orbi", nome: orbi.orbi_representante, cpf: orbi.orbi_cpf,
          whatsapp: numero, versao: doc.versao, hash, ip: ipDe(req), user_agent: (req.headers.get("user-agent") || "").slice(0, 300) });
        if (error) throw error;
        await supabase.from("cg_docs").update({ status: "concluido", hash, updated_at: new Date().toISOString() }).eq("id", doc.id);
        await evento(doc, req, "concluido", { hash });
        const final = linkParte(doc);
        await whats(doc.parte.whatsapp, `O "${doc.titulo}" ${doDe(doc.modelo)} está assinado pelas duas partes. Veja e salve o documento final: ${final}`);
        await whats(admin(), `Documento concluído com ${doc.parte.fantasia}: ${final}`);
        return NextResponse.json({ ok: true });
      }

      if (acao === "admin_cancelar") {
        if (doc.status === "concluido") return err("Documento concluído não pode ser cancelado por aqui.");
        await supabase.from("cg_docs").update({ status: "cancelado", updated_at: new Date().toISOString() }).eq("id", doc.id);
        await evento(doc, req, "cancelado");
        return NextResponse.json({ ok: true });
      }
    }

    return err("Ação inválida.");
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (/^(Muitos|Peça|O código|Muitas|Código)/.test(m)) return err(m);
    console.error("CG doc", e);
    return err("Não foi possível concluir agora. Tente de novo.", 500);
  }
}
