/**
 * Geometria e layout do campo do Mapa da rodada (viewBox 360 x 140).
 * Funções puras — testadas em separado do componente.
 *
 *  ┌ banco ┐ ┌──────── campo (3 zonas) ────────┐ ┌ banco ┐
 *  │ 1 – 7 │ │  Col 1   │   Col X   │  Col 2   │ │ 8 – 14│
 *  └───────┘ └──────────────────────────────────┘ └───────┘
 */
import type { ColunaIdx } from "@/types/mapa-rodada";

export const CAMPO = {
  centroX: 180,
  centroY: 70,
  /** distância mínima entre centros (raio 7,5 + folga) */
  distMin: 17,
  /** y candidatos: abaixo do rótulo da zona até o fim do campo */
  ys: Array.from({ length: 19 }, (_, i) => 32 + i * 5),
} as const;

type Faixa = readonly [number, number];

/** Geometria do gramado: com banco lateral ele é mais estreito; sem banco ocupa a largura toda. */
export interface Geometria {
  comBanco: boolean;
  /** retângulo do gramado */
  x0: number;
  w: number;
  /** x central de cada zona (col 1, X, col 2) — onde caem os palpites do modo volante */
  zx: readonly [number, number, number];
  /** faixa de x utilizável em cada zona (margem de 8 = raio + folga) */
  zonas: readonly [Faixa, Faixa, Faixa];
  /** linhas que separam as zonas */
  divisorias: readonly [number, number];
}

export function geometria(comBanco: boolean): Geometria {
  const x0 = comBanco ? 36 : 8;
  const w = comBanco ? 288 : 344;
  const t = w / 3;
  const d1 = x0 + t;
  const d2 = x0 + 2 * t;
  const m = 8;
  return {
    comBanco, x0, w,
    zx: [x0 + t / 2, CAMPO.centroX, x0 + w - t / 2],
    zonas: [[x0 + m, d1 - m], [d1 + m, d2 - m], [d2 + m, x0 + w - m]],
    divisorias: [d1, d2],
  };
}

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
export function xModelo(col: ColunaIdx, prob: number, numero: number, g: Geometria): number {
  const s = Math.min(1, Math.max(0, (prob - 33) / 37));
  if (col === 0) return g.zonas[0][1] - s * (g.zonas[0][1] - g.zonas[0][0] - 2);
  if (col === 2) return g.zonas[2][0] + s * (g.zonas[2][1] - g.zonas[2][0] - 2);
  return CAMPO.centroX + jitterX(numero);
}

export interface Alvo { id: string; x: number }

const DESLOCAMENTOS = [0, 7, -7, 14, -14, 21, -21, 28, -28, 35, -35, 42, -42, 49, -49, 56, -56, 63, -63, 70, -70];

/**
 * Posiciona marcadores sem sobreposição: tenta o x desejado e, só se não couber,
 * desloca na horizontal SEM sair da zona (a zona é o significado do gráfico).
 */
export function empilhar(alvos: Alvo[], g: Geometria): Map<string, { x: number; y: number }> {
  const ys = [...CAMPO.ys].sort((a, b) => Math.abs(a - CAMPO.centroY) - Math.abs(b - CAMPO.centroY) || a - b);
  const colocados: { id: string; x: number; y: number }[] = [];

  for (const a of alvos) {
    const [x0, x1] = g.zonas[a.x < g.divisorias[0] ? 0 : a.x < g.divisorias[1] ? 1 : 2];
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
