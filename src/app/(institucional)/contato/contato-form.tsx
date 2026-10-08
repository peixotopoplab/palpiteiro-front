"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { enviarContato, type ContatoState } from "./actions";

const INITIAL: ContatoState = { error: null, success: false };

const ASSUNTOS = [
  "Dúvida sobre análise",
  "Problema com assinatura VIP",
  "Solicitação de exclusão de dados (LGPD)",
  "Sugestão de melhoria",
  "Outro",
];

export function ContatoForm() {
  const [state, action, pending] = useActionState(enviarContato, INITIAL);

  if (state.success) {
    return (
      <div className="rounded-md border border-tertiary/40 bg-tertiary/10 px-4 py-4 space-y-1">
        <p className="text-title-sm text-tertiary">Mensagem enviada!</p>
        <p className="text-body-md text-text-muted">
          Recebemos sua mensagem e responderemos em até 2 dias úteis no e-mail informado.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {/* Nome */}
      <div className="space-y-1">
        <label htmlFor="nome" className="text-body-md text-text-primary">
          Nome <span className="text-error-red">*</span>
        </label>
        <input
          id="nome" name="nome" type="text" required
          placeholder="Seu nome"
          className="w-full rounded-default border border-border-subtle bg-background px-3 py-2.5 text-body-md text-text-primary placeholder:text-text-muted outline-none focus:border-primary-container transition-colors"
        />
      </div>

      {/* E-mail */}
      <div className="space-y-1">
        <label htmlFor="email" className="text-body-md text-text-primary">
          E-mail <span className="text-error-red">*</span>
        </label>
        <input
          id="email" name="email" type="email" required
          placeholder="seu@email.com"
          className="w-full rounded-default border border-border-subtle bg-background px-3 py-2.5 text-body-md text-text-primary placeholder:text-text-muted outline-none focus:border-primary-container transition-colors"
        />
      </div>

      {/* Assunto */}
      <div className="space-y-1">
        <label htmlFor="assunto" className="text-body-md text-text-primary">Assunto</label>
        <select
          id="assunto" name="assunto"
          className="w-full rounded-default border border-border-subtle bg-background px-3 py-2.5 text-body-md text-text-primary outline-none focus:border-primary-container transition-colors"
        >
          <option value="">Selecione um assunto</option>
          {ASSUNTOS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Mensagem */}
      <div className="space-y-1">
        <label htmlFor="mensagem" className="text-body-md text-text-primary">
          Mensagem <span className="text-error-red">*</span>
        </label>
        <textarea
          id="mensagem" name="mensagem" required rows={5}
          placeholder="Descreva sua dúvida ou solicitação..."
          className="w-full rounded-default border border-border-subtle bg-background px-3 py-2.5 text-body-md text-text-primary placeholder:text-text-muted outline-none focus:border-primary-container transition-colors resize-none"
        />
      </div>

      {state.error && (
        <p className="text-label-md text-error-red">{state.error}</p>
      )}

      <Button type="submit" variant="primary" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Enviar mensagem"}
      </Button>

      <p className="text-label-sm text-text-muted text-center">
        Respondemos em até 2 dias úteis · Dados tratados conforme nossa{" "}
        <a href="/privacidade" className="underline underline-offset-2">Política de Privacidade</a>
      </p>
    </form>
  );
}
