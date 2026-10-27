// Atualiza ao vivo o desenho da solução apresentado em reunião (páginas de projeto por cliente).
// Não grava nada: o desenho fica no navegador de quem apresenta.

import { atualizarProjeto } from "@/lib/projeto";

export const maxDuration = 300;

export async function POST(request) {
  try {
    const { desenho, respostas, observacoes } = await request.json();
    if (!desenho || typeof desenho !== "object") {
      return Response.json({ error: "Desenho ausente." }, { status: 400 });
    }
    if (JSON.stringify(desenho).length > 60000) {
      return Response.json({ error: "Desenho grande demais." }, { status: 400 });
    }
    const novas = (Array.isArray(respostas) ? respostas : [])
      .slice(0, 15)
      .map((x) => ({ pergunta: String(x?.pergunta || "").slice(0, 400), resposta: String(x?.resposta || "").trim().slice(0, 2000) }))
      .filter((x) => x.pergunta && x.resposta);
    const obs = String(observacoes || "").trim().slice(0, 4000);
    if (!novas.length && !obs) {
      return Response.json({ error: "Escreva ao menos uma resposta." }, { status: 400 });
    }
    const r = await atualizarProjeto(desenho, novas, obs);
    if (r.error) return Response.json({ error: r.error }, { status: 502 });
    return Response.json(r);
  } catch (error) {
    console.error("Erro na API de projeto:", error);
    return Response.json({ error: "Erro interno ao atualizar o desenho." }, { status: 500 });
  }
}
