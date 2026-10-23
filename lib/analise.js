// Núcleo da análise de anamnese: roteiro, catálogo da ORBI e chamada à IA.
// Usado por /api/analise (manual) e /api/pre-diagnostico (formulário).

const CATALOGO = `
O QUE A ORBI IA ENTREGA (só recomende itens desta lista):
1. Agente de atendimento no WhatsApp (API oficial da Meta ou Evolution API), em texto e áudio, com memória do histórico de cada cliente.
2. Qualificação de leads com perguntas e critérios definidos pela empresa, com repasse ao humano acompanhado de um resumo da conversa.
3. Agendamento (visitas, consultas, reuniões) com confirmação e lembrete, integrado a Google Agenda ou a sistema que tenha API.
4. Follow-up automático em cadência definida pela empresa (ex.: 24h, 3 dias, 7 dias), parando quando o cliente responde.
5. Reativação de base parada (leads antigos sem resposta), somente pela API oficial da Meta, com modelos de mensagem aprovados e envio escalonado.
6. Resumo automático do histórico do cliente entregue ao atendente ou corretor no momento do repasse.
7. Alertas internos por e-mail e WhatsApp (lead quente, prazo vencendo, pendência parada).
8. Automação de fluxos internos no n8n: encaminhamentos, checklists de documentos, cobrança de pendências, controle de prazos.
9. Conferência de documentos recebidos (extração de dados, checagem do que falta), sempre com revisão humana.
10. Geração de minutas a partir dos modelos da própria empresa, sempre com revisão humana antes de assinar.
11. Integração com sistemas que tenham API, webhook ou exportação de dados; integração com planilhas Google.
12. Captura de leads de Meta Ads, Google e formulários do site direto para o fluxo de atendimento.
13. Painel de indicadores: volume de leads, tempo de primeira resposta, taxa de resposta ao follow-up, visitas agendadas, conversão.

LIMITES (nunca prometa):
- Integrar sistema sem API, webhook ou exportação. Nesse caso, proponha trabalhar com exportação/planilha ou em paralelo ao sistema, e registre como risco.
- Aprovar crédito, financiamento ou dar parecer jurídico/contábil. A IA organiza e encaminha; a decisão é humana.
- Disparo em massa por WhatsApp não oficial.
- Resultado numérico (ex.: "dobrar vendas") sem uma medição inicial. Proponha medir primeiro.
- Treinar ou substituir a equipe. A IA padroniza respostas e garante execução de rotina; capacitação é da empresa.
`;

const ROTEIRO = `
Você é analista de processos da ORBI IA. Recebe a anamnese de uma empresa, coletada em reunião ou por formulário, e produz um diagnóstico de uso INTERNO para Jonei Lima, que depois apresenta a solução ao cliente.

Regras:
- Use somente o que está na anamnese. Separe o que é dado ("dado"), estimativa do cliente ("estimativa") e dedução sua ("hipótese").
- Aponte números que não fecham entre si e lacunas que impedem medir o problema. Isso é tão importante quanto a solução.
- Recomende apenas itens do catálogo abaixo, citando o número do item. Se o problema não tem solução no catálogo, diga isso em "fora_do_escopo".
- Priorize pelo impacto em receita e capacidade, e pela facilidade de provar resultado rápido.
- A fase 1 deve ser pequena, mensurável e depender o mínimo possível de integrações incertas.
- Português do Brasil, frases curtas, sem jargão técnico, sem exageros.
- Se a anamnese veio de formulário preenchido pelo próprio empresário, trate as respostas como estimativa e liste em "perguntas" o que precisa ser confirmado na conversa.
- Se a empresa marcou que a atividade não está na lista, use a atividade descrita por ela para entender o negócio. Se a descrição for vaga, registre isso em "lacunas" e não invente detalhes do ramo.

${CATALOGO}

Responda SOMENTE com um objeto JSON válido, sem texto antes ou depois, neste formato:
{
  "empresa": "nome",
  "sintese": "2 a 3 frases: o problema central e por que ele custa dinheiro",
  "gargalos": [
    {"titulo": "curto", "evidencia": "o que na anamnese mostra isso", "impacto": "o que custa", "base": "dado|estimativa|hipótese", "prioridade": 1}
  ],
  "inconsistencias": ["números ou falas que não fecham entre si"],
  "lacunas": ["o que falta medir e por que importa"],
  "fases": [
    {"nome": "Fase 1: ...", "objetivo": "uma frase", "entregas": ["descrição curta (item N)"], "depende_de": ["pré-requisito"], "metrica": "como saber que funcionou", "prazo_estimado": "ex.: 3 a 4 semanas", "contribuicao_pct": 0}
  ],
  "fluxo_atual": [
    {"raia": "Cliente|Equipe|Sistema", "acao": "até 8 palavras", "problema": "curto ou vazio"}
  ],
  "fluxo_proposto": [
    {"raia": "Cliente|Agente ORBI|Equipe|Sistema", "acao": "até 8 palavras", "ganho": "curto ou vazio"}
  ],
  "riscos": [{"risco": "curto", "mitigacao": "curto"}],
  "perguntas": ["perguntas para fazer ao cliente antes da proposta"],
  "fora_do_escopo": ["o que a ORBI não resolve aqui"],
  "projecao": {
    "unidade": "o que entra no funil, no plural (ex.: leads, pedidos, pacientes)",
    "entrada_mensal": 0,
    "entrada_base": "dado|estimativa|hipótese",
    "etapas": [
      {"nome": "até 5 palavras", "taxa_hoje": 0, "taxa_orbi": 0, "justificativa": "por que essas taxas, em uma frase"}
    ],
    "indicadores": [
      {"nome": "até 5 palavras", "hoje": "valor curto", "orbi": "valor curto"}
    ],
    "horas": {"tarefa": "tarefa repetitiva", "vezes_mes": 0, "minutos": 0, "automacao_pct": 0}
  }
}

Regras da projeção (ela vira um gráfico que o Jonei mostra ao cliente, depois de revisar):
- "entrada_mensal" é o volume mensal que entra no funil, tirado da anamnese. Se houver números conflitantes, use o menor e explique em "inconsistencias".
- "etapas": 3 ou 4 etapas do funil, em ordem. Cada taxa é a porcentagem (0 a 100) que passa da etapa anterior para esta. A primeira etapa compara com a entrada.
- O funil termina na última etapa que a ORBI entrega ou influencia diretamente: contato respondido, lead qualificado, visita, consulta, reunião ou orçamento agendado. NUNCA inclua venda, fechamento, cliente fechado, contrato assinado, faturamento ou receita: isso depende de preço, equipe comercial e mercado, e a ORBI não pode prometer.
- "taxa_hoje" vem da anamnese; sem dado, estime com cautela e diga "hipótese" na justificativa.
- Se a anamnese informar o resultado real de alguma etapa (ex.: 80 visitas no mês), calibre as taxas de hoje para que o funil de hoje chegue perto desse número.
- "taxa_orbi" deve ser conservadora e explicável pelas entregas propostas. Nunca acima de 95. Melhoria grande só onde a causa é demora ou falta de rotina, que a automação resolve.
- "indicadores": até 3 comparações qualitativas de antes e depois (ex.: tempo de primeira resposta, atendimento fora do horário, follow-up executado).
- "horas": a tarefa repetitiva mais citada, quantas vezes por mês acontece, minutos por vez e a porcentagem que a ORBI automatiza (no máximo 80).
- Em cada fase, "contribuicao_pct" é quanto do ganho da última etapa do funil (com a ORBI menos hoje) vem daquela fase. A soma das fases deve dar 100. Fase que não mexe no funil recebe 0.
- Se a anamnese não permitir estimar nada disso com honestidade, retorne "projecao": null.

Seja conciso: cada texto do JSON com no máximo 20 palavras, exceto a síntese.
Limites de tamanho: até 5 gargalos, até 3 fases, fluxo_atual com 5 a 8 passos, fluxo_proposto com 6 a 10 passos, até 5 riscos, até 6 perguntas. Os fluxos descrevem o caminho principal do problema prioritário, em ordem.
`;

