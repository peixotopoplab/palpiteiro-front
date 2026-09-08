import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como o Palpiteiro App coleta, usa e protege seus dados pessoais.",
};

export default function PrivacidadePage() {
  return (
    <article className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-headline-lg text-text-primary">Política de Privacidade</h1>
        <p className="text-label-sm text-text-muted">Última atualização: setembro de 2026 — Versão v1.0-2026-09</p>
      </div>

      <Secao titulo="1. Controlador dos Dados">
        O Palpiteiro App, operado por Mauro Lucio Peixoto Junior, é o controlador dos dados
        pessoais coletados por meio da plataforma palpiteiro.app.
      </Secao>

      <Secao titulo="2. Dados Coletados">
        Coletamos: nome, e-mail e senha (no cadastro); endereço IP e user-agent (no registro
        e aceite de termos); histórico de simulações de volante (por 7 dias); dados de
        assinatura processados pelo Mercado Pago (não armazenamos dados de cartão). Cookies
        essenciais são usados para manter a sessão autenticada.
      </Secao>

      <Secao titulo="3. Finalidade do Tratamento">
        Os dados são usados para: autenticar o acesso à plataforma; diferenciar planos Free
        e VIP; enviar e-mails transacionais (análises, confirmação de cadastro); fins de
        auditoria de consentimento (LGPD); e melhoria do serviço.
      </Secao>

      <Secao titulo="4. Base Legal">
        O tratamento baseia-se no consentimento explícito do usuário (Art. 7º, I da LGPD),
        coletado no momento do cadastro por meio de checkbox não pré-marcado, e na execução
        do contrato de prestação de serviço (Art. 7º, V).
      </Secao>

      <Secao titulo="5. Compartilhamento de Dados">
        Não vendemos dados pessoais. Compartilhamos apenas com: Supabase (infraestrutura de
        banco de dados e autenticação, servidores na AWS), Mercado Pago (processamento de
        pagamentos), e Resend (envio de e-mails transacionais). Todos sob contratos de
        processamento de dados adequados.
      </Secao>

      <Secao titulo="6. Retenção de Dados">
        Dados de conta são retidos enquanto a conta estiver ativa. Simulações de volante são
        excluídas automaticamente após 7 dias. Logs de auditoria de consentimento são retidos
        por 5 anos para fins legais. Dados são excluídos em até 30 dias após solicitação de
        exclusão de conta.
      </Secao>

      <Secao titulo="7. Direitos do Titular">
        Nos termos da LGPD, você tem direito a: confirmar a existência de tratamento;
        acessar seus dados; corrigir dados incompletos ou incorretos; solicitar a exclusão;
        revogar o consentimento; e portabilidade dos dados. Exerça seus direitos via{" "}
        <Link href="/contato" className="text-badge-vip underline underline-offset-2">
          página de contato
        </Link>.
      </Secao>

      <Secao titulo="8. Cookies">
        Usamos apenas cookies essenciais para funcionamento da sessão autenticada. Não usamos
        cookies de rastreamento, publicidade ou analytics de terceiros.
      </Secao>

      <Secao titulo="9. Segurança">
        Os dados são protegidos por: criptografia em trânsito (HTTPS/TLS); autenticação
        segura via Supabase Auth com JWT; políticas de acesso por linha (RLS) no banco de
        dados; e isolamento de dados entre usuários.
      </Secao>

      <Secao titulo="10. Contato">
        Dúvidas ou solicitações relacionadas à privacidade:{" "}
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
