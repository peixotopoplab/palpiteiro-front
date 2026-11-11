"use client";

import { useEffect, useState } from "react";
import { LegalLink } from "@/components/legal-drawer";

/**
 * Banner de consentimento de cookies — aparece apenas pra visitantes
 * que ainda não aceitaram. Usa localStorage pra persistir a preferência.
 * Cartão flutuante discreto: acima da bottom nav no mobile, canto inferior esquerdo no desktop.
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
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed z-40 left-3 right-3 sm:right-auto sm:w-[340px] lg:left-4 bottom-[calc(68px+env(safe-area-inset-bottom,0px))] lg:bottom-4 rounded-lg border border-border-subtle bg-surface-dark/95 backdrop-blur shadow-lg px-3 py-2.5"
    >
      <div className="flex items-center gap-3">
        <p className="text-label-sm text-text-muted leading-snug">
          Usamos cookies essenciais.{" "}
          <LegalLink doc="privacidade" className="text-badge-vip underline underline-offset-2">
            Saiba mais
          </LegalLink>
        </p>
        <button
          onClick={aceitar}
          className="shrink-0 rounded-md border border-primary-container/60 text-tertiary text-label-sm font-semibold px-3 py-1.5 hover:bg-primary-container/20 transition-colors"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
