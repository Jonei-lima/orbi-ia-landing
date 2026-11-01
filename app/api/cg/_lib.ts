import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export function whatsBR(raw: string): string {
  const d = (raw || "").replace(/\D/g, "");
  if (d.length < 10) return "";
  return d.startsWith("55") ? d : `55${d}`;
}

export function insta(raw: string): string {
  const v = (raw || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/[/?#].*$/, "").replace(/^@/, "");
  return v ? `@${v}` : "";
}

export async function getEvento(slug: string) {
  const q = supabase.from("cg_eventos").select("*");
  const { data } = slug
    ? await q.eq("slug", slug).maybeSingle()
    : await q.eq("ativo", true).order("data_hora", { ascending: true }).limit(1).maybeSingle();
  return data as null | { id: string; slug: string; titulo: string; data_hora: string; local: string; endereco: string; maps_url: string | null };
}

// Envia WhatsApp pela instância da Clara (Evolution). Se faltar configuração, apenas ignora.
export async function sendWhats(number: string, text: string) {
  const url = process.env.EVOLUTION_URL;
  const key = process.env.EVOLUTION_API_KEY;
  const inst = process.env.CG_EVOLUTION_INSTANCE;
  if (!url || !key || !inst) return;
  try {
    await fetch(`${url}/message/sendText/${inst}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key },
      body: JSON.stringify({ number, text }),
    });
    // Registra no histórico para a Clara saber o que já foi dito
    await supabase.from("cg_mensagens").insert({ whatsapp: number, direcao: "out", tipo: "texto", conteudo: text });
  } catch (e) {
    console.error("CG sendWhats", e);
  }
}

export function quando(iso: string) {
  const d = new Date(iso);
  const dia = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", timeZone: "America/Sao_Paulo" });
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }).replace(":", "h");
  return `${dia}, às ${hora}`;
}

// Perfil de quem confirma (lista do formulário)
const PERFIS: Record<string, string> = {
  arquiteto: "Arquiteto(a)",
  designer_interiores: "Designer de interiores",
  decorador: "Decorador(a)",
  paisagista: "Paisagista",
  engenheiro: "Engenheiro(a)",
  construtora: "Construtora ou incorporadora",
  imobiliaria: "Imobiliária ou corretor(a)",
  empresario: "Empresário(a)",
  patrocinador: "Patrocinador",
  influenciador: "Influenciador(a)",
  imprensa: "Imprensa",
  chef: "Chef",
  fornecedor: "Fornecedor ou parceiro",
  equipe: "Equipe do projeto",
  acompanhante: "Acompanhante de convidado",
  outro: "Outro",
};
export function perfilDe(raw: unknown, outro: unknown): { perfil: string | null; tipo: string | null } {
  const v = String(raw || "");
  if (!PERFIS[v]) return { perfil: null, tipo: null };
  const perfil = v === "outro" ? `Outro: ${String(outro || "").trim().slice(0, 60) || "não informado"}` : PERFIS[v];
  const tipo = v === "patrocinador" ? "patrocinador" : v === "imprensa" ? "imprensa" : null;
  return { perfil, tipo };
}

// Grava mesmo se a coluna "perfil" ainda não existir no banco
export function semColunaPerfil(e: unknown) {
  const m = String((e as { message?: string })?.message || "");
  return m.includes("perfil");
}

// Restrição alimentar (lista do formulário)
const RESTRICOES: Record<string, string> = {
  nenhuma: "Nenhuma",
  celiaco: "Doença celíaca (sem glúten)",
  lactose: "Intolerância à lactose",
  frutos_do_mar: "Alergia a frutos do mar",
  amendoim_castanhas: "Alergia a amendoim ou castanhas",
  vegetariano: "Vegetariano(a)",
  vegano: "Vegano(a)",
  outra: "Outra",
};
export function restricaoDe(raw: unknown): string | null {
  const v = String(raw || "");
  return RESTRICOES[v] && v !== "nenhuma" ? RESTRICOES[v] : null;
}
