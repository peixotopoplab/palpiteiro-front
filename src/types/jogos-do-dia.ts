/**
 * Schema v1.0 — Jogos do Dia (análises avulsas, não-Loteca).
 * Separado do schema v2.0 da skill `loteca`.
 *
 * Diferenças principais em relação ao AnaliseJogos da Loteca:
 * - Sem seletor de volante (1/X/2)
 * - Com `horario` por jogo (campo obrigatório)
 * - `resultado_recomendado` em vez de `coluna_recomendada`
 * - 1 a 15 jogos (Loteca é sempre 14)
 * - Sem `calculo_aposta`, `volante_recomendado`, `duplo_automatico`
 */

export interface JogoDodia {
  numero: number;
  mandante: string;
  visitante: string;
  competicao: string;
  horario: string; // ISO 8601
  probabilidades: { p1: number; pX: number; p2: number };
  odds?: { "1": number; X: number; "2": number };
  resultado_recomendado: string; // "1" | "X" | "2" | "1X" | "12" | "X2" | "1X2"
  zebra_alerta: boolean;
  justificativa_curta: string;
  justificativa_completa?: string;
}

export interface JogosDoDiaData {
  schema_version: "1.0";
  titulo: string;
  data_jogos: string;
  jogos: JogoDodia[];
}

export interface JogosDoDiaPublicacao {
  id: string;
  slug: string;
  titulo: string;
  data_jogos: string;
  publicado_em: string | null;
  dados: JogosDoDiaData;
  totalJogos: number;
}

/** Jogo bloqueado para Free — só identidade visível */
export type JogoDoDiaBloqueado = Pick<
  JogoDodia,
  "numero" | "mandante" | "visitante" | "competicao" | "horario"
> & { bloqueado: true };

export type JogoDoDiaExibicao = JogoDodia | JogoDoDiaBloqueado;

export const JOGOS_DO_DIA_LIBERADOS_FREE = 2;

/** Formata horário ISO para exibição: "Sáb 19h00" */
export function formatarHorario(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  } catch {
    return iso;
  }
}
