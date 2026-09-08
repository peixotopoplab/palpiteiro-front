import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Lock, Trophy } from "lucide-react";
import { getCurrentUser } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Histórico de Concursos" };

async function getHistorico() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("analyses")
    .select("id, slug, titulo, concurso_numero, publicado_em, tipo_analise")
    .eq("status", "publicado")
    .order("publicado_em", { ascending: false })
    .limit(50);
  return data ?? [];
}

export default async function HistoricoPage() {
  const [user, analises] = await Promise.all([getCurrentUser(), getHistorico()]);
  const isVip = user?.status === "vip";

  if (!analises.length) {
    return (
      <main className="container-content py-6 text-center space-y-3">
        <Trophy className="size-8 mx-auto text-text-muted" />
        <p className="text-title-sm text-text-muted">Nenhum concurso publicado ainda.</p>
      </main>
    );
  }

  // Separa o mais recente (vigente) dos anteriores
  const [vigente, ...anteriores] = analises;

  return (
    <main className="container-content py-6 space-y-5 max-w-lg">
      <h1 className="text-headline-lg text-text-primary">Histórico</h1>

      {/* Concurso vigente */}
      <section className="space-y-2">
        <p className="text-label-sm text-text-muted uppercase px-1">Concurso Vigente</p>
        <Link
          href={`/analise/${vigente.slug}`}
          className="flex items-center justify-between gap-3 rounded-md border border-primary-container bg-surface-dark px-4 py-3 hover:bg-surface-hover transition-colors"
        >
          <div className="min-w-0">
            <p className="text-title-sm text-text-primary truncate">{vigente.titulo}</p>
            {vigente.publicado_em && (
              <p className="text-label-sm text-text-muted">
                {new Date(vigente.publicado_em).toLocaleDateString("pt-BR", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </p>
            )}
          </div>
          <ChevronRight className="size-4 text-primary shrink-0" />
        </Link>
      </section>

      {/* Anteriores */}
      {anteriores.length > 0 && (
        <section className="space-y-2">
          <p className="text-label-sm text-text-muted uppercase px-1">Anteriores</p>

          {!isVip && (
            <div className="flex items-center gap-2 rounded-md bg-surface-container-lowest border border-border-subtle px-3 py-2.5">
              <Lock className="size-3.5 text-badge-vip shrink-0" />
              <p className="text-label-md text-text-muted">
                Histórico completo disponível para assinantes VIP.
              </p>
            </div>
          )}

          <div className="rounded-md border border-border-subtle bg-surface-dark divide-y divide-border-subtle overflow-hidden">
            {anteriores.map((analise, idx) => {
              const bloqueado = !isVip && idx >= 2; // Free vê os 2 mais recentes do histórico

              return bloqueado ? (
                <div
                  key={analise.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 opacity-50"
                >
                  <div className="min-w-0">
                    <p className="text-body-md text-text-primary truncate">{analise.titulo}</p>
                    {analise.publicado_em && (
                      <p className="text-label-sm text-text-muted">
                        {new Date(analise.publicado_em).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  <Lock className="size-3.5 text-badge-vip shrink-0" />
                </div>
              ) : (
                <Link
                  key={analise.id}
                  href={`/analise/${analise.slug}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-hover transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-body-md text-text-primary truncate">{analise.titulo}</p>
                    {analise.publicado_em && (
                      <p className="text-label-sm text-text-muted">
                        {new Date(analise.publicado_em).toLocaleDateString("pt-BR", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="size-4 text-text-muted shrink-0" />
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
