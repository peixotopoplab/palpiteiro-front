"use client";

import { useState, useCallback } from "react";
import { Copy, Share2, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  calcularVolante,
  volanteToQuery,
  type VolanteItem,
} from "@/lib/loteca-engine";
import type { ConcursoVigente, JogoConcurso } from "@/types/concurso";

const NOMES_COLUNA = { coluna1: "1", colunaX: "X", coluna2: "2" } as const;
type ColunaKey = keyof typeof NOMES_COLUNA;

function volanteVazio(n = 14): VolanteItem[] {
  return Array.from({ length: n }, (_, i) => ({
    jogoNumero: i + 1, coluna1: false, colunaX: false, coluna2: false,
  }));
}

function BannerFechado({ concurso }: { concurso: ConcursoVigente }) {
  const dataFechamento = concurso.data_fechamento
    ? new Date(concurso.data_fechamento).toLocaleString("pt-BR", {
        weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      })
    : null;
  return (
    <div className="flex items-start gap-3 rounded-md border border-error-red/30 bg-error-red/10 px-4 py-3">
      <AlertTriangle className="size-4 text-error-red shrink-0 mt-0.5" />
      <div>
        <p className="text-title-sm text-error-red">Concurso {concurso.numero} encerrado</p>
        <p className="text-body-md text-text-muted">
          Registros encerrados{dataFechamento ? ` em ${dataFechamento}` : ""}.
          O próximo concurso será carregado em breve.
        </p>
      </div>
    </div>
  );
}

function BannerSemDados() {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border-subtle bg-surface-container-lowest px-4 py-3">
      <RefreshCw className="size-4 text-text-muted shrink-0 mt-0.5" />
      <div>
        <p className="text-title-sm text-text-primary">Grade ainda não disponível</p>
        <p className="text-body-md text-text-muted">
          Os confrontos do próximo concurso ainda não foram publicados.
          Use o simulador em modo livre abaixo.
        </p>
      </div>
    </div>
  );
}

function BannerDesatualizado({ ultima }: { ultima: string }) {
  const hora = new Date(ultima).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex items-start gap-3 rounded-md border border-secondary/30 bg-secondary/10 px-4 py-3">
      <Clock className="size-4 text-secondary shrink-0 mt-0.5" />
      <p className="text-body-md text-text-muted">
        Grade atualizada às {hora}. Se os confrontos mudaram, aguarde a próxima sincronização.
      </p>
    </div>
  );
}

interface SimuladorClientProps {
  configuracaoInicial: VolanteItem[];
  concurso: ConcursoVigente | null;
}

