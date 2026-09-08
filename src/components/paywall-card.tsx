"use client";

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/components/auth-modal-provider";
import type { UserState } from "@/types/concurso";

interface PaywallCardProps {
  jogosRestantes: number;
  userState: UserState;
  precoMensal?: number;
}

/**
 * Paywall que aparece após os jogos liberados na análise.
 * Comportamento por estado:
 * - guest: abre AssinaturaModal com cadastro inline
 * - free:  abre AssinaturaModal direto no checkout (sem cadastro)
 * - vip:   nunca renderiza (página não chama esse componente pra VIP)
 */
export function PaywallCard({ jogosRestantes, userState, precoMensal }: PaywallCardProps) {
  const { abrirAssinatura } = useAuthModal();

  const preco = precoMensal
    ? precoMensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : null;

  const labelBotao =
    userState === "guest"
      ? "Criar conta e assinar VIP"
      : preco
      ? `Assinar VIP — ${preco}/mês`
      : "Assinar VIP";

  const contexto = `Desbloqueie os ${jogosRestantes} ${jogosRestantes === 1 ? "jogo" : "jogos"} restantes com probabilidades completas e alertas de zebra.`;

  return (
    <div className="rounded-lg border border-badge-vip/40 bg-surface-dark p-5 space-y-3 text-center">
      <Lock className="size-5 mx-auto text-badge-vip" strokeWidth={2} />

      <p className="text-headline-md text-text-primary">
        +{jogosRestantes} {jogosRestantes === 1 ? "jogo" : "jogos"} com análise completa
      </p>

      <p className="text-body-md text-text-muted">
        Probabilidades refinadas, secas estratégicas, duplos e triplos recomendados.
        Boletim enviado por e-mail antes do fechamento.
      </p>

      <Button
        variant="gold"
        className="w-full"
        onClick={() => abrirAssinatura({ contexto, userState, precoMensal })}
      >
        {labelBotao}
      </Button>

      {/* "Já tem conta?" só faz sentido para guest */}
      {userState === "guest" && (
        <p className="text-label-sm text-text-muted">
          Já tem conta?{" "}
          <button
            type="button"
            className="text-primary underline underline-offset-2"
            onClick={() => abrirAssinatura({ contexto, userState: "guest", precoMensal })}
          >
            Entrar
          </button>
        </p>
      )}
    </div>
  );
}
