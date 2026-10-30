import { NextResponse } from "next/server";
import { supabase, whatsBR, insta, getEvento, sendWhats, quando } from "../_lib";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (b?.site) return NextResponse.json({ ok: true }); // honeypot anti-spam

    const nome = String(b?.nome || "").trim().slice(0, 120);
    const instagram = insta(String(b?.instagram || "")).slice(0, 60);
    const whatsapp = whatsBR(String(b?.whatsapp || ""));
    const email = String(b?.email || "").trim().slice(0, 160);
    const consent = !!b?.consentimento;
    const status = b?.status === "recusado" ? "recusado" : "confirmado";

    if (!nome || !instagram || !whatsapp || !consent) {
      return NextResponse.json({ ok: false, error: "Preencha nome, Instagram, WhatsApp e aceite os termos." }, { status: 400 });
    }

    const evento = await getEvento(String(b?.evento || ""));
    if (!evento) return NextResponse.json({ ok: false, error: "Evento não encontrado." }, { status: 404 });

    const { data: contato, error: e1 } = await supabase
      .from("cg_contatos")
      .upsert(
        { whatsapp, nome, instagram, email: email || null, origem: "formulario", consentimento_lgpd: true, consentimento_imagem: true },
        { onConflict: "whatsapp" }
      )
      .select("id")
      .single();
    if (e1 || !contato) throw e1;

    const { error: e2 } = await supabase.from("cg_presencas").upsert(
      { evento_id: evento.id, contato_id: contato.id, status, confirmado_em: status === "confirmado" ? new Date().toISOString() : null },
      { onConflict: "evento_id,contato_id" }
    );
    if (e2) throw e2;

    const primeiro = nome.split(" ")[0];
    if (status === "confirmado") {
      await sendWhats(
        whatsapp,
        `Oi, ${primeiro}! Aqui é a Clara, do Cozinha Gourmet. Sua presença está confirmada.\n\n${quando(evento.data_hora)}\n${evento.local} · ${evento.endereco}\n${evento.maps_url || ""}\n\nNa chegada, é só ler o QR Code da recepção para registrar sua entrada. Qualquer dúvida, é só me chamar por aqui.`
      );
    }
    const admin = process.env.CG_ADMIN_NUMBER;
    if (admin) await sendWhats(admin, `Cozinha Gourmet · ${status === "confirmado" ? "nova confirmação" : "recusa"}\n${nome} · ${instagram} · ${whatsapp}`);

    return NextResponse.json({ ok: true, nome: primeiro, status });
  } catch (e) {
    console.error("CG rsvp", e);
    return NextResponse.json({ ok: false, error: "Não foi possível salvar agora. Tente de novo em instantes." }, { status: 500 });
  }
}
