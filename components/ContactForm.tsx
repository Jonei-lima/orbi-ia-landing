"use client"

import { useState } from "react"

export default function ContactForm() {
  // Timestamp de quando a página carregou para evitar bots
  const [loadedAt] = useState(() => Date.now());

  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    cargo: "",
    desafio: "",
    contato: "",
  })

  const [loading, setLoading] = useState(false)

  // Tipagem correta para evitar erros bobos no VS Code
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validação "pulo do gato": Se enviou em menos de 3 segundos, provavelmente é bot
    const timeSpent = (Date.now() - loadedAt) / 1000;
    if (timeSpent < 3) {
      console.warn("Envio muito rápido detectado.");
      // Não bloqueamos aqui para não frustrar o usuário, mas enviamos pro log
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Enviamos o formData + o tempo de carregamento para a API validar
        body: JSON.stringify({ ...formData, timeSpent }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Erro no servidor")
      }

      alert("Obrigado! Em breve retornaremos.")

      setFormData({
        nome: "",
        empresa: "",
        cargo: "",
        desafio: "",
        contato: "",
      })

    } catch (error: any) {
      console.error("Erro ORBI IA:", error)
      alert(error.message || "Erro ao enviar. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* O RESTO DO SEU JSX CONTINUA IGUAL */}
      <div className="grid md:grid-cols-3 gap-6">
        <input name="nome" value={formData.nome} onChange={handleChange} placeholder="Nome" required className="w-full border-b border-neutral-300 py-3 focus:outline-none focus:border-neutral-900 transition" />
        <input name="empresa" value={formData.empresa} onChange={handleChange} placeholder="Empresa" required className="w-full border-b border-neutral-300 py-3 focus:outline-none focus:border-neutral-900 transition" />
        <input name="cargo" value={formData.cargo} onChange={handleChange} placeholder="Cargo" required className="w-full border-b border-neutral-300 py-3 focus:outline-none focus:border-neutral-900 transition" />
      </div>

      <textarea name="desafio" value={formData.desafio} onChange={handleChange} placeholder="Principal desafio" required className="w-full border-b border-neutral-300 py-3 focus:outline-none focus:border-neutral-900 transition resize-none" />

      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <input name="contato" value={formData.contato} onChange={handleChange} placeholder="WhatsApp ou e-mail" required className="flex-1 border-b border-neutral-300 py-3 focus:outline-none focus:border-neutral-900 transition" />
        <button type="submit" disabled={loading} className="bg-[#3FAE69] text-white px-8 py-3 rounded-md hover:opacity-90 transition whitespace-nowrap">
          {loading ? "Enviando..." : "Solicitar análise"}
        </button>
      </div>
    </form>
  )
}