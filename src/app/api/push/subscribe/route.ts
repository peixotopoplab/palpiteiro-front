import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/push/subscribe
 * Salva a subscription Web Push do dispositivo em push_subscriptions.
 * Usa service role para garantir insert mesmo com RLS (tabela tem política
 * insert para anon/authenticated, mas usar service role é mais robusto).
 *
 * Body: { endpoint, keys: { p256dh, auth }, userAgent? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, keys, userAgent } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Busca user_id da sessão atual (pode ser null para guests)
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const authHeader = request.headers.get("authorization");
    let userId: string | null = null;
    if (authHeader) {
      const { data } = await supabaseAnon.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = data.user?.id ?? null;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Upsert por endpoint — evita duplicatas se o usuário se inscreve mais de uma vez
    await supabase.from("push_subscriptions").upsert(
      {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_id: userId,
        user_agent: userAgent ?? request.headers.get("user-agent"),
        ativo: true,
        ultimo_uso: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/subscribe]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/**
 * DELETE /api/push/subscribe
 * Desativa a subscription (soft delete — mantém o registro para histórico).
 * Body: { endpoint }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json();
    if (!endpoint) return NextResponse.json({ error: "endpoint obrigatório" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    await supabase
      .from("push_subscriptions")
      .update({ ativo: false })
      .eq("endpoint", endpoint);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[push/unsubscribe]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
