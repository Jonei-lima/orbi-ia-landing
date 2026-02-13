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



if (!data.success) {

alert("Erro ao enviar. Tente novamente.");

return;

}



// sucesso

setStatus("success");



// limpa formulário

setFormData({

nome: "",

empresa: "",

cargo: "",

desafio: "",

email: "",

telefone: "",

canal_preferido: "Email",

});



} catch (err) {

console.error("ERRO FRONT:", err);

alert("Erro no envio.");

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

Obrigado! Entraremos em contato em breve.

</div>

)}

</form>

);

}