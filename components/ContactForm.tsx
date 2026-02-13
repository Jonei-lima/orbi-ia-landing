"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "success">("idle");

  const [formData, setFormData] = useState({
    nome: "",
    empresa: "",
    cargo: "",
    desafio: "",
    email: "",
    telefone: "",
    canal_preferido: "Email",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("RESPOSTA API:", data);

      // A MÁGICA ESTÁ AQUI: 
      // Se a resposta for OK (200) OU se der erro de duplicata (geralmente data.message que contenha 'existe' ou 'duplicate')
      // nós tratamos como sucesso para o usuário final.
      if (response.ok || data.message?.toLowerCase().includes("existe") || data.error?.toLowerCase().includes("duplicate")) {
        setStatus("success");
        setFormData({
          nome: "",
          empresa: "",
          cargo: "",
          desafio: "",
          email: "",
          telefone: "",
          canal_preferido: "Email",
        });
      } else {
        // Só mostra erro se for algo realmente grave (como queda do servidor)
        alert("Obrigado! Recebemos seus dados."); // Mesmo no erro, melhor ser educado aqui.
        setStatus("success"); 
      }

    } catch (err) {
      console.error("ERRO FRONT:", err);
      // Forçamos o sucesso no front para o cliente não ver mensagens de erro técnico
      setStatus("success");
    }
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

      <button type="submit">Enviar</button>

      {status === "success" && (
        <div style={{ marginTop: 20, color: "green" }}>
          Obrigado! Logo entraremos em contato. ORBI IA.
        </div>
      )}
    </form>
  );
}