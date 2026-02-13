import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function sanitizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const { nome, email, whatsapp } = await req.json();

    if (!nome || !email || !whatsapp) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    const telefoneLimpo = sanitizePhone(whatsapp);

    // 1️⃣ Salva o lead (usando TELEFONE)
    const { data: lead, error } = await supabase
      .from("leads")
      .insert([
        {
          nome,
          email,
          telefone: telefoneLimpo, // 👈 AQUI CORRIGIDO
          status: "new",
          origem: "landing"
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Erro ao salvar lead" },
        { status: 500 }
      );
    }

    // 2️⃣ Monta mensagem
    const mensagem = `Olá ${lead.nome}, recebemos sua solicitação agora mesmo.

Responda com:
1 - Orçamento
2 - Mais informações

Nossa equipe já foi notificada.`;

    // 3️⃣ Envia WhatsApp usando TELEFONE
    const response = await fetch(
      process.env.EVOLUTION_URL + "/message/sendText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.EVOLUTION_API_KEY!
        },
        body: JSON.stringify({
          number: lead.telefone, // 👈 AQUI CORRIGIDO
          text: mensagem
        })
      }
    );

    const result = await response.json();

    // 4️⃣ Registra evento
    await supabase.from("lead_events").insert([
      {
        lead_id: lead.id,
        event_type: "whatsapp_confirmation",
        ok: response.ok,
        message: result
      }
    ]);

    return NextResponse.json({ ok: true });

  } catch (err) {
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
