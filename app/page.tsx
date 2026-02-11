import Image from "next/image"
import WhatsAppFloat from "../components/WhatsAppFloat"
import ContactForm from "../components/ContactForm"
import {
  FaInstagram,
  FaLinkedinIn,
  FaFacebookF
} from "react-icons/fa"
import {
  FaThreads,
  FaTiktok
} from "react-icons/fa6"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f7f6] text-neutral-900">

      {/* HEADER */}
      <header className="max-w-6xl mx-auto px-8 py-8 flex justify-between items-center">
        <div className="flex flex-col">
          <Image
            src="/logo-orbi.png"
            alt="ORBI IA"
            width={240}
            height={70}
            priority
          />
          <span className="mt-2 text-sm text-neutral-500 tracking-wide">
            Inteligência de Operações Autônomas
          </span>
        </div>

        <div className="flex gap-5 text-neutral-500 text-lg">
          <a href="https://instagram.com/agenciaorbi.ia/" target="_blank">
            <FaInstagram />
          </a>
          <a href="https://www.linkedin.com/in/orbi-ia-869408186" target="_blank">
            <FaLinkedinIn />
          </a>
          <a href="https://www.facebook.com/share/1HhQ7G9WZC/" target="_blank">
            <FaFacebookF />
          </a>
          <a href="https://www.threads.com/@agenciaorbi.ia" target="_blank">
            <FaThreads />
          </a>
          <a href="https://tiktok.com/@orbi.ia" target="_blank">
            <FaTiktok />
          </a>
        </div>
      </header>


      {/* HERO */}
      <section className="bg-[#1F2933] text-white">
        <div className="max-w-6xl mx-auto px-8 py-32 space-y-10">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-5xl md:text-6xl font-semibold leading-[1.05] tracking-tight">
              Arquitetura decisória para operações que não podem errar.
            </h1>
            <p className="text-xl text-neutral-300 leading-relaxed">
              A ORBI IA estrutura previsibilidade antes da automação.
              Criamos arquitetura estratégica que sustenta agentes de IA,
              reduz risco operacional e orienta decisão sob método proprietário.
            </p>
          </div>

          <a
            href="#contato"
            className="bg-[#3FAE69] text-white px-6 py-3 rounded-md font-medium hover:opacity-90 transition"
          >
            Solicitar diagnóstico estrutural
          </a>
        </div>
      </section>


      {/* TESE */}
      <section className="bg-white border-y border-neutral-200">
        <div className="max-w-6xl mx-auto px-8 py-24 space-y-10">
          <h2 className="text-3xl font-semibold tracking-tight max-w-3xl">
            Tecnologia sem arquitetura gera complexidade.
            Arquitetura antes da automação gera controle.
          </h2>
          <p className="text-lg text-neutral-600 max-w-3xl leading-relaxed">
            Implementar ferramentas antes de organizar decisão aumenta ruído.
            Estrutura decisória é o que sustenta previsibilidade real.
          </p>
        </div>
      </section>


      {/* ARQUITETURA */}
      <section className="bg-[#f5f7f6]">
        <div className="max-w-6xl mx-auto px-8 py-24 space-y-16">
          <h2 className="text-3xl font-semibold tracking-tight">
            Estrutura antes da automação
          </h2>

          <div className="grid md:grid-cols-3 gap-12 text-neutral-700">
            <div>
              <h3 className="font-semibold text-neutral-900">
                Diagnóstico Estrutural
              </h3>
              <p>Mapeamento de variáveis críticas e instabilidades.</p>
            </div>

            <div>
              <h3 className="font-semibold text-neutral-900">
                Modelagem Decisória
              </h3>
              <p>Organização de regras e critérios estratégicos.</p>
            </div>

            <div>
              <h3 className="font-semibold text-neutral-900">
                Implementação Orientada
              </h3>
              <p>Automação aplicada sob arquitetura definida.</p>
            </div>
          </div>
        </div>
      </section>


      {/* FRAMEWORK P3-IA */}
      <section className="bg-white border-y border-neutral-200">
        <div className="max-w-6xl mx-auto px-8 py-24 space-y-16">
          <h2 className="text-3xl font-semibold tracking-tight">
            Framework P³-IA
          </h2>

          <div className="grid md:grid-cols-3 gap-12 text-neutral-700">
            <div>
              <h3 className="text-xl font-semibold">P¹ — Previsão</h3>
              <p>Antecipação e redução de incerteza operacional.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">P² — Processos</h3>
              <p>Estruturação de fluxos antes da execução.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">P³ — Performance</h3>
              <p>Métricas orientadas à margem e previsibilidade.</p>
            </div>
          </div>

          <p className="text-neutral-500 max-w-3xl">
            Aplicação sob contrato e confidencialidade.
          </p>
        </div>
      </section>


      {/* AGENTES */}
      <section className="bg-[#f5f7f6]">
        <div className="max-w-6xl mx-auto px-8 py-24 space-y-10">
          <h2 className="text-3xl font-semibold tracking-tight">
            Agentes que executam. Arquitetura que decide.
          </h2>
          <ul className="space-y-3 text-neutral-700">
            <li>• Captura estruturada de dados</li>
            <li>• Monitoramento contínuo</li>
            <li>• Automação orientada por regra</li>
            <li>• Aprendizado com histórico operacional</li>
          </ul>
        </div>
      </section>


      {/* PERFIL IDEAL */}
      <section className="bg-[#1F2933] text-white">
        <div className="max-w-6xl mx-auto px-8 py-24 space-y-10">
          <h2 className="text-3xl font-semibold tracking-tight">
            Para operações que exigem previsibilidade real.
          </h2>
          <ul className="space-y-3 text-neutral-300">
            <li>• Empresas com sistemas desconectados</li>
            <li>• Operações com alto volume e baixa previsibilidade</li>
            <li>• Gestores que precisam decidir com dados confiáveis</li>
          </ul>
        </div>
      </section>


      {/* FORM */}
      <section id="contato" className="max-w-6xl mx-auto px-8 py-24 space-y-10">
        <h2 className="text-3xl font-semibold tracking-tight">
          Avaliar aderência estratégica
        </h2>
        <ContactForm />
      </section>


      {/* FAIXA VERDE */}
      <section className="bg-[#3FAE69] py-6 flex justify-center">
        <Image
          src="/roda-pe-orbi.png"
          alt="ORBI IA"
          width={200}
          height={50}
        />
      </section>


      {/* FAIXA AZUL FINAL */}
      <section className="bg-[#1F2933] py-4 text-center text-white text-sm opacity-70">
        2026 ORBI IA — Direitos reservados
      </section>

      <WhatsAppFloat />

    </main>
  )
}
