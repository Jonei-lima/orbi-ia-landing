"use client";

import { useState } from "react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    cargo: "",
    desafio: "",
    email: "",
    telefone: "",
    canal_preferido: "Email"
  });

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setStatus("error");
        return;
      }

      setStatus("success");

      // limpa formulário
      setFormData({
        nome: "",
        empresa: "",
        cargo: "",
        desafio: "",
        email: "",
        telefone: "",
        canal_preferido: "Email"
      });

    } catch (err) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>

      <input name="nome" placeholder="Nome" value={formData.nome} onChange={handleChange} required />
      <input name="empresa" placeholder="Empresa" value={formData.empresa} onChange={handleChange} required />
      <input name="cargo" placeholder="Cargo" value={formData.cargo} onChange={handleChange} required />
      <textarea name="desafio" placeholder="Desafio" value={formData.desafio} onChange={handleChange} required />
      <input name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
      <input name="telefone" placeholder="Telefone" value={formData.telefone} onChange={handleChange} required />

      <div>
        <label>
          <input
            type="radio"
            name="canal_preferido"
            value="Email"
            checked={formData.canal_preferido === "Email"}
            onChange={handleChange}
          />
          Email
        </label>

        <label>
          <input
            type="radio"
            name="canal_preferido"
            value="WhatsApp"
            checked={formData.canal_preferido === "WhatsApp"}
            onChange={handleChange}
          />
          WhatsApp
        </label>

        <label>
          <input
            type="radio"
            name="canal_preferido"
            value="Ligacao"
            checked={formData.canal_preferido === "Ligacao"}
            onChange={handleChange}
          />
          Ligação
        </label>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar"}
      </button>

      {/* ✅ Feedback elegante */}
      {status === "success" && (
        <div style={{ marginTop: 12, color: "green" }}>
          Obrigado! Recebemos sua mensagem e entraremos em contato em breve.
        </div>
      )}

      {status === "error" && (
        <div style={{ marginTop: 12, color: "red" }}>
          Ocorreu um erro ao enviar. Tente novamente.
        </div>
      )}

    </form>
  );
}
