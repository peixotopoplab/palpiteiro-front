import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ClipboardList, Trophy } from "lucide-react";
import { getCurrentUser, getAnalises, getProdutoVip, getUserState } from "@/lib/queries";
import { HomeCTAVip } from "@/components/home-cta-vip";
import { EmConstrucaoPopup } from "@/components/em-construcao-popup";

export const metadata: Metadata = {
  title: "Palpiteiro — Análises da Loteca",
  description: "Análises estatísticas da Loteca com probabilidades por jogo, secas, duplos e triplos recomendados.",
};

export default async function HomePage() {
  const [user, analises, produtoVip] = await Promise.all([
    getCurrentUser(),
    getAnalises(1),
    getProdutoVip(),
  ]);
  const userState = getUserState(user);
  const isVip = userState === "vip";
  const analiseAtiva = analises[0] ?? null;
  const precoMensal = produtoVip?.tipo_desconto === "fixo" ? Number(produtoVip.valor_desconto) : undefined;

  return (
    <main className="container-content py-4 space-y-4 max-w-lg">

      {/* Hero — análise vigente com grid de campo */}
      <section className="rounded-lg border border-border-subtle bg-surface-dark p-4 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 24px,#30B070 24px,#30B070 25px),repeating-linear-gradient(90deg,transparent,transparent 24px,#30B070 24px,#30B070 25px)" }}
        />
        <div className="relative space-y-3">
          <div className="flex items-center gap-1.5">
            <Trophy className="size-3.5 text-badge-vip" />
            <span className="text-label-sm text-badge-vip font-semibold uppercase tracking-wide">
              Concurso vigente
            </span>
          </div>

          {analiseAtiva ? (
            <Link
              href={`/analise/${analiseAtiva.slug}`}
              className="block rounded-md border border-badge-vip/25 bg-badge-vip/5 px-3 py-2.5 hover:bg-badge-vip/10 transition-colors"
            >
              <p className="text-title-sm text-text-primary">{analiseAtiva.titulo}</p>
              {analiseAtiva.publicado_em && (
                <p className="text-label-sm text-text-muted mt-0.5">
                  {new Date(analiseAtiva.publicado_em).toLocaleDateString("pt-BR", {
                    weekday: "short", day: "2-digit", month: "short",
                  })}
                </p>
              )}
              <span className="inline-flex items-center gap-1 text-label-sm text-primary mt-1.5">
                Ver análise completa <ChevronRight className="size-3" />
              </span>
            </Link>
          ) : (
            <div className="rounded-md border border-border-subtle bg-surface-container px-3 py-2.5">
              <p className="text-body-md text-text-muted">Nenhum concurso publicado ainda.</p>
            </div>
          )}

          <div className="flex justify-end">
            <Link href="/analise/historico" className="text-label-sm text-text-muted hover:text-text-primary transition-colors">
              Histórico de concursos →
            </Link>
          </div>
        </div>
      </section>

      {/* Simulador */}
      <Link href="/simulador">
        <div className="flex items-center gap-3 rounded-md border border-border-subtle bg-surface-dark px-4 py-3.5 hover:bg-surface-hover transition-colors">
          <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
            <ClipboardList className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-title-sm text-text-primary">Simulador de Volante</p>
            <p className="text-label-sm text-text-muted">Monte e calcule o custo do seu volante</p>
          </div>
          <ChevronRight className="size-4 text-text-muted shrink-0" />
        </div>
      </Link>

      {/* Divisor explícito antes do CTA VIP */}
      {!isVip && <hr className="border-border-subtle" />}

      {/* CTA VIP — respiração garantida pelo divisor acima */}
      {!isVip && <HomeCTAVip userState={userState} precoMensal={precoMensal} />}

      {!isVip && <EmConstrucaoPopup />}
    </main>
  );
}
