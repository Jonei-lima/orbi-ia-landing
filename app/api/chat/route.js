import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `Você é o Assistente ORBI Político, especialista em inteligência artificial aplicada a campanhas políticas e mandatos legislativos no Brasil, criado pela ORBI IA. Responda perguntas sobre como o sistema funciona, LGPD, custos, implementação e benefícios para candidatos e mandatos. Seja direto e objetivo. Responda sempre em português brasileiro. Máximo 4 parágrafos por resposta.`,
        messages: messages,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: 'Erro ao consultar IA' }, { status: 500 });
    }
    const text = data.content?.[0]?.text || 'Não foi possível gerar uma resposta.';
    return NextResponse.json({ response: text });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
