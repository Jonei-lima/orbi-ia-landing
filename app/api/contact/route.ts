import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

// ===== ENV =====
const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// ===== VALIDAÇÃO =====
const leadSchema = z.object({
  nome: z.string().min(3),
  empresa: z.string().min(2),
  cargo: z.string().min(2),
  desafio: z.string().min(5),
  email: z.string().email().optional(),
  telefone: z.string().min(8).optional(),
  canal_preferido: z.enum(["email", "whatsapp", "ligacao"]),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const parsed = leadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Dados inválidos" },
        { status: 400 }
      )
    }

    const {
      nome,
      empresa,
      cargo,
      desafio,
      email,
      telefone,
      canal_preferido,
    } = parsed.data

    // 🚨 Validação extra: precisa ter pelo menos um meio de contato
    if (!email && !telefone) {
      return NextResponse.json(
        { success: false, error: "Informe email ou telefone." },
        { status: 400 }
      )
    }

    // ===== SALVA LEAD =====
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        nome,
        empresa,
        cargo,
        desafio,
        contato: email || telefone,
        contato_tipo: canal_preferido,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json(
        { success: false, error: "Erro ao salvar lead." },
        { status: 500 }
      )
    }

    // ===== LOG DO EVENTO =====
    await supabase.from("lead_events").insert({
      lead_id: lead.id,
      event_type: "lead_created",
      ok: true,
      message: "Lead criado via landing page",
    })

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error("Erro na API:", err)
    return NextResponse.json(
      { success: false, error: "Erro interno." },
      { status: 500 }
    )
  }
}