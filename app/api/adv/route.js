export async function POST(request) {
  try {
    const { messages, system } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Mensagens inválidas" }, { status: 400 });
    }
    if (!system || typeof system !== "string" || system.trim().length === 0) {
      // Rota compartilhada entre vários clientes (Phillipe, Elisangela, outros).
      // Sem um 'system' explícito, não existe persona correta a usar —
      // melhor falhar aqui do que servir a persona errada pra um cliente real.
      console.error("Erro ADV: requisição sem 'system' definido");
      return Response.json({ error: "Configuração do agente ausente" }, { status: 400 });
    }
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 4096,
        system: system,
        messages: messages,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            // Restringe a busca a fontes jurídicas confiáveis — reduz risco de pegar
            // blog/fórum errado ou fonte de baixa qualidade pra citar jurisprudência
            allowed_domains: [
              "stf.jus.br",
              "stj.jus.br",
              "tst.jus.br",
              "jusbrasil.com.br",
              "planalto.gov.br",
            ],
          },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error("Erro Anthropic:", data);
      return Response.json({ error: "Erro na API" }, { status: 500 });
    }
    // Com busca ativada, pode haver blocos de tool_use/tool_result antes do texto final —
    // pega o ÚLTIMO bloco de texto, que é a resposta sintetizada após a busca
    const textBlocks = data.content?.filter((block) => block.type === "text") || [];
    const textBlock = textBlocks[textBlocks.length - 1];
    if (!textBlock) {
      console.error("Erro ADV: resposta sem bloco de texto", data);
      return Response.json({ error: "Resposta vazia do modelo" }, { status: 500 });
    }
    return Response.json({
      content: textBlock.text,
    });
  } catch (error) {
    console.error("Erro na API ADV:", error);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
