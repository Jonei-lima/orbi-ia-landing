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

    const nome = body?.nome;
    const empresa = body?.empresa;
    const cargo = body?.cargo;
    const desafio = body?.desafio;
    const email = body?.email;
    const canal_preferido = body?.canal_preferido;

    // aceita telefone OU whatsapp
    const telefoneRaw = body?.telefone ?? body?.whatsapp ?? "";
    const numeroFinal = asE164BR(telefoneRaw);

    const missing: string[] = [];

    if (!nome) missing.push("nome");
    if (!empresa) missing.push("empresa");
    if (!cargo) missing.push("cargo");
    if (!desafio) missing.push("desafio");
    if (!email) missing.push("email");
    if (!numeroFinal) missing.push("telefone|whatsapp");
    if (!canal_preferido) missing.push("canal_preferido");

    if (missing.length) {
      console.log("❌ VALIDAÇÃO FALHOU. FALTANDO:", missing);
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios ausentes.", missing },
        { status: 400 }
      );
    }

    // =========================
    // 1️⃣ SALVAR NO SUPABASE
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

    // 🔎 Tratamento de duplicidade (telefone já existe)
if (dbErr?.code === "23505") {
  console.log("⚠️ TELEFONE JÁ EXISTE:", numeroFinal);

  const evolutionUrl = process.env.EVOLUTION_URL!;

  // 🔔 1) Aviso interno (seu número admin)
  await fetch(`${evolutionUrl}/message/sendText/orbi_ia_landing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.EVOLUTION_API_KEY!,
    },
    body: JSON.stringify({
      number: "5566981320667",
      text: `⚠️ Número repetido no formulário

Telefone: ${numeroFinal}
Nome: ${nome}
Empresa: ${empresa}`,
    }),
  });

  // 📩 2) Mensagem para o próprio lead
  await fetch(`${evolutionUrl}/message/sendText/orbi_ia_landing`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: process.env.EVOLUTION_API_KEY!,
    },
    body: JSON.stringify({
      number: numeroFinal,
      text: `Recebemos seu contato novamente 👍
Vamos entrar em contato em breve.`,
    }),
  });

  return NextResponse.json({
    success: true,
    message: "Vamos entrar em contato em breve, obrigado!",
  });
}

// 🔴 Qualquer outro erro real de banco
if (dbErr) {
  console.error("❌ SUPABASE ERROR:", dbErr);
  return NextResponse.json(
    { success: false, error: "Erro banco." },
    { status: 500 }
  );
}

    // =========================
    // 2️⃣ WHATSAPP (EVOLUTION)
    // =========================

    try {
      const evolutionUrl = process.env.EVOLUTION_URL;

      if (!evolutionUrl) {
        console.error("EVOLUTION_URL ausente");
      } else {
        const evo = await fetch(
          `${evolutionUrl}/message/sendText/orbi_ia_landing`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: process.env.EVOLUTION_API_KEY!,
            },
            body: JSON.stringify({
              number: numeroFinal,
              text: `🚀 Novo Lead

Nome: ${nome}
Empresa: ${empresa}
Email: ${email}
Telefone: ${numeroFinal}
Canal: ${canal_preferido}`,
            }),
          }
        );

        const evoBody = await evo.text();
        console.log("EVOLUTION STATUS:", evo.status);
        console.log("EVOLUTION BODY:", evoBody);
      }
    } catch (evoErr) {
      console.error("❌ ERRO EVOLUTION:", evoErr);
    }

    // =========================
    // 3️⃣ EMAIL (RESEND)
    // =========================

    try {
      const resend = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "contato@agenteorbiia.com",
          to: ["jonei.lima@gmail.com"],
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

      const resendBody = await resend.text();
      console.log("RESEND STATUS:", resend.status);
      console.log("RESEND BODY:", resendBody);
    } catch (resendErr) {
      console.error("❌ ERRO RESEND:", resendErr);
    }

    // ✅ NUNCA deixa email derrubar a API
    return NextResponse.json({
      success: true,
      numeroFinal,
    });

  } catch (err: any) {
    console.error("❌ ERRO GERAL:", err?.message || err);
    return NextResponse.json(
      { success: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
