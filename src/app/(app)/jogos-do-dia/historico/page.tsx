import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getJogosDoDiaHistorico } from "@/lib/queries";

export const metadata: Metadata = { title: "Histórico — Jogos do Dia" };

export default async function JogosDoDiaHistoricoPage() {
  const historico = await getJogosDoDiaHistorico(10);

  return (
    <main className="container-content py-6 space-y-4 max-w-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-headline-lg text-text-primary">Histórico</h1>
        <Link href="/jogos-do-dia" className="text-label-sm text-text-muted hover:text-text-primary transition-colors">
          ← Hoje
        </Link>
      </div>

      {historico.length === 0 ? (
        <p className="text-body-md text-text-muted">Nenhuma análise publicada ainda.</p>
      ) : (
        <div className="rounded-md border border-border-subtle bg-surface-dark divide-y divide-border-subtle overflow-hidden">
          {historico.map((item) => (
            <Link
              key={item.id}
              href={`/jogos-do-dia`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-hover transition-colors"
            >
              <div className="min-w-0">
                <p className="text-body-md text-text-primary truncate">{item.titulo}</p>
                <p className="text-label-sm text-text-muted">
                  {new Date(item.data_jogos + "T12:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </p>
              </div>
              <ChevronRight className="size-4 text-text-muted shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
