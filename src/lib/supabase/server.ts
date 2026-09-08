import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para uso em Server Components / Server Actions.
 * Lê e escreve os cookies de sessão do usuário via next/headers.
 * Também usa só a chave anon — respeita RLS. A leitura de dados
 * "completos vs truncados" (Free vê 3 jogos) acontece aqui, na camada
 * de aplicação, nunca no client.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll chamado de um Server Component (sem permissão de escrita).
            // Inofensivo se houver middleware renovando a sessão.
          }
        },
      },
    }
  );
}
