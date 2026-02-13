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
    const { nome, empresa, cargo, desafio, email, canal_preferido } = body;

    const telefoneRaw = body?.telefone ?? body?.whatsapp ?? "";
    const numeroFinal = asE164BR(telefoneRaw);

    if (!nome || !email || !numeroFinal) {
      // Mesmo com campos faltando, retorna success pro front não quebrar
      return NextResponse.json({ success: true });
    }

    const evolutionUrl = process.env.EVOLUTION_URL!;
    const apiKey = process.env.EVOLUTION_API_KEY!;

    // 1️⃣ Tenta salvar no banco
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

    const isDuplicado = dbErr?.code === "23505";

    if (dbErr && !isDuplicado) {
      console.error("ERRO BANCO (não crítico):", dbErr);
    }

    // 2️⃣ WhatsApp — aviso interno + resposta ao cliente
    try {
      // Aviso para ORBI IA (mensagem interna diferencia novo vs repetido)
      await fetch(`${evolutionUrl}/message/sendText/orbi_ia_landing`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: apiKey },
        body: JSON.stringify({
          number: "5566981320667",
          text: isDuplicado
            ? `🔁 Lead Reenviado\n\nNome: ${nome}\nEmpresa: ${empresa}\nTelefone: ${numeroFinal}`
            : `🚀 Novo Lead\n\nNome: ${nome}\nEmpresa: ${empresa}\nEmail: ${email}\nTelefone: ${numeroFinal}\nCanal: ${canal_preferido}`,
        }),
      });

      // Resposta ao cliente — SEMPRE a mesma mensagem, novo ou repetido
      await fetch(`${evolutionUrl}/message/sendText/orbi_ia_landing`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: apiKey },
        body: JSON.stringify({
          number: numeroFinal,
          text: `Obrigado! Logo entraremos em contato. ORBI IA`,
        }),
      });
    } catch (waErr) {
      console.error("Erro ao disparar WhatsApp:", waErr);
    }

    // 3️⃣ Email apenas para novos leads
    if (!isDuplicado) {
      try {
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
            html: `<h2>Novo Lead</h2><p><strong>Nome:</strong> ${nome}</p><p><strong>Telefone:</strong> ${numeroFinal}</p>`,
          }),
        });
      } catch (emailErr) {
        console.error("Erro ao enviar email:", emailErr);
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("ERRO GERAL API:", err?.message || err);
    return NextResponse.json({ success: true });
  }
}