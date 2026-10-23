// Rota interna de análise de anamnese (uso do Jonei, não do cliente).
// Separada da /api/adv de propósito: aquela atende clientes em produção.
// POST: gera a análise a partir do texto colado (e atualiza o registro, se vier id).
// GET ?id=: abre um pré-diagnóstico salvo pelo formulário.

import { createClient } from "@supabase/supabase-js";
import { gerarAnalise } from "@/lib/analise";

export const maxDuration = 300;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function db() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function GET(request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!UUID.test(id)) return Response.json({ error: "Link inválido." }, { status: 400 });
  const supabase = db();
  if (!supabase) return Response.json({ error: "Banco não configurado." }, { status: 500 });
  const { data, error } = await supabase
    .from("pre_diagnosticos")
    .select("id, created_at, empresa, ramo, ficha, analise, analise_em, analise_erro")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error("Erro ao ler pré-diagnóstico:", error);
    return Response.json({ error: "Não foi possível abrir este pré-diagnóstico." }, { status: 500 });
  }
  if (!data) return Response.json({ error: "Pré-diagnóstico não encontrado." }, { status: 404 });
  return Response.json(data);
}

export async function POST(request) {
  try {
    const { ficha, extras, id } = await request.json();
    if (!ficha || typeof ficha !== "string" || ficha.trim().length < 40) {
      return Response.json({ error: "A anamnese está vazia ou curta demais para analisar." }, { status: 400 });
    }
    if (ficha.length > 30000) {
      return Response.json({ error: "A anamnese passou de 30 mil caracteres. Resuma antes de analisar." }, { status: 400 });
    }

    const r = await gerarAnalise(ficha, extras);
    if (r.error) return Response.json({ error: r.error }, { status: 502 });

    // Se veio de um pré-diagnóstico salvo, guarda a nova versão da análise
    if (r.analise && id && UUID.test(id)) {
      const supabase = db();
      if (supabase) {
        const { error } = await supabase
          .from("pre_diagnosticos")
          .update({ analise: r.analise, analise_em: new Date().toISOString(), analise_erro: null })
          .eq("id", id);
        if (error) console.error("Erro ao salvar nova análise:", error);
      }
    }
    return Response.json(r);
  } catch (error) {
    console.error("Erro na API de análise:", error);
    return Response.json({ error: "Erro interno ao gerar a análise." }, { status: 500 });
  }
}
