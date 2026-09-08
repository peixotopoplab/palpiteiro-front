import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware Guest-First (Lazy Auth).
 *
 * Rotas PÚBLICAS (guest acessa sem login):
 *   /                  — Home
 *   /analise/[slug]    — Análise (truncamento Free/VIP é server-side na página)
 *   /entrar            — Login/cadastro
 *   /glossario         — Glossário do modelo
 *
 * Rotas PROTEGIDAS (redirect pra /entrar se não autenticado):
 *   /conta             — Minha conta / assinatura
 *   /historico         — Histórico de concursos
 *
 * /simulador é PÚBLICO — guest pode usar, mas salvar simulação abre modal de cadastro.
 */

const ROTAS_PROTEGIDAS = ["/conta", "/historico"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Renova sessão em todas as rotas (necessário pro SSR do Supabase funcionar)
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const rotaProtegida = ROTAS_PROTEGIDAS.some((r) => pathname.startsWith(r));

  if (rotaProtegida && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
