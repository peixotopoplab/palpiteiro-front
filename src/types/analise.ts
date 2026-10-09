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
  // odds removido — não existe por jogo no schema real (só probabilidades)
  probabilidades: { p1: number; pX: number; p2: number };
  p_base?: number;
  p_final?: number;
  coluna_recomendada: Coluna;
  coluna_segura?: Coluna;
  /** zebra_alerta removido — sinal real: modificadores_ativos inclui "R01" ou similar */
  modificadores_ativos?: string[];
  justificativa_curta: string;
  justificativa_completa?: string;
}

export interface DuploAutomatico {
  jogo: number;
  times: string;
  opcoes: string[];
  motivo: string;
  // cobertura_pct e score removidos — não existem no schema real da skill
}

export interface VolanteRecomendado {
  colunas: Coluna[];
  custo_estimado_duplos: number;
  custo_estimado_triplos: number;
  // probabilidade_acumulada removido — não existe no schema real da skill
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

/** Jogo bloqueado para Free — só identidade visível */
export type JogoBloqueado = Pick<Jogo, "numero" | "mandante" | "visitante" | "competicao"> & { bloqueado: true };

/** União de jogo liberado e bloqueado — usado na grade da análise */
export type JogoExibicao = Jogo | JogoBloqueado;

/**
 * Formata data_jogos para exibição.
 * Trata intervalos ("2026-09-26/27") e datas simples ("2026-09-26").
 * new Date("2026-09-26/27") retorna Invalid Date — esta função é segura.
 */
export function formatarDataJogos(data_jogos: string): string {
  try {
    // Intervalo: "2026-09-26/27" — usa apenas a primeira data
    const dataPrincipal = data_jogos.includes("/")
      ? data_jogos.split("/")[0]
      : data_jogos;
    // Adiciona horário para evitar off-by-one de fuso
    return new Date(dataPrincipal + "T12:00:00").toLocaleDateString("pt-BR", {
      weekday: "long", day: "2-digit", month: "long",
    });
  } catch {
    return data_jogos; // fallback: exibe o string original
  }
}

/** Deriva o tipo de badge (seco/duplo/triplo) a partir da coluna recomendada. */
export function tipoColuna(coluna: Coluna): "seco" | "duplo" | "triplo" {
  const len = coluna.replace(/[^1X2]/g, "").length;
  if (len >= 3) return "triplo";
  if (len === 2) return "duplo";
  return "seco";
}

/** true se a opção de coluna ("1" | "X" | "2") está contida na recomendação.
 *  Usa busca de caractere exato — evita falso positivo de "12".includes("1") === true
 *  quando a recomendação é duplo "12" mas queremos saber se "1" ou "2" individualmente. */
export function colunaSelecionada(coluna_recomendada: Coluna, opcao: "1" | "X" | "2") {
  // Split em caracteres individuais: "1X2" → ["1","X","2"]
  return coluna_recomendada.split("").includes(opcao);
}
