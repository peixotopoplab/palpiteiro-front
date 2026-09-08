"use client";

import { useState, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";

type LegalDoc = "termos" | "privacidade";

const TITULOS: Record<LegalDoc, string> = {
  termos: "Termos de Uso",
  privacidade: "Política de Privacidade",
};

// Conteúdo inline — evita fetch de página separada e mantém o contexto atual
function ConteudoTermos() {
  return (
    <div className="space-y-5 text-body-md text-text-muted leading-relaxed">
      <p className="text-label-sm text-text-muted">Versão v1.0-2026-09</p>

      {[
        ["1. Natureza do Serviço", "O Palpiteiro App é uma ferramenta estritamente informativa, estatística e de modelagem de probabilidades voltada ao futebol e aos concursos oficiais da Loteca. Não é uma casa de apostas, não recebe apostas e não intermedia pagamentos lotéricos. As análises têm caráter exclusivamente educativo — não constituem aconselhamento financeiro nem garantia de premiação."],
        ["2. Requisito de Idade", "O uso é restrito a pessoas com 18 anos ou mais. Ao criar uma conta, o usuário declara expressamente ter a idade mínima exigida."],
        ["3. Jogo Responsável", "A Loteca é um produto regulamentado pela Caixa Econômica Federal. O Palpiteiro incentiva o jogo responsável e recomenda que os usuários estabeleçam limites de gasto. O app não tem responsabilidade sobre decisões de aposta tomadas com base nas análises fornecidas."],
        ["4. Independência da Caixa", "O Palpiteiro App é independente da Caixa Econômica Federal e não possui nenhuma afiliação, patrocínio ou endosso oficial da CEF. A Loteca® é marca registrada da CEF."],
        ["5. Planos e Assinatura", "O plano gratuito (Free) é permanente. O plano VIP é uma assinatura recorrente processada pelo Mercado Pago. Os preços podem ser alterados com aviso prévio de 30 dias. Cancelamento disponível a qualquer momento em Minha Conta."],
        ["6. Propriedade Intelectual", "Todo o conteúdo do app — análises, modelos, código e identidade visual — é protegido por direitos autorais. Vedada a reprodução ou uso comercial sem autorização prévia."],
        ["7. Limitação de Responsabilidade", "O app não garante premiação. Resultados passados não garantem resultados futuros. O usuário assume integralmente os riscos de suas decisões de aposta."],
        ["8. Privacidade e LGPD", "O tratamento de dados segue a Política de Privacidade do app, em conformidade com a LGPD (Lei nº 13.709/2018)."],
        ["9. Alterações", "Estes termos podem ser atualizados a qualquer momento. Mudanças significativas serão comunicadas por e-mail com 15 dias de antecedência."],
      ].map(([titulo, texto]) => (
        <section key={titulo as string} className="space-y-1">
          <h3 className="text-title-sm text-text-primary">{titulo}</h3>
          <p>{texto}</p>
        </section>
      ))}
    </div>
  );
}

function ConteudoPrivacidade() {
  return (
    <div className="space-y-5 text-body-md text-text-muted leading-relaxed">
      <p className="text-label-sm text-text-muted">Versão v1.0-2026-09</p>

      {[
        ["1. Controlador dos Dados", "O Palpiteiro App, operado por Mauro Lucio Peixoto Junior, é o controlador dos dados pessoais coletados por meio da plataforma palpiteiro.app."],
        ["2. Dados Coletados", "Nome, e-mail e senha (no cadastro); endereço IP e user-agent (no registro de consentimento); histórico de simulações de volante (por 7 dias); dados de assinatura processados pelo Mercado Pago. Não armazenamos dados de cartão."],
        ["3. Finalidade", "Autenticar o acesso; diferenciar planos Free e VIP; enviar e-mails transacionais; fins de auditoria de consentimento (LGPD); melhoria do serviço."],
        ["4. Base Legal", "Consentimento explícito do usuário (Art. 7º, I da LGPD), coletado por checkbox não pré-marcado, e execução do contrato de prestação de serviço (Art. 7º, V)."],
        ["5. Compartilhamento", "Não vendemos dados pessoais. Compartilhamos apenas com: Supabase (banco de dados e autenticação), Mercado Pago (pagamentos) e Resend (e-mails transacionais)."],
        ["6. Retenção", "Dados de conta retidos enquanto a conta estiver ativa. Simulações excluídas após 7 dias. Logs de consentimento retidos por 5 anos. Dados excluídos em até 30 dias após solicitação."],
        ["7. Seus Direitos (LGPD)", "Você tem direito a confirmar, acessar, corrigir, excluir e portar seus dados. Exerça seus direitos pelo nosso canal de contato."],
        ["8. Cookies", "Usamos apenas cookies essenciais para manutenção da sessão autenticada. Sem cookies de rastreamento ou publicidade."],
        ["9. Segurança", "Criptografia HTTPS/TLS, autenticação via Supabase Auth com JWT, e políticas de acesso por linha (RLS) no banco de dados."],
      ].map(([titulo, texto]) => (
        <section key={titulo as string} className="space-y-1">
          <h3 className="text-title-sm text-text-primary">{titulo}</h3>
          <p>{texto}</p>
        </section>
      ))}
    </div>
  );
}

// ---- Componente do drawer ----

interface LegalDrawerProps {
  doc: LegalDoc;
  onClose: () => void;
}

function LegalDrawer({ doc, onClose }: LegalDrawerProps) {
  const fecharBackdrop = useCallback(
    (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); },
    [onClose]
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-surface-container-lowest/80 backdrop-blur-sm"
      onClick={fecharBackdrop}
    >
      <div className="w-full max-w-lg bg-surface-dark border border-border-subtle rounded-t-xl sm:rounded-xl flex flex-col max-h-[85vh]">
        {/* Header fixo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
          <h2 className="text-title-sm text-text-primary">{TITULOS[doc]}</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-default"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="overflow-y-auto px-5 py-4">
          {doc === "termos" ? <ConteudoTermos /> : <ConteudoPrivacidade />}
        </div>
      </div>
    </div>
  );
}

// ---- Link que abre o drawer ----

interface LegalLinkProps {
  doc: LegalDoc;
  className?: string;
  children: ReactNode;
}

export function LegalLink({ doc, className, children }: LegalLinkProps) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={className}
      >
        {children}
      </button>

      {aberto && (
        <LegalDrawer doc={doc} onClose={() => setAberto(false)} />
      )}
    </>
  );
}
