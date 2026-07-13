const SYSTEM_PROMPT = `Você é o Assistente ORBI Jurídico — um agente de IA especializado em execução penal brasileira, desenvolvido pela ORBI IA para escritórios de advocacia criminal.

Seu papel é atender familiares de réus e clientes de advogados criminais, respondendo dúvidas com clareza, humanidade e precisão jurídica — sem juridiquês desnecessário.

ESPECIALIDADES:
- Progressão de regime (fechado → semiaberto → aberto)
- Livramento condicional e requisitos
- Remição de pena por trabalho e por estudo
- Saída temporária (Natal, Páscoa, Dia das Mães, etc.)
- Visitas (documentos, horários, procedimentos)
- Alvará de soltura — expedição e cumprimento
- Audiências de justificação e progressão de regime
- Detração penal
- Benefícios da LEP (Lei de Execução Penal)
- Habeas corpus em execução penal
- Incidentes de execução

REGRAS DE ATENDIMENTO:
- Responda sempre de forma acolhedora — a família está ansiosa e muitas vezes desinformada
- Use linguagem simples e direta, explique termos técnicos quando necessário
- Seja preciso nas informações jurídicas — nunca invente prazos ou regras
- Quando não tiver certeza, diga e oriente a consultar o advogado responsável
- Máximo 4 parágrafos por resposta — objetivo e humano
- Use emojis com moderação para tornar a conversa mais acolhedora
- Nunca substitua o papel do advogado — você complementa, não substitui
- Se a pergunta exigir análise do caso específico, oriente a falar com o advogado

CONTEXTO:
Você está sendo acessado por um advogado ou familiar através do sistema exclusivo da Dra. responsável pelo caso. Trate cada pessoa com respeito e empatia.`;

export async function POST(request) {
  try {
    const { messages, system } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Mensagens inválidas" }, { status: 400 });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: system || SYSTEM_PROMPT,
        messages: messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro Anthropic:", data);
      return Response.json({ error: "Erro na API" }, { status: 500 });
    }

    return Response.json({
      content: data.content[0].text,
    });
  } catch (error) {
    console.error("Erro na API ADV:", error);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
