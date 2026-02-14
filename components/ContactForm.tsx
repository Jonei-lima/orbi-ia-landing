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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        alert("Erro temporário. Tente novamente.");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setStatus("success");
      } else {
        alert("Erro no envio.");
      }
    } catch (err) {
      alert("Erro temporário. Tente novamente.");
    }
  };

  if (status === "success") {
    return (
      <div style={{ padding: "40px", textAlign: "left" }}>
        <h3>Recebemos sua mensagem.</h3>
        <p>Em breve entraremos em contato.</p>
      </div>
    );
  }

  const inputStyle = {
    width: "100%",
    padding: "12px",
    border: "1px solid #333",
    outline: "none",
    fontSize: "14px",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: "18px",
        maxWidth: "700px",
        margin: "0",
        textAlign: "left",
      }}
    >
      <div>
        <label>Nome</label>
        <input
          name="nome"
          onChange={handleChange}
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label>Empresa</label>
        <input
          name="empresa"
          onChange={handleChange}
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label>Cargo</label>
        <select
          name="cargo"
          value={formData.cargo}
          onChange={handleChange}
          required
          style={inputStyle}
        >
          <option value="">Selecione o cargo</option>
          <option>Sócio proprietário</option>
          <option>Founder</option>
          <option>CEO</option>
          <option>Diretor</option>
          <option>Gerente</option>
          <option>Gestor</option>
          <option>Analista de TI</option>
          <option>Colaborador</option>
        </select>
      </div>

      <div>
        <label>Desafio</label>
        <textarea
          name="desafio"
          onChange={handleChange}
          required
          rows={4}
          style={inputStyle}
        />
      </div>

      <div>
        <label>Email</label>
        <input
          name="email"
          type="email"
          onChange={handleChange}
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label>Telefone</label>
        <input
          name="telefone"
          onChange={handleChange}
          required
          style={inputStyle}
        />
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
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

      <button
        type="submit"
        style={{
          padding: "14px",
          backgroundColor: "#1f7a4c",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: "15px",
        }}
      >
        Enviar
      </button>
    </form>
  );
}
