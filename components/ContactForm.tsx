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

    console.log("📤 ENVIANDO:", formData);

    const response = await fetch("/api/lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    console.log("📩 RESPOSTA:", data);

    if (!response.ok) {
      alert(data.error || "Erro ao enviar.");
      return;
    }

    alert("Enviado com sucesso!");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="nome" placeholder="Nome" onChange={handleChange} required />
      <input name="empresa" placeholder="Empresa" onChange={handleChange} required />
      <input name="cargo" placeholder="Cargo" onChange={handleChange} required />
      <textarea name="desafio" placeholder="Desafio" onChange={handleChange} required />
      <input name="email" placeholder="Email" onChange={handleChange} required />
      <input name="telefone" placeholder="Telefone" onChange={handleChange} required />

      <div>
        <label>
          <input
            type="radio"
            name="canal_preferido"
            value="Email"
            onChange={handleChange}
            checked={formData.canal_preferido === "Email"}
          />
          Email
        </label>

        <label>
          <input
            type="radio"
            name="canal_preferido"
            value="WhatsApp"
            onChange={handleChange}
          />
          WhatsApp
        </label>

        <label>
          <input
            type="radio"
            name="canal_preferido"
            value="Ligacao"
            onChange={handleChange}
          />
          Ligação
        </label>
      </div>

      <button type="submit">Enviar</button>
    </form>
  );
}
