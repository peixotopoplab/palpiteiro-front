import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos e condições de uso do Palpiteiro App.",
};

export default function TermosPage() {
  return (
    <article className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-headline-lg text-text-primary">Termos de Uso</h1>
        <p className="text-label-sm text-text-muted">Última atualização: setembro de 2026 — Versão v1.0-2026-09</p>
      </div>

      <Secao titulo="1. Natureza do Serviço">
        O Palpiteiro é um serviço de publicação editorial digital de conteúdo informativo e
        estatístico voltado ao futebol e aos concursos oficiais da Loteca da Caixa Econômica
        Federal. O serviço compreende a edição e publicação de listas de análises estatísticas
        esportivas, boletins periódicos de dados e probabilidades, e acesso a conteúdo editorial
        digital informativo. O Palpiteiro não é uma casa de apostas, não recebe apostas e não
        intermedia pagamentos lotéricos. As análises têm caráter exclusivamente educativo e
        informativo — não constituem aconselhamento financeiro nem garantia de premiação.
      </Secao>

      <Secao titulo="2. Requisito de Idade">
        O uso do Palpiteiro App é restrito a pessoas com 18 anos ou mais. Ao criar uma conta,
        o usuário declara expressamente ter idade mínima exigida. Contas de menores de idade
        serão encerradas imediatamente ao serem identificadas.
      </Secao>

      <Secao titulo="3. Jogo Responsável">
        A Loteca é um produto de loteria regulamentado pela Caixa Econômica Federal. O
        Palpiteiro App incentiva o jogo responsável e recomenda que seus usuários estabeleçam
        limites de gasto e não apostem valores que comprometam seu orçamento pessoal ou
        familiar. O app não tem responsabilidade sobre decisões de aposta tomadas com base
        nas análises fornecidas.
      </Secao>

      <Secao titulo="4. Independência da Caixa Econômica Federal">
        O Palpiteiro App é independente da Caixa Econômica Federal e não possui nenhuma
        afiliação, patrocínio ou endosso oficial da CEF. A Loteca® é uma marca registrada da
        Caixa Econômica Federal. Os dados de concursos são de domínio público.
      </Secao>

      <Secao titulo="5. Planos e Assinatura">
        O acesso ao plano gratuito (Free) é permanente e não exige pagamento. O plano VIP é
        uma assinatura recorrente de acesso a publicações e listas de análises estatísticas
        esportivas, processada pelo Mercado Pago. Os preços e condições podem ser alterados
        mediante aviso prévio de 30 dias. O cancelamento pode ser feito a qualquer momento na área{" "}
        <Link href="/conta" className="text-badge-vip underline underline-offset-2">Minha Conta</Link>.
      </Secao>

      <Secao titulo="6. Propriedade Intelectual">
        Todo o conteúdo do Palpiteiro App — incluindo textos, análises, modelos estatísticos,
        código-fonte e identidade visual — é protegido por direitos autorais. É vedada a
        reprodução, distribuição ou uso comercial sem autorização prévia por escrito.
      </Secao>

      <Secao titulo="7. Limitação de Responsabilidade">
        O Palpiteiro App não garante que as análises resultarão em premiação. Os resultados
        passados do modelo não garantem resultados futuros. O usuário assume integralmente
        os riscos de suas decisões de aposta.
      </Secao>

      <Secao titulo="8. Privacidade e LGPD">
        O tratamento de dados pessoais segue a{" "}
        <Link href="/privacidade" className="text-badge-vip underline underline-offset-2">
          Política de Privacidade
        </Link>{" "}
        do app, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
      </Secao>

      <Secao titulo="9. Alterações nos Termos">
        Estes termos podem ser atualizados a qualquer momento. Mudanças significativas serão
        comunicadas por e-mail com 15 dias de antecedência. O uso continuado após o aviso
        implica aceitação dos novos termos.
      </Secao>

      <Secao titulo="10. Contato">
        Dúvidas sobre estes termos:{" "}
        <Link href="/contato" className="text-badge-vip underline underline-offset-2">
          página de contato
        </Link>.
      </Secao>
    </article>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-title-sm text-text-primary">{titulo}</h2>
      <p className="text-body-md text-text-muted leading-relaxed">{children}</p>
    </section>
  );
}
