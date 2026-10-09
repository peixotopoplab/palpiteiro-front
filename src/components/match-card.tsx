"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { colunaSelecionada, tipoColuna } from "@/types/analise";
import type { Jogo, JogoExibicao } from "@/types/analise";
import { JogoLikes } from "@/components/analise-likes";

// ----------------------------------------------------------------
// Paleta de colunas (nova — azul/cinza/verde)
// ----------------------------------------------------------------
function ColBadge({ coluna, recomendada }: { coluna: "1" | "X" | "2"; recomendada: boolean }) {
  const styles = {
    "1": recomendada
      ? "bg-blue-900/40 text-blue-300 border-blue-700/50"
      : "bg-surface-container text-text-muted border-border-subtle",
    "X": recomendada
      ? "bg-surface-container-high text-text-primary border-outline"
      : "bg-surface-container text-text-muted border-border-subtle",
    "2": recomendada
      ? "bg-primary-container/40 text-tertiary border-primary-container/50"
      : "bg-surface-container text-text-muted border-border-subtle",
  };
  return (
    <span className={cn("text-label-sm font-bold px-2.5 py-1 rounded-md border", styles[coluna])}>
      Col {coluna}
    </span>
  );
}

// ----------------------------------------------------------------
// Badge de risco
// ----------------------------------------------------------------
function RiskBadge({ modificadores }: { modificadores?: string[] }) {
  const isZebra = modificadores?.some((m) => m.startsWith("R0"));
  if (!isZebra) return null;
  return (
    <span className="inline-flex items-center gap-1 text-label-sm text-error-red bg-error-red/10 border border-error-red/20 px-2 py-0.5 rounded-full">
      <TriangleAlert className="size-3" /> Zebra
    </span>
  );
}

