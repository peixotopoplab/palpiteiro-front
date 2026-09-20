import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Callback PKCE do Supabase Auth.
 *
 * Obrigatório porque @supabase/ssr usa PKCE por padrão. Sem essa rota:
 * - Reset de senha não completa sessão (link do e-mail vai para /404)
 * - Confirmação de cadastro não ativa a conta
 *
 * Fluxo:
 * 1. Supabase envia e-mail com link para /auth/callback?code=...
 * 2. Esta rota troca o code por uma sessão real
 * 3. Redireciona para /entrar/redefinir (reset) ou / (confirmação)
 *
 * Configurar no Supabase → Authentication → URL Configuration → Redirect URLs:
 *   https://palpiteiro-front.vercel.app/auth/callback
 *   http://localhost:3001/auth/callback
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/entrar?erro=link_invalido`);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          response.cookies.delete("_temp");
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const response = NextResponse.redirect(
    next.startsWith("/") ? `${origin}${next}` : `${origin}/`
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession falhou:", error.message);
    return NextResponse.redirect(`${origin}/entrar?erro=link_expirado`);
  }

  return response;
}
