import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const payload = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: 'Você é o Assistente ORBI Político. Responda perguntas sobre IA aplicada a campanhas políticas no Brasil. Seja direto e objetivo. Responda sempre em português.',
      messages: messages,
    };

    console.log('Payload:', JSON.stringify(payload));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Anthropic response:', JSON.stringify(data));

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro ao consultar IA', details: data }, { status: 500 });
    }

    const text = data.content?.[0]?.text || 'Sem resposta.';
    return NextResponse.json({ response: text });

  } catch (error) {
    console.error('Catch error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
