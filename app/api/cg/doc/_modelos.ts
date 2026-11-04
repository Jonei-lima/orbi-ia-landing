// Modelos de contrato e termos de compromisso do Cozinha Gourmet.
// Cada cláusula tem itens numerados; a página de alterações compara item a item.

export type Item = { n: string; texto: string };
export type Clausula = { n: string; titulo: string; itens: Item[] };
export type Ctx = {
  empresa: string; cota: string; data: string; valor: string; extenso: string;
  pagamento: string; segmento: string;
};

type Bruta = { titulo: string; itens: string[] };

const COTAS: Record<string, { nome: string; filme: string; extra: string[]; convites: string }> = {
  termo_entrada: {
    nome: "Entrada",
    filme: "1 (um) filme de 30 segundos da {{EMPRESA}}, gravado durante o jantar",
    extra: [
      "Logo da {{EMPRESA}} nos créditos do episódio.",
    ],
    convites: "2 (dois)",
  },
  termo_prato: {
    nome: "Prato Principal",
    filme: "1 (um) filme de 1 minuto da {{EMPRESA}}, gravado durante o jantar",
    extra: [
      "Logo da {{EMPRESA}} nos créditos do episódio.",
      "Espaço de exposição em posição de destaque na noite do jantar.",
      "Produto da {{EMPRESA}} em cena durante o episódio.",
      "Menção da {{EMPRESA}} nos stories do programa, com marcação do seu perfil.",
      "1 (um) corte do episódio com a marca da {{EMPRESA}}, entregue para as suas redes.",
      "Relatório de alcance do episódio, em até 30 (trinta) dias após a publicação.",
    ],
    convites: "2 (dois)",
  },
  termo_anfitriao: {
    nome: "Anfitrião",
    filme: "1 (um) filme de 1min30 da {{EMPRESA}}, com produção dedicada, gravado durante o jantar",
    extra: [
      "\"{{EMPRESA}} apresenta\" na abertura e no encerramento do episódio, ao lado dos demais Anfitriões.",
      "Logo da {{EMPRESA}} em destaque no cardápio e marca visível durante todo o episódio.",
      "A apresentadora fala sobre a {{EMPRESA}} e seus produtos durante o episódio.",
      "Bate-bola da apresentadora com o responsável pela {{EMPRESA}}, gravado durante o jantar.",
      "Fala de boas-vindas da {{EMPRESA}} aos convidados.",
      "Espaço de exposição em posição de destaque e produto em cena durante o episódio.",
      "Menção da {{EMPRESA}} nos stories do programa e 1 (um) corte do episódio para as suas redes.",
      "Encaminhamento dos contatos de quem pedir informações sobre a {{EMPRESA}} pelo WhatsApp do programa, respeitada a LGPD.",
      "Relatório de alcance do episódio, em até 30 (trinta) dias após a publicação.",
    ],
    convites: "3 (três)",
  },
};

