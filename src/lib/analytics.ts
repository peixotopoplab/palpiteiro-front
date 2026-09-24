/**
 * analytics.ts — gravação de eventos de uso no Supabase.
 *
 * Insert direto com chave anon (RLS permite insert para anon/authenticated).
 * O Front nunca lê de volta — só grava. Erros são silenciados para não
 * afetar a experiência do usuário.
 *
 * Regra de privacidade: eventos existem só para métricas de produto
 * (funil Free/VIP, top análises). O Admin nunca expõe histórico individual.
 */

import { createBrowserClient } from "@supabase/ssr";

type TipoEvento =
  | "analise_visualizada"
  | "simulador_usado"
  | "vip_convertido"
  | "vip_cancelado"
  | "cupom_usado"
  | "push_clicado"
  | "login";

interface EventoPayload {
  tipo_evento: TipoEvento;
  user_id?: string | null;
  metadata?: Record<string, unknown>;
}

function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function obterSessionId(): string {
  try {
    let id = localStorage.getItem("palpiteiro_session_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("palpiteiro_session_id", id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

export async function registrarEvento({
  tipo_evento,
  user_id,
  metadata,
}: EventoPayload): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const sessionId = user_id ? null : obterSessionId();

    await supabase.from("usage_events").insert({
      tipo_evento,
      user_id: user_id ?? null,
      session_id: sessionId,
      metadata: metadata ?? null,
    });
  } catch {
    // Silencia — analytics nunca quebra a UX
  }
}
