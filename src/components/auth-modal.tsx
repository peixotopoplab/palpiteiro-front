"use client";

import { useActionState, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsentCheckbox } from "@/components/auth/consent-checkbox";
import { signIn, signUp, type AuthActionState } from "@/app/entrar/actions";

const INITIAL: AuthActionState = { error: null };

interface AuthModalProps {
  contexto?: string;
  onClose: () => void;
}

export function AuthModal({ contexto, onClose }: AuthModalProps) {
  const router = useRouter();
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [signInState, signInAction, signInPending] = useActionState(signIn, INITIAL);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, INITIAL);
  const [cadastroEnviado, setCadastroEnviado] = useState(false);

  // Quando login bem-sucedido: fecha modal e recarrega a página
  useEffect(() => {
    if (signInState.success) {
      onClose();
      router.refresh();
    }
  }, [signInState.success, onClose, router]);

  // Quando cadastro bem-sucedido com sessão: fecha modal e recarrega
  useEffect(() => {
    if (signUpState.success === true) {
      onClose();
      router.refresh();
    }
  }, [signUpState.success, onClose, router]);

  const fecharBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const cadastroConcluido = cadastroEnviado && !signUpPending && signUpState.success === false && !signUpState.error;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-surface-container-lowest/80 backdrop-blur-sm"
      onClick={fecharBackdrop}
    >
      <div className="w-full max-w-sm bg-surface-dark border border-border-subtle rounded-t-xl sm:rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-headline-md text-text-primary">
              {modo === "entrar" ? "Acessar o Palpiteiro" : "Criar conta grátis"}
            </h2>
            {contexto && (
              <p className="text-body-md text-text-muted mt-1">{contexto}</p>
            )}
          </div>
          <button onClick={onClose} className="text-text-muted p-1" aria-label="Fechar">
            <X className="size-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex rounded-md border border-border-subtle p-1 gap-1">
          {(["entrar", "cadastrar"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={`flex-1 rounded-default py-2 text-title-sm transition-colors ${
                modo === m
                  ? "bg-primary-container text-on-primary-container"
                  : "text-text-muted"
              }`}
            >
              {m === "entrar" ? "Entrar" : "Cadastrar"}
            </button>
          ))}
        </div>

        {modo === "entrar" ? (
          <form action={signInAction} className="space-y-3">
            <CampoInput name="email" type="email" placeholder="seu@email.com" icon={<Mail className="size-4" />} />
            <SenhaInput mostrarSenha={mostrarSenha} setMostrarSenha={setMostrarSenha} />
            {signInState.error && (
              <p className="text-label-md text-error-red">{signInState.error}</p>
            )}
            <Button type="submit" variant="primary" className="w-full" disabled={signInPending}>
              {signInPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        ) : (
          <form
            action={(fd) => { setCadastroEnviado(true); signUpAction(fd); }}
            className="space-y-3"
          >
            <CampoInput name="nome" type="text" placeholder="Seu nome" icon={<User className="size-4" />} />
            <CampoInput name="email" type="email" placeholder="seu@email.com" icon={<Mail className="size-4" />} />
            <SenhaInput mostrarSenha={mostrarSenha} setMostrarSenha={setMostrarSenha} minLength={8} />
            <ConsentCheckbox required />
            {signUpState.error && (
              <p className="text-label-md text-error-red">{signUpState.error}</p>
            )}
            {cadastroConcluido && (
              <p className="text-label-md text-tertiary">
                Verifique seu e-mail para confirmar o cadastro antes de entrar.
              </p>
            )}
            <Button type="submit" variant="primary" className="w-full" disabled={signUpPending}>
              {signUpPending ? "Criando..." : "Criar conta grátis"}
            </Button>
          </form>
        )}

        <p className="text-label-sm text-text-muted text-center">
          Palpiteiro é independente da Caixa Econômica Federal. +18 anos. Jogo responsável.
        </p>
      </div>
    </div>
  );
}

function CampoInput({ name, type, placeholder, icon }: {
  name: string; type: string; placeholder: string; icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-default border border-border-subtle bg-background px-3 py-2.5 focus-within:border-primary-container">
      <span className="text-text-muted shrink-0">{icon}</span>
      <input
        name={name} type={type} placeholder={placeholder} required
        className="w-full bg-transparent text-body-md text-text-primary placeholder:text-text-muted outline-none"
      />
    </div>
  );
}

function SenhaInput({ mostrarSenha, setMostrarSenha, minLength }: {
  mostrarSenha: boolean; setMostrarSenha: (v: boolean) => void; minLength?: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-default border border-border-subtle bg-background px-3 py-2.5 focus-within:border-primary-container">
      <span className="text-text-muted shrink-0"><Lock className="size-4" /></span>
      <input
        name="senha" type={mostrarSenha ? "text" : "password"}
        placeholder="••••••••" required minLength={minLength}
        className="w-full bg-transparent text-body-md text-text-primary placeholder:text-text-muted outline-none"
      />
      <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="text-text-muted shrink-0">
        {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
