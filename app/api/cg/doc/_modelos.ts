// Modelos de contrato e termos de compromisso do Cozinha Gourmet.
// Cada cláusula tem itens numerados; a página de alterações compara item a item.

export type Item = { n: string; texto: string };
export type Clausula = { n: string; titulo: string; itens: Item[] };
export type Ctx = {
  empresa: string; cota: string; data: string; valor: string; extenso: string;
  pagamento: string; segmento: string;
  extras?: Record<string, string>; // {{MENSALIDADE}}, {{RENOVACAO}}, {{FORO}} etc. (contratos da ORBI)
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
    convites: "4 (quatro)",
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


// Patrocínio em dinheiro + fornecimento de brindes (ex.: café em sachê com etiqueta personalizada)
const PARCEIRO_BRINDE: Bruta[] = [
  { titulo: "Objeto", itens: [
    "Patrocínio da {{EMPRESA}} ao episódio do Cozinha Gourmet de {{DATA}}, um jantar com chef convidado, gravado com qualidade de cinema e publicado como episódio de websérie, com início às 19h30, no showroom da Lar Brasileiro, Rua Antônio Lapa, 240, Cambuí, Campinas/SP.",
    "O patrocínio é composto por um valor em dinheiro (Cláusula 4) e pelo fornecimento de brindes aos convidados (Cláusula 3).",
    "Exclusividade da {{EMPRESA}} no segmento de {{SEGMENTO}} neste episódio.",
  ]},
  { titulo: "Contrapartidas da ORBI", itens: [
    "1 (um) filme de 30 segundos da {{EMPRESA}}, gravado durante o jantar e entregue em até 15 (quinze) dias após o evento, nos formatos horizontal (16:9) e vertical (9:16), com 1 (uma) rodada de ajustes.",
    "Distribuição dos brindes da {{EMPRESA}} aos convidados durante o jantar, com a identificação \"Produzido por\" e o perfil da {{EMPRESA}} na etiqueta.",
    "Exposição da marca da {{EMPRESA}} na noite do jantar e distribuição de cartões e materiais de divulgação aos convidados.",
    "Logo da {{EMPRESA}} no cardápio entregue a cada convidado e nos créditos do episódio.",
    "Presença da marca da {{EMPRESA}} no episódio da websérie.",
    "Menção da {{EMPRESA}} nas redes sociais do programa, com marcação do seu perfil.",
    "Arte da etiqueta personalizada dos brindes, criada pela Agência Nexo e enviada à {{EMPRESA}} para aprovação em até 5 (cinco) dias antes do evento.",
    "Emissão de recibo do valor recebido.",
  ]},
  { titulo: "Obrigações da {{EMPRESA}}", itens: [
    "Pagar o valor previsto na Cláusula 4.",
    "Produzir e entregar 40 (quarenta) sachês de café com a etiqueta personalizada aprovada, embalados e prontos para distribuição, em até 1 (um) dia antes do evento, em local combinado com a produção.",
    "Garantir a qualidade, a validade e as condições de consumo dos produtos fornecidos, que são de sua inteira responsabilidade.",
    "Imprimir e aplicar as etiquetas, por sua conta, a partir da arte enviada pela ORBI.",
    "Enviar a marca em alta resolução e o perfil de redes sociais a ser marcado em até 5 (cinco) dias antes do evento.",
    "Aprovar ou pedir ajustes no vídeo em até 5 (cinco) dias úteis do recebimento; sem manifestação nesse prazo, o vídeo será considerado aprovado.",
  ]},
  { titulo: "Valor e pagamento", itens: [
    "Pelo patrocínio, a {{EMPRESA}} pagará à ORBI o valor de R$ {{VALOR}} ({{EXTENSO}}).",
    "Forma de pagamento: {{PAGAMENTO}}.",
    "O fornecimento dos 40 (quarenta) sachês é contrapartida em produto, não é descontado do valor em dinheiro e não gera cobrança de parte a parte.",
    "O atraso no pagamento sujeita a {{EMPRESA}} a multa de 2% e juros de 1% ao mês.",
  ]},
  { titulo: "Desistência, remarcação e cancelamento", itens: [
    "Se a {{EMPRESA}} desistir do patrocínio após a assinatura deste contrato, em qualquer data, pagará à ORBI multa de 30% (trinta por cento) do valor previsto na Cláusula 4. Se o valor já tiver sido pago, a ORBI reterá a multa e devolverá o restante em até 15 (quinze) dias.",
    "Se a {{EMPRESA}} não entregar os sachês no prazo do item 3.2, a ORBI poderá retirar do episódio as contrapartidas ligadas aos brindes, sem devolução de valores.",
    "Se a ORBI precisar remarcar o episódio, o patrocínio vale para a nova data. Se a {{EMPRESA}} não puder participar na nova data, poderá optar, sem multa, pelo episódio seguinte ou pela devolução integral do valor pago.",
    "Se a ORBI cancelar o episódio sem nova data, devolverá integralmente o valor pago em até 15 (quinze) dias.",
    "Nos casos de caso fortuito ou força maior, as partes definem nova data em até 30 (trinta) dias, sem multa.",
  ]},
  { titulo: "Imagem, marca e uso dos conteúdos", itens: [
    "A {{EMPRESA}} autoriza o uso da sua marca, dos seus produtos e das imagens gravadas no evento no episódio, nos cortes e na divulgação do Cozinha Gourmet, por prazo indeterminado.",
    "A {{EMPRESA}} poderá usar o vídeo que receber em seus canais próprios, por prazo indeterminado. O uso em mídia paga ou em peças de terceiros depende de autorização prévia da ORBI, em razão dos direitos de imagem de chef, apresentadora e convidados.",
    "Cada parte autoriza a outra a usar sua marca exclusivamente para os fins deste contrato.",
    "Os direitos autorais sobre o formato Cozinha Gourmet, o episódio e as gravações pertencem à ORBI e à Agência Nexo.",
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


// ---------- ORBI IA: agentes de IA para WhatsApp (SDR de prospecção + atendimento) ----------
const ORBI_SDR: Bruta[] = [
  { titulo: "Objeto", itens: [
    "Prestação, pela ORBI, de serviço de automação comercial com inteligência artificial no WhatsApp da {{EMPRESA}}, composto por dois agentes: (a) Agente SDR, de prospecção ativa de empresas; e (b) Agente de Atendimento, que responde os contatos recebidos.",
    "O serviço é prestado por licença de uso durante a vigência deste contrato. Não há venda, cessão ou transferência do software, dos fluxos ou dos agentes à {{EMPRESA}}.",
  ]},
  { titulo: "Agente SDR (prospecção)", itens: [
    "Busca automática de empresas ativas em bases públicas de CNPJ, por até {{CNAES}} códigos de atividade (CNAEs) e pelas cidades ou regiões indicadas pela {{EMPRESA}}.",
    "A {{EMPRESA}} pode trocar os CNAEs e as cidades a qualquer tempo, por pedido escrito (WhatsApp ou e-mail). A troca é aplicada em até 3 (três) dias úteis.",
    "Busca do telefone de cada empresa em fontes públicas (como Google e o site da empresa), com descarte das empresas sem telefone validado.",
    "Controle de repetição: a mesma empresa não é abordada de novo antes de 90 (noventa) dias.",
    "A primeira mensagem é enviada por modelos de mensagem (templates) aprovados pela Meta, pela conta WhatsApp Business API (WABA) da {{EMPRESA}}.",
    "Volume: início gradual, com até 5 (cinco) abordagens por dia útil, aumentando conforme a qualidade do número, até o limite de {{VOLUME}} abordagens por dia útil. Volume acima desse limite depende de orçamento à parte.",
    "Proteção automática: antes de cada envio, o sistema confere a qualidade do número na Meta e o volume de pedidos de saída. Se houver risco, os envios são pausados e a ORBI é avisada.",
  ]},
  { titulo: "Agente de Atendimento", itens: [
    "Responde automaticamente, 24 horas por dia, quem responder à prospecção e quem chamar o número da {{EMPRESA}} diretamente.",
    "Entende mensagens de áudio, mantém o histórico da conversa, qualifica o contato e coleta as informações previstas no roteiro aprovado pela {{EMPRESA}}.",
    "Encaminha o contato para o atendimento humano da {{EMPRESA}} quando necessário, com aviso no WhatsApp indicado por ela. Quando uma pessoa da {{EMPRESA}} assume a conversa, o agente pausa.",
    "Respeita os pedidos de saída (\"PARAR\" ou equivalentes): o contato deixa de receber mensagens de prospecção.",
  ]},
  { titulo: "Implantação", itens: [
    "A implantação inclui a configuração da WABA, a criação e o envio dos templates para aprovação da Meta, o roteiro e as instruções dos agentes, as integrações e os testes.",
    "Prazo estimado de até 15 (quinze) dias úteis, contados do pagamento da implantação e da entrega, pela {{EMPRESA}}, de tudo o que está na Cláusula 6.",
    "A aprovação de templates, a verificação da empresa e os limites de envio são decisões exclusivas da Meta. O tempo de análise da Meta não conta no prazo da ORBI.",
  ]},
  { titulo: "Obrigações da ORBI", itens: [
    "Manter os agentes funcionando, com monitoramento e correção de falhas.",
    "Prestar suporte por WhatsApp, de segunda a sexta, das 9h às 18h, com resposta em até 1 (um) dia útil.",
    "Fazer, sem custo adicional, ajustes de textos, roteiro, CNAEs e cidades. Novas funcionalidades e integrações com outros sistemas são orçadas à parte.",
    "Manter sigilo e segurança sobre os dados tratados, conforme a Cláusula 10.",
  ]},
  { titulo: "Obrigações da {{EMPRESA}}", itens: [
    "Fornecer um número de WhatsApp exclusivo para o serviço, a conta Meta Business verificada e os documentos pedidos pela Meta.",
    "Manter um meio de pagamento válido na conta da Meta para as cobranças das mensagens.",
    "Fornecer informações corretas sobre a empresa, os produtos, os preços e a oferta, e aprovar os templates e o roteiro.",
    "Atender os contatos encaminhados pelo agente.",
    "Usar o serviço apenas para fins lícitos e dentro das políticas da Meta, sem enviar conteúdo enganoso, ofensivo ou ilegal.",
    "Pagar os valores da Cláusula 7 nas datas previstas.",
  ]},
  { titulo: "Valores e pagamento", itens: [
    "Implantação: R$ {{VALOR}} ({{EXTENSO}}), {{PAGAMENTO}}. O valor da implantação não é reembolsável e não transfere à {{EMPRESA}} a propriedade dos agentes.",
    "Mensalidade: R$ {{MENSALIDADE}} ({{MENSALIDADE_EXTENSO}}), com vencimento todo dia {{VENCIMENTO}} de cada mês, por boleto. A primeira mensalidade vence no dia {{VENCIMENTO}} do mês seguinte ao início da operação.",
    "Renovação: R$ {{RENOVACAO}} ({{RENOVACAO_EXTENSO}}) a cada 12 (doze) meses, devidos no início de cada novo período de 12 meses.",
    "Estão incluídos na mensalidade os custos de inteligência artificial, bases de dados e infraestrutura, dentro do volume previsto no item 2.6. Não estão incluídas as cobranças da Meta pelas mensagens, pagas diretamente pela {{EMPRESA}} à Meta.",
    "O atraso sujeita a {{EMPRESA}} a multa de 2% (dois por cento) e juros de 1% (um por cento) ao mês. Após 10 (dez) dias de atraso, a ORBI pode suspender o serviço até a regularização, sem prejuízo da cobrança.",
    "Os valores da mensalidade e da renovação são reajustados a cada 12 meses pelo IPCA do período.",
  ]},
  { titulo: "Prazo, renovação e cancelamento", itens: [
    "Este contrato vale por 12 (doze) meses a partir da assinatura e é renovado por iguais períodos com o pagamento da renovação.",
    "A {{EMPRESA}} pode cancelar a qualquer tempo, sem multa, com aviso por escrito com 30 (trinta) dias de antecedência e sem débitos em aberto.",
    "O aviso dado com menos de 30 (trinta) dias do próximo vencimento não dispensa esse vencimento: a mensalidade é devida, e o cancelamento vale a partir do ciclo seguinte.",
    "Os valores de implantação e de renovação já pagos não são reembolsados.",
    "A ORBI pode encerrar o contrato se houver uso ilícito do serviço ou atraso superior a 30 (trinta) dias.",
    "No encerramento, a ORBI desliga os agentes e, a pedido da {{EMPRESA}}, entrega em até 15 (quinze) dias a exportação dos contatos e das conversas da {{EMPRESA}}. A WABA e o número continuam sendo da {{EMPRESA}}.",
  ]},
  { titulo: "Uso do WhatsApp e riscos", itens: [
    "A {{EMPRESA}} declara conhecer as políticas da Meta para o WhatsApp Business, inclusive a exigência de consentimento para mensagens iniciadas pela empresa, e que a prospecção ativa de empresas envolve risco de queda de qualidade do número, limitação de envios e bloqueio do número ou da conta.",
    "A {{EMPRESA}} assume esse risco. Bloqueios, restrições ou suspensões aplicados pela Meta não são falha da ORBI e não geram reembolso, desconto ou indenização.",
    "Em caso de bloqueio, a ORBI configura, sem custo de mão de obra, um novo número fornecido pela {{EMPRESA}}. O chip, a verificação e as cobranças da Meta ficam por conta da {{EMPRESA}}.",
    "A ORBI pode pausar ou reduzir os envios a qualquer tempo para preservar o número, avisando a {{EMPRESA}}.",
    "Todas as mensagens de prospecção oferecem ao destinatário a opção de não receber novos contatos.",
  ]},
  { titulo: "Proteção de dados (LGPD)", itens: [
    "A {{EMPRESA}} é a controladora dos dados tratados na prospecção: ela define o público, a finalidade e a oferta, e responde pela base legal (legítimo interesse, na abordagem entre empresas), pelos pedidos dos titulares e perante a Autoridade Nacional de Proteção de Dados.",
    "A ORBI é a operadora: trata os dados conforme as instruções da {{EMPRESA}} e guarda e opera a base em infraestrutura sob sua administração, com medidas de segurança adequadas.",
    "A ORBI pode manter os registros mínimos (CNPJ, telefone, data do envio e pedido de saída) necessários ao controle de repetição e de pedidos de saída, inclusive após o encerramento, pelo prazo necessário a essa finalidade.",
    "A parte que tomar conhecimento de incidente de segurança com os dados avisará a outra em até 2 (dois) dias úteis.",
    "A {{EMPRESA}} responde por reclamações, autuações e indenizações decorrentes da abordagem que definiu, e ressarcirá a ORBI por valores que ela venha a pagar por esse motivo.",
  ]},
  { titulo: "Propriedade intelectual e licença", itens: [
    "Os fluxos, as instruções (prompts), as integrações, o código e a estrutura dos agentes são de propriedade exclusiva da ORBI. A {{EMPRESA}} recebe licença de uso não exclusiva e intransferível durante a vigência deste contrato.",
    "O pagamento da implantação, da mensalidade ou da renovação não transfere a propriedade dos agentes nem dá direito a cópia, código-fonte ou exportação dos fluxos.",
    "É proibido copiar, revender, sublicenciar ou fazer engenharia reversa dos agentes.",
    "Os contatos e as conversas gerados pertencem à {{EMPRESA}}, observado o item 10.3.",
  ]},
  { titulo: "Responsabilidades", itens: [
    "A ORBI presta o serviço com diligência, mas não garante número de respostas, contatos qualificados, reuniões ou vendas.",
    "Respostas geradas por inteligência artificial podem conter imprecisões. A {{EMPRESA}} revisa o roteiro e acompanha os atendimentos.",
    "Indisponibilidades de serviços de terceiros (como Meta, provedores de inteligência artificial e de hospedagem) não são falha da ORBI, que trabalhará para restabelecer o serviço assim que possível.",
    "A responsabilidade total da ORBI por este contrato fica limitada ao valor das 3 (três) últimas mensalidades pagas, salvo dolo.",
  ]},
  { titulo: "Confidencialidade", itens: [
    "As partes manterão sigilo sobre as informações comerciais, técnicas e de clientes a que tiverem acesso, durante a vigência e por 2 (dois) anos após o encerramento.",
  ]},
  { titulo: "Disposições gerais", itens: [
    "Este contrato não gera vínculo trabalhista, societário ou de representação entre as partes.",
    "Alterações só valem por escrito. Mensagens de WhatsApp e e-mails trocados entre os representantes valem como forma escrita.",
    "As partes reconhecem a validade da assinatura eletrônica deste contrato, feita com confirmação por código enviado ao WhatsApp de cada signatário e registro de data, hora, IP e código de verificação do documento, nos termos do art. 10, § 2º, da MP nº 2.200-2/2001 e da Lei nº 14.063/2020.",
    "Fica eleito o foro da Comarca de {{FORO}} para dirimir questões deste contrato.",
  ]},
];


// ---------- ORBI IA: agente de IA para imobiliária (contrato principal + Anexo I, Fase 1) ----------
// O sistema numera as cláusulas em sequência: o principal vai de 1 a 13 e o Anexo I de 14 a 17.
const ORBI_IMOBILIARIA: Bruta[] = [
  { titulo: "Natureza e licença", itens: [
    "Este contrato tem por objeto a implantação, a licença de uso e o suporte de agente de inteligência artificial para o atendimento da {{EMPRESA}}, nas fases descritas no Anexo I (Cláusulas 14 a 17) e nos anexos ou aditivos que vierem a ser assinados.",
    "A tecnologia da solução, compreendendo código, roteiros, fluxos, regras e documentação, pertence à ORBI.",
    "Com o pagamento integral da implantação de cada fase, a {{EMPRESA}} recebe licença de uso perpétua, não exclusiva e intransferível dos recursos daquela fase, para uso no CNPJ contratante. Quando a implantação de uma fase for isenta, a licença é concedida com a assinatura do respectivo aditivo.",
    "A mensalidade remunera a hospedagem, a operação, a inteligência artificial, o monitoramento, o suporte e as melhorias da solução, e não o direito de uso.",
    "Como a licença é perpétua, se este contrato for encerrado, a {{EMPRESA}} poderá voltar a usar a solução a qualquer tempo, sem pagar de novo a implantação das fases já pagas, bastando contratar novamente a operação e a hospedagem nas condições vigentes da ORBI.",
    "Novos módulos e fases serão contratados por anexos ou aditivos numerados, assinados pelas partes, regidos por este contrato.",
  ]},
  { titulo: "Limites da inteligência artificial", itens: [
    "A inteligência artificial não valida, não interpreta e não aprova contratos. Todo contrato passa por aprovação humana antes da assinatura.",
    "A inteligência artificial não aprova nem reprova cadastros e não comunica aprovação definitiva ao interessado.",
    "A inteligência artificial não negocia valores, descontos, garantias ou cláusulas.",
    "Decisões sensíveis, com risco jurídico ou excepcionais são tomadas por pessoas da equipe da {{EMPRESA}}.",
    "A intermediação imobiliária continua com corretor habilitado no CRECI, nos termos da Lei nº 6.530/1978.",
    "Respostas geradas por inteligência artificial podem conter imprecisões. Por isso, as etapas com efeito jurídico ou financeiro ficam sempre com a equipe, e a ORBI corrige as falhas que a {{EMPRESA}} apontar.",
    "A ORBI se compromete com a qualidade da solução, mas não garante número de locações, vendas ou faturamento, que dependem também do mercado, da carteira e da operação da {{EMPRESA}}.",
  ]},
  { titulo: "Compromissos da {{EMPRESA}}", itens: [
    "Fornecer o número oficial de WhatsApp e a conta Meta Business, com os documentos pedidos pela Meta.",
    "Fornecer as informações, as regras internas e os acessos necessários a cada fase.",
    "Indicar um responsável para acompanhar a implantação e a validação.",
    "Manter colaboradores para as etapas que dependem de pessoas, inclusive o atendimento dos interessados repassados pelo agente.",
    "Zelar pela exatidão das informações que fornecer.",
    "Usar a solução para fins lícitos e dentro das políticas da Meta para o WhatsApp Business.",
    "Restrições, limitações ou bloqueios aplicados pela Meta ao número ou à conta, inclusive por mudança nas políticas da Meta, não são falha da ORBI. Nesses casos, a ORBI trabalhará junto com a {{EMPRESA}} para restabelecer o atendimento, sem custo de mão de obra.",
  ]},
  { titulo: "Compromissos da ORBI", itens: [
    "Implantar cada fase conforme o respectivo anexo e treinar a equipe da {{EMPRESA}} para o uso do painel.",
    "Manter a solução em operação, com monitoramento e correção de falhas.",
    "Prestar suporte por WhatsApp, de segunda a sexta-feira, das 9h às 18h, com resposta em até 1 (um) dia útil. Falhas que impeçam o atendimento serão tratadas com prioridade.",
    "Fazer, sem custo adicional, os ajustes de roteiro, regras e textos dentro do escopo contratado. Novas funcionalidades, módulos e integrações não previstas serão orçados à parte.",
    "Manter sigilo e segurança sobre os dados tratados, conforme as Cláusulas 8 e 10.",
  ]},
  { titulo: "Plataformas de terceiros", itens: [
    "A {{EMPRESA}} contrata, em seu próprio nome e CNPJ, todos os serviços, plataformas e APIs de terceiros que forem usados ou implantados na operação da solução, em qualquer fase, como: as mensagens da API oficial do WhatsApp (Meta); a consulta de CPF e CNPJ, de restrições e de negativação em birôs de crédito, cartórios de protesto ou outros órgãos e empresas, em São Paulo ou em qualquer outro estado do Brasil; a análise cadastral e de crédito; e a assinatura eletrônica. As plataformas de crédito e de assinatura são escolhidas pela {{EMPRESA}} entre as que oferecem integração por API.",
    "Todos os custos desses serviços (adesão, mensalidade, franquias, cobrança por mensagem, por consulta, por documento ou por assinatura, e reajustes) são de responsabilidade exclusiva da {{EMPRESA}}, pagos diretamente ao fornecedor, e não estão incluídos na implantação nem na mensalidade da ORBI. Ficam incluídos na mensalidade apenas a hospedagem, a infraestrutura e os serviços de inteligência artificial que a ORBI usa para operar a solução (item 1.4).",
    "A ORBI não intermedeia, não antecipa e não repassa pagamentos a esses fornecedores, e não responde por indisponibilidade, mudança de preço ou de regras deles.",
    "Cada fase inclui a integração com 1 (uma) plataforma de cada tipo. Troca de fornecedor ou integração adicional é orçada à parte.",
  ]},
  { titulo: "Carteira de imóveis", itens: [
    "Se o sistema de gestão da {{EMPRESA}} oferecer API documentada ou exportação automática, a ORBI fará, dentro da implantação, a integração com esse sistema para manter a carteira do agente atualizada.",
    "Se a integração exigir desenvolvimento fora do padrão, como API sem documentação, instável ou com limites que impeçam a atualização regular, a ORBI avisará a {{EMPRESA}} por escrito, explicando o motivo. A {{EMPRESA}} escolherá entre a atualização por planilha (item 6.3) e a integração orçada à parte. Nenhum custo extra é cobrado sem a aprovação da {{EMPRESA}}.",
    "Se o sistema não oferecer integração, ou enquanto ela não estiver pronta, a carteira será atualizada por planilha, no modelo fornecido pela ORBI, enviada pela {{EMPRESA}} sempre que houver mudança (imóvel novo, alugado, retirado, alteração de valor ou de condições) e, no mínimo, 1 (uma) vez por dia útil.",
    "Para proteger a {{EMPRESA}} e os interessados, o agente informa que a disponibilidade do imóvel é confirmada pela equipe no agendamento da visita. Se a carteira ficar mais de 2 (dois) dias úteis sem atualização, a ORBI avisará o responsável indicado no item 3.3.",
    "A {{EMPRESA}} é responsável pela exatidão e pela atualização da carteira. O agente responde com base na última atualização recebida, e a ORBI não responde por informação desatualizada ou incorreta fornecida pela {{EMPRESA}}.",
    "Custos de licença, API ou exportação cobrados pelo fornecedor do sistema de gestão da {{EMPRESA}} são de responsabilidade da {{EMPRESA}}.",
  ]},
  { titulo: "Dados e continuidade", itens: [
    "Pertencem à {{EMPRESA}}, em qualquer situação: os dados de clientes e interessados, as conversas, os imóveis, os documentos, o histórico, o número de WhatsApp e a conta Meta.",
    "A {{EMPRESA}} pode pedir a exportação desses dados a qualquer tempo, durante ou depois do contrato. A ORBI os entregará em formato padrão (como planilha ou arquivo CSV/JSON), em até 15 (quinze) dias úteis após o pedido, sem custo.",
    "A ORBI não usa os dados da {{EMPRESA}} para nenhuma outra finalidade, nem para atender outros clientes.",
    "Se a ORBI encerrar suas atividades, entrar em falência ou interromper o serviço por mais de 30 (trinta) dias seguidos sem justificativa, entregará à {{EMPRESA}}, em até 30 (trinta) dias, o código e a documentação da solução, para uso e manutenção exclusivamente no CNPJ contratante, por conta própria ou com o fornecedor que escolher, mantidas as demais condições da licença.",
  ]},
  { titulo: "Uso da solução e confidencialidade", itens: [
    "A licença vale para o CNPJ contratante. O uso da solução em outras empresas, filiais ou unidades depende de contrato com a ORBI.",
    "Fora da hipótese do item 7.4, a licença não inclui a entrega do código nem o direito de copiar, revender, sublicenciar ou fazer engenharia reversa da solução.",
    "As partes manterão sigilo sobre as informações uma da outra a que tiverem acesso: de um lado, os processos, os clientes e os dados da {{EMPRESA}}; de outro, os roteiros, as regras e os fluxos da solução da ORBI. O sigilo vale durante o contrato e por 2 (dois) anos depois dele.",
    "Em contrapartida à confiança da {{EMPRESA}}, durante 12 (doze) meses a contar da assinatura, a ORBI não implantará esta solução para imobiliárias concorrentes da {{EMPRESA}} em Sumaré, Hortolândia e Nova Odessa. A restrição termina automaticamente com o fim do contrato, por qualquer motivo, salvo rescisão por culpa da ORBI.",
  ]},
  { titulo: "Expansão e parceria futura", itens: [
    "As partes reconhecem o interesse comum em, após a validação, avaliar a expansão do modelo de operação desenvolvido neste projeto.",
    "Pelo prazo de 5 (cinco) anos a contar da assinatura, caso a {{EMPRESA}}, seus sócios ou empresas relacionadas venham a estruturar essa expansão, as partes negociarão prioritariamente entre si.",
    "Os termos da expansão serão formalizados em aditivo a este contrato ou em instrumento próprio. Esta cláusula não obriga nenhuma das partes a fechar a parceria.",
  ]},
  { titulo: "Proteção de dados (LGPD)", itens: [
    "A {{EMPRESA}} é a controladora dos dados pessoais tratados na solução: define as finalidades, responde pela base legal e atende aos pedidos dos titulares. A ORBI é a operadora.",
    "A ORBI trata os dados somente para as finalidades deste contrato e conforme as instruções da {{EMPRESA}}.",
    "A ORBI adotará medidas de segurança adequadas, como controle de acesso, criptografia em trânsito e registro das ações.",
    "A ORBI utiliza provedores de hospedagem e de inteligência artificial, alguns com servidores fora do Brasil. Esses provedores atuam como suboperadores, com obrigações de segurança e sigilo equivalentes às deste contrato, e a lista atualizada será informada à {{EMPRESA}} sempre que pedida.",
    "A parte que tomar conhecimento de incidente de segurança com os dados avisará a outra em até 48 (quarenta e oito) horas, com as informações disponíveis, e as partes colaborarão nas providências exigidas pela lei.",
  ]},
  { titulo: "Pagamentos", itens: [
    "Os valores de cada fase constam do respectivo anexo ou aditivo.",
    "A mensalidade vence todo dia {{VENCIMENTO}}, a partir do mês seguinte à entrada do agente em operação no número oficial.",
    "O atraso no pagamento sujeita o valor devido a multa de 2% (dois por cento) e juros de 1% (um por cento) ao mês.",
    "A mensalidade será reajustada a cada 12 (doze) meses pela variação do IPCA do período.",
    "Depois de 15 (quinze) dias de atraso, e com aviso prévio de 5 (cinco) dias, a ORBI poderá suspender a operação até a regularização.",
  ]},
  { titulo: "Vigência, cancelamento e rescisão", itens: [
    "Este contrato tem vigência mínima de 12 (doze) meses a partir da entrada em operação e é renovado automaticamente por prazo indeterminado.",
    "O cancelamento pode ser pedido a qualquer momento, por escrito, com 30 (trinta) dias de aviso prévio. As mensalidades do período de aviso são devidas normalmente. Mensalidades já pagas não são devolvidas nem calculadas proporcionalmente.",
    "A parte que cancelar antes do fim da vigência mínima, sem justa causa, pagará à outra multa de 20% (vinte por cento) sobre as mensalidades restantes até completar os 12 (doze) meses, além do aviso prévio.",
    "Não há multa no encerramento por justa causa, assim entendido o descumprimento relevante deste contrato que não seja corrigido em até 15 (quinze) dias depois do aviso da outra parte, nem na hipótese do item 15.8.",
    "Os valores de implantação e de renovação anual já pagos não são devolvidos.",
    "Ao fim do contrato, a operação e a hospedagem são encerradas, ressalvado o item 1.5; os dados são exportados à {{EMPRESA}} conforme a Cláusula 7 e depois eliminados da base da ORBI, conforme a LGPD, guardando apenas o que a lei a obrigar a manter. O número de WhatsApp e a conta Meta continuam sendo da {{EMPRESA}}.",
  ]},
  { titulo: "Disposições gerais e foro", itens: [
    "Este contrato não cria vínculo trabalhista, societário ou de representação entre as partes.",
    "Alterações só valem por escrito. Mensagens de WhatsApp e e-mails trocados entre os representantes valem como forma escrita.",
    "As partes reconhecem a validade da assinatura eletrônica deste contrato e de seus anexos, feita com confirmação por código enviado ao WhatsApp de cada signatário e registro de data, hora, IP e código de verificação do documento, nos termos do art. 10, § 2º, da MP nº 2.200-2/2001 e da Lei nº 14.063/2020.",
    "Fica eleito o foro da Comarca de {{FORO}} para resolver as questões deste contrato.",
  ]},
  // ---------- Anexo I ----------
  { titulo: "Anexo I · Fase 1 (Atendimento e Qualificação): escopo e prazo", itens: [
    "Mapeamento do atendimento com a equipe e definição dos critérios de qualificação.",
    "Configuração do agente no WhatsApp oficial da {{EMPRESA}} (API oficial da Meta), com a linguagem da {{EMPRESA}}, atendendo 24 (vinte e quatro) horas por dia.",
    "Entrada automática dos leads de Google, Meta e site.",
    "Atendimento ao interessado em imóvel específico: identificação do imóvel, disponibilidade conforme a Cláusula 6 e apresentação das informações cadastradas (características, localização, aluguel, encargos e fotos).",
    "Atendimento ao interessado sem imóvel definido: levantamento de preferências e apresentação de opções compatíveis da carteira.",
    "Repasse ao corretor com resumo da conversa, e possibilidade de um colaborador assumir a conversa a qualquer momento.",
    "Cadência de follow-up de locação e de venda. Fora da janela de 24 horas do WhatsApp, as mensagens usam modelos aprovados pela Meta, com custo pago à Meta conforme a Cláusula 5.",
    "Testes com a equipe e acompanhamento intensivo nas primeiras semanas.",
    "Os itens 14.4 e 14.5 (consulta à carteira) são incluídos na Fase 1 como cortesia da ORBI.",
    "Prazo de implantação: 30 (trinta) dias corridos, contados a partir do recebimento das informações, regras e acessos da {{EMPRESA}} (item 3.2). O tempo de análise e aprovação da Meta não conta nesse prazo.",
  ]},
  { titulo: "Anexo I · Validação e aceite da Fase 1", itens: [
    "A validação dura 30 (trinta) dias de operação no número oficial, com os critérios dos itens 15.2 a 15.4.",
    "Primeira resposta em até 1 (um) minuto, 24 (vinte e quatro) horas por dia.",
    "100% (cem por cento) dos leads recebidos pelas fontes integradas com resposta.",
    "Todo repasse ao corretor acompanhado de resumo da conversa.",
    "Períodos de indisponibilidade de terceiros, como Meta e provedores de inteligência artificial e de hospedagem, comunicados pela ORBI à {{EMPRESA}}, não contam contra os critérios.",
    "Também serão medidas, sem serem critério de aceite, as horas da equipe por locação antes e depois da implantação. A medição anterior será feita em conjunto, antes da entrada em operação.",
    "Atingidos os critérios, a {{EMPRESA}} registra o aceite por escrito. Sem manifestação em até 5 (cinco) dias úteis após o fim da validação, a Fase 1 é considerada aceita.",
    "Se algum critério não for atingido, a ORBI fará os ajustes necessários e as partes medirão de novo por mais 30 (trinta) dias. Se ainda assim os critérios não forem atingidos por razões ligadas à solução, a {{EMPRESA}} poderá encerrar este contrato sem multa.",
  ]},
  { titulo: "Anexo I · Valores da Fase 1", itens: [
    "Implantação: R$ {{VALOR}} ({{EXTENSO}}). À vista, por PIX, com 10% (dez por cento) de desconto: R$ {{AVISTA}} ({{AVISTA_EXTENSO}}). Ou em até 3 (três) vezes no cartão de crédito, pelo valor cheio.",
    "Mensalidade: R$ {{MENSALIDADE}} ({{MENSALIDADE_EXTENSO}}), a partir da entrada em operação, com vencimento no dia {{VENCIMENTO}}, conforme o item 11.2.",
    "Renovação anual: R$ {{RENOVACAO}} ({{RENOVACAO_EXTENSO}}), cobrada uma vez a cada 12 (doze) meses de operação, a primeira ao completar 12 (doze) meses da entrada em operação, com vencimento no dia {{VENCIMENTO}}. Ela remunera a revisão completa do agente e a atualização dos modelos de inteligência artificial e da infraestrutura. Não é devida se o cancelamento for avisado, nos termos do item 12.2, até 30 (trinta) dias antes do seu vencimento.",
    "Não há cobrança por conversa ou mensagem por parte da ORBI. As mensagens cobradas pela Meta seguem a Cláusula 5.",
  ]},
  { titulo: "Anexo I · Condições das próximas fases", itens: [
    "As fases seguintes são contratadas por aditivo. Parte relevante dos custos da ORBI, como a infraestrutura em nuvem e os serviços de inteligência artificial, é contratada no exterior e cotada em moeda estrangeira. Por isso, as condições abaixo têm prazo de validade: dentro dele, os valores ficam garantidos à {{EMPRESA}}.",
    "Fase 2 · Visitas e reativação. Escopo: agenda de visitas (retirada de chaves e visita acompanhada) com confirmação e lembrete, reativação dos leads parados com modelos aprovados pela Meta (com custo pago à Meta conforme a Cláusula 5) e painel de indicadores.",
    "Condições da Fase 2: implantação de R$ 1.450,00 (mil quatrocentos e cinquenta reais) e mensalidade total de R$ 820,00 (oitocentos e vinte reais), em substituição à mensalidade de R$ 760,00 da Fase 1, válidas para contratação em até 6 (seis) meses a contar da assinatura deste contrato.",
    "Fase 3 · Documentação, contrato e locação. Escopo: recebimento e conferência de documentos, encaminhamento para análise de crédito com autorização do titular e resultado para avaliação humana, minuta a partir do modelo de contrato da {{EMPRESA}} com aprovação humana e envio para assinatura eletrônica.",
    "A Fase 3 só pode ser contratada depois da Fase 2. Condições da Fase 3: isenção da taxa de implantação, válida para contratação em até 3 (três) meses a contar do aceite da Fase 1, e mensalidade total de R$ 980,00 (novecentos e oitenta reais), em substituição à mensalidade de R$ 820,00 da Fase 2, válida para contratação em até 6 (seis) meses a contar da assinatura deste contrato.",
    "A renovação anual não muda com a contratação das próximas fases.",
    "Após esses prazos, os valores das próximas fases serão atualizados conforme os custos vigentes e apresentados à {{EMPRESA}} em nova proposta, sem obrigação de contratação por nenhuma das partes.",
  ]},
];

// renovacao: o modelo usa {{RENOVACAO}} e o formulário exige o valor
export const MODELOS: Record<string, { titulo: string; cota: string; bruto: () => Bruta[]; marca?: "orbi"; renovacao?: boolean }> = {
  orbi_sdr: { titulo: "Contrato de Prestação de Serviços · Agentes de IA para WhatsApp (SDR e Atendimento)", cota: "Mensal", bruto: () => ORBI_SDR, marca: "orbi", renovacao: true },
  orbi_imobiliaria: { titulo: "Contrato de Implantação, Licença de Uso e Suporte de Agente de IA para Imobiliária · Anexo I: Fase 1 (Atendimento e Qualificação)", cota: "Mensal", bruto: () => ORBI_IMOBILIARIA, marca: "orbi", renovacao: true },
  contrato_anfitriao: { titulo: "Contrato de Patrocínio e Cessão de Espaço", cota: "Anfitrião", bruto: () => ANFITRIAO_LOCAL },
  termo_anfitriao: { titulo: "Termo de Compromisso de Patrocínio · Cota Anfitrião", cota: "Anfitrião", bruto: () => termo("termo_anfitriao") },
  termo_prato: { titulo: "Termo de Compromisso de Patrocínio · Cota Prato Principal", cota: "Prato Principal", bruto: () => termo("termo_prato") },
  termo_entrada: { titulo: "Termo de Compromisso de Patrocínio · Cota Entrada", cota: "Entrada", bruto: () => termo("termo_entrada") },
  contrato_brinde: { titulo: "Contrato de Patrocínio e Fornecimento de Brindes", cota: "Parceiro", bruto: () => PARCEIRO_BRINDE },
};

export function gerar(modelo: string, ctx: Ctx): { titulo: string; clausulas: Clausula[] } {
  const m = MODELOS[modelo];
  const sub = (t: string) => t
    .replaceAll("{{EMPRESA}}", ctx.empresa).replaceAll("{{COTA}}", ctx.cota).replaceAll("{{DATA}}", ctx.data)
    .replaceAll("{{VALOR}}", ctx.valor).replaceAll("{{EXTENSO}}", ctx.extenso)
    .replaceAll("{{PAGAMENTO}}", ctx.pagamento).replaceAll("{{SEGMENTO}}", ctx.segmento)
    .replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (ctx.extras && ctx.extras[k] !== undefined ? ctx.extras[k] : m));
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
