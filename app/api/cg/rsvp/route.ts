import { NextResponse } from "next/server";
import { supabase, whatsBR, insta, getEvento, sendWhats, quando, perfilDe, semColunaPerfil, restricaoDe } from "../_lib";

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

    const { perfil, tipo } = perfilDe(b?.perfil, b?.perfil_outro);
    const base: Record<string, unknown> = { whatsapp, nome, instagram, email: email || null, origem: "formulario", consentimento_lgpd: true, consentimento_imagem: true };
    if (tipo) base.tipo = tipo;
    const salvar = (dados: Record<string, unknown>) =>
      supabase.from("cg_contatos").upsert(dados, { onConflict: "whatsapp" }).select("id").single();
    let { data: contato, error: e1 } = await salvar(perfil ? { ...base, perfil } : base);
    if (e1 && semColunaPerfil(e1)) ({ data: contato, error: e1 } = await salvar(base));
    if (e1 || !contato) throw e1;

    // Restrição alimentar (ignora se as colunas ainda não existirem no banco)
    const restricao = restricaoDe(b?.restricao);
    const restricaoObs = String(b?.restricao_obs || "").trim().slice(0, 200) || null;
    if (status === "confirmado") {
      await supabase.from("cg_contatos").update({ restricao, restricao_obs: restricaoObs }).eq("id", contato.id);
    }

    // Presença com lotação (função do banco); se ainda não existir, grava do jeito antigo
    let statusFinal: string = status;
    let vaga: { whatsapp?: string; texto?: string } = {};
    const { data: pres, error: ep } = await supabase.rpc("cg_presenca_site", { p_whatsapp: whatsapp, p_slug: evento.slug, p_status: status });
    if (!ep && pres && !pres.erro) {
      statusFinal = pres.status || status;
      vaga = { whatsapp: pres.vaga_whatsapp || undefined, texto: pres.vaga_texto || undefined };
    } else {
      const { error: e2 } = await supabase.from("cg_presencas").upsert(
        { evento_id: evento.id, contato_id: contato.id, status, confirmado_em: status === "confirmado" ? new Date().toISOString() : null },
        { onConflict: "evento_id,contato_id" }
      );
      if (e2) throw e2;
    }

    const primeiro = nome.split(" ")[0];
    if (statusFinal === "confirmado") {
      await sendWhats(
        whatsapp,
        `Oi, ${primeiro}! Aqui é a Clara, do *Projeto Cozinha Gourmet*. Sua presença está confirmada.\n\n${quando(evento.data_hora)}\n${evento.local} · ${evento.endereco}\n${evento.maps_url || ""}\n\nTraje: esporte fino. Na chegada, é só ler o QR Code da recepção para registrar sua entrada.\n\nSalve este número: é por aqui que mando os lembretes. E siga o programa no Instagram para acompanhar os bastidores: instagram.com/programacozinhagourmet\n\nTe esperamos!`
      );
    } else if (statusFinal === "lista_espera") {
      await sendWhats(
        whatsapp,
        `Oi, ${primeiro}! Aqui é a Clara, do *Projeto Cozinha Gourmet*. Os lugares do jantar de ${quando(evento.data_hora)} já foram preenchidos, mas você está na nossa lista de espera. Se abrir uma vaga, eu te aviso por aqui.`
      );
    }
    if (vaga.whatsapp && vaga.texto) await sendWhats(vaga.whatsapp, vaga.texto);

    const admin = process.env.CG_ADMIN_NUMBER;
    const rotulo = statusFinal === "confirmado" ? "nova confirmação" : statusFinal === "lista_espera" ? "lista de espera (lotado)" : "recusa";
    const rest = statusFinal === "confirmado" && (restricao || restricaoObs) ? `\nRestrição alimentar: ${[restricao, restricaoObs].filter(Boolean).join(" · ")}` : "";
    if (admin) await sendWhats(admin, `Cozinha Gourmet · ${rotulo}\n${nome}${perfil ? " · " + perfil : ""}\n${instagram} · wa.me/${whatsapp}${rest}`);

    return NextResponse.json({ ok: true, nome: primeiro, status: statusFinal });
  } catch (e) {
    console.error("CG rsvp", e);
    return NextResponse.json({ ok: false, error: "Não foi possível salvar agora. Tente de novo em instantes." }, { status: 500 });
  }
}
