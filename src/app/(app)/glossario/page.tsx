import type { Metadata } from "next";
import { HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Glossário do Modelo",
  description: "Entenda os termos técnicos usados nas análises do Palpiteiro: zebra, EV+, R02, seco, duplo, triplo e modificadores.",
};

const TERMOS = [
  {
    termo: "Seco",
    categoria: "Tipo de aposta",
    descricao: "Aposta em uma única coluna — 1 (mandante vence), X (empate) ou 2 (visitante vence). Menor custo, maior risco.",
    exemplo: "Apostar só em '1' = seco no mandante.",
  },
  {
    termo: "Duplo",
    categoria: "Tipo de aposta",
    descricao: "Cobertura de dois resultados possíveis no mesmo jogo, como '1X' (mandante ou empate) ou '12' (mandante ou visitante). Dobra o custo daquele jogo, mas cobre dois cenários.",
    exemplo: "Duplo '1X' = você acerta se o mandante vencer ou empatar.",
  },
  {
    termo: "Triplo",
    categoria: "Tipo de aposta",
    descricao: "Cobre os três resultados (1, X e 2) de um jogo — garante o acerto naquele jogo, mas triplica o custo. Usado em partidas de equilíbrio extremo onde o modelo não consegue prever com confiança.",
    exemplo: "Triplo em Grêmio x Inter = acerta independentemente do resultado.",
  },
  {
    termo: "Zebra",
    categoria: "Alerta de risco",
    descricao: "Resultado improvável segundo o modelo — o favorito claro perde ou empata quando as probabilidades apontavam vitória fácil. O modelo alerta jogos com alto risco de zebra para que você decida se cobre com duplo ou assume o risco do seco.",
    exemplo: "Time A favorito com 70% de chance de vencer, mas histórico H2H indica empates frequentes — alerta de zebra ativado.",
  },
  {
    termo: "EV+ (Expected Value positivo)",
    categoria: "Conceito estatístico",
    descricao: "Valor esperado positivo. Indica que a odd oferecida para um resultado é maior do que a probabilidade real calculada pelo modelo justificaria — ou seja, a aposta 'vale mais do que custa'. Um jogo pode ser de zebra (improvável) e ainda ter EV+ se a odd for alta o suficiente.",
    exemplo: "Probabilidade real do empate: 30%. Odd oferecida para X: 4.0 (implica 25%). Diferença de 5% = EV+ para o empate.",
  },
  {
    termo: "R02",
    categoria: "Modificador do modelo",
    descricao: "Modificador de risco aplicado automaticamente pelo modelo em clássicos históricos (confrontos tradicionais entre rivais). Clássicos têm distribuição de resultados mais imprevisível do que jogos comuns — o R02 aumenta a incerteza calculada, o que pode mudar a coluna recomendada ou ativar um alerta de zebra.",
    exemplo: "Flamengo x Fluminense: modelo daria 70% pro Flamengo sem R02. Com R02 aplicado, cai para 58% e o empate sobe de 18% para 24% — alerta de zebra ativado.",
  },
  {
    termo: "Modificadores",
    categoria: "Lógica do modelo",
    descricao: "Fatores que o modelo considera além das probabilidades brutas calculadas por odds e histórico. Incluem: clássico (R02), desfalques relevantes (artilheiro, goleiro titular), forma recente dos times, histórico H2H nos últimos 6 confrontos, e condições de jogo (chuva, mando de campo). Quando ativos, aparecem na leitura do especialista.",
    exemplo: "Modificadores ativos: 'classico', 'desfalque_chave' — indica que o modelo ajustou as probabilidades por esses dois fatores.",
  },
  {
    termo: "H2H (Head to Head)",
    categoria: "Dado histórico",
    descricao: "Histórico dos confrontos diretos entre os dois times. O modelo analisa os últimos 6 jogos entre eles para identificar padrões (times que empuram para empate, um dominando o outro, tendência ofensiva vs. defensiva).",
    exemplo: "H2H 6 jogos: 4V-1E-1D (Flamengo) = Flamengo venceu 4, empatou 1, perdeu 1.",
  },
  {
    termo: "Coluna recomendada",
    categoria: "Output do modelo",
    descricao: "O resultado que o modelo recomenda apostar após considerar probabilidades, modificadores e histórico. Pode ser seco (ex: '1'), duplo (ex: '1X') ou triplo ('1X2'). Não é garantia de acerto — é o resultado com melhor relação entre probabilidade e custo dado o contexto.",
    exemplo: "Coluna recomendada '12' = modelo recomenda cobrir mandante e visitante, evitando o empate.",
  },
  {
    termo: "Volante",
    categoria: "Aposta Loteca",
    descricao: "O bilhete oficial da Loteca com os 14 palpites (um por jogo). O custo é calculado pela fórmula oficial da Caixa: 2^D × 3^T × R$ 2,00, onde D = duplos e T = triplos. Mínimo obrigatório: 1 duplo (R$ 4,00). Máximo: R$ 1.728,00.",
    exemplo: "11 secos + 2 duplos + 1 triplo = 2² × 3¹ × R$ 2,00 = R$ 24,00.",
  },
];

export default function GlossarioPage() {
  return (
    <main className="container-content py-6 space-y-5 max-w-lg">
      <div className="space-y-1">
        <h1 className="text-headline-lg text-text-primary">Glossário do Modelo</h1>
        <p className="text-body-md text-text-muted">
          Entenda os termos usados nas análises para aproveitar melhor os palpites.
        </p>
      </div>

      <div className="space-y-3">
        {TERMOS.map((item) => (
          <article
            key={item.termo}
            className="rounded-md border border-border-subtle bg-surface-dark p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-title-sm text-text-primary">{item.termo}</h2>
              <span className="text-label-sm text-text-muted bg-surface-container-lowest px-2 py-0.5 rounded-full shrink-0">
                {item.categoria}
              </span>
            </div>
            <p className="text-body-md text-text-muted">{item.descricao}</p>
            {item.exemplo && (
              <div className="rounded-default bg-surface-container-lowest px-3 py-2">
                <p className="text-label-sm text-text-muted uppercase mb-1">Exemplo</p>
                <p className="text-body-md text-text-primary">{item.exemplo}</p>
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="flex items-start gap-2 rounded-md bg-surface-container-lowest p-3 text-body-md text-text-muted">
        <HelpCircle className="size-4 shrink-0 mt-0.5 text-tertiary" />
        <p>
          Palpiteiro é independente da Caixa Econômica Federal. As análises são estatísticas
          e não garantem premiação. Jogue com responsabilidade. +18 anos.
        </p>
      </div>
    </main>
  );
}
