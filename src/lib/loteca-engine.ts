/**
 * Motor de cálculo oficial da Loteca — regras da Caixa Econômica Federal.
 *
 * Fórmulas:
 *   Combinações = 2^D × 3^T  (D = duplos, T = triplos)
 *   Valor Total  = Combinações × R$ 2,00
 *
 * Teto máximo: 864 combinações = R$ 1.728,00 por bilhete.
 * Mínimo obrigatório: 1 duplo (2 combinações = R$ 4,00).
 */

export interface VolanteItem {
  jogoNumero: number;
  coluna1: boolean;
  colunaX: boolean;
  coluna2: boolean;
}

export interface CalculoVolanteResult {
  duplos: number;
  triplos: number;
  secos: number;
  combinacoes: number;
  valorTotal: number;
  valido: boolean;
  erro?: string;
}

/** Máximo de duplos permitidos por quantidade de triplos (tabela oficial Caixa). */
const LIMITE_DUPLOS: Record<number, number> = {
  0: 9,
  1: 8,
  2: 6,
  3: 5,
  4: 3,
  5: 1,
  6: 0,
};

export const CUSTO_POR_COMBINACAO = 2.0; // R$
export const TETO_MAXIMO_VALOR = 1728.0; // R$
export const MAX_TRIPLOS = 6;

export function calcularVolante(jogos: VolanteItem[]): CalculoVolanteResult {
  if (jogos.length !== 14) {
    return {
      duplos: 0, triplos: 0, secos: 0,
      combinacoes: 0, valorTotal: 0, valido: false,
      erro: "O volante deve conter exatamente 14 jogos.",
    };
  }

  let secos = 0, duplos = 0, triplos = 0;

  for (const jogo of jogos) {
    const marcacoes = Number(jogo.coluna1) + Number(jogo.colunaX) + Number(jogo.coluna2);
    if (marcacoes === 0) {
      return {
        duplos, triplos, secos, combinacoes: 0, valorTotal: 0, valido: false,
        erro: `Jogo ${jogo.jogoNumero} sem marcação.`,
      };
    }
    if (marcacoes === 1) secos++;
    else if (marcacoes === 2) duplos++;
    else triplos++;
  }

  if (duplos === 0 && triplos === 0) {
    return {
      duplos, triplos, secos, combinacoes: 1,
      valorTotal: CUSTO_POR_COMBINACAO, valido: false,
      erro: "Aposta mínima exige pelo menos 1 duplo (R$ 4,00).",
    };
  }

  if (triplos > MAX_TRIPLOS) {
    return {
      duplos, triplos, secos, combinacoes: 0, valorTotal: 0, valido: false,
      erro: `Máximo de ${MAX_TRIPLOS} triplos por volante.`,
    };
  }

  const limiteDuplos = LIMITE_DUPLOS[triplos];
  if (duplos > limiteDuplos) {
    return {
      duplos, triplos, secos, combinacoes: 0, valorTotal: 0, valido: false,
      erro: `Com ${triplos} triplo(s), limite máximo é ${limiteDuplos} duplo(s).`,
    };
  }

  const combinacoes = Math.pow(2, duplos) * Math.pow(3, triplos);
  const valorTotal = combinacoes * CUSTO_POR_COMBINACAO;

  if (valorTotal > TETO_MAXIMO_VALOR) {
    return {
      duplos, triplos, secos, combinacoes, valorTotal, valido: false,
      erro: `Ultrapassa o teto oficial de R$ 1.728,00.`,
    };
  }

  return { duplos, triplos, secos, combinacoes, valorTotal, valido: true };
}

/**
 * Converte string de parâmetro de URL em array de VolanteItem.
 * Formato: "1,1X,2,1,X,12,1,2,X,1,1X2,1,X,2"
 * "1" = coluna1, "X" = empate, "2" = coluna2, combinações como "1X", "12", "1X2".
 */
export function parseQueryToVolante(param: string | undefined): VolanteItem[] {
  const vazio = Array.from({ length: 14 }, (_, i) => ({
    jogoNumero: i + 1,
    coluna1: false,
    colunaX: false,
    coluna2: false,
  }));

  if (!param) return vazio;

  const partes = param.split(",");
  if (partes.length !== 14) return vazio;

  return partes.map((parte, i) => ({
    jogoNumero: i + 1,
    coluna1: parte.includes("1"),
    colunaX: parte.includes("X") || parte.includes("x"),
    coluna2: parte.includes("2"),
  }));
}

/** Converte VolanteItem[] de volta pra string de URL. */
export function volanteToQuery(jogos: VolanteItem[]): string {
  return jogos.map((j) => {
    let s = "";
    if (j.coluna1) s += "1";
    if (j.colunaX) s += "X";
    if (j.coluna2) s += "2";
    return s || "0";
  }).join(",");
}
