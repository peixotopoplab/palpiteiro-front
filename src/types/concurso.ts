/**
 * Estado unificado do usuário — propaga por todos os CTAs e componentes
 * de gating. Diferencia visitante de free logado (distinção que importa
 * pra conversão: visitante precisa de cadastro, free só de checkout).
 */
export type UserState = "guest" | "free" | "vip";

export interface JogoConcurso {
  numero: number;
  mandante: string;
  visitante: string;
  competicao: string;
  horario?: string; // ISO 8601 ou "Sáb 14:00"
}

export type ConcursoStatus = "aberto" | "fechado" | "sem_dados";

export interface ConcursoVigente {
  id: string;
  numero: number;
  data_fechamento: string | null;
  status: ConcursoStatus;
  ultima_atualizacao: string;
  jogos: JogoConcurso[];
}
