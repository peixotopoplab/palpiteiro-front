import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  CheckCircle2, CreditCard, Mail, Bell,
  BellOff, FileText, HelpCircle, Calendar, UserCheck, Clock
} from "lucide-react";
import { getCurrentUser } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { CupomForm } from "./cupom-form";
import { BotaoCheckout } from "./botao-checkout";
import { getProdutoVip } from "@/lib/queries";
import { BotaoSair } from "./botao-sair";

export const metadata: Metadata = { title: "Minha Conta" };

async function getSubscription(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("status, valor, data_inicio, data_fim, origem")
    .eq("user_id", userId)
    .eq("status", "ativa")
    .order("data_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

const VANTAGENS_VIP = [
  "Acesso total aos 14 jogos com análise aprofundada",
  "Alertas de zebras e jogos de alto valor esperado (EV+)",
  "Estratégia de duplos e triplos recomendados",
  "Boletim exclusivo por e-mail antes do fechamento",
  "Simulador de volante ilimitado com persistência 7 dias",
];

interface ContaPageProps {
  searchParams: Promise<{ pagamento?: string }>;
}

export default async function ContaPage({ searchParams }: ContaPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?redirect=/conta");
  const { pagamento } = await searchParams;
  const produtoVip = await getProdutoVip();
  const precoMensal = produtoVip?.tipo_desconto === "fixo" ? Number(produtoVip.valor_desconto) : undefined;

  const subscription = await getSubscription(user.id);
  const isVip = user.status === "vip";

  const dataRenovacao = subscription?.data_fim
    ? new Date(subscription.data_fim).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "long", year: "numeric",
      })
    : null;

  return (
    <main className="container-content py-6 space-y-4 max-w-lg">
      {pagamento === "sucesso" && (
        <div className="rounded-md border border-tertiary/40 bg-tertiary/10 px-4 py-3">
          <p className="text-title-sm text-tertiary">✓ Pagamento confirmado!</p>
          <p className="text-body-md text-text-muted">Seu plano VIP foi ativado. Aproveite o acesso completo.</p>
        </div>
      )}
      {pagamento === "falha" && (
        <div className="rounded-md border border-error-red/40 bg-error-red/10 px-4 py-3">
          <p className="text-title-sm text-error-red">Pagamento não concluído</p>
          <p className="text-body-md text-text-muted">Tente novamente ou entre em contato com o suporte.</p>
        </div>
      )}
      {pagamento === "pendente" && (
        <div className="rounded-md border border-secondary/40 bg-secondary/10 px-4 py-3">
          <p className="text-title-sm text-secondary">Pagamento em processamento</p>
          <p className="text-body-md text-text-muted">Assim que confirmado, seu VIP será ativado automaticamente.</p>
        </div>
      )}
      {/* Perfil */}
      <section className="rounded-md border border-border-subtle bg-surface-dark p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="size-14 rounded-full bg-surface-container-high flex items-center justify-center text-headline-lg text-text-primary font-bold shrink-0">
            {user.nome.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-title-sm text-text-primary truncate">{user.nome}</p>
              <Badge variant={isVip ? "vip" : "free"} />
            </div>
            <p className="text-body-md text-text-muted truncate">{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="flex items-center gap-2 text-label-sm text-text-muted">
            <UserCheck className="size-3.5 shrink-0 text-tertiary" />
            {isVip ? "Assinante VIP" : "Plano Gratuito"}
          </div>
          {subscription?.data_inicio && (
            <div className="flex items-center gap-2 text-label-sm text-text-muted">
              <Clock className="size-3.5 shrink-0" />
              Membro desde {new Date(subscription.data_inicio).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
            </div>
          )}
        </div>
      </section>

      {/* Status do plano */}
      <section className="rounded-md border border-border-subtle bg-surface-dark p-4 space-y-3">
        <p className="text-label-sm text-text-muted uppercase">Status do Plano</p>

        {isVip ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-headline-md text-text-primary">Plano VIP Ativo</p>
              <span className="inline-flex items-center gap-1 text-label-sm text-badge-vip">
                <span className="size-1.5 rounded-full bg-badge-vip" /> Ativo
              </span>
            </div>

            {subscription && (
              <div className="grid grid-cols-2 gap-2">
                {dataRenovacao && (
                  <div className="rounded-default bg-surface-container-lowest p-2.5">
                    <p className="text-label-sm text-text-muted">Próxima renovação</p>
                    <p className="text-body-md text-text-primary flex items-center gap-1 mt-0.5">
                      <Calendar className="size-3.5 shrink-0" />
                      {dataRenovacao}
                    </p>
                  </div>
                )}
                <div className="rounded-default bg-surface-container-lowest p-2.5">
                  <p className="text-label-sm text-text-muted">Método</p>
                  <p className="text-body-md text-text-primary flex items-center gap-1 mt-0.5">
                    <CreditCard className="size-3.5 shrink-0" />
                    {subscription.origem === "manual" ? "Manual (Admin)" : "PIX / Cartão"}
                  </p>
                </div>
              </div>
            )}

            <ul className="space-y-1.5 pt-1">
              {VANTAGENS_VIP.map((item) => (
                <li key={item} className="flex items-start gap-2 text-body-md text-text-muted">
                  <CheckCircle2 className="size-4 text-tertiary shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>

            {subscription?.origem !== "manual" && (
              <a
                href="https://www.mercadopago.com.br/subscriptions"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full rounded-md border border-border-subtle px-4 py-3 text-body-md text-text-primary hover:bg-surface-hover transition-colors"
              >
                <CreditCard className="size-4 text-text-muted" />
                Gerenciar assinatura no Mercado Pago
              </a>
            )}
          </>
        ) : (
          <>
            <p className="text-body-md text-text-muted">
              Você está no plano gratuito. Assine o VIP para desbloquear a análise completa dos 14 jogos.
            </p>
            <ul className="space-y-1.5">
              {VANTAGENS_VIP.map((item) => (
                <li key={item} className="flex items-start gap-2 text-body-md text-text-muted">
                  <CheckCircle2 className="size-4 text-border-subtle shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <BotaoCheckout precoMensal={precoMensal} />
          </>
        )}
      </section>

      {/* Cupons */}
      <CupomForm />

      {/* Preferências */}
      <section className="rounded-md border border-border-subtle bg-surface-dark divide-y divide-border-subtle overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-label-sm text-text-muted uppercase">Preferências e Notificações</p>
          <p className="text-label-sm text-text-muted">Em breve</p>
        </div>
        <div className="flex items-center justify-between px-4 py-3 opacity-60">
          <div className="flex items-center gap-3">
            <Mail className="size-4 text-text-muted shrink-0" />
            <div>
              <p className="text-body-md text-text-primary">Boletim por E-mail</p>
              <p className="text-label-sm text-text-muted">Receber análises ao publicar</p>
            </div>
          </div>
          <div className="w-10 h-6 rounded-full bg-primary-container flex items-center justify-end px-1">
            <div className="size-4 rounded-full bg-white" />
          </div>
        </div>
        <div className="flex items-center justify-between px-4 py-3 opacity-60">
          <div className="flex items-center gap-3">
            <Bell className="size-4 text-text-muted shrink-0" />
            <div>
              <p className="text-body-md text-text-primary">Alertas de Zebras</p>
              <p className="text-label-sm text-text-muted">Aviso de jogos com EV+ alto</p>
            </div>
          </div>
          <div className="w-10 h-6 rounded-full bg-surface-container-high flex items-center px-1">
            <div className="size-4 rounded-full bg-text-muted" />
          </div>
        </div>
      </section>

      {/* Links legais */}
      <section className="rounded-md border border-border-subtle bg-surface-dark divide-y divide-border-subtle overflow-hidden">
        {[
          { icon: FileText, label: "Termos de Uso e Privacidade", href: "/termos" },
          { icon: HelpCircle, label: "Perguntas Frequentes", href: "/faq" },
          { icon: BellOff, label: "Glossário do Modelo", href: "/glossario" },
        ].map(({ icon: Icon, label, href }) => (
          <a
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-3 text-body-md text-text-muted hover:bg-surface-hover transition-colors"
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </a>
        ))}
      </section>

      <BotaoSair />
    </main>
  );
}
