import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Quem Somos",
  description: "Conheça o Palpiteiro App e o projeto por trás das análises da Loteca.",
};

export default function QuemSomosPage() {
  return (
    <article className="space-y-6">
      <h1 className="text-headline-lg text-text-primary">Quem Somos</h1>

      <p className="text-body-md text-text-muted leading-relaxed">
        O Palpiteiro é um projeto independente de análise estatística da Loteca, criado por
        um entusiasta de futebol e dados que queria transformar probabilidades em palpites
        mais fundamentados — sem achismos, com método.
      </p>

      <p className="text-body-md text-text-muted leading-relaxed">
        O projeto nasceu como um canal no YouTube (@canalpalpiteiro) e evoluiu para esta
        plataforma, onde o modelo de análise roda semanalmente para cada concurso da Loteca
        da Caixa Econômica Federal, gerando probabilidades, alertas de zebra e recomendações
        de volante.
      </p>

      <div className="rounded-md border border-border-subtle bg-surface-dark p-4 space-y-2">
        <p className="text-title-sm text-text-primary">O que o modelo faz</p>
        <ul className="space-y-1.5">
          {[
            "Calcula probabilidades para cada resultado (1, X, 2) com base em odds e histórico",
            "Aplica modificadores contextuais: clássicos (R02), desfalques, forma recente, H2H",
            "Identifica jogos com valor esperado positivo (EV+) e alerta sobre zebras",
            "Recomenda coluna (seco, duplo ou triplo) com base na relação risco×custo",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-body-md text-text-muted">
              <span className="text-tertiary mt-0.5">✓</span> {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-body-md text-text-muted leading-relaxed">
        O Palpiteiro App é independente da Caixa Econômica Federal e não garante premiação.
        As análises são informativas — a decisão de apostar é sempre do usuário. Conheça
        mais no{" "}
        <Link href="/glossario" className="text-badge-vip underline underline-offset-2">
          Glossário do Modelo
        </Link>.
      </p>
    </article>
  );
}
