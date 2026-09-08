"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { criarPreferenciaVip } from "./mp-actions";

interface BotaoCheckoutProps {
  precoMensal?: number;
}

export function BotaoCheckout({ precoMensal }: BotaoCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const preco = precoMensal
    ? precoMensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : null;

  const handleClick = async () => {
    setLoading(true);
    setErro(null);
    try {
      const result = await criarPreferenciaVip();
      if (result.error) {
        setErro(result.error);
        return;
      }
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="gold"
        className="w-full"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Preparando checkout...
          </>
        ) : (
          preco ? `Assinar VIP — ${preco}/mês` : "Assinar VIP"
        )}
      </Button>
      {erro && <p className="text-label-md text-error-red text-center">{erro}</p>}
      <p className="text-label-sm text-text-muted text-center">
        Você será redirecionado para o Mercado Pago. PIX ou cartão de crédito.
      </p>
    </div>
  );
}
