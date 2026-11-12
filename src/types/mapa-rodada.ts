/** 0 = coluna 1 (mandante) · 1 = coluna X (empate) · 2 = coluna 2 (visitante) */
export type ColunaIdx = 0 | 1 | 2;

/**
 * Jogo no formato enxuto do Mapa da rodada (Home).
 * `detalhe` só existe quando o jogo está liberado para o usuário — o gating
 * acontece no servidor (montarJogosMapa); o navegador nunca recebe dados
 * de jogos bloqueados.
 */
export interface JogoMapa {
  numero: number;
  mandante: string;
  visitante: string;
  competicao: string;
  bloqueado: boolean;
  detalhe?: {
    p1: number;
    pX: number;
    p2: number;
    /** Colunas recomendadas pelo modelo (1 a 3; mais de uma = duplo/triplo). */
    indicada: ColunaIdx[];
    /** Modificador R01 (equilíbrio altíssimo) — o sinal real de "zebra". */
    equilibrioAlto: boolean;
    resumo?: string;
  };
}
