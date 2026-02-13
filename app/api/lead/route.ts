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

    let lead: any;
    let isReengaged = false;

    // 🔹 Tenta inserir exatamente conforme sua tabela
    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          nome,
          empresa,
          cargo,
          desafio,
          email,
          telefone: telefoneLimpo,
          canal_preferido
        }
      ])
      .select()
      .single();

    if (error) {
      const isDuplicate =
        error.code === "23505" ||
        error.message?.toLowerCase().includes("duplicate");

      if (isDuplicate) {
        isReengaged = true;

        const { data: existingLead, error: fetchError } = await supabase
          .from("leads")
          .select("*")
          .eq("telefone", telefoneLimpo)
          .single();

        if (fetchError || !existingLead) {
          console.error(fetchError);
          return NextResponse.json(
            { error: "Erro ao buscar lead existente." },
            { status: 500 }
          );
        }

        await supabase
          .from("leads")
          .update({
            nome,
            empresa,
            cargo,
            desafio,
            email,
            canal_preferido
          })
          .eq("telefone", telefoneLimpo);

        lead = existingLead;
      } else {
        console.error("Erro real:", error);
        return NextResponse.json(
          { error: "Erro ao salvar no banco." },
          { status: 500 }
        );
      }
    } else {
      lead = data;
    }

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
        event_type: isReengaged
          ? "lead_reengaged"
          : "lead_created",
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
