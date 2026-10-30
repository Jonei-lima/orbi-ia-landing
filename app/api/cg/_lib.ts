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
