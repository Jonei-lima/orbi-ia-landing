// Atualização ao vivo do "desenho da solução" mostrado ao cliente em reunião.
// Recebe o desenho atual (JSON) e as respostas que o Jonei digitou, e devolve
// SÓ as seções que mudam (patch), para a resposta chegar rápido.
// O texto é lido pelo cliente na tela: tom de proposta, nada de crítica interna.

import { extrairJSON } from "@/lib/analise";

const CATALOGO = `
O QUE A ORBI IA ENTREGA (só proponha itens desta lista):
1. Agente de atendimento no WhatsApp (API oficial da Meta ou Evolution API), em texto e áudio, com memória do histórico de cada cliente.
2. Qualificação de leads com perguntas e critérios definidos pela empresa, com repasse ao humano acompanhado de um resumo da conversa.
3. Agendamento (visitas, reuniões) com confirmação e lembrete, integrado a Google Agenda ou a sistema que tenha API.
4. Follow-up automático em cadência definida pela empresa, parando quando o cliente responde.
5. Reativação de base parada (leads antigos sem resposta), somente pela API oficial da Meta, com modelos aprovados e envio escalonado.
6. Resumo automático do histórico do cliente entregue ao atendente ou corretor no momento do repasse.
7. Alertas internos por e-mail e WhatsApp (lead quente, prazo vencendo, pendência parada).
8. Automação de fluxos internos no n8n: encaminhamentos, checklists de documentos, cobrança de pendências, controle de prazos.
9. Conferência de documentos recebidos (extração de dados, checagem do que falta), sempre com revisão humana.
10. Geração de minutas a partir dos modelos da própria empresa, sempre com revisão humana antes de assinar.
11. Integração com sistemas que tenham API, webhook ou exportação de dados; integração com planilhas Google.
12. Captura de leads de Meta Ads, Google e formulários do site direto para o fluxo de atendimento.
13. Painel de indicadores: volume de leads, tempo de primeira resposta, follow-up executado, visitas agendadas.

LIMITES (nunca prometa):
- Integrar sistema sem API, webhook ou exportação: nesse caso o agente trabalha em paralelo ou por exportação, e isso vai em "atencao".
- Aprovar crédito ou financiamento, ou dar parecer jurídico. A IA organiza e encaminha; a decisão é humana.
- Disparo em massa por WhatsApp não oficial.
- Número de vendas, fechamentos, faturamento ou "aumento de X%" em vendas. Só indicadores de atendimento (tempo de resposta, leads respondidos, follow-up executado, visitas agendadas).
- Substituir ou treinar a equipe. O agente garante a rotina; capacitação é da empresa.
`;

const ROTEIRO = `
Você é consultor de processos da ORBI IA. Durante uma reunião ao vivo, o Jonei digita respostas do cliente às perguntas pendentes. Você atualiza o desenho da solução que está aberto na tela, diante do cliente.

Regras:
- O cliente está lendo. Tom de proposta: claro, respeitoso, sem crítica à equipe, sem jargão técnico, frases curtas, português do Brasil.
- Uma resposta do cliente vale como dado confirmado. Se contradizer o desenho atual, a resposta vence.
- Mude só o que as respostas afetam. Seção que não muda: não devolva.
- Nunca invente números. Número só se veio da resposta ou do desenho atual. Cálculo simples a partir deles é permitido (ex.: 35 por dia ≈ 1.050 por mês) e deve dizer "estimado".
- Em "numeros", "base" é "informado" (veio do cliente), "estimado" (cálculo ou estimativa do cliente) ou "a confirmar".
- Proponha apenas itens do catálogo, citando o número em "item". Se a resposta revelar um problema fora do catálogo, registre em "atencao".
- Tire de "perguntas" as que foram respondidas. Acrescente pergunta nova só se a resposta abriu uma dúvida que muda a proposta.
- Se a resposta mudar a prioridade (ex.: o que mais incomoda), reordene "fases" e "problemas" de acordo.
- Mantenha o tamanho: cada texto com no máximo 25 palavras; listas com no máximo 8 itens; fases no máximo 3.

${CATALOGO}

Responda SOMENTE com um objeto JSON válido, sem texto antes ou depois:
{
  "secoes": { ...apenas as chaves que mudaram, com o conteúdo COMPLETO da seção, no mesmo formato do desenho atual... },
  "o_que_mudou": ["até 5 frases curtas, para o cliente ler: o que mudou no desenho e por quê"]
}
Chaves permitidas em "secoes": sintese, numeros, problemas, agente, fluxo_atual, fluxo_proposto, acoes, fases, indicadores, atencao, perguntas.
`;

const CHAVES = ["sintese", "numeros", "problemas", "agente", "fluxo_atual", "fluxo_proposto", "acoes", "fases", "indicadores", "atencao", "perguntas"];

export async function atualizarProjeto(desenho, respostas, observacoes) {
  const atual = {};
  for (const k of CHAVES) if (desenho[k] !== undefined) atual[k] = desenho[k];
  let conteudo = "EMPRESA: " + String(desenho.empresa || "").slice(0, 120);
  conteudo += "\n\nDESENHO ATUAL (JSON):\n" + JSON.stringify(atual);
  const hist = Array.isArray(desenho.respostas) ? desenho.respostas : [];
  if (hist.length) {
    conteudo += "\n\nRESPOSTAS JÁ INCORPORADAS:\n" + hist.map((r, i) => `${i + 1}. ${r.pergunta}\n   Resposta: ${r.resposta}`).join("\n");
  }
  if (respostas.length) {
    conteudo += "\n\nRESPOSTAS NOVAS DO CLIENTE:\n" + respostas.map((r, i) => `${i + 1}. ${r.pergunta}\n   Resposta: ${r.resposta}`).join("\n");
  }
  if (observacoes) conteudo += "\n\nOUTRAS INFORMAÇÕES DITAS NA REUNIÃO:\n" + observacoes;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 8000,
      system: ROTEIRO,
      messages: [{ role: "user", content: conteudo }],
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    console.error("Erro Anthropic (projeto):", data);
    return { error: "A IA não respondeu. Tente de novo em instantes." };
  }
  const texto = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  const r = extrairJSON(texto);
  if (!r || typeof r.secoes !== "object" || r.secoes === null) {
    return { error: data.stop_reason === "max_tokens" ? "A resposta ficou longa demais. Envie menos respostas por vez." : "A IA devolveu um formato inválido. Tente de novo." };
  }
  const secoes = {};
  for (const k of CHAVES) if (r.secoes[k] !== undefined) secoes[k] = r.secoes[k];
  const mudou = Array.isArray(r.o_que_mudou) ? r.o_que_mudou.map(String).slice(0, 5) : [];
  return { secoes, o_que_mudou: mudou };
}
