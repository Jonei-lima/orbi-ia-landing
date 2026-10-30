import { NextResponse } from "next/server";
import { supabase, whatsBR, insta, getEvento } from "../_lib";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (b?.site) return NextResponse.json({ ok: true });
    const whatsapp = whatsBR(String(b?.whatsapp || ""));
    if (!whatsapp) return NextResponse.json({ ok: false, error: "Digite seu WhatsApp com DDD." }, { status: 400 });

    const evento = await getEvento(String(b?.evento || ""));
    if (!evento) return NextResponse.json({ ok: false, error: "Evento não encontrado." }, { status: 404 });

    let { data: contato } = await supabase.from("cg_contatos").select("id,nome").eq("whatsapp", whatsapp).maybeSingle();

    if (!contato) {
      const nome = String(b?.nome || "").trim().slice(0, 120);
      const instagram = insta(String(b?.instagram || "")).slice(0, 60);
      if (!nome || !instagram || !b?.consentimento) {
        return NextResponse.json({ ok: false, precisaCadastro: true }, { status: 200 });
      }
      const { data: novo, error } = await supabase
        .from("cg_contatos")
        .insert({ whatsapp, nome, instagram, origem: "checkin", consentimento_lgpd: true, consentimento_imagem: true })
        .select("id,nome")
        .single();
      if (error || !novo) throw error;
      contato = novo;
    }

    const { error: e2 } = await supabase.from("cg_presencas").upsert(
      { evento_id: evento.id, contato_id: contato.id, status: "presente", checkin_em: new Date().toISOString() },
      { onConflict: "evento_id,contato_id" }
    );
    if (e2) throw e2;

    return NextResponse.json({ ok: true, nome: (contato.nome || "").split(" ")[0] });
  } catch (e) {
    console.error("CG checkin", e);
    return NextResponse.json({ ok: false, error: "Não foi possível registrar agora. Tente de novo." }, { status: 500 });
  }
}
