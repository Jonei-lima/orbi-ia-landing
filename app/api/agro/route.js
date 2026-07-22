export async function POST(request) {
  try {
    const { messages, system } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Mensagens inválidas" }, { status: 400 });
    }
    if (!system || typeof system !== "string" || system.trim().length === 0) {
      // Rota compartilhada entre vários pilotos de produtores (mesma lógica do /api/adv).
      // Sem um 'system' explícito, não existe persona correta a usar —
      // melhor falhar aqui do que servir a persona errada pra um produtor real.
      console.error("Erro AGRO: requisição sem 'system' definido");
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
            // Restringe a busca a fontes técnicas de agronomia/agro confiáveis —
            // reduz risco de pegar blog/fórum de baixa qualidade pra citar manejo.
            allowed_domains: [
              "embrapa.br",
              "agencia.cnptia.embrapa.br",
              "conab.gov.br",
              "imea.com.br",
              "gov.br",
              "inmet.gov.br",
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
    const textBlocks = data.content?.filter((block) => block.type === "text") || [];
    if (textBlocks.length === 0) {
      console.error("Erro AGRO: resposta sem bloco de texto", data);
      return Response.json({ error: "Resposta vazia do modelo" }, { status: 500 });
    }
    const fullText = textBlocks.map((block) => block.text).join("");

    // As citações da busca vêm como metadado separado (block.citations), não como
    // link dentro do texto — precisa juntar e listar as fontes manualmente
    const fontes = new Map(); // url -> title, pra não repetir a mesma fonte
    for (const block of textBlocks) {
      if (Array.isArray(block.citations)) {
        for (const c of block.citations) {
          if (c.url && !fontes.has(c.url)) {
            fontes.set(c.url, c.title || c.url);
          }
        }
      }
    }
    let finalText = fullText;
    if (fontes.size > 0) {
      const listaFontes = Array.from(fontes.entries())
        .map(([url, title]) => `${title}: ${url}`)
        .join("\n");
      finalText += `\n\nFontes consultadas:\n${listaFontes}`;
    }

    return Response.json({
      content: finalText,
    });
  } catch (error) {
    console.error("Erro na API AGRO:", error);
    return Response.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
