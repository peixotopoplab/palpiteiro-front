"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { solicitarRecuperacao, type RecuperarState } from "./actions";

const INITIAL: RecuperarState = { error: null, success: false };

export default function RecuperarPage() {
  const [state, action, pending] = useActionState(solicitarRecuperacao, INITIAL);

  if (state.success) {
    return (
      <main className="container-content flex flex-col items-center py-12 gap-6 max-w-md">
        <div className="text-center space-y-2">
          <p className="text-display-lg-mobile">✉️</p>
          <h1 className="text-headline-lg text-text-primary">Verifique seu e-mail</h1>
          <p className="text-body-md text-text-muted">
            Se existe uma conta com esse e-mail, enviamos um link para redefinir sua senha.
            O link expira em 1 hora.
          </p>
        </div>
        <Link href="/entrar" className="text-body-md text-primary underline underline-offset-2">
          Voltar para o login
        </Link>
      </main>
    );
  }

  return (
    <main className="container-content flex flex-col items-center py-12 gap-6 max-w-md">
      <div className="text-center space-y-1">
        <h1 className="text-headline-lg text-text-primary">Recuperar senha</h1>
        <p className="text-body-md text-text-muted">
          Digite seu e-mail e enviaremos um link para criar uma nova senha.
        </p>
      </div>

      <div className="w-full rounded-lg border border-border-subtle bg-surface-dark p-5 space-y-4">
        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-body-md text-text-primary">E-mail</label>
            <div className="mt-1 flex items-center gap-2 rounded-default border border-border-subtle bg-background px-3 py-2.5 focus-within:border-primary-container">
              <Mail className="size-4 text-text-muted shrink-0" />
              <input
                id="email" name="email" type="email"
                placeholder="seu@email.com" required
                className="w-full bg-transparent text-body-md text-text-primary placeholder:text-text-muted outline-none"
              />
            </div>
          </div>

          {state.error && <p className="text-label-md text-error-red">{state.error}</p>}

          <Button type="submit" variant="primary" className="w-full" disabled={pending}>
            {pending ? "Enviando..." : "Enviar link de recuperação"}
          </Button>
        </form>
      </div>

      <Link href="/entrar" className="flex items-center gap-1.5 text-body-md text-text-muted hover:text-text-primary transition-colors">
        <ArrowLeft className="size-4" /> Voltar para o login
      </Link>
    </main>
  );
}
