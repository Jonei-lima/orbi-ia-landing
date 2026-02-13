import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
    console.log("EVOLUTION_URL:", process.env.EVOLUTION_URL);
function sanitizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function POST(req: Request) {
  try {
    const {
      nome,
      empresa,
      cargo,
      desafio,
      email,
      whatsapp,
      canal_preferido
    } = await req.json();

    if (!nome || !email || !whatsapp) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    const telefoneLimpo = sanitizePhone(whatsapp);

    // 🔥 UPSERT (resolve duplicidade sozinho)
    const { data: lead, error } = await supabase
      .from("leads")
      .upsert(
        {
          nome,
          empresa,
          cargo,
          desafio,
          email,
          telefone: telefoneLimpo,
          canal_preferido
        },
        {
          onConflict: "telefone"
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Erro Supabase:", error);
      return NextResponse.json(
        { error: "Erro ao salvar no banco." },
        { status: 500 }
      );
    }

    const mensagem = `Olá ${lead.nome}, recebemos sua solicitação.

Responda:
1 - Orçamento
2 - Mais informações`;

    const response = await fetch(
      process.env.EVOLUTION_URL + "/message/sendText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.EVOLUTION_API_KEY!
        },
        body: JSON.stringify({
          number: lead.telefone,
          text: mensagem
        })
      }
    );

    const result = await response.json();

    await supabase.from("lead_events").insert([
      {
        lead_id: lead.id,
        event_type: "lead_saved",
        ok: response.ok,
        message: result
      }
    ]);

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("Erro geral:", err);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
