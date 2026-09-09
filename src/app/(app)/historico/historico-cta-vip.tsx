"use client";

import { useAuthModal } from "@/components/auth-modal-provider";
import type { UserState } from "@/types/concurso";

export function HistoricoCTAVip({ userState }: { userState: UserState }) {
  const { abrirAssinatura } = useAuthModal();

  return (
    <button
      type="button"
      onClick={() => abrirAssinatura({
        contexto: "Acesse o histórico completo de todos os concursos anteriores.",
        userState,
      })}
      className="text-label-md text-badge-vip underline underline-offset-2 hover:text-secondary transition-colors"
    >
      Assinar VIP para ver tudo
    </button>
  );
}
