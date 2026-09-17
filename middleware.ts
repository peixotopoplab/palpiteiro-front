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
 *
 * Rate limiting simples para o endpoint de webhook do MP:
 * Aceita no máximo 30 requests por IP por minuto.
 * Requests inválidos (sem assinatura) são barrados pelo webhook handler mesmo assim —
 * isso reduz a superfície de probing e DoS no endpoint público.
 */

const ROTAS_PROTEGIDAS = ["/conta", "/historico"];

// Rate limit simples em memória — adequado para Vercel Edge/Serverless com
// instância única por região. Para multi-região, usar KV (Vercel KV ou Upstash).
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WEBHOOK = 30; // requests por janela
const RATE_LIMIT_JANELA_MS = 60 * 1000; // 1 minuto

function checkRateLimit(ip: string): boolean {
  const agora = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || agora > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: agora + RATE_LIMIT_JANELA_MS });
    return true; // permitido
  }

  if (entry.count >= RATE_LIMIT_WEBHOOK) {
    return false; // bloqueado
  }

  entry.count++;
  return true; // permitido
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Rate limiting no endpoint do webhook
  if (pathname === "/api/webhooks/mercadopago") {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (!checkRateLimit(ip)) {
      console.warn("[middleware] Rate limit atingido para IP:", ip);
      return new NextResponse("Too Many Requests", { status: 429 });
    }
    // Webhook não precisa de renovação de sessão — retorna direto
    return NextResponse.next({ request });
  }

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

