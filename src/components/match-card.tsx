"use client";

import { useState } from "react";
import { ChevronRight, Lock, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { JogoExibicao } from "@/lib/queries";
import { tipoColuna, colunaSelecionada } from "@/types/analise";
import type { Jogo } from "@/types/analise";

/* ------------------------------------------------------------------ */
/* Drawer de análise completa (abre na mesma tela)                     */
/* ------------------------------------------------------------------ */
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
          <button onClick={onClose} className="text-text-muted text-label-sm">fechar</button>
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
              <p className="text-title-sm truncate">{label}</p>
              <p className="text-metric-val">{prob}%</p>
            </div>
          ))}
        </div>

        {/* Leitura completa */}
        {jogo.justificativa_completa && (
          <div className="rounded-default bg-surface-container-lowest p-3 space-y-1">
            <p className="text-label-sm text-text-muted uppercase">Análise do modelo</p>
            <p className="text-body-md text-text-primary">{jogo.justificativa_completa}</p>
          </div>
        )}

        {/* Desfalques */}
        {(jogo.desfalques_mandante.length > 0 || jogo.desfalques_visitante.length > 0) && (
          <div className="space-y-1">
            <p className="text-label-sm text-text-muted uppercase">Desfalques</p>
            <p className="text-body-md text-secondary">
              {[...jogo.desfalques_mandante, ...jogo.desfalques_visitante].join(" · ")}
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

/* ------------------------------------------------------------------ */
/* Card de jogo desbloqueado                                           */
/* ------------------------------------------------------------------ */
function MatchCardLiberado({ jogo }: { jogo: Jogo }) {
  const [aberto, setAberto] = useState(false);
  const tipoBadge = tipoColuna(jogo.coluna_recomendada);

  return (
    <>
      <article className="rounded-md border border-border-subtle bg-surface-dark overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-1 flex-wrap">
          <span className="text-label-sm text-text-muted uppercase">
            {String(jogo.numero).padStart(2, "0")} · {jogo.competicao}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {jogo.zebra_alerta && (
              <span className="inline-flex items-center gap-1 text-label-sm text-error-red">
                <TriangleAlert className="size-3" /> Zebra
              </span>
            )}
            <Badge variant={tipoBadge} />
          </div>
        </div>

        {/* Times */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2">
          <div>
            <p className="text-title-sm text-text-primary">{jogo.mandante}</p>
            {jogo.posicao_mandante && (
              <p className="text-label-sm text-tertiary">{jogo.posicao_mandante}</p>
            )}
          </div>
          <span className="text-label-sm text-text-muted">vs</span>
          <div className="text-right">
            <p className="text-title-sm text-text-primary">{jogo.visitante}</p>
            {jogo.posicao_visitante && (
              <p className="text-label-sm text-text-muted">{jogo.posicao_visitante}</p>
            )}
          </div>
        </div>

        {/* Seletor de colunas — minimalista */}
        <div className="grid grid-cols-3 gap-px bg-border-subtle mx-3 mb-3 rounded-md overflow-hidden">
          {([
            ["1", jogo.mandante, jogo.probabilidades.p1],
            ["X", "Empate", jogo.probabilidades.pX],
            ["2", jogo.visitante, jogo.probabilidades.p2],
          ] as [string, string, number][]).map(([col, label, prob]) => {
            const sel = colunaSelecionada(jogo.coluna_recomendada, col as "1" | "X" | "2");
            return (
              <div
                key={col}
                className={cn(
                  "py-2 px-1 text-center",
                  sel
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-surface-container text-text-muted"
                )}
              >
                <p className="text-label-sm uppercase">Col {col}</p>
                <p className="text-label-sm truncate">{label}</p>
                <p className="text-title-sm font-bold">{prob}%</p>
              </div>
            );
          })}
        </div>

        {/* Resumo + link análise */}
        <button
          onClick={() => setAberto(true)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 border-t border-border-subtle text-left hover:bg-surface-hover transition-colors"
        >
          <p className="text-body-md text-text-muted line-clamp-1 flex-1">
            {jogo.justificativa_curta}
          </p>
          <ChevronRight className="size-4 text-text-muted shrink-0" />
        </button>
      </article>

      {aberto && <JogoDrawer jogo={jogo} onClose={() => setAberto(false)} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Card de jogo bloqueado — times visíveis, dados ocultados            */
/* ------------------------------------------------------------------ */
function MatchCardBloqueado({ jogo }: { jogo: { numero: number; mandante: string; visitante: string; competicao: string } }) {
  return (
    <article className="rounded-md border border-border-subtle bg-surface-dark opacity-70">
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-1">
        <span className="text-label-sm text-text-muted uppercase">
          {String(jogo.numero).padStart(2, "0")} · {jogo.competicao}
        </span>
        <Lock className="size-3.5 text-badge-vip" />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2">
        <p className="text-title-sm text-text-primary">{jogo.mandante}</p>
        <span className="text-label-sm text-text-muted">vs</span>
        <p className="text-title-sm text-text-primary text-right">{jogo.visitante}</p>
      </div>
      {/* Dados ocultos — blur simulado com barras */}
      <div className="grid grid-cols-3 gap-px bg-border-subtle mx-3 mb-3 rounded-md overflow-hidden">
        {["1", "X", "2"].map((col) => (
          <div key={col} className="py-2 px-1 text-center bg-surface-container">
            <p className="text-label-sm uppercase text-text-muted">Col {col}</p>
            <div className="h-3 rounded bg-surface-container-high mx-auto w-10 mt-1 mb-1" />
            <div className="h-4 rounded bg-surface-container-high mx-auto w-8" />
          </div>
        ))}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Componente principal — despacha pro tipo certo                      */
/* ------------------------------------------------------------------ */
export function MatchCard({ jogo }: { jogo: JogoExibicao }) {
  if ("bloqueado" in jogo && jogo.bloqueado) {
    return <MatchCardBloqueado jogo={jogo} />;
  }
  return <MatchCardLiberado jogo={jogo as Jogo} />;
}
