"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { X, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { colunaSelecionada } from "@/types/analise";
import type { Jogo } from "@/types/analise";

interface DrawerContextValue {
  abrirDrawer: (jogo: Jogo) => void;
}

const DrawerContext = createContext<DrawerContextValue>({ abrirDrawer: () => {} });

export function useJogoDrawer() {
  return useContext(DrawerContext);
}

function JogoModal({ jogo, onClose }: { jogo: Jogo; onClose: () => void }) {
  // Fecha com Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    // Trava scroll do body enquanto modal está aberto
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const alertaZebra = jogo.modificadores_ativos?.some((m) => m.startsWith("R0"));

  return (
    /* Overlay escuro */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
    >
      {/* Modal centralizado */}
      <div className="w-full max-w-lg bg-surface-dark border border-border-subtle rounded-xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header fixo */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-border-subtle shrink-0">
          <div className="min-w-0">
            <p className="text-label-sm text-text-muted uppercase tracking-wide">
              {String(jogo.numero).padStart(2, "0")} · {jogo.competicao}
            </p>
            <h2 className="text-headline-md text-text-primary mt-0.5">
              {jogo.mandante} <span className="text-text-muted font-normal">vs</span> {jogo.visitante}
            </h2>
            {alertaZebra && (
              <span className="inline-flex items-center gap-1 text-label-sm text-error-red mt-1">
                <TriangleAlert className="size-3.5" /> Equilíbrio alto — resultado incerto
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors p-1 shrink-0 mt-0.5"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="overflow-y-auto px-5 py-4 space-y-5">

          {/* Probabilidades */}
          <div className="grid grid-cols-3 gap-2">
            {([
              ["1", jogo.mandante, jogo.probabilidades.p1],
              ["X", "Empate", jogo.probabilidades.pX],
              ["2", jogo.visitante, jogo.probabilidades.p2],
            ] as [string, string, number][]).map(([col, label, prob]) => (
              <div
                key={col}
                className={cn(
                  "rounded-md p-3 text-center border",
                  colunaSelecionada(jogo.coluna_recomendada, col as "1" | "X" | "2")
                    ? "bg-primary-container border-primary-container text-on-primary-container"
                    : "bg-surface-container border-border-subtle text-text-muted"
                )}
              >
                <p className="text-label-sm uppercase font-medium">Col {col}</p>
                <p className="text-label-sm truncate mt-0.5">{label}</p>
                <p className="text-headline-md mt-1">{prob}%</p>
              </div>
            ))}
          </div>

          {/* Análise completa — texto principal */}
          {jogo.justificativa_completa ? (
            <div className="space-y-1.5">
              <p className="text-label-sm text-text-muted uppercase tracking-wide">Análise do modelo</p>
              <p className="text-body-md text-text-primary leading-relaxed">
                {jogo.justificativa_completa}
              </p>
            </div>
          ) : jogo.justificativa_curta ? (
            <div className="space-y-1.5">
              <p className="text-label-sm text-text-muted uppercase tracking-wide">Análise do modelo</p>
              <p className="text-body-md text-text-muted leading-relaxed">
                {jogo.justificativa_curta}
              </p>
            </div>
          ) : null}

          {/* Desfalques */}
          {((jogo.desfalques_mandante?.length ?? 0) > 0 ||
            (jogo.desfalques_visitante?.length ?? 0) > 0) && (
            <div className="space-y-1.5">
              <p className="text-label-sm text-text-muted uppercase tracking-wide">Desfalques</p>
              <p className="text-body-md text-secondary">
                {[
                  ...(jogo.desfalques_mandante ?? []),
                  ...(jogo.desfalques_visitante ?? []),
                ].join(" · ")}
              </p>
            </div>
          )}

          {/* H2H */}
          {jogo.h2h_6_jogos && (
            <div className="space-y-1.5">
              <p className="text-label-sm text-text-muted uppercase tracking-wide">Últimos confrontos</p>
              <p className="text-body-md text-text-primary">{jogo.h2h_6_jogos}</p>
            </div>
          )}

        </div>

        {/* Footer fixo — botão fechar */}
        <div className="px-5 py-3 border-t border-border-subtle shrink-0">
          <button
            onClick={onClose}
            className="w-full text-center text-body-md text-text-muted hover:text-text-primary transition-colors py-1"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export function JogoDrawerProvider({ children }: { children: ReactNode }) {
  const [jogoAberto, setJogoAberto] = useState<Jogo | null>(null);
  const abrirDrawer = useCallback((jogo: Jogo) => setJogoAberto(jogo), []);
  const fecharDrawer = useCallback(() => setJogoAberto(null), []);

  return (
    <DrawerContext.Provider value={{ abrirDrawer }}>
      {children}
      {jogoAberto && <JogoModal jogo={jogoAberto} onClose={fecharDrawer} />}
    </DrawerContext.Provider>
  );
}
