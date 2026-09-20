"use client";

import { createContext, useContext, useState, useCallback, useEffect, Suspense, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthModal } from "@/components/auth-modal";
import { AssinaturaModal } from "@/components/assinatura-modal";
import type { UserState } from "@/types/concurso";

interface ModalConfig {
  tipo: "auth" | "assinatura";
  contexto?: string;
  userState?: UserState;
  precoMensal?: number;
}

interface AuthModalContextValue {
  abrirAuth: (contexto?: string) => void;
  abrirAssinatura: (opts?: { contexto?: string; userState?: UserState; precoMensal?: number }) => void;
  fecharModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue>({
  abrirAuth: () => {},
  abrirAssinatura: () => {},
  fecharModal: () => {},
});

export function useAuthModal() {
  return useContext(AuthModalContext);
}

// Isolado para usar useSearchParams (exige Suspense no App Router)
function AssinarWatcher({ onAssinar }: { onAssinar: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("assinar") === "1") {
      onAssinar();
      const url = new URL(window.location.href);
      url.searchParams.delete("assinar");
      router.replace(url.pathname + (url.search || ""), { scroll: false });
    }
  }, [searchParams, router, onAssinar]);

  return null;
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ModalConfig | null>(null);

  const abrirAuth = useCallback((contexto?: string) => {
    setConfig({ tipo: "auth", contexto });
  }, []);

  const abrirAssinatura = useCallback((opts?: { contexto?: string; userState?: UserState; precoMensal?: number }) => {
    setConfig({ tipo: "assinatura", ...opts });
  }, []);

  const fecharModal = useCallback(() => setConfig(null), []);

  return (
    <AuthModalContext.Provider value={{ abrirAuth, abrirAssinatura, fecharModal }}>
      {children}
      {/* Detecta ?assinar=1 na URL (CTA de e-mail para Free) */}
      <Suspense fallback={null}>
        <AssinarWatcher onAssinar={abrirAssinatura} />
      </Suspense>
      {config?.tipo === "auth" && (
        <AuthModal contexto={config.contexto} onClose={fecharModal} />
      )}
      {config?.tipo === "assinatura" && (
        <AssinaturaModal
          userState={config.userState ?? "guest"}
          precoMensal={config.precoMensal}
          contexto={config.contexto}
          onClose={fecharModal}
        />
      )}
    </AuthModalContext.Provider>
  );
}