export function extrairJSON(texto) {
  const limpo = texto.replace(/```json|```/g, "");
  const ini = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");
  if (ini === -1 || fim <= ini) return null;
  try {
    return JSON.parse(limpo.slice(ini, fim + 1));
  } catch {
    return null;
  }
}


async function chamarIA(system, conteudo) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 12000,
      system,
      messages: [{ role: "user", content: conteudo }],
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    console.error("Erro Anthropic (analise):", data);
    return { error: "A IA não respondeu. Tente de novo em instantes." };
  }
  const texto = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
  const analise = extrairJSON(texto);
  if (!analise) return { raw: texto, truncada: data.stop_reason === "max_tokens" };
  return { analise };
}

function blocoRespostas(respostas) {
  return respostas.map((r, i) => `${i + 1}. ${r.pergunta}\n   Resposta: ${r.resposta}`).join("\n");
}

export async function gerarAnalise(ficha, extras, historico) {
  let conteudo = "ANAMNESE:\n" + String(ficha).trim();
  if (extras && typeof extras === "string" && extras.trim()) {
    conteudo += "\n\nINFORMAÇÕES COMPLEMENTARES DO JONEI:\n" + extras.trim().slice(0, 8000);
  }
  if (Array.isArray(historico) && historico.length) {
    conteudo += "\n\nRESPOSTAS DO CLIENTE A PERGUNTAS ANTERIORES:\n" + blocoRespostas(historico);
  }
  return chamarIA(ROTEIRO, conteudo);
}

const REVISAO = `
MODO REVISÃO: você recebe um diagnóstico já feito e respostas novas do cliente às perguntas pendentes.
- Mantenha exatamente igual tudo o que as respostas não afetam (mesmos textos, mesma ordem).
- Atualize só o que as respostas mudam: gargalos, base (dado/estimativa/hipótese), inconsistências, lacunas, fases, fluxos, riscos e principalmente a projeção.
- Uma resposta do cliente vale como "dado". Se ela contradizer algo anterior, a resposta vence.
- Tire de "perguntas" as que foram respondidas. Só acrescente pergunta nova se a resposta abriu uma dúvida importante.
- Inclua no JSON o campo "o_que_mudou": lista de até 5 itens curtos dizendo o que mudou e por quê. Se nada mudou, lista vazia.
`;

export async function revisarAnalise(ficha, extras, anterior, respostas) {
  const ant = { ...anterior };
  delete ant.respostas_cliente;
  delete ant.o_que_mudou;
  let conteudo = "ANAMNESE ORIGINAL:\n" + String(ficha).trim();
  if (extras && typeof extras === "string" && extras.trim()) {
    conteudo += "\n\nINFORMAÇÕES COMPLEMENTARES DO JONEI:\n" + extras.trim().slice(0, 8000);
  }
  const hist = Array.isArray(anterior.respostas_cliente) ? anterior.respostas_cliente : [];
  if (hist.length) conteudo += "\n\nRESPOSTAS JÁ INCORPORADAS ANTES:\n" + blocoRespostas(hist);
  conteudo += "\n\nDIAGNÓSTICO ATUAL (JSON):\n" + JSON.stringify(ant);
  conteudo += "\n\nRESPOSTAS NOVAS DO CLIENTE:\n" + blocoRespostas(respostas);
  return chamarIA(ROTEIRO + REVISAO, conteudo);
}
