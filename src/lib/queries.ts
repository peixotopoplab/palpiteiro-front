import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Analise, AnaliseJogos, Jogo } from "@/types/analise";

export type UserStatus = "free" | "vip";

export interface CurrentUser {
  id: string;
  nome: string;
  email: string;
  status: UserStatus;
}

/**
 * Usuário autenticado + perfil (public.users).
 * Retorna null pra guests — Guest-First: ausência de sessão é estado
 * válido (não é erro), tratado como Free sem conta no truncamento.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, nome, email, status")
    .eq("id", authUser.id)
    .single();

  return (profile as CurrentUser) ?? null;
});

export const JOGOS_LIBERADOS = 3;

/** Jogo com dados analíticos removidos — só identidade (times, competição, datas). */
export type JogoBloqueado = Pick<Jogo,
  "numero" | "mandante" | "visitante" | "competicao" | "e_classico"
> & { bloqueado: true };

export type JogoExibicao = Jogo | JogoBloqueado;

export interface AnaliseParaExibicao {
  id: string;
  slug: string;
  titulo: string;
  concurso_numero: number | null;
  publicado_em: string | null;
  dados: AnaliseJogos & { jogos: JogoExibicao[] };
  isVip: boolean;
  totalJogos: number;
}

export const getAnaliseBySlug = cache(async (
  slug: string,
  userStatus: UserStatus | null
): Promise<AnaliseParaExibicao | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("analyses")
    .select("id, slug, titulo, concurso_numero, publicado_em, json_data")
    .eq("slug", slug)
    .eq("status", "publicado")
    .single();

  if (error || !data) return null;

  const dadosCompletos = data.json_data as Analise;
  if (dadosCompletos.tipo_analise === "analise_resultados") return null;

  const totalJogos = dadosCompletos.jogos.length;
  const isVip = userStatus === "vip";

  /**
   * Truncamento granular server-side:
   * - VIP: recebe todos os dados completos.
   * - Guest/Free: jogos 1-3 completos; jogos 4-14 recebem só identidade
   *   (mandante, visitante, competição) — probabilidades, sugestão de coluna
   *   e leitura de especialista nunca chegam ao payload do navegador.
   */
  const jogos: JogoExibicao[] = dadosCompletos.jogos.map((jogo, idx) => {
    if (isVip || idx < JOGOS_LIBERADOS) return jogo;
    return {
      numero: jogo.numero,
      mandante: jogo.mandante,
      visitante: jogo.visitante,
      competicao: jogo.competicao,
      e_classico: jogo.e_classico,
      bloqueado: true as const,
    };
  });

  return {
    id: data.id,
    slug: data.slug,
    titulo: data.titulo,
    concurso_numero: data.concurso_numero,
    publicado_em: data.publicado_em,
    dados: { ...dadosCompletos, jogos } as AnaliseJogos & { jogos: JogoExibicao[] },
    isVip,
    totalJogos,
  };
});

/** Lista as N análises publicadas mais recentes (pra Home). */
export const getAnalises = cache(async (limite = 5) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("analyses")
    .select("id, slug, titulo, concurso_numero, publicado_em, tipo_analise")
    .eq("status", "publicado")
    .order("publicado_em", { ascending: false })
    .limit(limite);
  return data ?? [];
});

/** Lê preço/condições do produto VIP diretamente do banco. */
export const getProdutoVip = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("promotional_pricing")
    .select("nome, tipo_desconto, valor_desconto, valido_ate")
    .eq("ativo", true)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
});

// ================================================================
// Concurso vigente (confrontos do simulador)
// ================================================================
import type { ConcursoVigente, UserState } from "@/types/concurso";

export const getConcursoVigente = cache(async (): Promise<ConcursoVigente | null> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("concurso_vigente")
    .select("id, numero, data_fechamento, status, ultima_atualizacao, jogos")
    .order("numero", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as ConcursoVigente | null;
});

/**
 * Deriva o UserState a partir do CurrentUser.
 * guest  = sem sessão
 * free   = logado, plano free
 * vip    = logado, plano vip
 */
export function getUserState(user: CurrentUser | null): UserState {
  if (!user) return "guest";
  return user.status === "vip" ? "vip" : "free";
}
