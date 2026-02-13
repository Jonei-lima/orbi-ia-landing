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

    let lead;
    let isReengaged = false;

    // 🔹 Tenta inserir novo lead
    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          nome,
          email,
          telefone: telefoneLimpo,
          status: "new",
          origem: "landing"
        }
      ])
      .select()
      .single();

    if (error) {
      // 🔥 Se for erro de duplicidade
      if (error.code === "23505") {
        isReengaged = true;

        // Busca lead existente
        const { data: existingLead } = await supabase
          .from("leads")
          .select("*")
          .eq("telefone", telefoneLimpo)
          .single();

        if (!existingLead) {
          return NextResponse.json(
            { error: "Erro ao buscar lead existente" },
            { status: 500 }
          );
        }

        // Atualiza dados
        await supabase
          .from("leads")
          .update({
            nome,
            email,
            updated_at: new Date()
          })
          .eq("telefone", telefoneLimpo);

        lead = existingLead;
      } else {
        return NextResponse.json(
          { error: "Erro ao salvar no banco." },
          { status: 500 }
        );
      }
    } else {
      lead = data;
    }

    // 🔹 Monta mensagem
    const mensagem = isReengaged
      ? `Olá ${lead.nome}, recebemos novamente sua solicitação.

Já estamos acompanhando seu atendimento.

Responda:
1 - Orçamento
2 - Mais informações`
      : `Olá ${lead.nome}, recebemos sua solicitação agora mesmo.

Responda:
1 - Orçamento
2 - Mais informações`;

    // 🔹 Envia WhatsApp
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

    // 🔹 Registra evento
    await supabase.from("lead_events").insert([
      {
        lead_id: lead.id,
        event_type: isReengaged
          ? "lead_reengaged"
          : "lead_created",
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
