import { NextResponse } from "next/server";
import { supabase, whatsBR, insta, getEvento, perfilDe, semColunaPerfil, sendWhats } from "../_lib";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (b?.site) return NextResponse.json({ ok: true });
    const whatsapp = whatsBR(String(b?.whatsapp || ""));
    if (!whatsapp) return NextResponse.json({ ok: false, error: "Digite seu WhatsApp com DDD." }, { status: 400 });

    const evento = await getEvento(String(b?.evento || ""));
    if (!evento) return NextResponse.json({ ok: false, error: "Evento não encontrado." }, { status: 404 });

    let { data: contato } = await supabase.from("cg_contatos").select("id,nome,consentimento_imagem").eq("whatsapp", whatsapp).maybeSingle();
    let semImagem = false;

    // Quem já estava na lista (confirmou pelo WhatsApp, por exemplo) precisa autorizar imagem e voz na chegada
    if (contato && !contato.consentimento_imagem) {
      const resp = String(b?.imagem || "");
      if (resp !== "sim" && resp !== "nao") {
        return NextResponse.json({ ok: false, precisaAutorizacao: true, nome: (contato.nome || "").split(" ")[0] }, { status: 200 });
      }
      if (resp === "sim") {
        await supabase.from("cg_contatos").update({ consentimento_imagem: true, consentimento_lgpd: true }).eq("id", contato.id);
      } else {
        semImagem = true;
      }
    }

    if (!contato) {
      const nome = String(b?.nome || "").trim().slice(0, 120);
      const instagram = insta(String(b?.instagram || "")).slice(0, 60);
      if (!nome || !instagram || !b?.consentimento) {
        return NextResponse.json({ ok: false, precisaCadastro: true }, { status: 200 });
      }
      const { perfil, tipo } = perfilDe(b?.perfil, b?.perfil_outro);
      const base: Record<string, unknown> = { whatsapp, nome, instagram, origem: "checkin", consentimento_lgpd: true, consentimento_imagem: true };
      if (tipo) base.tipo = tipo;
      const inserir = (dados: Record<string, unknown>) => supabase.from("cg_contatos").insert(dados).select("id,nome").single();
      let { data: novo, error } = await inserir(perfil ? { ...base, perfil } : base);
      if (error && semColunaPerfil(error)) ({ data: novo, error } = await inserir(base));
      if (error || !novo) throw error;
      contato = { ...novo, consentimento_imagem: true };
    }

    const { error: e2 } = await supabase.from("cg_presencas").upsert(
      { evento_id: evento.id, contato_id: contato!.id, status: "presente", checkin_em: new Date().toISOString(),
        ...(semImagem ? { observacao: "Não autorizou o uso de imagem e voz (check-in)" } : {}) },
      { onConflict: "evento_id,contato_id" }
    );
    if (e2) throw e2;

    // Boas-vindas no WhatsApp (só na primeira leitura do QR, para não repetir se a pessoa ler de novo)
    const primeiro = (contato!.nome || "").split(" ")[0];
    const { count: jaRecebeu } = await supabase.from("cg_mensagens").select("id", { count: "exact", head: true })
      .eq("whatsapp", whatsapp).eq("direcao", "out").like("conteudo", "%Sua chegada está registrada%")
      .gte("created_at", new Date(Date.now() - 12 * 3600 * 1000).toISOString());
    if (!jaRecebeu) {
      await sendWhats(whatsapp,
        `${primeiro ? "Que bom ter você aqui, " + primeiro + "!" : "Que bom ter você aqui!"} Aqui é a Clara, do *Projeto Cozinha Gourmet*. Sua chegada está registrada.\n\n` +
        `Aproveite a noite: boa comida, boas conversas e novas conexões. 🥂` +
        (semImagem
          ? `\n\nAnotamos que você prefere não aparecer nos vídeos. Avise também a equipe de gravação, por favor.`
          : `\n\nLembrando que a noite está sendo gravada para a websérie do programa.`));
    }

    return NextResponse.json({ ok: true, semImagem, nome: (contato!.nome || "").split(" ")[0] });
  } catch (e) {
    console.error("CG checkin", e);
    return NextResponse.json({ ok: false, error: "Não foi possível registrar agora. Tente de novo." }, { status: 500 });
  }
}
