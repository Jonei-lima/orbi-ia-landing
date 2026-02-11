import { NextResponse } from "next/server"
import { z } from "zod"
import fs from "fs"
import path from "path"

/*
  ============================
  SCHEMA DE VALIDAÇÃO (ZOD)
  ============================
  Bloqueia lixo, campos fracos e entradas inválidas
*/

const leadSchema = z.object({
  nome: z.string().min(3, "Nome muito curto"),
  empresa: z.string().min(2, "Empresa inválida"),
  cargo: z.string().min(2, "Cargo inválido"),
  desafio: z.string().min(10, "Descreva melhor o desafio"),
  contato: z.string().min(5, "Contato inválido"),
})

/*
  ============================
  ROTA POST
  ============================
*/

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Validação real
    const parsed = leadSchema.safeParse(body)

    if (!parsed.success) {
  const firstError = parsed.error.issues[0]?.message || "Dados inválidos"

  return NextResponse.json(
    {
      success: false,
      error: firstError,
    },
    { status: 400 }
  )
}


    const lead = parsed.data

    /*
      ============================
      LOG LOCAL (Backup mínimo)
      ============================
    */

    const logPath = path.join(process.cwd(), "leads-log.json")

    let leads: any[] = []

    if (fs.existsSync(logPath)) {
      const file = fs.readFileSync(logPath, "utf-8")
      leads = JSON.parse(file)
    }

    leads.push({
      ...lead,
      createdAt: new Date().toISOString(),
    })

    fs.writeFileSync(logPath, JSON.stringify(leads, null, 2))

    /*
      ============================
      AQUI ENTRARIA EMAILJS OU OUTRO ENVIO
      (Pode integrar depois)
      ============================
    */

    console.log("Lead recebido:", lead)

    return NextResponse.json({
      success: true,
    })

  } catch (error) {
    console.error("Erro na API:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno no servidor",
      },
      { status: 500 }
    )
  }
}
