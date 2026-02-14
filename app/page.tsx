import Image from "next/image";
import ContactForm from "../components/ContactForm";
import WhatsAppFloat from "../components/WhatsAppFloat";

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
    >
      {children}
    </a>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* HEADER (faixa branca) */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="relative h-[52px] w-[210px]">
              <Image
                src="/logo-orbi.png"
                alt="ORBI IA"
                fill
                priority
                className="object-contain"
              />
            </div>

            <div className="hidden md:block">
              <div className="text-sm text-neutral-800">
                Inteligência de Operações Autônomas
              </div>
            </div>
          </div>

          {/* Ícones sociais (links corretos) */}
          <div className="flex items-center gap-2">
            <SocialIcon
              href="https://www.instagram.com/agenciaorbi.ia"
              label="Instagram"
            >
              {/* Instagram SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M17.5 6.5h.01"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </SocialIcon>

            <SocialIcon
              href="https://www.linkedin.com/in/orbi-ia-869408186?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
              label="LinkedIn"
            >
              {/* LinkedIn SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 4h4v16H4V4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M10 10h4v2c.6-1.2 2-2 3.7-2 3 0 4.3 2 4.3 5v5h-4v-5c0-1.6-.6-2.6-2-2.6-1.1 0-2 .7-2 2.2V20h-4V10Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M6 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </SocialIcon>

            <SocialIcon
              href="https://www.threads.com/@agenciaorbi.ia"
              label="Threads"
            >
              {/* Threads (símbolo simples) */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 21c-4.2 0-7.5-3-7.5-7.6C4.5 8 7.6 4.5 12 4.5c3.8 0 6.5 2.2 7.2 5.6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M19.2 10.2c.2 3.8-1.6 6.8-5.7 6.8-2.3 0-3.8-1.2-3.8-3 0-1.9 1.6-3 4.2-3 1.8 0 3.6.5 5.3 1.7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </SocialIcon>

            <SocialIcon
              href="https://www.facebook.com/share/1HhQ7G9WZC/"
              label="Facebook"
            >
              {/* Facebook SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v3H8v3h2v7h3v-7h2.3l.7-3H13V9c0-.6.4-1 1-1Z"
                  fill="currentColor"
                />
              </svg>
            </SocialIcon>

            <SocialIcon href="https://tiktok.com/@orbi.ia" label="TikTok">
              {/* TikTok (ícone simplificado) */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14 4v10.2a3.6 3.6 0 1 1-3-3.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M14 4c1 2.6 3 4.2 6 4.4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </SocialIcon>
          </div>
        </div>
      </header>

      {/* HERO (faixa escura) */}
      <section className="bg-[#0f172a] text-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight md:text-6xl">
            Arquitetura decisória para operações que não podem errar.
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-white/75">
            Estruturamos previsibilidade antes da automação. Agentes executam. A
            arquitetura decide.
          </p>

          <a
            href="#contato"
            className="mt-10 inline-flex rounded-md bg-[#22c55e] px-6 py-3 text-sm font-semibold text-white hover:opacity-95"
          >
            Solicitar diagnóstico estrutural
          </a>
        </div>
      </section>

      {/* BLOCO 1 */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-semibold leading-snug md:text-4xl">
            Tecnologia sem arquitetura gera complexidade.
            <br />
            Arquitetura antes da automação gera controle.
          </h2>

          <p className="mt-8 max-w-3xl text-neutral-600">
            Implementar ferramentas antes de organizar decisão aumenta ruído.
            Estrutura decisória é o que sustenta previsibilidade real.
          </p>

          <div className="mt-16">
            <h3 className="text-2xl font-semibold">Estrutura antes da automação</h3>

            <div className="mt-10 grid gap-10 md:grid-cols-3">
              <div>
                <div className="text-sm font-semibold text-neutral-900">
                  Diagnóstico Estrutural
                </div>
                <div className="mt-2 text-neutral-600">
                  Mapeamento de variáveis críticas e instabilidades.
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-neutral-900">
                  Modelagem Decisória
                </div>
                <div className="mt-2 text-neutral-600">
                  Organização de regras e critérios estratégicos.
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-neutral-900">
                  Implementação Orientada
                </div>
                <div className="mt-2 text-neutral-600">
                  Automação aplicada sob arquitetura definida.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BLOCO 2 - Framework */}
      <section className="bg-[#22c55e]">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <h2 className="text-5xl font-semibold">Desenvolvedor do Framework P³-IA</h2>

          <div className="mt-10 grid gap-10 md:grid-cols-3">
            <div>
              <div className="text-3xl font-semibold">P1 — Previsão</div>
              <div className="mt-2 text-neutral-600 text-white">
                Antecipação e redução de incerteza operacional.
              </div>
            </div>

            <div>
              <div className="text-3xl font-semibold">P2 — Processos</div>
              <div className="mt-2 text-neutral-600 text-white">
                Estruturação de fluxos antes da execução.
              </div>
            </div>

            <div>
              <div className="text-3xl font-semibold">P3 — Performance</div>
              <div className="mt-2 text-neutral-600 text-white">
                Métricas orientadas à margem e previsibilidade.
              </div>
            </div>
          </div>

          <div className="mt-3 text-1xl text-neutral-1000 text-black">
            Aplicação sob contrato e confidencialidade.
          </div>
        </div>
      </section>

      {/* BLOCO 3 */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-4xl font-semibold">
            Agentes que executam. Arquitetura que decide.
          </h2>

          <ul className="mt-8 grid gap-3 text-neutral-700">
            <li>• Captura estruturada de dados</li>
            <li>• Monitoramento contínuo</li>
            <li>• Automação orientada por regra</li>
            <li>• Aprendizado com histórico operacional</li>
          </ul>
        </div>
      </section>

      {/* BLOCO 4 (faixa escura) */}
      <section className="bg-[#0f172a] text-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-4xl font-semibold">
            Para operações que exigem previsibilidade real.
          </h2>

          <ul className="mt-8 grid gap-3 text-white/75">
            <li>• Empresas com sistemas desconectados</li>
            <li>• Operações com alto volume e baixa previsibilidade</li>
            <li>• Gestores que precisam decidir com dados confiáveis</li>
          </ul>
        </div>
      </section>

      {/* FORMULÁRIO */}
      <section id="contato" className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-semibold">Avaliar aderência estratégica</h2>
          <ContactForm />
        </div>
      </section>

      {/* PROJETOS ANTERIORES (depois do formulário) */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="text-1xl font-semibold">
            Projetos anteriores conduzidos pelo fundador
          </h2>

          {/* Logos dos clientes */}
          <div className="mt-10 flex justify-center">
            <div className="relative h-[50px] w-full max-w-4xl">
              <Image
                src="/logo%20clientes.png"
                alt="Logos de clientes"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* Mantém a frase do MBA */}
          <div className="mt-10 text-2xl text-neutral-600">
            MBA em Inteligência Artificial e Data Science – Estácio
          </div>

          {/* Imagem curso */}
          <div className="mt-6 flex justify-center">
            <div className="relative h-[90px] w-full max-w-4xl">
              <Image
                src="/curso.png"
                alt="Cursos e certificações"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAIXA VERDE ESTREITA COM roda-pe-orbi (centralizada) */}
      <section className="bg-[#22c55e]">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <div className="flex justify-center">
            <div className="relative h-[120px] w-full max-w-[520px]">
              <Image
                src="/roda-pe-orbi.png"
                alt="Rodapé ORBI IA"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* RODAPÉ FINAL (azul, estreito) */}
      <footer className="bg-[#0b1220] py-6 text-center text-sm text-white/80">
        © 2026 ORBI IA — Agentes Inteligentes com Arquitetura de Estados. Transformando processos com tecnologia e criatividade.
         — Todos os direitos reservados.
      </footer>

      {/* WhatsApp flutuante */}
      <WhatsAppFloat />
    </main>
  );
}
