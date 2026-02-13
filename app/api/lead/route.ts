import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()

  const { nome, email, whatsapp } = body

  console.log('Novo lead:', { nome, email, whatsapp })

  return NextResponse.json({ success: true })
}
