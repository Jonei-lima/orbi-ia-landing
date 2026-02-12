"use client"

import { useState } from "react"

type FormData = {
  nome: string
  empresa: string
  cargo: string
  desafio: string
  email: string
  telefone: string
  canal_preferido: "email" | "whatsapp" | "ligacao"
  hp: string
}

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    empresa: "",
    cargo: "",
    desafio: "",
    email: "",
    telefone: "",
    canal_preferido: "email",
    hp: "",
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erro no servidor")
      }

      alert("Obrigado! Em breve retornaremos.")

      setFormData({
        nome: "",
        empresa: "",
        cargo: "",
        desafio: "",
        email: "",
        telefone: "",
        canal_preferido: "email",
        hp: "",
      })
    } catch (error: any) {
      alert(error.message || "Erro ao enviar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* Honeypot */}
      <input
        type="text"
        name="hp"
        value={formData.hp}
        onChange={handleChange}
        style={{ display: "none" }}
      />

      <div className="grid md:grid-cols-3 gap-6">
        <input
          name="nome"
          value={formData.nome}
          onChange={handleChange}
          placeholder="Nome"
          required
          className="w-full border-b border-neutral-300 py-3 focus:outline-none focus:border-neutral-900"
        />

        <input
          name="empresa"
          value={formData.empresa}
          onChange={handleChange}
          placeholder="Empresa"
          required
          className="w-full border-b border-neutral-300 py-3 focus:outline-none focus:border-neutral-900"
        />

        <input
          name="cargo"
          value={formData.cargo}
          onChange={handleChange}
          placeholder="Cargo"
          required
          className="w-full border-b border-neutral-300 py-3 focus:outline-none focus:border-neutral-900"
        />
      </div>

      <textarea
        name="desafio"
        value={formData.desafio}
        onChange={handleChange}
        placeholder="Principal desafio"
        required
        className="w-full border-b border-neutral-300 py-3 focus:outline-none focus:border-neutral-900 resize-none"
      />

      <div className="grid md:grid-cols-2 gap-6">
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="E-mail"
          required
          className="w-full border-b border-neutral-300 py-3 focus:outline-none focus:border-neutral-900"
        />

        <input
          name="telefone"
          value={formData.telefone}
          onChange={handleChange}
          placeholder="WhatsApp (opcional)"
          className="w-full border-b border-neutral-300 py-3 focus:outline-none focus:border-neutral-900"
        />
      </div>

      <select
        name="canal_preferido"
        value={formData.canal_preferido}
        onChange={handleChange}
        className="w-full border-b border-neutral-300 py-3 focus:outline-none focus:border-neutral-900"
      >
        <option value="email">Prefiro contato por E-mail</option>
        <option value="whatsapp">Prefiro contato por WhatsApp</option>
        <option value="ligacao">Prefiro ligação</option>
      </select>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#3FAE69] text-white px-8 py-3 rounded-md hover:opacity-90 transition"
        >
          {loading ? "Enviando..." : "Solicitar análise"}
        </button>
      </div>

    </form>
  )
}
