"use client";

import { useActionState, useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { redefinirSenha, type RedefinirState } from "./actions";

const INITIAL: RedefinirState = { error: null };

export default function RedefinirPage() {
  const [state, action, pending] = useActionState(redefinirSenha, INITIAL);
  const [mostrar, setMostrar] = useState(false);

  return (
    <main className="container-content flex flex-col items-center py-12 gap-6 max-w-md">
      <div className="text-center space-y-1">
        <h1 className="text-headline-lg text-text-primary">Nova senha</h1>
        <p className="text-body-md text-text-muted">Escolha uma senha com pelo menos 8 caracteres.</p>
      </div>

      <div className="w-full rounded-lg border border-border-subtle bg-surface-dark p-5 space-y-4">
        <form action={action} className="space-y-4">
          {/* Nova senha */}
          <div>
            <label htmlFor="senha" className="text-body-md text-text-primary">Nova senha</label>
            <div className="mt-1 flex items-center gap-2 rounded-default border border-border-subtle bg-background px-3 py-2.5 focus-within:border-primary-container">
              <Lock className="size-4 text-text-muted shrink-0" />
              <input
                id="senha" name="senha"
                type={mostrar ? "text" : "password"}
                placeholder="••••••••" required minLength={8}
                className="w-full bg-transparent text-body-md text-text-primary placeholder:text-text-muted outline-none"
              />
              <button type="button" onClick={() => setMostrar(!mostrar)} className="text-text-muted shrink-0">
                {mostrar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Confirmação */}
          <div>
            <label htmlFor="confirmacao" className="text-body-md text-text-primary">Confirmar senha</label>
            <div className="mt-1 flex items-center gap-2 rounded-default border border-border-subtle bg-background px-3 py-2.5 focus-within:border-primary-container">
              <Lock className="size-4 text-text-muted shrink-0" />
              <input
                id="confirmacao" name="confirmacao"
                type={mostrar ? "text" : "password"}
                placeholder="••••••••" required minLength={8}
                className="w-full bg-transparent text-body-md text-text-primary placeholder:text-text-muted outline-none"
              />
            </div>
          </div>

          {state.error && <p className="text-label-md text-error-red">{state.error}</p>}

          <Button type="submit" variant="primary" className="w-full" disabled={pending}>
            {pending ? "Salvando..." : "Salvar nova senha"}
          </Button>
        </form>
      </div>
    </main>
  );
}
