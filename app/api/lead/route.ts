import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function asE164BR(raw: string) {
  const d = onlyDigits(raw);
  if (!d) return "";
  return d.startsWith("55") ? d : `55${d}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("BODY RECEBIDO:", body);

    const {
      nome,
      empresa,
      cargo,
      desafio,
      email,
      canal_preferido,
    } = body;

    const telefoneRaw = body?.telefone ?? body?.whatsapp ?? "";
    const numeroFinal = asE164BR(telefoneRaw);

    // 🔎 Validação
    if (
      !nome ||
      !empresa ||
      !cargo ||
      !desafio ||
      !email ||
      !numeroFinal ||
      !canal_preferido
    ) {
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios ausentes." },
        { status: 400 }
      );
    }

    const evolutionUrl = process.env.EVOLUTION_URL!;

    // =========================
    // TENTA SALVAR
    // =========================

    const { error: dbErr } = await supabase.from("leads").insert([
      {
        nome,
        empresa,
        cargo,
        desafio,
        email,
        telefone: numeroFinal,
        canal_preferido,
      },
    ]);

    // =========================
    // SE FOR DUPLICADO
    // =========================

    if (dbErr?.code === "23505") {

      // 🔔 Admin recebe aviso silencioso
      await fetch(`${evolutionUrl}/message/sendText/orbi_ia_landing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.EVOLUTION_API_KEY!,
        },
        body: JSON.stringify({
          number: "5566981320667",
          text: `🔁 Lead reenviado

Nome: ${nome}
Empresa: ${empresa}
Telefone: ${numeroFinal}`,
        }),
      });

      // 📩 Cliente recebe SEMPRE mesma mensagem padrão
      await fetch(`${evolutionUrl}/message/sendText/orbi_ia_landing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.EVOLUTION_API_KEY!,
        },
        body: JSON.stringify({
          number: numeroFinal,
          text: `Recebemos sua mensagem.
Em breve entraremos em contato.
Obrigado.
ORBI IA`,
        }),
      });

      return NextResponse.json({ success: true });
    }

    // =========================
    // ERRO REAL DE BANCO
    // =========================

    if (dbErr) {
      console.error("SUPABASE ERROR:", dbErr);
      return NextResponse.json(
        { success: false, error: "Erro banco." },
        { status: 500 }
      );
    }

    // =========================
    // NOVO LEAD
    // =========================

    // 🔔 Aviso interno
    await fetch(`${evolutionUrl}/message/sendText/orbi_ia_landing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.EVOLUTION_API_KEY!,
      },
      body: JSON.stringify({
        number: "5566981320667",
        text: `🚀 Novo Lead

Nome: ${nome}
Empresa: ${empresa}
Email: ${email}
Telefone: ${numeroFinal}
Canal: ${canal_preferido}`,
      }),
    });

    // 📩 Resposta automática para cliente
    await fetch(`${evolutionUrl}/message/sendText/orbi_ia_landing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.EVOLUTION_API_KEY!,
      },
      body: JSON.stringify({
        number: numeroFinal,
        text: `Recebemos sua mensagem.
Em breve entraremos em contato.
Obrigado.
ORBI IA`,
      }),
    });

    // 📧 Email interno
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "contato@agenteorbiia.com",
        to: ["contato@agenteorbiia.com"],
        subject: "Novo Lead ORBI IA",
        html: `
          <h2>Novo Lead</h2>
          <p><strong>Nome:</strong> ${nome}</p>
          <p><strong>Empresa:</strong> ${empresa}</p>
          <p><strong>Cargo:</strong> ${cargo}</p>
          <p><strong>Desafio:</strong> ${desafio}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${numeroFinal}</p>
          <p><strong>Canal:</strong> ${canal_preferido}</p>
        `,
      }),
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("ERRO GERAL:", err?.message || err);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
