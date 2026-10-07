"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

type StatusPagamento = "sucesso" | "falha" | "pendente";

interface PagamentoRetornoProps {
  status: StatusPagamento;
}

/**
 * Componente client renderizado apenas quando o usuário retorna do checkout MP.
 *
 * Para "sucesso": faz polling do status VIP a cada 3s por até 30s.
 * Quando o webhook ativar o VIP, recarrega a página automaticamente.
 *
 * Para "falha" e "pendente": mostra feedback claro com CTA adequado.
 */
export function PagamentoRetorno({ status }: PagamentoRetornoProps) {
  const router = useRouter();
  const [vipAtivado, setVipAtivado] = useState(false);
  const [tentativas, setTentativas] = useState(0);
  const MAX_TENTATIVAS = 10; // 10 × 3s = 30s de polling

  useEffect(() => {
    if (status !== "sucesso") return;
    if (vipAtivado) return;
    if (tentativas >= MAX_TENTATIVAS) return;

    const timer = setTimeout(async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("users")
          .select("status")
          .eq("id", user.id)
          .single();

        if (data?.status === "vip") {
          setVipAtivado(true);
          // Recarrega para mostrar o estado VIP completo
          router.refresh();
        } else {
          setTentativas((t) => t + 1);
        }
      } catch {
        setTentativas((t) => t + 1);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [status, tentativas, vipAtivado, router]);

  if (status === "sucesso") {
    if (vipAtivado) {
      return (
        <div className="rounded-md border border-tertiary/40 bg-tertiary/10 px-4 py-3 flex items-start gap-3">
          <CheckCircle2 className="size-5 text-tertiary shrink-0 mt-0.5" />
          <div>
            <p className="text-title-sm text-tertiary">VIP ativado com sucesso!</p>
            <p className="text-body-md text-text-muted">
              Seu acesso completo já está disponível. Verifique seu e-mail para a confirmação.
            </p>
          </div>
        </div>
      );
    }

    if (tentativas >= MAX_TENTATIVAS) {
      return (
        <div className="rounded-md border border-secondary/40 bg-secondary/10 px-4 py-3 space-y-2">
          <p className="text-title-sm text-secondary">Pagamento confirmado — ativando VIP</p>
          <p className="text-body-md text-text-muted">
            A ativação está demorando mais que o esperado. Você receberá um e-mail assim que
            o acesso for liberado. Se o problema persistir, entre em contato com o suporte.
          </p>
          <a href="/contato" className="inline-block text-body-md text-primary underline underline-offset-2">
            Falar com suporte →
          </a>
        </div>
      );
    }

    return (
      <div className="rounded-md border border-tertiary/40 bg-tertiary/10 px-4 py-3 flex items-start gap-3">
        <Loader2 className="size-5 text-tertiary shrink-0 mt-0.5 animate-spin" />
        <div>
          <p className="text-title-sm text-tertiary">Pagamento confirmado!</p>
          <p className="text-body-md text-text-muted">
            Ativando seu plano VIP... ({tentativas + 1}/{MAX_TENTATIVAS})
          </p>
        </div>
      </div>
    );
  }

  if (status === "falha") {
    return (
      <div className="rounded-md border border-error-red/40 bg-error-red/10 px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-error-red shrink-0" />
          <p className="text-title-sm text-error-red">Pagamento não concluído</p>
        </div>
        <p className="text-body-md text-text-muted">
          O pagamento não foi processado. Nenhum valor foi cobrado.
        </p>
        <a
          href="/assinar"
          className="inline-block rounded-md bg-primary-container text-on-primary-container text-label-md font-semibold px-4 py-2 hover:bg-[#176839] transition-colors"
        >
          Tentar novamente
        </a>
      </div>
    );
  }

  // pendente
  return (
    <div className="rounded-md border border-secondary/40 bg-secondary/10 px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <Clock className="size-5 text-secondary shrink-0" />
        <p className="text-title-sm text-secondary">Pagamento em processamento</p>
      </div>
      <p className="text-body-md text-text-muted">
        Seu pagamento está sendo processado. O VIP será ativado automaticamente assim que
        a confirmação chegar — geralmente em alguns minutos. Você receberá um e-mail.
      </p>
    </div>
  );
}
