"use client";

import { useState, useCallback, useEffect } from "react";
import { Clock } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import { PaywallCard } from "@/components/paywall-card";
import type { JogoExibicao, Jogo } from "@/types/analise";
import type { UserState } from "@/types/concurso";
import { cn } from "@/lib/utils";

type Filtro = "todos" | "favorito" | "equilibrado" | "zebra";
type Modo = "detalhado" | "compacto";

function getRisco(jogo: Jogo): "favorito" | "equilibrado" | "zebra" {
  const isZebra = jogo.modificadores_ativos?.some((m) => m.startsWith("R0"));
  if (isZebra) return "zebra";
  const max = Math.max(jogo.probabilidades.p1, jogo.probabilidades.pX, jogo.probabilidades.p2);
  if (max >= 50) return "favorito";
  return "equilibrado";
}

function Countdown({ dataFechamento }: { dataFechamento: string | null }) {
  const [texto, setTexto] = useState<string | null>(null);

  useEffect(() => {
    if (!dataFechamento) return;
    const alvo = new Date(dataFechamento).getTime();
    const tick = () => {
      const diff = alvo - Date.now();
      if (diff <= 0) { setTexto("Encerrado"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTexto(
        d > 0
          ? `Encerra em: ${d} dia${d !== 1 ? "s" : ""}, ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
          : `Encerra em: ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dataFechamento]);

  if (!texto) return null;
  return (
    <div className="flex items-center gap-1.5 text-label-sm text-badge-vip">
      <Clock className="size-3.5 animate-pulse" />
      <span className="tabular-nums">{texto}</span>
    </div>
  );
}

interface Props {
  jogos: JogoExibicao[];
  analysisId: string;
  usuarioLogado: boolean;
  qtdBloqueados: number;
  qtdLiberados: number;
  userState: UserState;
  precoMensal?: number;
  dataFechamento: string | null;
}

export function AnaliseConcursoClient({
  jogos, analysisId, usuarioLogado,
  qtdBloqueados, userState, precoMensal, dataFechamento,
}: Props) {
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [modo, setModo] = useState<Modo>("detalhado");
  const [jogoAberto, setJogoAberto] = useState<number | null>(null);

  const toggleJogo = useCallback((numero: number) => {
    setJogoAberto((prev) => (prev === numero ? null : numero));
  }, []);

  // Fecha ao clicar fora (no overlay transparente)
  const fecharTudo = useCallback(() => setJogoAberto(null), []);

  // Separa liberados e bloqueados
  const liberados = jogos.filter((j): j is Jogo => !("bloqueado" in j));
  const bloqueados = jogos.filter((j) => "bloqueado" in j);

  // Aplica filtro de risco nos liberados
  const liberadosFiltrados = filtro === "todos"
    ? liberados
    : liberados.filter((j) => getRisco(j) === filtro);

  // Contadores para os chips
  const contadores = {
    todos: liberados.length,
    favorito: liberados.filter((j) => getRisco(j) === "favorito").length,
    equilibrado: liberados.filter((j) => getRisco(j) === "equilibrado").length,
    zebra: liberados.filter((j) => getRisco(j) === "zebra").length,
  };

  const chips: { key: Filtro; label: string; color: string }[] = [
    { key: "todos", label: `Todos (${contadores.todos})`, color: "border-primary-container text-tertiary bg-primary-container/20" },
    { key: "favorito", label: `Favorito (${contadores.favorito})`, color: "border-blue-700/50 text-blue-300 bg-blue-900/20" },
    { key: "equilibrado", label: `Equilibrado (${contadores.equilibrado})`, color: "border-badge-vip/40 text-badge-vip bg-badge-vip/10" },
    { key: "zebra", label: `Zebra (${contadores.zebra})`, color: "border-error-red/40 text-error-red bg-error-red/10" },
  ];

  return (
    <div onClick={jogoAberto !== null ? fecharTudo : undefined} className={cn(jogoAberto !== null && "cursor-pointer")}>
      {/* Chips + Modo + Countdown */}
      <div className="space-y-2 mb-3" onClick={(e) => e.stopPropagation()}>
        {dataFechamento && <Countdown dataFechamento={dataFechamento} />}

        {/* Chips de filtro */}
        <div className="flex flex-wrap gap-1.5">
          {chips.map(({ key, label, color }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFiltro(key)}
              className={cn(
                "text-label-sm px-3 py-1 rounded-full border transition-all",
                filtro === key ? color : "border-border-subtle text-text-muted hover:border-outline"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Toggle Detalhado / Compacto */}
        <div className="flex bg-surface-container rounded-md p-0.5 w-fit">
          {(["detalhado", "compacto"] as Modo[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={cn(
                "text-label-sm px-3 py-1.5 rounded transition-all capitalize",
                modo === m ? "bg-surface-dark text-text-primary" : "text-text-muted"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Grade — jogos liberados */}
      <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
        {liberadosFiltrados.map((jogo) => (
          <MatchCard
            key={jogo.numero}
            jogo={jogo}
            analysisId={analysisId}
            usuarioLogado={usuarioLogado}
            modoCompacto={modo === "compacto"}
            aberto={jogoAberto === jogo.numero}
            onToggle={() => toggleJogo(jogo.numero)}
          />
        ))}
      </div>

      {/* Paywall */}
      {qtdBloqueados > 0 && filtro === "todos" && (
        <div className="mt-3">
          <PaywallCard
            jogosRestantes={qtdBloqueados}
            userState={userState}
            precoMensal={precoMensal}
          />
        </div>
      )}

      {/* Jogos bloqueados */}
      {filtro === "todos" && bloqueados.length > 0 && (
        <div className="space-y-1.5 mt-1.5">
          {bloqueados.map((jogo) => (
            <MatchCard key={"numero" in jogo ? jogo.numero : Math.random()} jogo={jogo} />
          ))}
        </div>
      )}
    </div>
  );
}