export function SimuladorClient({ configuracaoInicial, concurso }: SimuladorClientProps) {
  const temJogos = concurso && concurso.jogos.length > 0;
  const jogosIniciais: VolanteItem[] = temJogos
    ? concurso!.jogos.map((_, i) =>
        configuracaoInicial[i] ?? { jogoNumero: i + 1, coluna1: false, colunaX: false, coluna2: false }
      )
    : (configuracaoInicial.length === 14 ? configuracaoInicial : volanteVazio());

  const [jogos, setJogos] = useState<VolanteItem[]>(jogosIniciais);
  const resultado = calcularVolante(jogos);

  const toggleColuna = useCallback((jogoNumero: number, coluna: ColunaKey) => {
    setJogos((prev) => prev.map((j) => j.jogoNumero === jogoNumero ? { ...j, [coluna]: !j[coluna] } : j));
  }, []);

  const limpar = useCallback(() => { setJogos((prev) => volanteVazio(prev.length)); }, []);

  const copiarVolante = useCallback(() => {
    const linhas = jogos.map((j) => {
      const confronto: JogoConcurso | undefined = concurso?.jogos[j.jogoNumero - 1];
      const colunas = (Object.keys(NOMES_COLUNA) as ColunaKey[]).filter((k) => j[k]).map((k) => NOMES_COLUNA[k]).join("");
      const label = confronto ? `${confronto.mandante} x ${confronto.visitante}` : `Jogo ${String(j.jogoNumero).padStart(2, "0")}`;
      return `${label}: ${colunas || "—"}`;
    });
    const resumo = resultado.valido ? `\nTotal: ${resultado.combinacoes} combinações — R$ ${resultado.valorTotal.toFixed(2).replace(".", ",")}` : "";
    navigator.clipboard.writeText(linhas.join("\n") + resumo);
  }, [jogos, resultado, concurso]);

  const compartilhar = useCallback(() => {
    const query = volanteToQuery(jogos);
    const url = `${window.location.origin}/simulador?p=${query}`;
    if (navigator.share) { navigator.share({ title: "Meu volante — Palpiteiro", url }); }
    else { navigator.clipboard.writeText(url); }
  }, [jogos]);

  const horaFechamento = concurso?.data_fechamento
    ? new Date(concurso.data_fechamento).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;
  const concursoClosed = concurso?.status === "fechado";

  return (
    <main className="container-content py-6 space-y-4 pb-36 lg:pb-20">
      <div>
        <h1 className="text-headline-lg text-text-primary">Simulador de Volante</h1>
        {concurso && (
          <p className="text-body-md text-text-muted mt-0.5">
            Concurso {concurso.numero}{horaFechamento && ` · Encerra ${horaFechamento}`}
          </p>
        )}
      </div>

      {!concurso && <BannerSemDados />}
      {concurso?.status === "fechado" && <BannerFechado concurso={concurso} />}
      {concurso?.status === "sem_dados" && <BannerSemDados />}
      {concurso?.status === "aberto" && !temJogos && <BannerDesatualizado ultima={concurso.ultima_atualizacao} />}

      <div className="sticky top-16 z-10 rounded-md border border-border-subtle bg-surface-dark/95 backdrop-blur px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        {[
          { label: "Secos", valor: String(resultado.secos), cor: "text-text-primary" },
          { label: "Duplos", valor: String(resultado.duplos), cor: "text-tertiary" },
          { label: "Triplos", valor: String(resultado.triplos), cor: "text-secondary" },
          { label: "Custo", valor: resultado.valido ? `R$\u00a0${resultado.valorTotal.toFixed(2).replace(".", ",")}` : "—", cor: resultado.valido ? "text-badge-vip" : "text-text-muted" },
        ].map(({ label, valor, cor }) => (
          <div key={label}>
            <p className={`text-metric-val ${cor}`}>{valor}</p>
            <p className="text-label-sm text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {resultado.erro && <p className="text-label-md text-error-red px-1">{resultado.erro}</p>}

      <div className="space-y-1">
        {jogos.map((jogo) => {
          const confronto: JogoConcurso | undefined = concurso?.jogos[jogo.jogoNumero - 1];
          const marcacoes = Number(jogo.coluna1) + Number(jogo.colunaX) + Number(jogo.coluna2);
          const tipo = marcacoes === 3 ? "triplo" : marcacoes === 2 ? "duplo" : marcacoes === 1 ? "seco" : null;
          return (
            <div key={jogo.jogoNumero} className={cn("flex items-center gap-2 rounded-default border bg-surface-dark px-3 py-2 transition-colors", concursoClosed ? "opacity-60 pointer-events-none border-border-subtle" : "border-border-subtle hover:bg-surface-hover")}>
              {confronto ? (
                <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_1fr] items-center gap-1">
                  <p className="text-label-sm text-text-primary truncate text-right">{confronto.mandante}</p>
                  <span className="text-label-sm text-text-muted shrink-0 px-1">×</span>
                  <p className="text-label-sm text-text-primary truncate text-left">{confronto.visitante}</p>
                </div>
              ) : (
                <span className="text-label-sm text-text-muted w-8 shrink-0 text-center">{String(jogo.jogoNumero).padStart(2, "0")}</span>
              )}
              <div className="flex gap-1 shrink-0">
                {(["coluna1", "colunaX", "coluna2"] as ColunaKey[]).map((coluna) => (
                  <button key={coluna} type="button" onClick={() => toggleColuna(jogo.jogoNumero, coluna)} disabled={concursoClosed}
                    className={cn("w-9 rounded-default py-2 text-label-md font-bold transition-all border cursor-pointer hover:scale-105 active:scale-95",
                      jogo[coluna] ? "bg-primary-container border-primary-container text-on-primary-container" : "bg-transparent border-border-subtle text-text-muted hover:border-outline hover:text-text-primary hover:bg-surface-hover"
                    )}>
                    {NOMES_COLUNA[coluna]}
                  </button>
                ))}
              </div>
              <span className={cn("text-label-sm w-10 text-right shrink-0", tipo === "triplo" ? "text-secondary" : tipo === "duplo" ? "text-tertiary" : tipo === "seco" ? "text-text-muted" : "text-error-red")}>
                {tipo ?? "—"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-border-subtle bg-surface-dark/95 backdrop-blur px-4 py-3">
        <div className="container-content flex gap-2">
          <Button variant="ghost" size="sm" onClick={copiarVolante} className="flex-1"><Copy className="size-4" /> Copiar</Button>
          <Button variant="ghost" size="sm" onClick={compartilhar} className="flex-1"><Share2 className="size-4" /> Compartilhar</Button>
          <Button variant="ghost" size="sm" onClick={limpar}>Limpar</Button>
        </div>
      </div>
    </main>
  );
}
