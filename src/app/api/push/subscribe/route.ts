import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validarInscricao, validarRemocao, origemPermitida, LIMITES } from "@/lib/push-validacao";
import { inscrever, remover, type PushDb } from "@/lib/push-inscricao";

/**
 * /api/push/subscribe — rota PÚBLICA que usa a service role.
 * Por isso: valida origem, tamanho e formato de tudo (src/lib/push-validacao.ts), só aceita
 * endpoints de serviços de push conhecidos (evita SSRF no envio feito pelo Admin) e aplica
 * regras de posse (src/lib/push-inscricao.ts). Rate limit por IP no middleware.
 */

const respostaErro = (status: number, error: string) => NextResponse.json({ error }, { status });

function bancoServiceRole(): PushDb {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const t = "push_subscriptions";
  return {
    async buscar(endpoint) {
      const { data, error } = await supabase.from(t).select("endpoint, auth, user_id, ativo").eq("endpoint", endpoint).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    async inserir(l) {
      const { error } = await supabase.from(t).insert({ ...l, ativo: true, ultimo_uso: new Date().toISOString() });
      if (error?.code === "23505") return "duplicado";
      if (error) throw new Error(error.message);
      return "ok";
    },
    async atualizar(l, authAtual) {
      // condição no próprio UPDATE: só mexe se a linha ainda for do mesmo dono OU estiver inativa
      const { data, error } = await supabase
        .from(t)
        .update({ p256dh: l.p256dh, auth: l.auth, user_id: l.user_id, user_agent: l.user_agent, ativo: true, ultimo_uso: new Date().toISOString() })
        .eq("endpoint", l.endpoint)
        .or(`auth.eq.${authAtual},ativo.eq.false`) // authAtual veio do banco; a entrada já passou por validação base64url
        .select("endpoint");
      if (error) throw new Error(error.message);
      return data?.length ?? 0;
    },
    async desativar(endpoint, auth) {
      const { data, error } = await supabase.from(t).update({ ativo: false }).eq("endpoint", endpoint).eq("auth", auth).select("endpoint");
      if (error) throw new Error(error.message);
      return data?.length ?? 0;
    },
  };
}

/** Lê o corpo com limite de tamanho; devolve o JSON ou o erro HTTP correspondente. */
async function lerCorpo(request: NextRequest): Promise<{ corpo: unknown } | { status: number; erro: string }> {
  const texto = await request.text();
  if (texto.length > LIMITES.corpo) return { status: 413, erro: "Corpo muito grande" };
  try { return { corpo: JSON.parse(texto) }; } catch { return { status: 400, erro: "JSON inválido" }; }
}

async function usuarioDaRequisicao(request: NextRequest): Promise<string | null> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  try {
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data } = await anon.auth.getUser(token);
    return data.user?.id ?? null;
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  if (!origemPermitida(request.headers.get("origin"), request.headers.get("host"))) return respostaErro(403, "Origem não permitida");
  try {
    const lido = await lerCorpo(request);
    if (!("corpo" in lido)) return respostaErro(lido.status, lido.erro);
    const v = validarInscricao(lido.corpo);
    if (!v.ok) return respostaErro(400, v.erro);

    const r = await inscrever(bancoServiceRole(), v.valor, await usuarioDaRequisicao(request));
    return NextResponse.json(r.corpo, { status: r.status });
  } catch (err) {
    console.error("[push/subscribe]", err instanceof Error ? err.message : err);
    return respostaErro(500, "Erro interno");
  }
}

export async function DELETE(request: NextRequest) {
  if (!origemPermitida(request.headers.get("origin"), request.headers.get("host"))) return respostaErro(403, "Origem não permitida");
  try {
    const lido = await lerCorpo(request);
    if (!("corpo" in lido)) return respostaErro(lido.status, lido.erro);
    const v = validarRemocao(lido.corpo);
    if (!v.ok) return respostaErro(400, v.erro);

    const r = await remover(bancoServiceRole(), v.valor.endpoint, v.valor.auth);
    return NextResponse.json(r.corpo, { status: r.status });
  } catch (err) {
    console.error("[push/unsubscribe]", err instanceof Error ? err.message : err);
    return respostaErro(500, "Erro interno");
  }
}