// ----------------------------------------------------------------
// Barras de probabilidade
// ----------------------------------------------------------------
function ProbBars({ p1, px, p2 }: { p1: number; px: number; p2: number }) {
  return (
    <div className="grid grid-cols-3 gap-2 px-3 pb-3">
      {([["1", p1, "bg-blue-500"], ["X", px, "bg-outline"], ["2", p2, "bg-primary"]] as [string, number, string][]).map(
        ([col, prob, color]) => (
          <div key={col}>
            <div className="flex justify-between text-label-sm text-text-muted mb-1">
              <span>Col {col}</span>
              <span>{prob}%</span>
            </div>
            <div className="h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", color)}
                style={{ width: `${prob}%` }}
              />
            </div>
          </div>
        )
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Card desbloqueado
// ----------------------------------------------------------------
interface MatchCardLiberadoProps {
  jogo: Jogo;
  analysisId: string;
  usuarioLogado: boolean;
  modoCompacto: boolean;
  aberto: boolean;
  onToggle: () => void;
}

function MatchCardLiberado({
  jogo, analysisId, usuarioLogado, modoCompacto, aberto, onToggle,
}: MatchCardLiberadoProps) {
  const isZebra = jogo.modificadores_ativos?.some((m) => m.startsWith("R0"));
  const colRec = jogo.coluna_recomendada as "1" | "X" | "2";

  return (
    <div className={cn(
      "rounded-md border bg-surface-dark transition-colors",
      aberto ? "border-primary-container/60" : "border-border-subtle"
    )}>
      {/* Header do card */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left"
      >
        <div className="flex items-center gap-2 px-3 py-2.5">
          {/* Número */}
          <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-label-sm text-text-muted font-medium shrink-0">
            {jogo.numero}
          </span>

          {/* Times */}
          <div className="flex-1 min-w-0">
            <p className="text-title-sm text-text-primary truncate">
              {jogo.mandante} <span className="text-text-muted font-normal">×</span> {jogo.visitante}
            </p>
            {!modoCompacto && (
              <p className="text-label-sm text-text-muted truncate">{jogo.competicao}</p>
            )}
          </div>

          {/* Coluna recomendada */}
          <ColBadge coluna={colRec} recomendada={true} />

          {/* Zebra */}
          {isZebra && <TriangleAlert className="size-3.5 text-error-red shrink-0" />}

          {/* Toggle */}
          {aberto
            ? <ChevronUp className="size-4 text-text-muted shrink-0" />
            : <ChevronDown className="size-4 text-text-muted shrink-0" />}
        </div>
      </button>

      {/* Barras de probabilidade — só no modo detalhado */}
      {!modoCompacto && (
        <ProbBars p1={jogo.probabilidades.p1} px={jogo.probabilidades.pX} p2={jogo.probabilidades.p2} />
      )}

      {/* Insight inline — abre ao clicar, empurra os demais */}
      {aberto && (
        <div className="border-t border-border-subtle bg-surface-container-lowest px-3 py-3 space-y-2.5">
          {/* Probabilidades completas (modo compacto mostra aqui) */}
          {modoCompacto && (
            <ProbBars p1={jogo.probabilidades.p1} px={jogo.probabilidades.pX} p2={jogo.probabilidades.p2} />
          )}

          {/* Todas as colunas com destaque */}
          <div className="flex gap-2">
            {(["1", "X", "2"] as const).map((col) => (
              <ColBadge
                key={col}
                coluna={col}
                recomendada={colunaSelecionada(jogo.coluna_recomendada, col)}
              />
            ))}
            <RiskBadge modificadores={jogo.modificadores_ativos} />
          </div>

          {/* Análise completa */}
          {(jogo.justificativa_completa || jogo.justificativa_curta) && (
            <div>
              <p className="text-label-sm text-primary uppercase tracking-wide font-semibold mb-1">
                Análise do modelo
              </p>
              <p className="text-body-md text-text-muted leading-relaxed">
                {jogo.justificativa_completa ?? jogo.justificativa_curta}
              </p>
            </div>
          )}

          {/* H2H */}
          {jogo.h2h_6_jogos && (
            <div>
              <p className="text-label-sm text-text-muted uppercase tracking-wide mb-1">Últimos confrontos</p>
              <p className="text-body-md text-text-primary">{jogo.h2h_6_jogos}</p>
            </div>
          )}

          {/* Desfalques */}
          {((jogo.desfalques_mandante?.length ?? 0) > 0 || (jogo.desfalques_visitante?.length ?? 0) > 0) && (
            <div>
              <p className="text-label-sm text-text-muted uppercase tracking-wide mb-1">Desfalques</p>
              <p className="text-body-md text-secondary">
                {[...(jogo.desfalques_mandante ?? []), ...(jogo.desfalques_visitante ?? [])].join(" · ")}
              </p>
            </div>
          )}

          {/* Likes */}
          <div className="flex justify-end pt-1">
            <JogoLikes
              analysisId={analysisId}
              jogoNumero={jogo.numero}
              initialLikes={0}
              initialDislikes={0}
              initialVoto={null}
              usuarioLogado={usuarioLogado}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Card bloqueado
// ----------------------------------------------------------------
function MatchCardBloqueado({ jogo }: { jogo: { numero: number; mandante: string; visitante: string } }) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-dark opacity-50 px-3 py-2.5 flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-label-sm text-text-muted font-medium shrink-0">
        {jogo.numero}
      </span>
      <div className="flex-1 min-w-0">
        <div className="h-3.5 w-40 rounded bg-surface-container-high mb-1" />
        <div className="h-2.5 w-24 rounded bg-surface-container" />
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Export público — recebe estado de abertura do pai
// ----------------------------------------------------------------
export interface MatchCardProps {
  jogo: JogoExibicao;
  analysisId?: string;
  usuarioLogado?: boolean;
  modoCompacto?: boolean;
  aberto?: boolean;
  onToggle?: () => void;
}

export function MatchCard({
  jogo,
  analysisId = "",
  usuarioLogado = false,
  modoCompacto = false,
  aberto = false,
  onToggle = () => {},
}: MatchCardProps) {
  if ("bloqueado" in jogo && jogo.bloqueado) {
    return <MatchCardBloqueado jogo={jogo} />;
  }
  return (
    <MatchCardLiberado
      jogo={jogo as Jogo}
      analysisId={analysisId}
      usuarioLogado={usuarioLogado}
      modoCompacto={modoCompacto}
      aberto={aberto}
      onToggle={onToggle}
    />
  );
}
