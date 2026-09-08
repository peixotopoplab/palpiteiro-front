"use client";

import { LogOut } from "lucide-react";
import { signOut } from "./actions";

export function BotaoSair() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="flex items-center gap-2 w-full px-4 py-3 text-error-red text-body-md hover:bg-surface-hover transition-colors rounded-md"
      >
        <LogOut className="size-4" />
        Sair da Conta
      </button>
    </form>
  );
}