function termo(modelo: string): Bruta[] {
  const c = COTAS[modelo];
  return [
    { titulo: "Objeto", itens: [
      "Patrocínio da {{EMPRESA}}, na cota " + c.nome + ", ao episódio do Cozinha Gourmet de {{DATA}}, um jantar com chef convidado, gravado com qualidade de cinema e publicado como episódio de websérie.",
      "Exclusividade da {{EMPRESA}} no segmento de {{SEGMENTO}} neste episódio.",
    ]},
    { titulo: "Contrapartidas da ORBI", itens: [
      c.filme + ", entregue em até 15 (quinze) dias após o evento, nos formatos horizontal (16:9) e vertical (9:16), com 1 (uma) rodada de ajustes.",
      "Exposição e demonstração de produtos da {{EMPRESA}} na noite do jantar.",
      "Distribuição de brindes, cartões de visita e materiais de publicidade da {{EMPRESA}} aos convidados.",
      "Logo da {{EMPRESA}} no cardápio entregue a cada convidado.",
      "Presença da marca da {{EMPRESA}} no episódio da websérie.",
      ...c.extra,
      c.convites + " convites para o jantar.",
    ]},
    { titulo: "Obrigações da {{EMPRESA}}", itens: [
      "Pagar o valor previsto na Cláusula 4.",
      "Enviar a marca em alta resolução e o perfil de redes sociais a ser marcado em até 5 (cinco) dias antes do evento.",
      "Levar e retirar, por sua conta, os produtos, brindes e materiais de exposição, nos horários combinados com a produção.",
      "Informar os nomes de quem usará os convites em até 2 (dois) dias antes do evento.",
      "Aprovar ou pedir ajustes nos vídeos em até 5 (cinco) dias úteis do recebimento; sem manifestação nesse prazo, os vídeos serão considerados aprovados.",
    ]},
    { titulo: "Valor e pagamento", itens: [
      "Pelo patrocínio, a {{EMPRESA}} pagará à ORBI o valor de R$ {{VALOR}} ({{EXTENSO}}).",
      "Forma de pagamento: {{PAGAMENTO}}.",
      "A ORBI emitirá nota fiscal referente ao valor deste termo.",
      "O atraso no pagamento sujeita a {{EMPRESA}} a multa de 2% e juros de 1% ao mês.",
    ]},
    { titulo: "Desistência, remarcação e cancelamento", itens: [
      "Se a {{EMPRESA}} desistir do patrocínio após a assinatura deste termo, em qualquer data, pagará à ORBI multa de 30% (trinta por cento) do valor previsto na Cláusula 4. Se o valor já tiver sido pago, a ORBI reterá a multa e devolverá o restante em até 15 (quinze) dias.",
      "Se a ORBI precisar remarcar o episódio, o patrocínio vale para a nova data. Se a {{EMPRESA}} não puder participar na nova data, poderá optar, sem multa, pelo episódio seguinte ou pela devolução integral do valor pago.",
      "Se a ORBI cancelar o episódio sem nova data, devolverá integralmente o valor pago em até 15 (quinze) dias.",
      "Nos casos de caso fortuito ou força maior, as partes definem nova data em até 30 (trinta) dias, sem multa.",
    ]},
    { titulo: "Imagem, marca e uso dos conteúdos", itens: [
      "A {{EMPRESA}} autoriza o uso da sua marca e das imagens gravadas no evento no episódio, nos cortes e na divulgação do Cozinha Gourmet, por prazo indeterminado.",
      "A {{EMPRESA}} poderá usar os vídeos que receber em seus canais próprios, por prazo indeterminado. O uso em mídia paga ou em peças de terceiros depende de autorização prévia da ORBI, em razão dos direitos de imagem de chef, apresentadora e convidados.",
      "Os direitos autorais sobre o formato Cozinha Gourmet, o episódio e as gravações pertencem à ORBI e à Agência Nexo.",
    ]},
    { titulo: "Proteção de dados", itens: [
      "As partes tratarão os dados pessoais de convidados e contatos apenas para os fins deste termo, conforme a Lei nº 13.709/2018 (LGPD), e não os repassarão a terceiros.",
    ]},
    { titulo: "Disposições gerais", itens: [
      "Este termo não gera vínculo trabalhista, societário ou de representação entre as partes. Alterações só valem por escrito.",
      "As partes reconhecem a validade da assinatura eletrônica deste termo, feita com confirmação por código enviado ao WhatsApp de cada signatário e registro de data, hora, IP e código de verificação do documento, nos termos do art. 10, § 2º, da MP nº 2.200-2/2001 e da Lei nº 14.063/2020.",
      "Fica eleito o foro da Comarca de Campinas/SP para dirimir questões deste termo.",
    ]},
  ];
}

