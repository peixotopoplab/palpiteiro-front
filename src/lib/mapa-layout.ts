/**
 * Layout do campo do Mapa da rodada: posiciona marcadores (círculos de raio 10)
 * sem sobreposição, tentando primeiro o x desejado e só então deslocando na
 * horizontal, SEM sair da zona da coluna (a zona é o significado do gráfico).
 * Função pura — testada em separado do componente.
 */
export interface Alvo {
  id: string;
  x: number;
}

export const CAMPO = {
  centroY: 77,
  /** distância mínima entre centros (raio 10 + folga) */
  distMin: 21,
  /** y candidatos: do rótulo da zona até o fim do campo */
  ys: Array.from({ length: 15 }, (_, i) => 38 + i * 6),
  /** faixa de x utilizável por zona (col 1, X, col 2) */
  zonas: [[18, 112], [128, 232], [248, 342]] as const,
} as const;

const DESLOCAMENTOS = [0, 7, -7, 14, -14, 21, -21, 28, -28, 35, -35, 42, -42, 49, -49, 56, -56, 63, -63, 70, -70, 77, -77, 84, -84];

export function empilhar(alvos: Alvo[]): Map<string, { x: number; y: number }> {
  const ys = [...CAMPO.ys].sort((a, b) => Math.abs(a - CAMPO.centroY) - Math.abs(b - CAMPO.centroY) || a - b);
  const colocados: { id: string; x: number; y: number }[] = [];

  for (const a of alvos) {
    const [x0, x1] = CAMPO.zonas[a.x < 122 ? 0 : a.x < 238 ? 1 : 2];
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
