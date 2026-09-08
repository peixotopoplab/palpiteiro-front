"use client";

import { useActionState } from "react";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aplicarCupom, type CupomActionState } from "./actions";

const INITIAL: CupomActionState = { error: null, success: null };

export function CupomForm() {
  const [state, action, pending] = useActionState(aplicarCupom, INITIAL);

  return (
    <section className="rounded-md border border-border-subtle bg-surface-dark p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="size-4 text-badge-vip" />
        <p className="text-title-sm text-text-primary">Cupons de Desconto</p>
      </div>
      <p className="text-body-md text-text-muted">
        Adicione um cupom para renovar ou assinar com condições exclusivas.
      </p>
      <form action={action} className="flex gap-2">
        <input
          name="codigo"
          type="text"
          placeholder="Ex: LOTECA10"
          className="flex-1 rounded-default border border-border-subtle bg-background px-3 py-2.5 text-body-md text-text-primary placeholder:text-text-muted uppercase outline-none focus:border-primary-container"
        />
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? "..." : "Aplicar"}
        </Button>
      </form>
      {state.error && <p className="text-label-md text-error-red">{state.error}</p>}
      {state.success && <p className="text-label-md text-tertiary">{state.success}</p>}
    </section>
  );
}