const ANFITRIAO_LOCAL: Bruta[] = [
  { titulo: "Objeto", itens: [
    "Patrocínio da {{EMPRESA}}, na cota de Anfitrião, ao episódio do Cozinha Gourmet de {{DATA}}, jantar com chef convidado gravado para websérie.",
    "Cessão gratuita, pela {{EMPRESA}}, do seu showroom na Rua Antônio Lapa, 240, Cambuí, Campinas/SP, incluindo a cozinha em funcionamento, para a realização do jantar e da gravação.",
    "Data do evento: {{DATA}}, com início às 19h30 e término previsto às 22h30.",
  ]},
  { titulo: "Obrigações da ORBI", itens: [
    "Ter ao menos 12 (doze) arquitetos(as) com presença confirmada até a véspera do jantar, de acordo com o perfil combinado entre as partes.",
    "Produzir o jantar: chef convidado, apresentadora, recepção, mesa posta e equipe de serviço, diretamente ou por meio de parceiros.",
    "Gravar o episódio com qualidade de cinema, com equipe e equipamentos profissionais, e publicá-lo na websérie do programa em até 30 (trinta) dias após o evento.",
    "Inserir \"{{EMPRESA}} apresenta\" na abertura e no encerramento do episódio.",
    "Garantir que a apresentadora fale sobre a {{EMPRESA}} e o espaço durante o episódio e grave um bate-bola com o responsável pela empresa.",
    "Entregar à {{EMPRESA}}, em até 15 (quinze) dias após o evento, nos formatos horizontal (16:9) e vertical (9:16): 1 (um) filme exclusivo de 1min30 e 3 (três) cortes de até 60 segundos, cada um com 1 (uma) rodada de ajustes.",
    "Divulgar a {{EMPRESA}} nas redes sociais do programa, com marcação do seu perfil: 2 (duas) publicações no feed e 3 (três) sequências de stories, antes, durante e depois do evento.",
    "Aplicar a marca da {{EMPRESA}} em destaque no cardápio impresso e no backdrop do evento.",
    "Reservar 3 (três) convites para o jantar à {{EMPRESA}}.",
    "Entregar relatório de alcance das publicações em até 30 (trinta) dias após a publicação do episódio.",
    "Encaminhar à {{EMPRESA}} os contatos de quem pedir informações sobre a marca pelo WhatsApp do programa, respeitada a LGPD.",
    "Garantir exclusividade à {{EMPRESA}} no segmento de {{SEGMENTO}} neste episódio.",
    "Emitir nota fiscal referente ao valor deste contrato.",
  ]},
  { titulo: "Obrigações da {{EMPRESA}}", itens: [
    "Pagar o valor previsto na Cláusula 4.",
    "Disponibilizar o showroom no dia do evento das 14h às 00h, com acesso para montagem, gravação e desmontagem, energia elétrica, água e a cozinha em condições de uso, inclusive o gás.",
    "Manter um responsável no local durante todo o período, para abertura, acompanhamento e fechamento do espaço.",
    "Enviar, em até 5 (cinco) dias antes do evento, a marca em alta resolução e os perfis de redes sociais a serem marcados.",
    "Aprovar ou pedir ajustes nos vídeos em até 5 (cinco) dias úteis do recebimento; sem manifestação nesse prazo, os vídeos serão considerados aprovados.",
  ]},
  { titulo: "Valor e pagamento", itens: [
    "Pelo patrocínio, a {{EMPRESA}} pagará à ORBI o valor de R$ {{VALOR}} ({{EXTENSO}}), condição especial deste episódio.",
    "Forma de pagamento: {{PAGAMENTO}}.",
    "A cessão do showroom não é descontada do valor e não gera cobrança de parte a parte.",
    "O atraso no pagamento sujeita a parte devedora a multa de 2% e juros de 1% ao mês.",
  ]},
  { titulo: "Remarcação e cancelamento", itens: [
    "A data do evento só pode ser alterada por acordo escrito entre as partes (WhatsApp ou e-mail valem), com pelo menos 10 (dez) dias de antecedência.",
    "Se uma parte pedir a remarcação com menos de 10 (dez) dias, ela arca com os custos já comprovadamente assumidos pela outra para a data original, como alimentos, fornecedores e materiais impressos.",
    "Se o evento não puder acontecer por caso fortuito ou força maior, as partes definem nova data em até 30 (trinta) dias, sem multa.",
    "A desistência por qualquer das partes após a assinatura, em qualquer data, implica multa de 30% (trinta por cento) do valor deste contrato, sem prejuízo do ressarcimento previsto no item 5.2.",
  ]},
  { titulo: "Responsabilidade por danos", itens: [
    "A ORBI responde pelos danos causados ao showroom, aos móveis e aos objetos expostos por sua equipe e pelos fornecedores que contratar, durante a montagem, o evento e a desmontagem.",
    "Danos causados por convidados serão apurados entre as partes, que se comprometem a buscar a solução junto ao responsável.",
    "As partes farão, no início da montagem, uma vistoria do espaço, com registro em fotos.",
  ]},
  { titulo: "Imagem, marca e uso dos conteúdos", itens: [
    "A {{EMPRESA}} autoriza a gravação do showroom, dos seus móveis e da sua marca, e o uso dessas imagens no episódio, nos cortes e na divulgação do Cozinha Gourmet, por prazo indeterminado.",
    "A {{EMPRESA}} poderá usar os vídeos exclusivos em seus canais próprios, por prazo indeterminado. O uso em mídia paga ou em peças de terceiros depende de autorização prévia da ORBI, em razão dos direitos de imagem de chef, apresentadora e convidados.",
    "Cada parte autoriza a outra a usar sua marca exclusivamente para os fins deste contrato.",
    "Os direitos autorais sobre o formato Cozinha Gourmet, o episódio e as gravações pertencem à ORBI e à Agência Nexo.",
  ]},
  { titulo: "Preferência nas próximas edições", itens: [
    "A {{EMPRESA}} terá preferência na cota de Anfitrião e como local dos próximos episódios, nas condições comerciais vigentes da temporada, desde que manifeste interesse em até 15 (quinze) dias após a publicação do episódio.",
  ]},
  { titulo: "Proteção de dados", itens: [
    "As partes tratarão os dados pessoais de convidados e contatos apenas para os fins deste contrato, conforme a Lei nº 13.709/2018 (LGPD), e não os repassarão a terceiros.",
  ]},
  { titulo: "Disposições gerais", itens: [
    "Este contrato não gera vínculo trabalhista, societário ou de representação entre as partes. Alterações só valem por escrito.",
    "As partes reconhecem a validade da assinatura eletrônica deste contrato, feita com confirmação por código enviado ao WhatsApp de cada signatário e registro de data, hora, IP e código de verificação do documento, nos termos do art. 10, § 2º, da MP nº 2.200-2/2001 e da Lei nº 14.063/2020.",
    "Fica eleito o foro da Comarca de Campinas/SP para dirimir questões deste contrato.",
  ]},
];

