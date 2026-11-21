import { NextResponse } from "next/server";
import { supabase, whatsBR } from "../_lib";

// Galeria de fotos: cadastro na primeira vez (nome + WhatsApp + autorização) e registro de cada download.
export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (b?.site) return NextResponse.json({ ok: true }); // honeypot

    const whatsapp = whatsBR(String(b?.whatsapp || ""));
    if (!whatsapp) return NextResponse.json({ ok: false, error: "Digite seu WhatsApp com DDD, por exemplo (19) 99999-9999." }, { status: 400 });
    const foto = String(b?.foto || "").slice(0, 120);
    const evento = String(b?.evento || "11nov").slice(0, 40);

    let { data: contato } = await supabase.from("cg_contatos").select("id,nome").eq("whatsapp", whatsapp).maybeSingle();

    if (!contato) {
      const nome = String(b?.nome || "").trim().slice(0, 120);
      if (!nome || !b?.consentimento) {
        return NextResponse.json({ ok: false, error: "Preencha seu nome e marque a autorização." }, { status: 400 });
      }
      const { data: novo, error } = await supabase.from("cg_contatos")
        .insert({ whatsapp, nome, origem: "galeria", consentimento_lgpd: true, observacoes: "Cadastro pela galeria de fotos do Episódio 1" })
        .select("id,nome").single();
      if (error || !novo) throw error;
      contato = novo;
    } else if (b?.consentimento) {
      await supabase.from("cg_contatos").update({ consentimento_lgpd: true }).eq("id", contato.id);
    }

    if (foto) {
      const { error: e2 } = await supabase.from("cg_galeria_downloads")
        .insert({ contato_id: contato.id, whatsapp, evento_slug: evento, foto });
      if (e2) console.error("CG fotos log", e2); // não bloqueia o download
    }

    return NextResponse.json({ ok: true, nome: (contato.nome || "").split(" ")[0] });
  } catch (e) {
    console.error("CG fotos", e);
    return NextResponse.json({ ok: false, error: "Não foi possível registrar agora. Tente de novo." }, { status: 500 });
  }
}
