import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { getCurrentUser, getJogosDoDiaVigente, getUserState } from "@/lib/queries";
import { JogoDoDiaCard } from "@/components/jogo-do-dia-card";
import { PaywallCard } from "@/components/paywall-card";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Jogos do Dia",
  description: "Análises estatísticas dos principais jogos do dia com probabilidades e recomendações.",
};

export default async function JogosDoDiaPage() {
  const user = await getCurrentUser();
  const userState = getUserState(user);
  const publicacao = await getJogosDoDiaVigente(user?.status ?? null);

  if (!publicacao) {
    return (
      <main className="container-content py-10 text-center space-y-3 max-w-lg">
        <CalendarDays className="size-8 mx-auto text-text-muted" />
        <p className="text-title-sm text-text-muted">Nenhuma análise publicada hoje.</p>
        <p className="text-body-md text-text-muted">Volte mais tarde ou confira o histórico.</p>
        <Link href="/jogos-do-dia/historico" className="text-body-md text-primary underline underline-offset-2">
          Ver histórico
        </Link>
      </main>
    );
  }

  const { dados, totalJogos } = publicacao;
  const jogosLiberados = (dados.jogos as import("@/types/jogos-do-dia").JogoDoDiaExibicao[]).filter((j) => !("bloqueado" in j));
  const jogosBloqueados = (dados.jogos as import("@/types/jogos-do-dia").JogoDoDiaExibicao[]).filter((j) => "bloqueado" in j);

  return (
    <main className="container-content py-6 space-y-4 max-w-lg">
      {/* Cabeçalho */}
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-headline-lg text-text-primary">{publicacao.titulo}</h1>
          <Link href="/jogos-do-dia/historico" className="text-label-sm text-text-muted hover:text-text-primary transition-colors">
            Histórico
          </Link>
        </div>
        <p className="text-body-md text-text-muted">
          {new Date(dados.data_jogos + "T12:00:00").toLocaleDateString("pt-BR", {
            weekday: "long", day: "2-digit", month: "long",
          })} · {totalJogos} {totalJogos === 1 ? "jogo" : "jogos"}
        </p>
      </header>

      {/* Jogos liberados */}
      <div className="space-y-3">
        {jogosLiberados.map((jogo) => (
          <JogoDoDiaCard key={jogo.numero} jogo={jogo} />
        ))}
      </div>

      {/* Paywall entre liberados e bloqueados */}
      {jogosBloqueados.length > 0 && (
        <PaywallCard
          jogosRestantes={jogosBloqueados.length}
          userState={userState}
        />
      )}

      {/* Jogos bloqueados */}
      {jogosBloqueados.length > 0 && (
        <div className="space-y-3">
          {jogosBloqueados.map((jogo) => (
            <JogoDoDiaCard key={jogo.numero} jogo={jogo} />
          ))}
        </div>
      )}

      {/* Link glossário */}
      <p className="text-center pb-2">
        <Link href="/glossario" className="text-label-sm text-text-muted hover:text-text-primary transition-colors underline underline-offset-2">
          Não entendeu algum termo? Veja o glossário do modelo
        </Link>
      </p>
    </main>
  );
}
