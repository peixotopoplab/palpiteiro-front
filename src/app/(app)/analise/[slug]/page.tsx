import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import { PaywallCard } from "@/components/paywall-card";
import { AnaliseTracker } from "@/components/analise-tracker";
import { formatarDataJogos } from "@/types/analise";
import { getAnaliseBySlug, getCurrentUser, getProdutoVip, getUserState } from "@/lib/queries";
import { AnaliseConcursoClient } from "./analise-concurso-client";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const analise = await getAnaliseBySlug(slug, null);
  return {
    title: analise?.titulo ?? "Análise",
    description: analise
      ? `Análise completa da Loteca — ${analise.titulo} com probabilidades por jogo.`
      : undefined,
  };
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AnalisePage({ params }: PageProps) {
  const { slug } = await params;

  const [user, produtoVip] = await Promise.all([
    getCurrentUser(),
    getProdutoVip(),
  ]);
  const userState = getUserState(user);
  const analise = await getAnaliseBySlug(slug, user?.status ?? null);
  if (!analise) notFound();

  const precoMensal = produtoVip?.tipo_desconto === "fixo" ? Number(produtoVip.valor_desconto) : undefined;
  const { dados, totalJogos } = analise;
  const qtdBloqueados = dados.jogos.filter((j) => "bloqueado" in j && j.bloqueado).length;
  const qtdLiberados = totalJogos - qtdBloqueados;

  return (
    <main className="container-content py-4 space-y-4 max-w-lg">
      <AnaliseTracker slug={slug} userId={user?.id} />

      {/* Header da análise */}
      <header className="rounded-lg border border-border-subtle bg-surface-dark p-4 space-y-3 relative overflow-hidden">
        {/* Grid sutil de fundo */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 28px,#30B070 28px,#30B070 29px),repeating-linear-gradient(90deg,transparent,transparent 28px,#30B070 28px,#30B070 29px)" }}
        />
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-badge-vip" />
              <span className="text-label-sm text-badge-vip uppercase tracking-wide font-semibold">Loteca</span>
            </div>
            <Link href="/analise/historico" className="text-label-sm text-text-muted hover:text-text-primary transition-colors">
              Histórico
            </Link>
          </div>
          <h1 className="text-headline-md text-text-primary">{analise.titulo}</h1>
          <p className="text-body-md text-text-muted mt-0.5">
            {formatarDataJogos(dados.data_jogos)} · {totalJogos} jogos
          </p>
        </div>
      </header>

      {/* Grade interativa — client component para chips/toggle/countdown */}
      <AnaliseConcursoClient
        jogos={dados.jogos}
        analysisId={analise.id}
        usuarioLogado={!!user}
        qtdBloqueados={qtdBloqueados}
        qtdLiberados={qtdLiberados}
        userState={userState}
        precoMensal={precoMensal}
        dataFechamento={null}
      />

      {/* Link glossário */}
      <p className="text-center pb-2">
        <Link href="/glossario" className="text-label-sm text-text-muted hover:text-text-primary transition-colors underline underline-offset-2">
          Não entendeu algum termo? Veja o glossário do modelo
        </Link>
      </p>
    </main>
  );
}
