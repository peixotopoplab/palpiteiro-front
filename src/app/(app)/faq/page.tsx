import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Perguntas Frequentes — Palpiteiro",
  description: "Tire suas dúvidas sobre o Palpiteiro, as análises da Loteca e como funciona o plano VIP.",
};

const PERGUNTAS = [
  {
    pergunta: "O que é o Palpiteiro?",
    resposta: "O Palpiteiro é um serviço de publicação editorial digital de análises estatísticas esportivas focado na Loteca, o concurso de futebol da Caixa Econômica Federal. Oferecemos probabilidades calculadas por modelo algorítmico próprio, identificação de jogos com equilíbrio alto (R01) e estratégias de montagem de volante.",
  },
  {
    pergunta: "O Palpiteiro garante premiação?",
    resposta: "Não. As análises têm caráter exclusivamente educativo e informativo. Resultados passados não garantem resultados futuros. O Palpiteiro é independente da Caixa Econômica Federal e não tem nenhuma afiliação oficial com a Loteca.",
  },
  {
    pergunta: "Qual a diferença entre o plano Free e o VIP?",
    resposta: "No plano Free você acessa 3 jogos do concurso vigente com probabilidades básicas, o simulador de volante e o glossário do modelo. No plano VIP você desbloqueia os 14 jogos com análise completa, alertas de equilíbrio alto, estratégia de duplos e triplos, boletim por e-mail antes do fechamento e histórico completo de todos os concursos.",
  },
  {
    pergunta: "Posso testar o VIP antes de pagar?",
    resposta: "Sim. Todo usuário que cria uma conta pela primeira vez recebe 7 dias de acesso VIP completo gratuitamente. Após esse período, o acesso retorna para o plano Free caso a assinatura não seja ativada.",
  },
  {
    pergunta: "Como funciona o pagamento?",
    resposta: "O pagamento é processado pelo Mercado Pago, via PIX ou cartão de crédito. A assinatura é mensal e renovada automaticamente. Você pode cancelar a qualquer momento diretamente no painel do Mercado Pago.",
  },
  {
    pergunta: "Como cancelo minha assinatura VIP?",
    resposta: "Acesse o painel do Mercado Pago (mercadopago.com.br/subscriptions) e cancele por lá. Seu acesso VIP permanece ativo até o fim do período já pago — você não perde o acesso imediatamente ao cancelar.",
  },
  {
    pergunta: "O que são as probabilidades exibidas?",
    resposta: "As probabilidades (p1, pX, p2) representam a chance estimada de cada resultado — vitória do mandante, empate ou vitória do visitante — calculada pelo nosso modelo estatístico com base em dados históricos e contexto dos times. Não são odds de apostas e não refletem a probabilidade implícita de casas de apostas.",
  },
  {
    pergunta: "O que significa o alerta R01 (equilíbrio alto)?",
    resposta: 'O modificador R01 sinaliza que as probabilidades dos três resultados possíveis estão relativamente próximas, tornando o jogo menos previsível. Popularmente chamado de "zebra", indica maior risco — mas também maior retorno potencial caso o resultado fuja do favorito.',
  },
  {
    pergunta: "Como funciona o Simulador de Volante?",
    resposta: "O Simulador permite que você monte seu volante da Loteca escolhendo 1, 2 ou 3 colunas (seco, duplo ou triplo) para cada jogo. Ele calcula automaticamente o número de combinações geradas e o custo total com base na tabela oficial da Caixa (R$ 2,00 por combinação, mínimo R$ 4,00). O volante pode ser copiado ou compartilhado com link.",
  },
  {
    pergunta: "Posso excluir minha conta?",
    resposta: "Sim. Em Minha Conta, no rodapé da página, há o link 'Excluir minha conta'. A exclusão é permanente e apaga todos os seus dados. O mesmo e-mail não poderá ser usado para criar uma nova conta com o trial gratuito de 7 dias.",
  },
  {
    pergunta: "O Palpiteiro tem aplicativo para celular?",
    resposta: "Ainda não temos um app nas lojas, mas o site é um PWA (Progressive Web App) — no celular você pode adicionar o Palpiteiro à sua tela inicial e receber notificações push de novas análises, com experiência similar a um app nativo.",
  },
];

export default function FaqPage() {
  return (
    <main className="container-content py-6 space-y-6 max-w-lg">
      <div className="space-y-1">
        <h1 className="text-headline-lg text-text-primary">Perguntas Frequentes</h1>
        <p className="text-body-md text-text-muted">
          Não encontrou o que procura?{" "}
          <Link href="/contato" className="text-primary underline underline-offset-2">
            Fale com a gente
          </Link>
          .
        </p>
      </div>

      <div className="space-y-2">
        {PERGUNTAS.map(({ pergunta, resposta }) => (
          <details
            key={pergunta}
            className="group rounded-md border border-border-subtle bg-surface-dark open:border-primary-container transition-colors"
          >
            <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer text-title-sm text-text-primary list-none select-none">
              {pergunta}
              <span className="text-text-muted shrink-0 text-lg leading-none group-open:rotate-45 transition-transform">
                +
              </span>
            </summary>
            <div className="px-4 pb-4">
              <p className="text-body-md text-text-muted leading-relaxed">{resposta}</p>
            </div>
          </details>
        ))}
      </div>

      <p className="text-center text-label-sm text-text-muted">
        Palpiteiro é independente da Caixa Econômica Federal · +18 anos · Jogue com responsabilidade
      </p>
    </main>
  );
}
