import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, Trophy } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import { PaywallCard } from "@/components/paywall-card";
import { AnaliseTracker } from "@/components/analise-tracker";
import { AnaliseLikes } from "@/components/analise-likes";
import { formatarDataJogos } from "@/types/analise";
import { getAnaliseBySlug, getCurrentUser, getProdutoVip, getUserState, getLikesAnalise } from "@/lib/queries";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const user = await getCurrentUser();
  const analise = await getAnaliseBySlug(slug, user?.status ?? null);
  if (!analise) return { title: "Análise não encontrada" };
  return {
    title: analise.titulo,
    description: `Probabilidades, secas e duplos recomendados — ${analise.titulo}.`,
    openGraph: { title: analise.titulo, type: "article" },
  };
}

export default async function AnalisePage({ params }: PageProps) {
  const { slug } = await params;

  // Carrega em paralelo — sem waterfalls
  const [user, produtoVip] = await Promise.all([
    getCurrentUser(),
    getProdutoVip(),
  ]);
  const userState = getUserState(user);
  const analise = await getAnaliseBySlug(slug, user?.status ?? null);
  if (!analise) notFound();
  const likes = await getLikesAnalise(analise.id, user?.id ?? null);

  const { dados, totalJogos } = analise;

  // Separa pra métricas do header — não altera o que é renderizado na grade
  const qtdBloqueados = dados.jogos.filter((j) => "bloqueado" in j && j.bloqueado).length;
  const zebras = dados.jogos.filter(
    (j) => !("bloqueado" in j) && "zebra_alerta" in j && j.zebra_alerta
  ).length;
  const secas = dados.jogos.filter(
    (j) => !("bloqueado" in j) && "coluna_recomendada" in j &&
    (j as { coluna_recomendada: string }).coluna_recomendada.length === 1
  ).length;

  const precoMensal = produtoVip?.tipo_desconto === "fixo" ? Number(produtoVip.valor_desconto) : undefined;

  return (
    <main className="container-content py-6 space-y-4">
      <AnaliseTracker slug={slug} userId={user?.id} />
      {/* Cabeçalho */}
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-label-sm text-text-muted">
          <CalendarClock className="size-3.5" />
          {formatarDataJogos(dados.data_jogos)}
        </div>
        <h1 className="text-headline-lg text-text-primary">{analise.titulo}</h1>

        {dados.meta?.valor_acumulado && (
          <div className="flex items-center gap-1.5 text-body-md text-badge-vip">
            <Trophy className="size-4" />
            {dados.meta.valor_acumulado.toLocaleString("pt-BR", {
              style: "currency", currency: "BRL", maximumFractionDigits: 0,
            })}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Jogos", valor: totalJogos, cor: "" },
            { label: "Zebras", valor: zebras, cor: "text-error-red" },
            { label: "Secas VIP", valor: secas, cor: "" },
          ].map(({ label, valor, cor }) => (
            <div key={label} className="rounded-default bg-surface-container-lowest p-3 text-center">
              <p className={`text-metric-val text-text-primary ${cor}`}>{valor}</p>
              <p className="text-label-sm text-text-muted">{label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* Grade de jogos — liberados primeiro, paywall no meio, bloqueados depois */}
      <div className="space-y-2">
        {dados.jogos
          .filter((j) => !("bloqueado" in j))
          .map((jogo) => (
            <MatchCard key={jogo.numero} jogo={jogo} />
          ))}
      </div>

      {/* Paywall — entre os liberados e os bloqueados */}
      {qtdBloqueados > 0 && (
        <PaywallCard
          jogosRestantes={qtdBloqueados}
          userState={userState}
          precoMensal={precoMensal}
        />
      )}

      {/* Jogos bloqueados — times visíveis, dados analíticos ocultados */}
      {qtdBloqueados > 0 && (
        <div className="space-y-2">
          {dados.jogos
            .filter((j) => "bloqueado" in j && j.bloqueado)
            .map((jogo) => (
              <MatchCard key={jogo.numero} jogo={jogo} />
            ))}
        </div>
      )}

      {/* Like / Dislike — abaixo das análises, lateral direita */}
      <div className="flex justify-end px-1">
        <AnaliseLikes
          analysisId={analise.id}
          totalLikes={likes.totalLikes}
          totalDislikes={likes.totalDislikes}
          meuVoto={likes.meuVoto}
          usuarioLogado={!!user}
        />
      </div>

      {/* Link discreto pro glossário */}
      <p className="text-center pb-2">
        <Link href="/glossario" className="text-label-sm text-text-muted hover:text-text-primary transition-colors underline underline-offset-2">
          Não entendeu algum termo? Veja o glossário do modelo
        </Link>
      </p>
    </main>
  );
}
