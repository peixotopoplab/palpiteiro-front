import type { Jogo } from "@/types/analise";
import type { AnaliseParaExibicao, JogoExibicao } from "@/lib/queries";
import type { ColunaIdx, JogoMapa } from "@/types/mapa-rodada";

const CHAVE: Record<string, ColunaIdx> = { "1": 0, X: 1, x: 1, "2": 2 };

/** "12" -> [0, 2] · "X" -> [1] · "1X2" -> [0, 1, 2]. Ignora caracteres desconhecidos. */
export function colunasDe(coluna: string | null | undefined): ColunaIdx[] {
  const set = new Set<ColunaIdx>();
  for (const ch of (coluna ?? "").split("")) {
    const i = CHAVE[ch];
    if (i !== undefined) set.add(i);
  }
  return [...set].sort((a, b) => a - b);
}

function maisProvavel(p: { p1: number; pX: number; p2: number }): ColunaIdx {
  const m = Math.max(p.p1, p.pX, p.p2);
  return p.p1 === m ? 0 : p.pX === m ? 1 : 2;
}

/**
 * Converte os jogos já truncados por plano (getAnaliseBySlug) para o formato
 * enxuto do mapa. Jogo bloqueado vira só identidade; nada além disso é copiado.
 */
export function montarJogosMapa(jogos: JogoExibicao[]): JogoMapa[] {
  return jogos.map((j): JogoMapa => {
    const base = { numero: j.numero, mandante: j.mandante, visitante: j.visitante, competicao: j.competicao };
    if ("bloqueado" in j && j.bloqueado) return { ...base, bloqueado: true };

    const jogo = j as Jogo;
    const p = jogo.probabilidades;
    const indicada = colunasDe(jogo.coluna_recomendada);
    return {
      ...base,
      bloqueado: false,
      detalhe: {
        p1: p.p1,
        pX: p.pX,
        p2: p.p2,
        indicada: indicada.length ? indicada : [maisProvavel(p)],
        equilibrioAlto: !!jogo.modificadores_ativos?.includes("R01"),
        resumo: jogo.justificativa_curta,
      },
    };
  });
}

/**
 * Volante sugerido pelo modelo — SÓ para quem tem acesso VIP (analise.isVip já
 * reflete o acesso efetivo, incluindo trial). Usa o volante_recomendado da
 * análise; se não vier, cai na coluna recomendada de cada jogo. Retorna null
 * quando não há sugestão confiável (ex.: algum jogo sem coluna).
 */
export function montarSugestao(analise: AnaliseParaExibicao): ColunaIdx[][] | null {
  if (!analise.isVip) return null;
  const { jogos, volante_recomendado } = analise.dados;
  const colunas = volante_recomendado?.colunas;
  const fonte: string[] =
    Array.isArray(colunas) && colunas.length === jogos.length
      ? colunas
      : jogos.map((j) => ("bloqueado" in j && j.bloqueado ? "" : (j as Jogo).coluna_recomendada));
  const out = fonte.map(colunasDe);
  return out.every((c) => c.length > 0) ? out : null;
}
