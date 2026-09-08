/**
 * Tipos do JSON schema v2.0 gerado pela skill `loteca`.
 * Fonte: /mnt/skills/user/loteca/SKILL.md — "Schema JSON v2.0 (unificado)".
 * Mantido em sincronia manual com a skill; qualquer mudança de schema lá
 * precisa ser refletida aqui.
 */

export type TipoAnalise =
  | "loteca_oficial"
  | "bolao_custom"
  | "jogo_individual"
  | "analise_resultados";

/** Coluna Loteca: "1" (mandante), "X" (empate), "2" (visitante), ou combinações
 *  como "1X", "X2", "12" (duplo) e "1X2" (triplo). */
export type Coluna = string;

export interface Jogo {
  numero: number;
  mandante: string;
  visitante: string;
  competicao: string;
  e_classico: boolean;
  posicao_mandante?: string;
  posicao_visitante?: string;
  forma_mandante?: string;
  forma_visitante?: string;
  h2h_6_jogos?: string;
  desfalques_mandante: string[];
  desfalques_visitante: string[];
  odds?: { "1": number; X: number; "2": number };
  probabilidades: { p1: number; pX: number; p2: number };
  p_base?: number;
  p_final?: number;
  coluna_recomendada: Coluna;
  coluna_segura?: Coluna;
  zebra_alerta: boolean;
  modificadores_ativos?: string[];
  justificativa_curta: string;
  justificativa_completa?: string;
}

export interface DuploAutomatico {
  jogo: number;
  times: string;
  opcoes: string[];
  cobertura_pct: number;
  score: number;
  motivo: string;
}

export interface VolanteRecomendado {
  colunas: Coluna[];
  probabilidade_acumulada: number;
  custo_estimado_duplos: number;
  custo_estimado_triplos: number;
}

export interface CalculoAposta {
  duplos: number;
  triplos: number;
  total_apostas: number;
  custo_total: number;
  valido: boolean;
  limite_caixa: number;
}

export interface AnaliseMeta {
  taxa_acerto_historico_13?: number;
  acertos_concurso_anterior?: number;
  valor_acumulado?: number;
}

/** Modos A/B/C — loteca_oficial, bolao_custom, jogo_individual */
export interface AnaliseJogos {
  schema_version: "2.0";
  tipo_analise: "loteca_oficial" | "bolao_custom" | "jogo_individual";
  concurso?: number;
  tipo_concurso?: string;
  data_analise: string;
  data_jogos: string;
  status: string;
  meta?: AnaliseMeta;
  jogos: Jogo[];
  duplo_automatico?: DuploAutomatico;
  volante_recomendado?: VolanteRecomendado;
  taxa_acerto_historico?: Record<string, string>;
  calculo_aposta?: CalculoAposta;
}

/** Modo D — analise_resultados (conferência de gabarito) */
export interface AnaliseResultados {
  schema_version: "2.0";
  tipo_analise: "analise_resultados";
  analise_referenciada: string;
  data_conferencia: string;
  gabarito: Array<{
    numero: number;
    mandante: string;
    visitante: string;
    coluna_recomendada: Coluna;
    resultado_real: string;
    acerto: boolean;
    modificadores_ativos_na_previsao?: string[];
  }>;
  taxa_acerto_rodada: number;
  taxa_acerto_acumulada_atualizada: number;
  leitura_modificadores?: Record<string, string>;
  resumo_curto: string;
}

export type Analise = AnaliseJogos | AnaliseResultados;

/** Deriva o tipo de badge (seco/duplo/triplo) a partir da coluna recomendada. */
export function tipoColuna(coluna: Coluna): "seco" | "duplo" | "triplo" {
  const len = coluna.replace(/[^1X2]/g, "").length;
  if (len >= 3) return "triplo";
  if (len === 2) return "duplo";
  return "seco";
}

/** true se a opção de coluna ("1" | "X" | "2") está contida na recomendação. */
export function colunaSelecionada(coluna_recomendada: Coluna, opcao: "1" | "X" | "2") {
  return coluna_recomendada.includes(opcao);
}
