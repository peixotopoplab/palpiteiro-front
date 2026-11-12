/**
 * Geometria e layout do campo do Mapa da rodada (viewBox 360 x 140).
 * Funções puras — testadas em separado do componente.
 *
 *  ┌ banco ┐ ┌──────── campo (3 zonas) ────────┐ ┌ banco ┐
 *  │ 1 – 7 │ │  Col 1   │   Col X   │  Col 2   │ │ 8 – 14│
 *  └───────┘ └──────────────────────────────────┘ └───────┘
 */
import type { ColunaIdx } from "@/types/mapa-rodada";

/** x central de cada zona (col 1, X, col 2) — onde caem os palpites do modo volante. */
export const ZX = [84, 180, 276] as const;

export const CAMPO = {
  centroX: 180,
  centroY: 70,
  /** distância mínima entre centros (raio 7,5 + folga) */
  distMin: 17,
  /** y candidatos: abaixo do rótulo da zona até o fim do campo */
  ys: Array.from({ length: 19 }, (_, i) => 32 + i * 5),
  /** faixa de x utilizável em cada zona */
  zonas: [[44, 124], [140, 220], [236, 316]] as const,
  /** linhas que separam as zonas */
  divisorias: [132, 228] as const,
} as const;

/** Colunas laterais do banco de reservas: jogos 1–7 à esquerda, 8–14 à direita. */
export const BANCO = { xEsq: 18, xDir: 342, y0: 17, passo: 17.7 } as const;

/** Posição FIXA do jogo i no banco (não muda quando outros jogos saem do banco). */
export function slot(i: number, total: number): { x: number; y: number } {
  const metade = Math.ceil(total / 2);
  const esquerda = i < metade;
  const k = esquerda ? i : i - metade;
  return { x: esquerda ? BANCO.xEsq : BANCO.xDir, y: BANCO.y0 + k * BANCO.passo };
}

interface Prob { p1: number; pX: number; p2: number; indicada: ColunaIdx[] }

/** Coluna onde o jogo fica no campo: a mais provável entre as indicadas pelo modelo. */
export function colunaPrincipal(d: Prob): ColunaIdx {
  const probs = [d.p1, d.pX, d.p2];
  return d.indicada.reduce<ColunaIdx>((m, c) => (probs[c] > probs[m] ? c : m), d.indicada[0]);
}

/** Desvio horizontal determinístico por jogo (evita pilha vertical perfeita). */
export const jitterX = (numero: number) => (((numero * 37) % 61) - 30) * 0.7;

/** x do marcador no modo Modelo: dentro da zona; mais forte = mais perto do gol. */
export function xModelo(col: ColunaIdx, prob: number, numero: number): number {
  const s = Math.min(1, Math.max(0, (prob - 33) / 37));
  if (col === 0) return 124 - s * 78;
  if (col === 2) return 236 + s * 78;
  return CAMPO.centroX + jitterX(numero);
}

export interface Alvo { id: string; x: number }

const DESLOCAMENTOS = [0, 7, -7, 14, -14, 21, -21, 28, -28, 35, -35, 42, -42, 49, -49, 56, -56, 63, -63, 70, -70];

/**
 * Posiciona marcadores sem sobreposição: tenta o x desejado e, só se não couber,
 * desloca na horizontal SEM sair da zona (a zona é o significado do gráfico).
 */
export function empilhar(alvos: Alvo[]): Map<string, { x: number; y: number }> {
  const ys = [...CAMPO.ys].sort((a, b) => Math.abs(a - CAMPO.centroY) - Math.abs(b - CAMPO.centroY) || a - b);
  const colocados: { id: string; x: number; y: number }[] = [];

  for (const a of alvos) {
    const [x0, x1] = CAMPO.zonas[a.x < CAMPO.divisorias[0] ? 0 : a.x < CAMPO.divisorias[1] ? 1 : 2];
    let escolhido: { x: number; y: number } | null = null;
    let melhorFolga = -1;
    let melhorFallback = { x: Math.min(x1, Math.max(x0, a.x)), y: ys[0] };

    busca: for (const d of DESLOCAMENTOS) {
      const x = Math.min(x1, Math.max(x0, a.x + d));
      for (const y of ys) {
        const folga = colocados.reduce((m, c) => Math.min(m, Math.hypot(c.x - x, c.y - y)), Infinity);
        if (folga >= CAMPO.distMin) { escolhido = { x, y }; break busca; }
        if (folga > melhorFolga) { melhorFolga = folga; melhorFallback = { x, y }; }
      }
    }
    colocados.push({ id: a.id, ...(escolhido ?? melhorFallback) });
  }
  return new Map(colocados.map((c) => [c.id, { x: c.x, y: c.y }]));
}
