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

    // 🔎 Validação básica
    if (!nome || !email || !numeroFinal) {
      return NextResponse.json(
        { success: false, error: "Campos essenciais ausentes." },
        { status: 400 }
      );
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

    // 2️⃣ Define se é novo ou repetido (23505 = Unique Violation)
    const isDuplicado = dbErr?.code === "23505";

    // Se der erro no banco e NÃO for duplicado, loga o erro mas não para o processo
    if (dbErr && !isDuplicado) {
      console.error("ERRO BANCO (não crítico):", dbErr);
    }

    // 3️⃣ Prepara as mensagens de WhatsApp (Aviso interno e resposta ao cliente)
    // Usamos blocos try/catch individuais para que se o WhatsApp falhar, o cliente ainda receba o "Obrigado" no site.
    
    try {
      // Aviso para ORBI IA
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

      // Resposta Automática para o Cliente
      await fetch(`${evolutionUrl}/message/sendText/orbi_ia_landing`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: apiKey },
        body: JSON.stringify({
          number: numeroFinal,
          text: `Recebemos sua mensagem.
Em breve entraremos em contato.
Obrigado.
ORBI IA`,
        }),
      });
    } catch (waErr) {
      console.error("Erro ao disparar WhatsApp:", waErr);
    }

    // 4️⃣ Envio de Email (Apenas para novos leads, para não encher sua caixa)
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

    // 5️⃣ SUCESSO ABSOLUTO: Independente de tudo, o front-end recebe success: true
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("ERRO GERAL API:", err?.message || err);
    // Mesmo em erro crítico de código, retornamos true para o front não mostrar erro ao cliente
    return NextResponse.json({ success: true }); 
  }
}