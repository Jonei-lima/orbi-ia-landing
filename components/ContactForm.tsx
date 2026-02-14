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
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>Recebemos sua mensagem.</h3>
        <p>Em breve entraremos em contato.</p>
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "16px",
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        <input
          name="nome"
          placeholder="Nome"
          onChange={handleChange}
          required
        />

        <input
          name="empresa"
          placeholder="Empresa"
          onChange={handleChange}
          required
        />

        <select
          name="cargo"
          value={formData.cargo}
          onChange={handleChange}
          required
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

        <textarea
          name="desafio"
          placeholder="Desafio"
          onChange={handleChange}
          required
        />

        <input
          name="email"
          placeholder="Email"
          type="email"
          onChange={handleChange}
          required
        />

        <input
          name="telefone"
          placeholder="Telefone"
          onChange={handleChange}
          required
        />

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
            padding: "12px",
            backgroundColor: "#1f7a4c",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Enviar
        </button>
      </form>

      {/* 🔽 SEÇÃO ADICIONADA */}
      <section
        style={{
          marginTop: "80px",
          maxWidth: "800px",
          marginLeft: "auto",
          marginRight: "auto",
          textAlign: "left",
        }}
      >
        <div style={{ marginBottom: "6px" }}>
          <span
            style={{
              fontSize: "13px",
              color: "#777",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Desenvolvedor do
          </span>
        </div>

        <h2 style={{ marginBottom: "24px" }}>
          Framework P³-IA
        </h2>

        <div style={{ display: "grid", gap: "18px" }}>
          <div>
            <strong>P1 — Previsão</strong>
            <p style={{ margin: "6px 0 0 0" }}>
              Antecipação e redução de incerteza operacional.
            </p>
          </div>

          <div>
            <strong>P2 — Processos</strong>
            <p style={{ margin: "6px 0 0 0" }}>
              Estruturação de fluxos antes da execução.
            </p>
          </div>

          <div>
            <strong>P3 — Performance</strong>
            <p style={{ margin: "6px 0 0 0" }}>
              Métricas orientadas à margem e previsibilidade.
            </p>
          </div>
        </div>

        <p
          style={{
            marginTop: "28px",
            fontSize: "14px",
            color: "#555",
          }}
        >
          Aplicação sob contrato e confidencialidade.
        </p>
      </section>
    </>
  );
}