export const MODELOS: Record<string, { titulo: string; cota: string; bruto: () => Bruta[] }> = {
  contrato_anfitriao: { titulo: "Contrato de Patrocínio e Cessão de Espaço", cota: "Anfitrião", bruto: () => ANFITRIAO_LOCAL },
  termo_anfitriao: { titulo: "Termo de Compromisso de Patrocínio · Cota Anfitrião", cota: "Anfitrião", bruto: () => termo("termo_anfitriao") },
  termo_prato: { titulo: "Termo de Compromisso de Patrocínio · Cota Prato Principal", cota: "Prato Principal", bruto: () => termo("termo_prato") },
  termo_entrada: { titulo: "Termo de Compromisso de Patrocínio · Cota Entrada", cota: "Entrada", bruto: () => termo("termo_entrada") },
};

export function gerar(modelo: string, ctx: Ctx): { titulo: string; clausulas: Clausula[] } {
  const m = MODELOS[modelo];
  const sub = (t: string) => t
    .replaceAll("{{EMPRESA}}", ctx.empresa).replaceAll("{{COTA}}", ctx.cota).replaceAll("{{DATA}}", ctx.data)
    .replaceAll("{{VALOR}}", ctx.valor).replaceAll("{{EXTENSO}}", ctx.extenso)
    .replaceAll("{{PAGAMENTO}}", ctx.pagamento).replaceAll("{{SEGMENTO}}", ctx.segmento);
  const clausulas = m.bruto().map((c, i) => ({
    n: String(i + 1),
    titulo: sub(c.titulo),
    itens: c.itens.map((t, j) => ({ n: `${i + 1}.${j + 1}`, texto: sub(t) })),
  }));
  return { titulo: m.titulo, clausulas };
}

// Valor por extenso (reais), até 999.999.999,99
const U = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const D = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const C = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
function ate999(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const c = Math.floor(n / 100), r = n % 100, p: string[] = [];
  if (c) p.push(C[c]);
  if (r) p.push(r < 20 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? " e " + U[r % 10] : ""));
  return p.join(" e ");
}
export function extenso(valor: number): string {
  const inteiro = Math.floor(valor), cent = Math.round((valor - inteiro) * 100);
  const mi = Math.floor(inteiro / 1e6), mil = Math.floor((inteiro % 1e6) / 1000), r = inteiro % 1000;
  const partes: string[] = [];
  if (mi) partes.push(ate999(mi) + (mi === 1 ? " milhão" : " milhões"));
  if (mil) partes.push(mil === 1 ? "mil" : ate999(mil) + " mil");
  if (r) partes.push(ate999(r));
  let txt = "";
  partes.forEach((p, i) => {
    if (i === 0) txt = p;
    else {
      const ultimo = i === partes.length - 1;
      const usarE = ultimo && (r < 100 || r % 100 === 0);
      txt += (usarE ? " e " : " ") + p;
    }
  });
  if (inteiro) txt += (inteiro === 1 ? " real" : (inteiro % 1e6 === 0 ? " de reais" : " reais"));
  if (cent) txt += (inteiro ? " e " : "") + ate999(cent) + (cent === 1 ? " centavo" : " centavos");
  return txt || "zero real";
}

export function moeda(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
