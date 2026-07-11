// @ts-nocheck
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Script from 'next/script';

const SEGMENTOS = [
  {
    id: 'estetica',
    nome: 'Estética',
    persona: 'Lari',
    foto: '/clinicas/img/estetica-bemestar.jpg',
    desc: 'Procedimentos, autoestima e resultado visível',
  },
  {
    id: 'odontologica',
    nome: 'Odontológica',
    persona: 'Ana',
    foto: '/clinicas/img/odonto-avaliacao.jpg',
    desc: 'Consultas, avaliações e tratamentos dentários',
  },
  {
    id: 'medica',
    nome: 'Médica',
    persona: 'Beatriz',
    foto: '/clinicas/img/medico-pediatria.jpeg',
    desc: 'Consultas clínicas e acompanhamento de pacientes',
  },
  {
    id: 'fisioterapia',
    nome: 'Fisioterapia',
    persona: 'Duda',
    foto: '/clinicas/img/fisio-preventiva.jpeg',
    desc: 'Reabilitação, prevenção e qualidade de vida',
  },
];

export default function ClinicasPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Oi! Sou o assistente da ORBI Plena. Qual é sua área?' },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [segmentoEscolhido, setSegmentoEscolhido] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState(null);
  const lastLeadSnapshotRef = useRef('');
  const chatHistoryRef = useRef([]);
  const msgsEndRef = useRef(null);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function escolherSegmento(segmentoNome) {
    setSegmentoEscolhido(true);
    setChatOpen(true);
    const abertura = `Meu segmento é ${segmentoNome}.`;
    handleSend(abertura);
  }

  function openChatWithSegment(segmentoNome) {
    escolherSegmento(segmentoNome);
  }

  function extractLeadMarker(rawText) {
    const match = rawText.match(/<!--LEAD:([\s\S]*?)-->/);
    if (!match) return { visibleText: rawText.trim(), leadFields: null };
    const visibleText = rawText.replace(match[0], '').trim();
    let leadFields = null;
    try { leadFields = JSON.parse(match[1]); } catch { leadFields = null; }
    return { visibleText, leadFields };
  }

  async function maybeSaveLead(leadFields) {
    if (!leadFields) return;
    if (!leadFields.nome || !leadFields.telefone || !leadFields.segmento) return;

    const snapshot = JSON.stringify(leadFields);
    if (snapshot === lastLeadSnapshotRef.current) return;
    lastLeadSnapshotRef.current = snapshot;

    // Sempre salva/atualiza (protege contra perder o lead se a pessoa sumir no meio),
    // mas o e-mail/WhatsApp real só dispara quando o servidor ver "encerrar":true.
    try {
      const res = await fetch('/api/lead-clinicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadFields),
      });
      const data = await res.json();
      if (data?.whatsappLink) {
        setWhatsappLink({ url: data.whatsappLink, persona: data.persona });
        if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
          window.fbq('track', 'Lead');
        }
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
          window.gtag('event', 'conversion', {
            send_to: 'AW-17997912287/FnWMCI_Rvc4cEN-xiYZD',
            value: 1.0,
            currency: 'BRL',
          });
        }
      }
      setLeadSaved(true);
    } catch (err) {
      console.error('Falha ao salvar/atualizar lead:', err);
      lastLeadSnapshotRef.current = '';
    }
  }

  async function handleSend(textOverride) {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: 'user', text }]);
    chatHistoryRef.current.push({ role: 'user', content: text });
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/chat-clinicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistoryRef.current }),
      });
      const data = await res.json();
      const rawReply = data.response || 'Não consegui processar, tenta de novo?';
      const { visibleText, leadFields } = extractLeadMarker(rawReply);
      setMessages((prev) => [...prev, { role: 'bot', text: visibleText }]);
      chatHistoryRef.current.push({ role: 'assistant', content: rawReply });
      if (leadFields?.segmento) setSegmentoEscolhido(true);
      maybeSaveLead(leadFields);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'bot', text: 'Erro de conexão, tenta de novo em instantes.' }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5F2] text-[#22262B]">
      {/* META PIXEL — ORBI Plena */}
      <Script id="meta-pixel-clinicas" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1772566967429029');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img height="1" width="1" style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=1772566967429029&ev=PageView&noscript=1" />
      </noscript>
      {/* HEADER */}
      <header className="bg-[#F7F5F2]/90 backdrop-blur-sm py-4 sticky top-0 z-50 border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/clinicas/img/logo-orbi-color.png" alt="ORBI IA" width={140} height={36} className="h-8 w-auto" />
            <span className="text-xs font-semibold tracking-wide uppercase bg-[#4F7A5A]/10 text-[#4F7A5A] px-3 py-1 rounded-full border border-[#4F7A5A]/20">Plena</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#22262B]/70">
            <a href="#segmentos" className="hover:text-[#4F7A5A] transition-colors">Áreas de atuação</a>
            <a href="#como-funciona" className="hover:text-[#4F7A5A] transition-colors">Como funciona</a>
            <a href="#noticias" className="hover:text-[#4F7A5A] transition-colors">Notícias</a>
            <button onClick={() => setChatOpen(true)} className="bg-[#22262B] text-[#F7F5F2] px-5 py-2 rounded-lg font-medium hover:bg-[#4F7A5A] transition-colors">
              Falar com a IA
            </button>
          </nav>
        </div>
      </header>

      {/* HERO — vídeo estética */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-end">
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop playsInline poster="/clinicas/img/estetica-poster.jpg" className="w-full h-full object-cover">
            <source src="/clinicas/video/estetica.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-[#141712] via-[#141712]/55 to-[#141712]/10" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-16 w-full">
          <div className="max-w-2xl">
            <div className="inline-block px-4 py-1 bg-white/10 backdrop-blur-sm text-[#F7F5F2] rounded-full text-sm font-medium mb-6 border border-white/20">
              Estética · Odontologia · Medicina · Fisioterapia
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
              Quem responde na hora, <span className="text-[#D9B36A]">fecha a consulta.</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              O ORBI Plena atende seus pacientes no WhatsApp, 24 horas por dia, agenda, confirma presença e reduz falta — pra sua equipe focar no que os pacientes realmente amam: o acolhimento humano.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => setChatOpen(true)} className="inline-flex items-center justify-center px-8 py-4 bg-[#D9B36A] text-[#22262B] font-semibold rounded-lg hover:bg-[#e5c584] transition-all shadow-lg">
                Conversar com a IA agora
              </button>
              <a href="#como-funciona" className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/30 hover:bg-white/20 transition-all">
                Ver como funciona
              </a>
            </div>
            <p className="text-xs text-white/50 mt-4">
              Ao conversar, você concorda com nossa política de privacidade — seus dados seguem a LGPD (Lei 13.709/2020).
            </p>
          </div>
        </div>
      </section>

      {/* DADOS REAIS */}
      <section className="py-20 bg-[#F7F5F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#4F7A5A] mb-3">Dado real, não promessa</p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">A IA já está mudando a saúde no Brasil</h2>
            <p className="text-lg text-[#22262B]/70">Não é tendência distante — é o que já está acontecendo nas clínicas brasileiras agora.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { n: '18%', d: 'dos estabelecimentos de saúde do Brasil já usam IA — sobe pra 31% nas unidades com mais de 50 leitos', f: 'Cetic.br / TIC Saúde' },
              { n: '47%', d: 'dos profissionais de saúde dizem passar mais tempo em tarefa administrativa e menos tempo com o paciente do que há 5 anos', f: 'Philips Future Health Index 2025' },
              { n: '32%', d: 'das instituições que já usam IA aplicam a tecnologia pra aumentar a eficiência dos tratamentos', f: 'Cetic.br / TIC Saúde' },
              { n: 'até 20%', d: 'de redução nas faltas em clínica que automatizou lembrete de consulta via WhatsApp', f: 'Caso relatado à Medscape' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-black/5 shadow-sm">
                <div className="text-3xl font-bold text-[#4F7A5A] mb-3">{s.n}</div>
                <p className="text-sm text-[#22262B]/80 leading-relaxed mb-3 min-h-[72px]">{s.d}</p>
                <p className="text-xs text-[#22262B]/50">Fonte: {s.f}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEGMENTOS — 4 personas */}
      <section id="segmentos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#4F7A5A] mb-3">Sua área</p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Um agente treinado pra cada especialidade</h2>
            <p className="text-lg text-[#22262B]/70">Clique na sua área e já converse com a IA certa pro seu contexto.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SEGMENTOS.map((seg) => (
              <button
                key={seg.id}
                onClick={() => openChatWithSegment(seg.nome)}
                className="group text-left rounded-2xl overflow-hidden border border-black/5 shadow-sm hover:shadow-xl transition-all bg-white"
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={seg.foto} alt={seg.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-4 text-white">
                    <p className="text-xs opacity-80">Assistente</p>
                    <p className="font-semibold text-lg">{seg.persona}</p>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-1">{seg.nome}</h3>
                  <p className="text-sm text-[#22262B]/60 mb-3">{seg.desc}</p>
                  <span className="text-sm font-medium text-[#4F7A5A] group-hover:underline">Conversar agora →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-20 bg-[#F7F5F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#4F7A5A] mb-3">Como funciona</p>
            <h2 className="text-3xl lg:text-4xl font-bold">Do primeiro "oi" até a consulta confirmada</h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {[
              { n: 1, t: 'Paciente conversa no site ou no WhatsApp', d: 'A qualquer hora — noite, fim de semana, feriado — a IA já responde e entende a área de interesse.', ex: '💬 "Preciso agendar uma avaliação"' },
              { n: 2, t: 'A IA qualifica e passa pra especialista certa', d: 'Se veio pelo site, a conversa segue direto no WhatsApp com a Lari, Ana, Beatriz ou Duda — sem o paciente repetir nada.', ex: '🤖 "Te chamando aqui no WhatsApp, já com o que você me contou!"' },
              { n: 3, t: 'Confirmação automática reduz falta', d: '1 dia antes da consulta, lembrete automático — sem depender de alguém lembrar de mandar.', ex: '✅ "Sua consulta é amanhã às 9h. Confirma presença?"' },
            ].map((s) => (
              <div key={s.n}>
                <div className="bg-[#22262B] text-white w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold mb-5">{s.n}</div>
                <h3 className="text-xl font-bold mb-3">{s.t}</h3>
                <p className="text-[#22262B]/70 mb-4">{s.d}</p>
                <div className="bg-white rounded-lg p-4 text-sm border border-black/5">{s.ex}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOCO FULL-BLEED — vídeo odonto */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop playsInline poster="/clinicas/img/odonto-poster.jpg" className="w-full h-full object-cover">
            <source src="/clinicas/video/odonto.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[#141712]/70" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center text-white">
          <p className="text-4xl mb-4 text-[#D9B36A]">"</p>
          <p className="text-2xl lg:text-3xl font-medium leading-snug mb-4">
            Enquanto a mensagem espera na fila do WhatsApp, o paciente já está agendando na clínica ao lado.
          </p>
          <p className="text-white/70">Resposta rápida não é diferencial — é o mínimo que decide se o paciente fica ou vai embora.</p>
        </div>
      </section>

      {/* NOTÍCIAS */}
      <section id="noticias" className="py-20 bg-[#F7F5F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#4F7A5A] mb-3">Notícias · IA na Saúde</p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">O que está acontecendo no setor</h2>
            <p className="text-lg text-[#22262B]/70">Curadoria com fonte e link — sempre dando crédito.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                tag: 'Atendimento', fonte: 'Medscape', data: '21/05/2026',
                titulo: 'Como a IA está transformando o atendimento em clínicas e consultórios',
                resumo: 'Reportagem traz o relato de uma ginecologista de Curitiba que reduziu de três pra duas secretárias após adotar IA de atendimento — sem receber reclamação de paciente, e com a maioria sequer percebendo que fala com IA no início da conversa.',
                url: 'https://portugues.medscape.com/viewarticle/ia-est%C3%A1-transformando-atendimento-cl%C3%ADnicas-e-2026a1000gil',
              },
              {
                tag: 'Pesquisa', fonte: 'Cetic.br / CGI.br', data: '12/05/2026',
                titulo: 'Uso de Inteligência Artificial avança na saúde brasileira',
                resumo: 'A 12ª edição da pesquisa TIC Saúde mostra crescimento da adoção de IA nos estabelecimentos de saúde do país, ainda concentrada em tarefas operacionais como organização de processos clínicos e administrativos.',
                url: 'https://cetic.br/pt/noticia/uso-de-inteligencia-artificial-avanca-na-saude-brasileira-mas-ainda-se-concentra-em-tarefas-operacionais/',
              },
              {
                tag: 'Regulação', fonte: 'CFM', data: '27/02/2026',
                titulo: 'Resolução do CFM normatiza o uso da IA na medicina',
                resumo: 'Nova resolução do Conselho Federal de Medicina estabelece que o médico preserva sua autonomia profissional e não pode ser obrigado a seguir, de forma automática, recomendação gerada por sistema de IA.',
                url: 'https://sistemas.cfm.org.br/normas/arquivos/resolucoes/BR/2026/2454_2026.pdf',
              },
            ].map((n, i) => (
              <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" className="block bg-white rounded-2xl p-6 border border-black/5 shadow-sm hover:shadow-lg transition-all">
                <div className="flex items-center gap-2 text-xs text-[#22262B]/50 mb-3">
                  <span className="bg-[#4F7A5A]/10 text-[#4F7A5A] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide text-[10px]">{n.tag}</span>
                  <span>{n.fonte}</span><span>·</span><span>{n.data}</span>
                </div>
                <h3 className="font-bold text-lg mb-3 leading-snug">{n.titulo}</h3>
                <p className="text-sm text-[#22262B]/70 leading-relaxed mb-4">{n.resumo}</p>
                <span className="text-sm font-semibold text-[#4F7A5A]">Ler matéria completa →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* PROVA SOCIAL */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold">Clínicas que já usam</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { texto: 'Reduzimos as faltas nos procedimentos de forma clara. O retorno financeiro pagou a implementação rápido.', nome: 'Dra. Camila R.', area: 'Clínica de Estética' },
              { texto: 'Nossa secretária agora foca no atendimento presencial. O agente cuida do WhatsApp sem errar.', nome: 'Dr. Rafael M.', area: 'Clínica Odontológica' },
            ].map((t, i) => (
              <div key={i} className="bg-[#F7F5F2] rounded-2xl p-8 border border-black/5">
                <p className="text-[#22262B]/80 mb-5 text-lg leading-relaxed">"{t.texto}"</p>
                <p className="font-semibold">{t.nome}</p>
                <p className="text-sm text-[#22262B]/50">{t.area}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONFIANÇA */}
      <section className="py-20 bg-[#F7F5F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-xs font-semibold tracking-widest uppercase text-[#4F7A5A] mb-3">Como a IA trabalha</p>
            <h2 className="text-3xl lg:text-4xl font-bold">Com responsabilidade, não com autonomia</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { t: 'A IA nunca decide sozinha', d: 'Agendamento e triagem, sim. Diagnóstico, indicação de procedimento ou decisão clínica são sempre do profissional responsável.' },
              { t: 'Nunca afirma o que não sabe', d: 'Se a pergunta exige avaliação clínica, a IA encaminha pra equipe — nunca chuta resposta de saúde.' },
              { t: 'Dados protegidos, sempre', d: 'Conforme a LGPD (Lei 13.709/2020). Dados sensíveis de paciente não são usados pra treinar modelo nem compartilhados com terceiros.' },
              { t: 'Transparência com o paciente', d: 'A IA se identifica como assistente. Ninguém finge ser humano.' },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-black/5">
                <h3 className="font-bold text-lg mb-2">{c.t}</h3>
                <p className="text-[#22262B]/70 text-sm leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video autoPlay muted loop playsInline poster="/clinicas/img/medico-poster.jpg" className="w-full h-full object-cover">
            <source src="/clinicas/video/medico.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[#141712]/70" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-bold mb-5">Pare de perder paciente por demora</h2>
          <p className="text-xl text-white/80 mb-8">Fala com a IA agora e vê como funciona pra sua especialidade.</p>
          <button onClick={() => setChatOpen(true)} className="inline-flex items-center justify-center px-8 py-4 bg-[#D9B36A] text-[#22262B] font-semibold rounded-lg hover:bg-[#e5c584] transition-all shadow-xl">
            Conversar com a IA
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#22262B] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <Image src="/clinicas/img/logo-orbi-color.png" alt="ORBI IA" width={140} height={32} className="h-8 w-auto mb-4 brightness-0 invert" />
              <p className="text-sm text-white/70">ORBI Plena — IA para clínicas de estética, odontologia, medicina e fisioterapia.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contato</h3>
              <p className="text-sm mb-2"><a href="https://wa.me/5566981320667" className="hover:text-[#D9B36A] transition-colors">WhatsApp: (66) 98132-0667</a></p>
              <p className="text-sm mb-2">Tel: (83) 9.8914-8253</p>
              <p className="text-sm"><a href="mailto:contato@agenteorbiia.com" className="hover:text-[#D9B36A] transition-colors">contato@agenteorbiia.com</a></p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Redes Sociais</h3>
              <div className="flex gap-3">
                {[
                  { href: 'https://www.instagram.com/agenciaorbi.ia', label: 'Instagram' },
                  { href: 'https://www.facebook.com/share/1HhQ7G9WZC/', label: 'Facebook' },
                  { href: 'https://www.linkedin.com/in/orbi-ia-869408186', label: 'LinkedIn' },
                  { href: 'https://tiktok.com/@orbi.ia', label: 'TikTok' },
                ].map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-[#4F7A5A]/30 transition-all border border-white/10 text-xs">
                    {s.label[0]}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-xs text-white/50">
            © 2026 ORBI IA — Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* WHATSAPP FLOAT */}
      <a href="https://wa.me/5566981320667" target="_blank" rel="noopener noreferrer" className="fixed bottom-7 right-7 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
        <svg viewBox="0 0 32 32" fill="white" width="28" height="28"><path d="M16 2C8.28 2 2 8.28 2 16c0 2.46.66 4.76 1.8 6.76L2 30l7.48-1.76A13.93 13.93 0 0 0 16 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.4a11.34 11.34 0 0 1-5.78-1.58l-.42-.24-4.44 1.04 1.06-4.32-.28-.44A11.36 11.36 0 0 1 4.6 16C4.6 9.7 9.7 4.6 16 4.6S27.4 9.7 27.4 16 22.3 27.4 16 27.4z"/></svg>
      </a>

      {/* CHAT WIDGET */}
      <button onClick={() => setChatOpen((v) => !v)} className="fixed bottom-7 right-24 z-50 w-14 h-14 bg-[#22262B] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </button>

      {chatOpen && (
        <div className="fixed bottom-24 right-4 sm:right-7 z-50 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[560px] bg-white rounded-2xl shadow-2xl border border-black/10 flex flex-col overflow-hidden">
          <div className="bg-[#22262B] text-white px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Assistente ORBI Plena</p>
              <p className="text-xs text-[#7BCB8E]">● Online agora</p>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white">✕</button>
          </div>
          <div className="px-4 py-2 bg-[#4F7A5A]/10 text-[10px] text-[#22262B]/60 text-center border-b border-black/5">
            💡 A IA analisa e agenda (decisão clínica é sempre do profissional) — seus dados seguem a LGPD
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 320 }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-[#4F7A5A]/10 text-[#22262B]' : 'bg-[#F7F5F2] text-[#22262B]'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-[#F7F5F2] rounded-xl px-4 py-3 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-[#22262B]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#22262B]/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#22262B]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            {whatsappLink && (
              <div className="flex justify-start">
                <a
                  href={whatsappLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] text-white rounded-xl px-4 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <svg viewBox="0 0 32 32" fill="white" width="18" height="18"><path d="M16 2C8.28 2 2 8.28 2 16c0 2.46.66 4.76 1.8 6.76L2 30l7.48-1.76A13.93 13.93 0 0 0 16 30c7.72 0 14-6.28 14-14S23.72 2 16 2z"/></svg>
                  Clique pra falar com a {whatsappLink.persona} no WhatsApp
                </a>
              </div>
            )}
            <div ref={msgsEndRef} />
          </div>
          {!segmentoEscolhido && (
            <div className="px-3 pb-3 grid grid-cols-2 gap-2">
              {SEGMENTOS.map((seg) => (
                <button
                  key={seg.id}
                  onClick={() => escolherSegmento(seg.nome)}
                  className="text-xs bg-[#4F7A5A]/10 text-[#4F7A5A] rounded-lg px-3 py-2 font-medium hover:bg-[#4F7A5A]/20 transition-colors text-left"
                >
                  Meu segmento é {seg.nome}
                </button>
              ))}
            </div>
          )}
          <div className="p-3 border-t border-black/5 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Digite sua mensagem..."
              className="flex-1 bg-[#F7F5F2] rounded-lg px-3 py-2 text-sm outline-none border border-black/5 focus:border-[#4F7A5A]/40"
            />
            <button onClick={() => handleSend()} disabled={sending} className="bg-[#4F7A5A] text-white rounded-lg w-10 h-10 flex items-center justify-center disabled:opacity-50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
