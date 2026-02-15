// @ts-nocheck
'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function ClinicasPage() {
  const [formData, setFormData] = useState({
    nome: '',
    empresa: '',
    cargo: '',
    telefone: '',
    email: '',
    desafio: '',
    canal_preferido: 'WhatsApp',
    origem: 'clinicas'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitStatus('success');
        setTimeout(() => {
          window.location.href = 'https://wa.me/5566981320667?text=Acabei%20de%20preencher%20o%20diagn%C3%B3stico.%20Quando%20podemos%20conversar%3F';
        }, 2000);
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Erro ao enviar:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header com Logo */}
      <header className="bg-[#3D4449] py-6 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start gap-2">
              <Image 
                src="/logo-orbi-white-cor.png" 
                alt="ORBI IA" 
                width={360} 
                height={80}
                className="h-20 w-auto"
              />
              <p className="text-[#7BCB8E] text-base font-medium">Inteligência de Operações Autônomas</p>
            </div>
            <a 
              href="#formulario"
              className="bg-[#7BCB8E] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#6BB87D] transition-all text-sm"
            >
              Solicitar diagnóstico
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-1 bg-[#7BCB8E]/10 text-[#3D4449] rounded-full text-sm font-medium mb-6 border border-[#7BCB8E]/20">
                Especialmente para Clínicas Médicas
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Sua clínica perde <span className="text-[#5B7FB5]">40% dos agendamentos</span> porque ninguém responde rápido
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Agente de IA que agenda consultas, confirma presença e reduz faltas no WhatsApp da sua clínica — <strong>24 horas por dia</strong>, sem contratar secretária extra.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="#formulario" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#7BCB8E] text-white font-semibold rounded-lg hover:bg-[#6BB87D] transition-all shadow-lg hover:shadow-xl"
                >
                  Solicitar diagnóstico gratuito
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
                
                <a 
                  href="#como-funciona" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#5B7FB5] font-semibold rounded-lg border-2 border-[#5B7FB5] hover:bg-blue-50 transition-all"
                >
                  Ver como funciona
                </a>
              </div>
              
              <div className="mt-8 flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#7BCB8E]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Implementação em 7 dias
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#7BCB8E]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Sem mensalidade de CRM
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b">
                  <div className="w-12 h-12 bg-[#7BCB8E]/10 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#7BCB8E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Agente ORBI IA</p>
                    <p className="text-sm text-[#7BCB8E]">● Online agora</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1 bg-gray-100 rounded-lg p-3 text-sm text-gray-700">
                      Olá! Gostaria de agendar uma consulta
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-end">
                    <div className="flex-1 bg-[#5B7FB5] text-white rounded-lg p-3 text-sm">
                      Ótimo! Qual sua preferência de dia e horário?
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="flex-1 bg-gray-100 rounded-lg p-3 text-sm text-gray-700">
                      Terça-feira pela manhã
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-end">
                    <div className="flex-1 bg-[#5B7FB5] text-white rounded-lg p-3 text-sm">
                      Perfeito! Confirmado para terça às 9h30 com Dr. Silva. Enviarei um lembrete 1 dia antes. ✓
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t text-center">
                  <p className="text-xs text-gray-500">
                    ⚡ Resposta em menos de 3 segundos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problema (Dor) */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Quanto dinheiro sua clínica está perdendo?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A maioria das clínicas não percebe, mas a demora no atendimento está custando caro
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-red-100">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                40% dos pacientes desistem
              </h3>
              <p className="text-gray-600">
                Quando a secretária demora mais de 5 minutos pra responder, o paciente já ligou pra outra clínica
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-sm border border-red-100">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                30% de faltas sem aviso
              </h3>
              <p className="text-gray-600">
                Horários vagos que poderiam estar gerando receita, perdidos porque ninguém confirmou presença
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-sm border border-red-100">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                4 horas/dia em WhatsApp
              </h3>
              <p className="text-gray-600">
                Sua secretária gasta metade do dia só respondendo "sim, temos horário" e agendando manualmente
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Como o agente funciona na prática
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Implementação simples, resultados imediatos
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 relative">
            <div className="hidden lg:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-[#7BCB8E]/30" />
            
            <div className="relative">
              <div className="bg-[#5B7FB5] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6 mx-auto lg:mx-0 relative z-10">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Paciente envia mensagem
              </h3>
              <p className="text-gray-600 mb-4">
                No WhatsApp da clínica, qualquer hora do dia ou da noite. Final de semana, feriado, madrugada.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 border border-gray-200">
                💬 "Olá, preciso marcar consulta com ortopedista"
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-[#5B7FB5] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6 mx-auto lg:mx-0 relative z-10">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Agente responde e agenda
              </h3>
              <p className="text-gray-600 mb-4">
                Em menos de 3 segundos, consulta a agenda real, oferece horários, confirma dados e registra tudo.
              </p>
              <div className="bg-[#5B7FB5]/10 rounded-lg p-4 text-sm text-[#3D4449] border border-[#5B7FB5]/20">
                🤖 "Tenho vaga terça 9h ou quarta 14h. Qual prefere?"
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-[#5B7FB5] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6 mx-auto lg:mx-0 relative z-10">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Confirmação automática
              </h3>
              <p className="text-gray-600 mb-4">
                1 dia antes da consulta, envia lembrete automático. Reduz faltas em até 60%.
              </p>
              <div className="bg-[#7BCB8E]/10 rounded-lg p-4 text-sm text-[#3D4449] border border-[#7BCB8E]/30">
                ✅ "Sua consulta é amanhã às 9h. Confirma presença?"
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20 bg-[#3D4449] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              O que muda na sua clínica
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Resultados que você vai ver nos primeiros 30 dias
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-4xl font-bold mb-2 text-[#7BCB8E]">+60%</div>
              <p className="text-gray-300">Mais agendamentos (resposta imediata 24/7)</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-4xl font-bold mb-2 text-[#7BCB8E]">-40%</div>
              <p className="text-gray-300">Menos faltas (confirmação automática)</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-4xl font-bold mb-2 text-[#7BCB8E]">4h/dia</div>
              <p className="text-gray-300">Secretária liberada pra outras tarefas</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="text-4xl font-bold mb-2 text-[#7BCB8E]">R$ 0</div>
              <p className="text-gray-300">Sem custo de CRM ou software extra</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Clínicas que já usam
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Reduzimos 60% das faltas em consultas. O retorno financeiro pagou a implementação em menos de 2 meses."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#5B7FB5]/10 rounded-full flex items-center justify-center text-[#5B7FB5] font-bold">
                  DS
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Dra. Silva</p>
                  <p className="text-sm text-gray-600">Clínica Ortopédica - Cuiabá</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Nossa secretária agora foca no atendimento presencial. O agente cuida 100% do WhatsApp sem errar."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#5B7FB5]/10 rounded-full flex items-center justify-center text-[#5B7FB5] font-bold">
                  CM
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Dr. Mendes</p>
                  <p className="text-sm text-gray-600">Clínica Cardiológica - Várzea Grande</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Formulário */}
      <section id="formulario" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Solicite um diagnóstico gratuito
            </h2>
            <p className="text-xl text-gray-600">
              Vamos analisar sua operação e mostrar quanto você está perdendo por não ter automação no WhatsApp
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-2xl p-8 lg:p-12 border border-gray-200">
            {submitStatus === 'success' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#7BCB8E]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#7BCB8E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Diagnóstico solicitado!
                </h3>
                <p className="text-gray-600 mb-4">
                  Redirecionando você pro WhatsApp...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seu nome completo
                  </label>
                  <input
                    type="text"
                    name="nome"
                    required
                    value={formData.nome}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5B7FB5] focus:border-transparent transition-all"
                    placeholder="Dr. João Silva"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da clínica
                  </label>
                  <input
                    type="text"
                    name="empresa"
                    required
                    value={formData.empresa}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5B7FB5] focus:border-transparent transition-all"
                    placeholder="Clínica Saúde Total"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seu cargo
                  </label>
                  <select
                    name="cargo"
                    required
                    value={formData.cargo}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5B7FB5] focus:border-transparent transition-all"
                  >
                    <option value="">Selecione</option>
                    <option value="Médico(a) proprietário(a)">Médico(a) proprietário(a)</option>
                    <option value="Diretor(a)">Diretor(a)</option>
                    <option value="Gerente">Gerente</option>
                    <option value="Administrador(a)">Administrador(a)</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    name="telefone"
                    required
                    value={formData.telefone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5B7FB5] focus:border-transparent transition-all"
                    placeholder="(65) 9 9999-9999"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5B7FB5] focus:border-transparent transition-all"
                    placeholder="contato@clinica.com.br"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Principal desafio da clínica
                  </label>
                  <textarea
                    name="desafio"
                    required
                    value={formData.desafio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5B7FB5] focus:border-transparent transition-all"
                    placeholder="Ex: Muitas faltas sem aviso, demora no atendimento do WhatsApp, agenda desorganizada..."
                  />
                </div>
                
                {submitStatus === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    Erro ao enviar. Tente novamente ou entre em contato via WhatsApp.
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#7BCB8E] text-white font-semibold py-4 px-8 rounded-lg hover:bg-[#6BB87D] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      Solicitar diagnóstico gratuito
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
                
                <p className="text-sm text-gray-500 text-center">
                  Ao enviar, você será redirecionado para nosso WhatsApp para agendar uma conversa de 15 minutos
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Perguntas frequentes
            </h2>
          </div>
          
          <div className="space-y-4">
            <details className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                Preciso trocar meu número de WhatsApp?
              </summary>
              <p className="mt-3 text-gray-600">
                Não. O agente se integra ao WhatsApp atual da clínica usando a API oficial do WhatsApp Business. Seu número continua o mesmo.
              </p>
            </details>
            
            <details className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                Funciona com meu sistema de agenda atual?
              </summary>
              <p className="mt-3 text-gray-600">
                Sim. Integramos com Google Agenda, iClinic, MV, Tasy e outros sistemas. Se você usa agenda em papel ou Excel, também funciona — criamos uma integração personalizada.
              </p>
            </details>
            
            <details className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                E se o paciente fizer uma pergunta que o agente não sabe responder?
              </summary>
              <p className="mt-3 text-gray-600">
                O agente encaminha automaticamente pra secretária com contexto completo da conversa. Você define quais perguntas ele responde sozinho e quais precisam de humano.
              </p>
            </details>
            
            <details className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                Quanto tempo leva pra implementar?
              </summary>
              <p className="mt-3 text-gray-600">
                7 a 10 dias úteis. Fazemos todo o setup técnico, treinamento do agente com os protocolos da sua clínica, e liberamos em modo teste antes de ir pra produção.
              </p>
            </details>
            
            <details className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                Qual o investimento?
              </summary>
              <p className="mt-3 text-gray-600">
                Varia de acordo com volume de mensagens e complexidade. No diagnóstico gratuito, analisamos sua operação e apresentamos uma proposta personalizada. A maioria das clínicas se paga em menos de 2 meses com redução de faltas.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-[#5B7FB5] to-[#3D4449] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Pare de perder pacientes por demora no atendimento
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Agende um diagnóstico gratuito e descubra quanto sua clínica está deixando na mesa
          </p>
          <a 
            href="#formulario"
            className="inline-flex items-center justify-center px-8 py-4 bg-[#7BCB8E] text-white font-semibold rounded-lg hover:bg-[#6BB87D] transition-all shadow-xl hover:shadow-2xl"
          >
            Solicitar diagnóstico agora
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </section>

     {/* Footer */}
<footer className="bg-[#3D4449] text-white py-12">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="grid md:grid-cols-3 gap-8 mb-8">
      {/* Container Centralizado */}
      <div className="flex flex-col items-center text-center">
        <Image 
          src="/logo-orbi-white.png" 
          alt="ORBI IA" 
          width={150} 
          height={35}
          className="h-20 w-auto" 
        />
        <p className="text-[10px] tracking-widest text-white/90 mt-2">
          Inteligência de Operações Autônomas
        </p>
      </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Contato</h3>
              <p className="text-sm mb-2 text-white">
                <a href="https://wa.me/5566981320667" className="hover:text-[#7BCB8E] transition-colors">
                  WhatsApp: (66) 98132-0667
                </a>
              </p>
              <p className="text-sm text-white">
                <a href="mailto:contato@agenteorbiia.com" className="hover:text-[#7BCB8E] transition-colors">
                  contato@agenteorbiia.com
                </a>
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Redes Sociais</h3>
              <div className="flex gap-4">
                {/* Threads */}
                <a 
                  href="https://www.threads.com/@agenciaorbi.ia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-[#7BCB8E]/20 transition-all border border-white/10"
                  title="Threads"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.186 3.077c-1.503.075-3.011.335-4.304.903-1.293.567-2.515 1.513-3.297 2.853-.782 1.339-1.17 3.07-1.17 4.843 0 1.773.388 3.504 1.17 4.843.782 1.34 2.004 2.286 3.297 2.853 1.293.568 2.801.828 4.304.903 1.503.074 2.796.074 4.299 0 1.503-.075 3.011-.335 4.304-.903 1.293-.567 2.515-1.513 3.297-2.853.782-1.339 1.17-3.07 1.17-4.843 0-1.773-.388-3.504-1.17-4.843-.782-1.34-2.004-2.286-3.297-2.853-1.293-.568-2.801-.828-4.304-.903-1.503-.074-2.796-.074-4.299 0zm.814 13.846c-1.158 0-2.106-.22-2.843-.66-.738-.44-1.265-1.04-1.584-1.797-.318-.758-.477-1.614-.477-2.566 0-.953.159-1.809.477-2.567.319-.757.846-1.356 1.584-1.797.737-.44 1.685-.66 2.843-.66.958 0 1.777.142 2.457.427.68.284 1.234.675 1.663 1.172.43.497.723 1.067.88 1.71.156.642.234 1.316.234 2.021 0 .706-.078 1.38-.234 2.022-.157.643-.45 1.213-.88 1.71-.429.497-.983.888-1.663 1.172-.68.285-1.499.427-2.457.427z"/>
                  </svg>
                </a>
                
                {/* LinkedIn */}
                <a 
                  href="https://www.linkedin.com/in/orbi-ia-869408186" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-[#7BCB8E]/20 transition-all border border-white/10"
                  title="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                
                {/* TikTok */}
                <a 
                  href="https://tiktok.com/@orbi.ia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-[#7BCB8E]/20 transition-all border border-white/10"
                  title="TikTok"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
                
                {/* Facebook */}
                <a 
                  href="https://www.facebook.com/share/1HhQ7G9WZC/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-[#7BCB8E]/20 transition-all border border-white/10"
                  title="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                
                {/* Instagram */}
                <a 
                  href="https://www.instagram.com/agenciaorbi.ia" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center hover:bg-[#7BCB8E]/20 transition-all border border-white/10"
                  title="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 text-center text-sm text-white">
            <p>© 2026 ORBI IA — Agentes Inteligentes com Arquitetura de Estados. Transformando processos com tecnologia e criatividade. — Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}