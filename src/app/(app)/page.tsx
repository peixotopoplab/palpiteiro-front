import Link from "next/link";
import { ChevronRight, ClipboardList, History, Trophy } from "lucide-react";
import { getCurrentUser, getAnalises, getProdutoVip, getUserState } from "@/lib/queries";
import { Badge } from "@/components/ui/badge";
import { HomeCTAVip } from "@/components/home-cta-vip";

export default async function HomePage() {
  const [user, analises, produtoVip] = await Promise.all([getCurrentUser(), getAnalises(6), getProdutoVip()]);
  const userState = getUserState(user);
  const precoMensal = produtoVip?.tipo_desconto === "fixo" ? Number(produtoVip.valor_desconto) : undefined;
  const isVip = userState === "vip";
  const analiseAtiva = analises[0] ?? null;

  return (
    <main className="container-content py-5 space-y-5">
      {/* Card hero */}
      {analiseAtiva ? (
        <div className="rounded-lg border border-border-subtle bg-surface-dark p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-label-sm text-tertiary">
              <span className="size-1.5 rounded-full bg-tertiary inline-block" />
              Análise publicada
            </span>
          </div>
          <h1 className="text-headline-lg text-text-primary">{analiseAtiva.titulo}</h1>
          <Link
            href={`/analise/${analiseAtiva.slug}`}
            className="flex items-center justify-center w-full rounded-md bg-primary-container text-on-primary-container text-title-sm font-semibold py-3 hover:bg-[#176839] transition-colors"
          >
            Acessar Análise Completa →
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-border-subtle bg-surface-dark p-4 text-center space-y-2">
          <Trophy className="size-8 mx-auto text-text-muted" />
          <p className="text-title-sm text-text-muted">Nenhum concurso publicado ainda.</p>
        </div>
      )}

      {/* Lista de análises */}
      {analises.length > 0 && (
        <section className="space-y-2">
          <p className="text-label-sm text-text-muted uppercase px-1">Acesso rápido</p>
          <div className="rounded-md border border-border-subtle bg-surface-dark divide-y divide-border-subtle overflow-hidden">
            {analises.map((a) => (
              <Link
                key={a.id}
                href={`/analise/${a.slug}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-hover transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-title-sm text-text-primary truncate">{a.titulo}</p>
                  {a.publicado_em && (
                    <p className="text-label-sm text-text-muted">
                      {new Date(a.publicado_em).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "short",
                      })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={isVip ? "vip" : "free"} icon={null} />
                  <ChevronRight className="size-4 text-text-muted" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Ações rápidas */}
      <section className="grid grid-cols-2 gap-2">
        <Link href="/simulador">
          <div className="rounded-md border border-border-subtle bg-surface-dark p-4 space-y-1 hover:bg-surface-hover transition-colors">
            <ClipboardList className="size-5 text-primary" />
            <p className="text-title-sm text-text-primary">Simulador</p>
            <p className="text-label-sm text-text-muted">Monte seu volante</p>
          </div>
        </Link>
        <Link href="/historico">
          <div className="rounded-md border border-border-subtle bg-surface-dark p-4 space-y-1 hover:bg-surface-hover transition-colors">
            <History className="size-5 text-primary" />
            <p className="text-title-sm text-text-primary">Histórico</p>
            <p className="text-label-sm text-text-muted">Concursos anteriores</p>
          </div>
        </Link>
      </section>

      {/* CTA VIP — client component pra usar o AuthModal */}
      {!isVip && <HomeCTAVip userState={userState} precoMensal={precoMensal} />}
    </main>
  );
}
