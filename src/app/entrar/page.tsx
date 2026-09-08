"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsentCheckbox } from "@/components/auth/consent-checkbox";
import { signIn, signUp, type AuthActionState } from "./actions";

const INITIAL_STATE: AuthActionState = { error: null };

type Modo = "entrar" | "cadastrar";

export default function EntrarPage() {
  const [modo, setModo] = useState<Modo>("entrar");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [signInState, signInAction, signInPending] = useActionState(signIn, INITIAL_STATE);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, INITIAL_STATE);
  const [cadastroEnviado, setCadastroEnviado] = useState(false);
  const cadastroConcluido = cadastroEnviado && !signUpPending && !signUpState.error;

  return (
    <main className="container-content flex flex-col items-center py-12 gap-8 max-w-md">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative">
          <Image
            src="/icons/icon-192.png"
            alt="Palpiteiro"
            width={72}
            height={72}
            className="rounded-lg"
          />
        </div>
        <h1 className="text-headline-lg text-text-primary">Acessar o Palpiteiro</h1>
        <p className="text-body-md text-text-muted max-w-xs">
          Entre com seus dados para liberar análises estatísticas, zebras e simulador.
        </p>
      </div>

      <div className="w-full rounded-lg border border-border-subtle bg-surface-dark p-5 space-y-5">
        {/* Abas */}
        <div className="flex rounded-md border border-border-subtle p-1">
          <button
            type="button"
            onClick={() => setModo("entrar")}
            className={`flex-1 rounded-default py-2 text-title-sm transition-colors ${
              modo === "entrar" ? "bg-primary-container text-on-primary-container" : "text-text-muted"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setModo("cadastrar")}
            className={`flex-1 rounded-default py-2 text-title-sm transition-colors ${
              modo === "cadastrar" ? "bg-primary-container text-on-primary-container" : "text-text-muted"
            }`}
          >
            Cadastrar
          </button>
        </div>

        {modo === "entrar" ? (
          <form action={signInAction} className="space-y-4">
            <Campo label="E-mail" name="email" type="email" placeholder="carlos@email.com" icon={<Mail className="size-4" />} />
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="senha" className="text-body-md text-text-primary">
                  Senha
                </label>
                <Link href="/entrar/recuperar" className="text-label-md text-badge-vip">
                  Esqueceu?
                </Link>
              </div>
              <SenhaInput mostrarSenha={mostrarSenha} setMostrarSenha={setMostrarSenha} />
            </div>

            {signInState.error && <p className="text-label-md text-error-red">{signInState.error}</p>}

            <Button type="submit" variant="primary" className="w-full" disabled={signInPending}>
              {signInPending ? "Entrando..." : "Entrar na Minha Conta"}
            </Button>
          </form>
        ) : (
          <form
            action={(formData) => {
              setCadastroEnviado(true);
              signUpAction(formData);
            }}
            className="space-y-4"
          >
            <Campo label="Nome" name="nome" type="text" placeholder="Carlos Silva" icon={<User className="size-4" />} />
            <Campo label="E-mail" name="email" type="email" placeholder="carlos@email.com" icon={<Mail className="size-4" />} />
            <div>
              <label htmlFor="senha" className="text-body-md text-text-primary">
                Senha
              </label>
              <SenhaInput mostrarSenha={mostrarSenha} setMostrarSenha={setMostrarSenha} minLength={8} />
              <p className="text-label-sm text-text-muted mt-1">Mínimo de 8 caracteres.</p>
            </div>

            <ConsentCheckbox required />

            {signUpState.error && <p className="text-label-md text-error-red">{signUpState.error}</p>}
            {cadastroConcluido && (
              <p className="text-label-md text-tertiary">
                Conta criada! Verifique seu e-mail pra confirmar antes de entrar.
              </p>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={signUpPending}>
              {signUpPending ? "Criando conta..." : "Cadastre-se grátis"}
            </Button>
          </form>
        )}

        {/*
          Login social (Google) fica pra fase 2 — decisão registrada na
          conversa de planejamento. Não renderizar botão desabilitado
          pra não sugerir uma opção que ainda não existe.
        */}
      </div>

      <footer className="text-center space-y-2 max-w-sm">
        <p className="text-label-sm text-text-muted">
          Ao continuar, você concorda com os{" "}
          <Link href="/termos" className="text-badge-vip">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="text-badge-vip">
            Política de Privacidade
          </Link>
          .
        </p>
        <p className="text-label-sm text-text-muted">
          Palpiteiro é independente da Caixa Econômica Federal, não garante premiação e é
          destinado a maiores de 18 anos. Jogue com responsabilidade.
        </p>
      </footer>
    </main>
  );
}

function Campo({
  label,
  name,
  type,
  placeholder,
  icon,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-body-md text-text-primary">
        {label}
      </label>
      <div className="mt-1 flex items-center gap-2 rounded-default border border-border-subtle bg-background px-3 py-2.5 focus-within:border-primary-container">
        <span className="text-text-muted">{icon}</span>
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          required
          className="w-full bg-transparent text-body-md text-text-primary placeholder:text-text-muted outline-none"
        />
      </div>
    </div>
  );
}

function SenhaInput({
  mostrarSenha,
  setMostrarSenha,
  minLength,
}: {
  mostrarSenha: boolean;
  setMostrarSenha: (v: boolean) => void;
  minLength?: number;
}) {
  return (
    <div className="mt-1 flex items-center gap-2 rounded-default border border-border-subtle bg-background px-3 py-2.5 focus-within:border-primary-container">
      <span className="text-text-muted">
        <Lock className="size-4" />
      </span>
      <input
        id="senha"
        name="senha"
        type={mostrarSenha ? "text" : "password"}
        placeholder="••••••••••"
        required
        minLength={minLength}
        className="w-full bg-transparent text-body-md text-text-primary placeholder:text-text-muted outline-none"
      />
      <button
        type="button"
        onClick={() => setMostrarSenha(!mostrarSenha)}
        className="text-text-muted"
        aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
      >
        {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
