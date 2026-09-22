"use client";

import { Clock, TriangleAlert, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatarHorario } from "@/types/jogos-do-dia";
import type { JogoDoDiaExibicao, JogoDodia } from "@/types/jogos-do-dia";
import { useJogosDoDiaDrawer } from "@/components/jogos-do-dia-drawer-provider";

function CardBloqueado({ jogo }: { jogo: { numero: number; mandante: string; visitante: string; competicao: string; horario: string } }) {
  return (
    <article className="rounded-md border border-border-subtle bg-surface-dark px-4 py-3 opacity-50">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-label-sm text-text-muted uppercase truncate">{jogo.competicao}</span>
        <span className="text-label-sm text-text-muted flex items-center gap-1">
          <Clock className="size-3" />
          {formatarHorario(jogo.horario)}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <p className="text-title-sm text-text-primary">{jogo.mandante}</p>
        <span className="text-label-sm text-text-muted">vs</span>
        <p className="text-title-sm text-text-primary text-right">{jogo.visitante}</p>
      </div>
      <div className="grid grid-cols-3 gap-px bg-border-subtle mt-2 rounded-default overflow-hidden">
        {["1", "X", "2"].map((col) => (
          <div key={col} className="py-2 text-center bg-surface-container">
            <p className="text-label-sm text-text-muted">{col}</p>
            <div className="h-3 w-8 rounded bg-surface-container-high mx-auto mt-1" />
          </div>
        ))}
      </div>
    </article>
  );
}

function CardLiberado({ jogo }: { jogo: JogoDodia }) {
  const { abrirDrawer } = useJogosDoDiaDrawer();
  const recCol = jogo.resultado_recomendado;

  return (
    <article className="rounded-md border border-border-subtle bg-surface-dark overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1 flex-wrap">
        <span className="text-label-sm text-text-muted uppercase truncate">{jogo.competicao}</span>
        <div className="flex items-center gap-2 shrink-0">
          {jogo.zebra_alerta && (
            <span className="inline-flex items-center gap-1 text-label-sm text-error-red">
              <TriangleAlert className="size-3" /> Zebra
            </span>
          )}
          <span className="text-label-sm text-text-muted flex items-center gap-1">
            <Clock className="size-3" />
            {formatarHorario(jogo.horario)}
          </span>
        </div>
      </div>

      {/* Times */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2">
        <p className="text-title-sm text-text-primary">{jogo.mandante}</p>
        <span className="text-label-sm text-text-muted">vs</span>
        <p className="text-title-sm text-text-primary text-right">{jogo.visitante}</p>
      </div>

      {/* Probabilidades compactas — sem seletor 1/X/2 */}
      <div className="grid grid-cols-3 gap-px bg-border-subtle mx-4 mb-3 rounded-default overflow-hidden">
        {([
          ["1", jogo.mandante, jogo.probabilidades.p1],
          ["X", "Empate", jogo.probabilidades.pX],
          ["2", jogo.visitante, jogo.probabilidades.p2],
        ] as [string, string, number][]).map(([col, label, prob]) => {
          const recomendado = recCol.split("").includes(col);
          return (
            <div key={col} className={cn(
              "py-2 text-center",
              recomendado
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container text-text-muted"
            )}>
              <p className="text-label-sm uppercase">{col}</p>
              <p className="text-label-sm truncate px-1">{label}</p>
              <p className="text-title-sm font-bold">{prob}%</p>
            </div>
          );
        })}
      </div>

      {/* Link para análise completa */}
      <button
        onClick={() => abrirDrawer(jogo)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 border-t border-border-subtle text-left hover:bg-surface-hover transition-colors"
      >
        <p className="text-body-md text-text-muted line-clamp-1 flex-1">{jogo.justificativa_curta}</p>
        <ChevronRight className="size-4 text-text-muted shrink-0" />
      </button>
    </article>
  );
}

export function JogoDoDiaCard({ jogo }: { jogo: JogoDoDiaExibicao }) {
  if ("bloqueado" in jogo && jogo.bloqueado) {
    return <CardBloqueado jogo={jogo} />;
  }
  return <CardLiberado jogo={jogo as JogoDodia} />;
}
