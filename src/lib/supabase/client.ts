"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em Client Components.
 * Usa a chave anon — respeita RLS integralmente.
 * Nunca importar a service role key aqui (ela nem existe neste projeto,
 * ver env-vars-contract.md — é exclusiva do Admin).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
