"use client";

import { useState } from "react";
import { ExcluirContaModal } from "@/components/excluir-conta-modal";

export function ExcluirContaButton() {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-label-sm text-text-muted hover:text-error-red transition-colors underline underline-offset-2"
      >
        Excluir minha conta
      </button>
      {aberto && <ExcluirContaModal onClose={() => setAberto(false)} />}
    </>
  );
}
