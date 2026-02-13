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
    canal_preferido: ""
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

    const response = await fetch("/api/lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Erro ao enviar.");
      return;
    }

    alert("Enviado com sucesso!");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="nome"
        placeholder="Nome"
        value={formData.nome}
        onChange={handleChange}
        required
      />

      <input
        name="empresa"
        placeholder="Empresa"
        value={formData.empresa}
        onChange={handleChange}
        required
      />

      <input
        name="cargo"
        placeholder="Cargo"
        value={formData.cargo}
        onChange={handleChange}
        required
      />

      <textarea
        name="desafio"
        placeholder="Desafio"
        value={formData.desafio}
        onChange={handleChange}
        required
      />

      <input
        name="email"
        placeholder="Email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <input
        name="telefone"
        placeholder="Telefone"
        value={formData.telefone}
        onChange={handleChange}
        required
      />

      <input
        name="canal_preferido"
        placeholder="Canal"
        value={formData.canal_preferido}
        onChange={handleChange}
        required
      />

      <button type="submit">Enviar</button>
    </form>
  );
}
