"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuthModal } from "@/components/auth-modal-provider";

const STORAGE_KEY = "palpiteiro_em_construcao_fechado";

export function EmConstrucaoPopup() {
  const [visivel, setVisivel] = useState(false);
  const { abrirAuth } = useAuthModal();

  useEffect(() => {
    let mostrar = true;
    try {
      mostrar = !sessionStorage.getItem(STORAGE_KEY);
    } catch { /* silencia */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisivel(mostrar);
  }, []);

  const fechar = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch { /* silencia */ }
    setVisivel(false);
  };

  if (!visivel) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-surface-container-lowest/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-surface-dark border border-border-subtle rounded-xl p-5 space-y-4 shadow-lg">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-label-sm text-text-muted uppercase tracking-wide">Em construção</p>
            <h2 className="text-headline-md text-text-primary">Estamos quase lá 🍀</h2>
          </div>
          <button
            type="button"
            onClick={fechar}
            aria-label="Fechar"
            className="text-text-muted hover:text-text-primary transition-colors p-1 shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Corpo */}
        <p className="text-body-md text-text-muted leading-relaxed">
          O Palpiteiro está em fase de lançamento. Algumas funcionalidades ainda
          estão sendo finalizadas — mas você já pode explorar as análises da Loteca
          e usar o simulador de volante.
        </p>

        <p className="text-body-md text-text-muted leading-relaxed">
          Cadastre-se agora para ser avisado assim que o acesso completo estiver disponível.
        </p>

        {/* Ações */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={() => { fechar(); abrirAuth("Cadastre-se para receber atualizações e ser avisado quando o Palpiteiro lançar."); }}
            className="w-full rounded-md bg-primary-container text-on-primary-container text-title-sm font-semibold py-2.5 hover:bg-[#176839] transition-colors"
          >
            Criar conta grátis
          </button>
          <button
            type="button"
            onClick={fechar}
            className="w-full rounded-md text-text-muted text-body-md py-2 hover:text-text-primary transition-colors"
          >
            Explorar por enquanto
          </button>
        </div>

      </div>
    </div>
  );
}
