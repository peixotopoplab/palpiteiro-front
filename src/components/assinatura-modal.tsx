"use client";

import { useActionState, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Star, CheckCircle2, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BotaoCheckout } from "@/app/(app)/conta/botao-checkout";
import { ConsentCheckbox } from "@/components/auth/consent-checkbox";
import { signIn, signUp, type AuthActionState } from "@/app/entrar/actions";
import type { UserState } from "@/types/concurso";

const INITIAL: AuthActionState = { error: null };

const VANTAGENS = [
  "14 jogos com probabilidades e análise completa",
  "Alertas de zebras e jogos com EV+ alto",
  "Estratégia de duplos e triplos recomendados",
  "Boletim por e-mail antes do fechamento",
];

interface AssinaturaModalProps {
  userState: UserState;
  precoMensal?: number;
  contexto?: string;
  onClose: () => void;
}

export function AssinaturaModal({ userState, precoMensal, contexto, onClose }: AssinaturaModalProps) {
  const router = useRouter();
  const preco = precoMensal
    ? precoMensal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : null;

  // Para free logado: vai direto para o checkout (sem formulário de auth)
  if (userState === "free") {
    return (
      <ModalShell onClose={onClose}>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="size-5 text-badge-vip" />
            <h2 className="text-headline-md text-text-primary">Assinar VIP</h2>
          </div>
          {contexto && <p className="text-body-md text-text-muted">{contexto}</p>}

          <ul className="space-y-2">
            {VANTAGENS.map((v) => (
              <li key={v} className="flex items-start gap-2 text-body-md text-text-muted">
                <CheckCircle2 className="size-4 text-tertiary shrink-0 mt-0.5" />
                {v}
              </li>
            ))}
          </ul>

          {preco && (
            <p className="text-headline-md text-badge-vip text-center">{preco}/mês</p>
          )}

          <BotaoCheckout precoMensal={precoMensal} />
        </div>
      </ModalShell>
    );
  }

  // Para guest: precisa de cadastro + oferta
  return <ModalComCadastro preco={preco} contexto={contexto} onClose={onClose} router={router} />;
}

// ---- Modal com cadastro inline (para guests) ----

function ModalComCadastro({
  preco, contexto, onClose, router,
}: {
  preco: string | null;
  contexto?: string;
  onClose: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const [modo, setModo] = useState<"entrar" | "cadastrar">("cadastrar");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [signInState, signInAction, signInPending] = useActionState(signIn, INITIAL);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, INITIAL);
  const [cadastroEnviado, setCadastroEnviado] = useState(false);

  useEffect(() => {
    if (signInState.success || signUpState.success === true) {
      onClose();
      router.refresh();
    }
  }, [signInState.success, signUpState.success, onClose, router]);

  const cadastroConcluido = cadastroEnviado && !signUpPending && signUpState.success === false && !signUpState.error;

  return (
    <ModalShell onClose={onClose}>
      <div className="space-y-4">
        {/* Oferta */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Star className="size-5 text-badge-vip" />
            <h2 className="text-headline-md text-text-primary">Assinar VIP</h2>
          </div>
          {contexto && <p className="text-body-md text-text-muted">{contexto}</p>}
          {preco && (
            <p className="text-title-sm text-badge-vip">{preco}/mês · cancele quando quiser</p>
          )}
        </div>

        <ul className="space-y-1.5">
          {VANTAGENS.map((v) => (
            <li key={v} className="flex items-start gap-2 text-body-md text-text-muted">
              <CheckCircle2 className="size-3.5 text-tertiary shrink-0 mt-0.5" />
              {v}
            </li>
          ))}
        </ul>

        {/* Abas */}
        <div className="flex rounded-md border border-border-subtle p-1 gap-1">
          {(["cadastrar", "entrar"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setModo(m)}
              className={`flex-1 rounded-default py-2 text-title-sm transition-colors ${modo === m ? "bg-primary-container text-on-primary-container" : "text-text-muted"}`}>
              {m === "cadastrar" ? "Criar conta" : "Já tenho conta"}
            </button>
          ))}
        </div>

        {modo === "cadastrar" ? (
          <form action={(fd) => { setCadastroEnviado(true); signUpAction(fd); }} className="space-y-3">
            <CampoInput name="nome" type="text" placeholder="Seu nome" icon={<User className="size-4" />} />
            <CampoInput name="email" type="email" placeholder="seu@email.com" icon={<Mail className="size-4" />} />
            <SenhaInput mostrarSenha={mostrarSenha} setMostrarSenha={setMostrarSenha} minLength={8} />
            <ConsentCheckbox required />
            {signUpState.error && <p className="text-label-md text-error-red">{signUpState.error}</p>}
            {cadastroConcluido && <p className="text-label-md text-tertiary">Verifique seu e-mail antes de continuar.</p>}
            <Button type="submit" variant="gold" className="w-full" disabled={signUpPending}>
              {signUpPending ? "Criando conta..." : preco ? `Criar conta e assinar — ${preco}/mês` : "Criar conta grátis"}
            </Button>
          </form>
        ) : (
          <form action={signInAction} className="space-y-3">
            <CampoInput name="email" type="email" placeholder="seu@email.com" icon={<Mail className="size-4" />} />
            <SenhaInput mostrarSenha={mostrarSenha} setMostrarSenha={setMostrarSenha} />
            {signInState.error && <p className="text-label-md text-error-red">{signInState.error}</p>}
            <Button type="submit" variant="primary" className="w-full" disabled={signInPending}>
              {signInPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        )}

        <p className="text-label-sm text-text-muted text-center">
          Palpiteiro é independente da CEF. +18 anos. Jogue com responsabilidade.
        </p>
      </div>
    </ModalShell>
  );
}

// ---- Shell do modal ----

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const fecharBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-surface-container-lowest/80 backdrop-blur-sm"
      onClick={fecharBackdrop}
    >
      <div className="w-full max-w-sm bg-surface-dark border border-border-subtle rounded-t-xl sm:rounded-xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="text-text-muted p-1" aria-label="Fechar">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---- Helpers de campo ----

function CampoInput({ name, type, placeholder, icon }: { name: string; type: string; placeholder: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-default border border-border-subtle bg-background px-3 py-2.5 focus-within:border-primary-container">
      <span className="text-text-muted shrink-0">{icon}</span>
      <input name={name} type={type} placeholder={placeholder} required
        className="w-full bg-transparent text-body-md text-text-primary placeholder:text-text-muted outline-none" />
    </div>
  );
}

function SenhaInput({ mostrarSenha, setMostrarSenha, minLength }: { mostrarSenha: boolean; setMostrarSenha: (v: boolean) => void; minLength?: number }) {
  return (
    <div className="flex items-center gap-2 rounded-default border border-border-subtle bg-background px-3 py-2.5 focus-within:border-primary-container">
      <span className="text-text-muted shrink-0"><Lock className="size-4" /></span>
      <input name="senha" type={mostrarSenha ? "text" : "password"} placeholder="••••••••" required minLength={minLength}
        className="w-full bg-transparent text-body-md text-text-primary placeholder:text-text-muted outline-none" />
      <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="text-text-muted shrink-0">
        {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
