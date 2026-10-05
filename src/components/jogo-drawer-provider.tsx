"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";
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

function JogoDrawer({ jogo, onClose }: { jogo: Jogo; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-surface-container-lowest/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-surface-dark border-t border-border-subtle rounded-t-xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <span className="text-label-sm text-text-muted uppercase">
            {String(jogo.numero).padStart(2, "0")} · {jogo.competicao}
          </span>
          <button onClick={onClose} className="text-text-muted text-label-sm hover:text-text-primary transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <h3 className="text-headline-md text-text-primary">
          {jogo.mandante} <span className="text-text-muted">vs</span> {jogo.visitante}
        </h3>

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
              <p className="text-label-sm uppercase">Col {col}</p>
              <p className="text-label-sm truncate">{label}</p>
              <p className="text-metric-val">{prob}%</p>
            </div>
          ))}
        </div>

        {/* Análise completa */}
        {jogo.justificativa_completa && (
          <div className="rounded-default bg-surface-container-lowest p-3 space-y-1">
            <p className="text-label-sm text-text-muted uppercase">Análise do modelo</p>
            <p className="text-body-md text-text-primary">{jogo.justificativa_completa}</p>
          </div>
        )}

        {/* Desfalques */}
        {((jogo.desfalques_mandante?.length ?? 0) > 0 || (jogo.desfalques_visitante?.length ?? 0) > 0) && (
          <div className="space-y-1">
            <p className="text-label-sm text-text-muted uppercase">Desfalques</p>
            <p className="text-body-md text-secondary">
              {[...(jogo.desfalques_mandante ?? []), ...(jogo.desfalques_visitante ?? [])].join(" · ")}
            </p>
          </div>
        )}

        {/* H2H */}
        {jogo.h2h_6_jogos && (
          <div>
            <p className="text-label-sm text-text-muted uppercase">Últimos 6 confrontos</p>
            <p className="text-body-md text-text-primary">{jogo.h2h_6_jogos}</p>
          </div>
        )}
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
      {jogoAberto && <JogoDrawer jogo={jogoAberto} onClose={fecharDrawer} />}
    </DrawerContext.Provider>
  );
}
