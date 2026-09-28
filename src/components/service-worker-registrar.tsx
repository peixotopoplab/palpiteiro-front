"use client";

import { useEffect } from "react";

/**
 * Registra o service worker silenciosamente ao montar.
 * Não mostra nada ao usuário — só garante que o SW está ativo
 * para receber push notifications mesmo antes de o usuário
 * clicar no botão de ativar alertas.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Injeta config no SW para o evento push_clicado
        reg.active?.postMessage({
          type: "INIT_CONFIG",
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        });
      })
      .catch(() => {
        // Silencia — SW é progressivo, não bloqueia nada
      });
  }, []);

  return null;
}
