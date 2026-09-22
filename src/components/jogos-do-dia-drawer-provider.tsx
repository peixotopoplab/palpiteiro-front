"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatarHorario } from "@/types/jogos-do-dia";
import type { JogoDodia } from "@/types/jogos-do-dia";

interface DrawerContextValue {
  abrirDrawer: (jogo: JogoDodia) => void;
}

const DrawerContext = createContext<DrawerContextValue>({ abrirDrawer: () => {} });

export function useJogosDoDiaDrawer() {
  return useContext(DrawerContext);
}

function JogoDoDiaDrawer({ jogo, onClose }: { jogo: JogoDodia; onClose: () => void }) {
  const recCol = jogo.resultado_recomendado;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-surface-container-lowest/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg bg-surface-dark border-t border-border-subtle rounded-t-xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-label-sm text-text-muted uppercase">{jogo.competicao}</span>
            <p className="text-label-sm text-text-muted">{formatarHorario(jogo.horario)}</p>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <h3 className="text-headline-md text-text-primary">
          {jogo.mandante} <span className="text-text-muted">vs</span> {jogo.visitante}
        </h3>

        {/* Probabilidades detalhadas */}
        <div className="grid grid-cols-3 gap-2">
          {([
            ["1", jogo.mandante, jogo.probabilidades.p1],
            ["X", "Empate", jogo.probabilidades.pX],
            ["2", jogo.visitante, jogo.probabilidades.p2],
          ] as [string, string, number][]).map(([col, label, prob]) => (
            <div key={col} className={cn(
              "rounded-md p-3 text-center border",
              recCol.split("").includes(col)
                ? "bg-primary-container border-primary-container text-on-primary-container"
                : "bg-surface-container border-border-subtle text-text-muted"
            )}>
              <p className="text-label-sm uppercase">Col {col}</p>
              <p className="text-label-sm truncate">{label}</p>
              <p className="text-metric-val">{prob}%</p>
              {jogo.odds && (
                <p className="text-label-sm opacity-70">
                  {col === "1" ? jogo.odds["1"] : col === "X" ? jogo.odds.X : jogo.odds["2"]}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Análise completa */}
        {jogo.justificativa_completa && (
          <div className="rounded-default bg-surface-container-lowest p-3 space-y-1">
            <p className="text-label-sm text-text-muted uppercase">Análise</p>
            <p className="text-body-md text-text-primary">{jogo.justificativa_completa}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function JogosDoDiaDrawerProvider({ children }: { children: ReactNode }) {
  const [jogoAberto, setJogoAberto] = useState<JogoDodia | null>(null);
  const abrirDrawer = useCallback((jogo: JogoDodia) => setJogoAberto(jogo), []);
  const fecharDrawer = useCallback(() => setJogoAberto(null), []);

  return (
    <DrawerContext.Provider value={{ abrirDrawer }}>
      {children}
      {jogoAberto && <JogoDoDiaDrawer jogo={jogoAberto} onClose={fecharDrawer} />}
    </DrawerContext.Provider>
  );
}
