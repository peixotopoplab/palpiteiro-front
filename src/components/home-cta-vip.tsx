"use client";

import { useAuthModal } from "@/components/auth-modal-provider";
import type { UserState } from "@/types/concurso";

interface HomeCTAVipProps {
  userState: UserState;
  precoMensal?: number;
}

/**
 * CTA de assinatura VIP na Home.
 * guest → abre AssinaturaModal com cadastro inline
 * free  → abre AssinaturaModal direto no checkout
 * vip   → não renderiza (Home não monta esse componente)
 */
export function HomeCTAVip({ userState, precoMensal }: HomeCTAVipProps) {
  const { abrirAssinatura } = useAuthModal();

  const preco = precoMensal
    ? precoMensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : null;

  return (
    <div className="rounded-lg border border-badge-vip/30 bg-surface-dark p-4 space-y-3">
      <p className="text-label-sm text-badge-vip uppercase">Clube VIP Palpiteiro</p>
      <p className="text-headline-md text-text-primary">Análise completa dos 14 jogos</p>
      <p className="text-body-md text-text-muted">
        Probabilidades refinadas, secas estratégicas, duplos e triplos recomendados.
        Boletim enviado por e-mail antes do fechamento.
      </p>
      <ul className="space-y-1">
        {[
          "14 análises aprofundadas",
          "Estratégia de duplos e triplos",
          "Envio automático por e-mail",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2 text-body-md text-text-muted">
            <span className="text-tertiary">✓</span> {item}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => abrirAssinatura({
          contexto: "Desbloqueie a análise completa dos 14 jogos com probabilidades e alertas de zebra.",
          userState,
          precoMensal,
        })}
        className="w-full rounded-md bg-badge-vip text-surface-container-lowest font-bold text-title-sm py-3 hover:bg-[#c59f2d] transition-colors"
        style={{ boxShadow: "0 0 16px rgba(212,175,55,0.18)" }}
      >
        {userState === "guest"
          ? "Criar conta e assinar VIP"
          : preco
          ? `Assinar VIP — ${preco}/mês`
          : "Assinar VIP Agora"}
      </button>
    </div>
  );
}
