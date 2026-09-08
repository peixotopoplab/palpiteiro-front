"use client";

import { useEffect, useState } from "react";
import { LegalLink } from "@/components/legal-drawer";

/**
 * Banner de consentimento de cookies — aparece apenas pra visitantes
 * que ainda não aceitaram. Usa localStorage pra persistir a preferência.
 * Posicionado acima da bottom nav (bottom-16 no mobile, bottom-0 no desktop).
 */
export function CookieBanner() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    let aceito = false;
    try {
      aceito = !!localStorage.getItem("cookie_consent_accepted");
    } catch {
      // localStorage indisponível (SSR ou modo privado restrito)
      aceito = true; // não exibe o banner se não consegue checar
    }
    if (!aceito) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisivel(true);
    }
  }, []);

  const aceitar = () => {
    try {
      localStorage.setItem("cookie_consent_accepted", "true");
    } catch {
      // silencia — se não conseguir salvar, o banner vai aparecer de novo
    }
    setVisivel(false);
  };

  if (!visivel) return null;

  return (
    <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-40 border-t border-border-subtle bg-surface-dark/98 backdrop-blur px-4 py-3">
      <div className="container-content flex items-center justify-between gap-4">
        <p className="text-body-md text-text-muted">
          Usamos cookies essenciais para funcionamento do app. Ao continuar, você concorda
          com nossa{" "}
          <LegalLink doc="privacidade" className="text-badge-vip underline underline-offset-2">
            Política de Privacidade
          </LegalLink>
          .
        </p>
        <button
          onClick={aceitar}
          className="shrink-0 rounded-md bg-primary-container text-on-primary-container text-label-md font-semibold px-4 py-2 hover:bg-[#176839] transition-colors"
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
