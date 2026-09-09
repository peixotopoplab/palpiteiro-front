import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Lock, Trophy, ChevronLeft } from "lucide-react";
import { getCurrentUser, getUserState } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { HistoricoCTAVip } from "./historico-cta-vip";

export const metadata: Metadata = {
  title: "Histórico de Concursos",
  description: "Consulte análises de concursos anteriores da Loteca com probabilidades e resultados.",
};

const POR_PAGINA = 10;
const FREE_LIBERADOS = 2; // Free vê os 2 anteriores ao vigente

interface PageProps {
  searchParams: Promise<{ pagina?: string }>;
}

async function getHistorico(pagina: number) {
  const supabase = await createClient();

  // Total para calcular paginação
  const { count } = await supabase
    .from("analyses")
    .select("id", { count: "exact", head: true })
    .eq("status", "publicado");

  const total = count ?? 0;
  const offset = (pagina - 1) * POR_PAGINA;

  const { data } = await supabase
    .from("analyses")
    .select("id, slug, titulo, concurso_numero, publicado_em, tipo_analise")
    .eq("status", "publicado")
    .order("publicado_em", { ascending: false })
    .range(offset, offset + POR_PAGINA - 1);

  return { analises: data ?? [], total };
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default async function HistoricoPage({ searchParams }: PageProps) {
  const { pagina: paginaStr } = await searchParams;
  const pagina = Math.max(1, parseInt(paginaStr ?? "1", 10) || 1);

  const user = await getCurrentUser();
  const userState = getUserState(user);
  const isVip = userState === "vip";

  const { analises, total } = await getHistorico(pagina);
  const totalPaginas = Math.ceil(total / POR_PAGINA);

  if (!analises.length && pagina === 1) {
    return (
      <main className="container-content py-10 text-center space-y-3">
        <Trophy className="size-8 mx-auto text-text-muted" />
        <p className="text-title-sm text-text-muted">Nenhum concurso publicado ainda.</p>
      </main>
    );
  }

  // Na primeira página, o primeiro item é o vigente
  const ehPrimeiraPagina = pagina === 1;
  const vigente = ehPrimeiraPagina ? analises[0] : null;
  const anteriores = ehPrimeiraPagina ? analises.slice(1) : analises;

  return (
    <main className="container-content py-6 space-y-5 max-w-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-headline-lg text-text-primary">Histórico</h1>
        <p className="text-label-sm text-text-muted">{total} publicações</p>
      </div>

      {/* Concurso vigente — só na primeira página */}
      {vigente && (
        <section className="space-y-2">
          <p className="text-label-sm text-text-muted uppercase px-1">Concurso Vigente</p>
          <Link
            href={`/analise/${vigente.slug}`}
            className="flex items-center justify-between gap-3 rounded-md border border-primary-container bg-surface-dark px-4 py-3 hover:bg-surface-hover transition-colors"
          >
            <div className="min-w-0">
              <p className="text-title-sm text-text-primary truncate">{vigente.titulo}</p>
              {vigente.publicado_em && (
                <p className="text-label-sm text-text-muted">{formatarData(vigente.publicado_em)}</p>
              )}
            </div>
            <ChevronRight className="size-4 text-primary shrink-0" />
          </Link>
        </section>
      )}

      {/* Anteriores */}
      {anteriores.length > 0 && (
        <section className="space-y-2">
          <p className="text-label-sm text-text-muted uppercase px-1">
            {ehPrimeiraPagina ? "Anteriores" : `Página ${pagina}`}
          </p>

          {/* Banner Free — só na primeira página */}
          {!isVip && ehPrimeiraPagina && (
            <div className="rounded-md border border-badge-vip/30 bg-surface-dark p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="size-3.5 text-badge-vip shrink-0" />
                <p className="text-label-md text-text-muted">
                  Você vê os {FREE_LIBERADOS} concursos mais recentes. VIP acessa o histórico completo.
                </p>
              </div>
              <HistoricoCTAVip userState={userState} />
            </div>
          )}

          <div className="rounded-md border border-border-subtle bg-surface-dark divide-y divide-border-subtle overflow-hidden">
            {anteriores.map((analise, idx) => {
              // Free: só os primeiros FREE_LIBERADOS anteriores (índice 0 e 1)
              const bloqueado = !isVip && ehPrimeiraPagina && idx >= FREE_LIBERADOS;

              if (bloqueado) {
                return (
                  <div
                    key={analise.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 opacity-40 select-none"
                  >
                    <div className="min-w-0">
                      <div className="h-3.5 w-40 rounded bg-surface-container-high mb-1.5" />
                      <div className="h-3 w-20 rounded bg-surface-container-high" />
                    </div>
                    <Lock className="size-3.5 text-badge-vip shrink-0" />
                  </div>
                );
              }

              return (
                <Link
                  key={analise.id}
                  href={`/analise/${analise.slug}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-hover transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-body-md text-text-primary truncate">{analise.titulo}</p>
                    {analise.publicado_em && (
                      <p className="text-label-sm text-text-muted">{formatarData(analise.publicado_em)}</p>
                    )}
                  </div>
                  <ChevronRight className="size-4 text-text-muted shrink-0" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Paginação — só VIP ou se não há paywall */}
      {isVip && totalPaginas > 1 && (
        <nav className="flex items-center justify-between gap-2">
          {pagina > 1 ? (
            <Link
              href={`/historico?pagina=${pagina - 1}`}
              className="flex items-center gap-1.5 text-body-md text-text-muted hover:text-text-primary transition-colors"
            >
              <ChevronLeft className="size-4" /> Anterior
            </Link>
          ) : <span />}

          <p className="text-label-sm text-text-muted">
            {pagina} de {totalPaginas}
          </p>

          {pagina < totalPaginas ? (
            <Link
              href={`/historico?pagina=${pagina + 1}`}
              className="flex items-center gap-1.5 text-body-md text-text-muted hover:text-text-primary transition-colors"
            >
              Próxima <ChevronRight className="size-4" />
            </Link>
          ) : <span />}
        </nav>
      )}

      {/* Free vendo histórico limitado — CTA de upgrade no fim */}
      {!isVip && total > FREE_LIBERADOS + 1 && ehPrimeiraPagina && (
        <p className="text-center text-label-sm text-text-muted">
          Há {total - FREE_LIBERADOS - 1} concursos anteriores disponíveis para VIP.
        </p>
      )}
    </main>
  );
}
