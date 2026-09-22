import Link from "next/link";
import { ChevronRight, ClipboardList, Trophy, CalendarDays } from "lucide-react";
import { getCurrentUser, getAnalises, getProdutoVip, getUserState, getJogosDoDiaVigente, getJogosDoDiaHistorico, getAnalisesHistorico } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { HomeCTAVip } from "@/components/home-cta-vip";

export default async function HomePage() {
  const [user, analises, produtoVip, jogosDoDia] = await Promise.all([
    getCurrentUser(),
    getAnalises(1),
    getProdutoVip(),
    getJogosDoDiaVigente(null), // guest view for home
  ]);
  const userState = getUserState(user);
  const isVip = userState === "vip";
  const analiseAtiva = analises[0] ?? null;
  const precoMensal = produtoVip?.tipo_desconto === "fixo" ? Number(produtoVip.valor_desconto) : undefined;

  return (
    <main className="container-content py-5 space-y-6">

      {/* ── Seção Loteca ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-badge-vip" />
            <h2 className="text-title-sm text-text-primary">Loteca</h2>
          </div>
          <Link href="/analise/historico" className="text-label-sm text-text-muted hover:text-text-primary transition-colors">
            Histórico
          </Link>
        </div>

        {analiseAtiva ? (
          <Link
            href={`/analise/${analiseAtiva.slug}`}
            className="flex items-center justify-between gap-3 rounded-md border border-badge-vip/30 bg-surface-dark px-4 py-3 hover:bg-surface-hover transition-colors"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="inline-flex items-center gap-1 text-label-sm text-tertiary">
                  <span className="size-1.5 rounded-full bg-tertiary inline-block" />
                  Publicado
                </span>
              </div>
              <p className="text-title-sm text-text-primary truncate">{analiseAtiva.titulo}</p>
              {analiseAtiva.publicado_em && (
                <p className="text-label-sm text-text-muted">
                  {new Date(analiseAtiva.publicado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </p>
              )}
            </div>
            <ChevronRight className="size-4 text-text-muted shrink-0" />
          </Link>
        ) : (
          <div className="rounded-md border border-border-subtle bg-surface-dark px-4 py-3 text-center">
            <p className="text-body-md text-text-muted">Nenhum concurso publicado ainda.</p>
          </div>
        )}
      </section>

      {/* ── Seção Jogos do Dia ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <h2 className="text-title-sm text-text-primary">Jogos do Dia</h2>
          </div>
          <Link href="/jogos-do-dia/historico" className="text-label-sm text-text-muted hover:text-text-primary transition-colors">
            Histórico
          </Link>
        </div>

        {jogosDoDia ? (
          <Link
            href="/jogos-do-dia"
            className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-surface-dark px-4 py-3 hover:bg-surface-hover transition-colors"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="inline-flex items-center gap-1 text-label-sm text-tertiary">
                  <span className="size-1.5 rounded-full bg-tertiary inline-block" />
                  Hoje
                </span>
              </div>
              <p className="text-title-sm text-text-primary truncate">{jogosDoDia.titulo}</p>
              <p className="text-label-sm text-text-muted">{jogosDoDia.totalJogos} jogos analisados</p>
            </div>
            <ChevronRight className="size-4 text-text-muted shrink-0" />
          </Link>
        ) : (
          <div className="rounded-md border border-border-subtle bg-surface-dark px-4 py-3 text-center">
            <p className="text-body-md text-text-muted">Nenhuma análise publicada hoje.</p>
          </div>
        )}
      </section>

      {/* ── Simulador ── */}
      <section>
        <Link href="/simulador">
          <div className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-surface-dark px-4 py-3 hover:bg-surface-hover transition-colors">
            <div className="flex items-center gap-3">
              <ClipboardList className="size-5 text-primary shrink-0" />
              <div>
                <p className="text-title-sm text-text-primary">Simulador de Volante</p>
                <p className="text-label-sm text-text-muted">Monte e calcule o custo do seu volante</p>
              </div>
            </div>
            <ChevronRight className="size-4 text-text-muted shrink-0" />
          </div>
        </Link>
      </section>

      {/* ── CTA VIP ── */}
      {!isVip && <HomeCTAVip userState={userState} precoMensal={precoMensal} />}

    </main>
  );
}
