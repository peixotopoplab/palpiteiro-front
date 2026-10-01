import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, Star } from "lucide-react";
import { getCurrentUser, getProdutoVip, getUserState } from "@/lib/queries";
import { BotaoCheckout } from "@/app/(app)/conta/botao-checkout";

export const metadata: Metadata = {
  title: "Assinar VIP — Palpiteiro",
  description: "Desbloqueie a análise completa dos 14 jogos da Loteca com probabilidades refinadas e alertas de zebra.",
};

const VANTAGENS_VIP = [
  "14 jogos com probabilidades e análise completa",
  "Alertas de equilíbrio alto (R01) — oportunidades fora do radar",
  "Estratégia de duplos e triplos recomendados",
  "Boletim por e-mail antes do fechamento das apostas",
  "Histórico completo de todos os concursos anteriores",
  "Acesso ao simulador com concurso vigente",
];

const VANTAGENS_FREE = [
  "3 jogos do concurso vigente",
  "Simulador de volante (modo livre)",
  "Glossário completo do modelo",
];

export default async function AssinarPage() {
  const [user, produtoVip] = await Promise.all([
    getCurrentUser(),
    getProdutoVip(),
  ]);

  const userState = getUserState(user);

  // VIP ativo não precisa ver essa tela
  if (userState === "vip") redirect("/conta");

  const precoMensal = produtoVip?.tipo_desconto === "fixo"
    ? Number(produtoVip.valor_desconto)
    : null;

  const precoFormatado = precoMensal
    ? precoMensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : null;

  return (
    <main className="container-content py-6 space-y-6 max-w-lg">
      <div className="text-center space-y-1">
        <p className="text-label-sm text-badge-vip uppercase tracking-wide">Clube VIP Palpiteiro</p>
        <h1 className="text-headline-lg text-text-primary">Análise completa da Loteca</h1>
        <p className="text-body-md text-text-muted">
          Probabilidades refinadas, secas estratégicas e boletim antes do fechamento.
        </p>
      </div>

      {/* Cards de plano lado a lado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* Plano Free */}
        <div className="rounded-lg border border-border-subtle bg-surface-dark p-4 space-y-3">
          <div>
            <p className="text-label-sm text-text-muted uppercase">Free</p>
            <p className="text-headline-md text-text-primary">Gratuito</p>
            <p className="text-label-sm text-text-muted">sempre</p>
          </div>
          <ul className="space-y-2">
            {VANTAGENS_FREE.map((v) => (
              <li key={v} className="flex items-start gap-2 text-body-md text-text-muted">
                <CheckCircle2 className="size-4 text-text-muted shrink-0 mt-0.5" />
                {v}
              </li>
            ))}
          </ul>
          <p className="text-label-sm text-text-muted italic">Plano atual</p>
        </div>

        {/* Plano VIP */}
        <div className="rounded-lg border border-badge-vip/50 bg-surface-dark p-4 space-y-3 relative">
          <div className="absolute -top-3 left-4">
            <span className="inline-flex items-center gap-1 bg-badge-vip text-surface-dark text-label-sm font-bold px-2.5 py-0.5 rounded-full">
              <Star className="size-3" /> Recomendado
            </span>
          </div>
          <div className="pt-2">
            <p className="text-label-sm text-badge-vip uppercase">VIP</p>
            {precoFormatado ? (
              <>
                <p className="text-headline-md text-badge-vip">{precoFormatado}</p>
                <p className="text-label-sm text-text-muted">por mês · cancele quando quiser</p>
              </>
            ) : (
              <p className="text-headline-md text-badge-vip">Ver preço no checkout</p>
            )}
          </div>
          <ul className="space-y-2">
            {VANTAGENS_VIP.map((v) => (
              <li key={v} className="flex items-start gap-2 text-body-md text-text-muted">
                <CheckCircle2 className="size-4 text-tertiary shrink-0 mt-0.5" />
                {v}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-3">
        {user ? (
          <BotaoCheckout precoMensal={precoMensal ?? undefined} />
        ) : (
          <a
            href="/entrar?redirect=/assinar"
            className="block w-full text-center rounded-md bg-badge-vip text-surface-dark font-bold text-title-sm py-3 hover:bg-[#c59f2d] transition-colors"
          >
            Criar conta e assinar VIP
          </a>
        )}

        {!user && (
          <p className="text-center text-label-sm text-text-muted">
            Já tem conta?{" "}
            <a href="/entrar?redirect=/assinar" className="text-primary underline underline-offset-2">
              Entrar
            </a>
          </p>
        )}

        <p className="text-center text-label-sm text-text-muted">
          Pagamento processado pelo Mercado Pago · PIX ou cartão de crédito
        </p>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-label-sm text-text-muted">
        Palpiteiro é independente da Caixa Econômica Federal e não garante premiação.
        Destinado a maiores de 18 anos. Jogue com responsabilidade.
      </p>
    </main>
  );
}
