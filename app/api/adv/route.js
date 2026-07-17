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
        model: "claude-haiku-4-5-20251001", // trocado de claude-haiku-4-5-20251001 — mais preciso em prazo/número jurídico
        max_tokens: 1024,
        system: system,
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
