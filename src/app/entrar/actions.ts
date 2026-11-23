"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { TERMOS_VERSAO } from "@/lib/termos";
import { enviarBoasVindas } from "@/lib/email";

export interface AuthActionState {
  error: string | null;
  success?: boolean;
}

const ERROS_TRADUZIDOS: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed": "Confirme seu e-mail antes de entrar — verifique sua caixa de entrada.",
  "User already registered": "Já existe uma conta com esse e-mail. Tente entrar em vez de cadastrar.",
};

function traduzErro(mensagem: string) {
  if (process.env.NODE_ENV !== "production") {
    return ERROS_TRADUZIDOS[mensagem] ?? `[DEV] ${mensagem}`;
  }
  return ERROS_TRADUZIDOS[mensagem] ?? "Não foi possível concluir. Tente novamente em instantes.";
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) return { error: "Preencha e-mail e senha." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) return { error: traduzErro(error.message) };

  return { error: null, success: true };
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const termosAceitos = formData.get("termos_aceitos") === "true";

  if (!nome || !email || !senha) return { error: "Preencha nome, e-mail e senha." };
  if (senha.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };

  // Validação backend obrigatória — checkbox nunca pré-marcado (LGPD)
  if (!termosAceitos) {
    return { error: "Você precisa aceitar os Termos de Uso e a Política de Privacidade." };
  }

  const supabase = await createClient();

  // Prova de consentimento: o gatilho handle_new_user() (migration 025) lê estes metadados e
  // grava users.termos_* + audit_consentimento ('aceite_cadastro') na MESMA transação em que a
  // conta nasce. É a ÚNICA origem desses dados — o navegador não tem policy de INSERT na
  // auditoria, e escrever aqui depois do signUp era barrado pela RLS sem aviso.
  // user_agent vem do servidor (cabeçalho da requisição), truncado. IP NÃO é enviado de
  // propósito: seria dado pessoal adicional e exige decisão de privacidade (ver framework).
  const userAgent = ((await headers()).get("user-agent") ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .slice(0, 300);

  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        nome,
        termos_aceitos: true,
        termos_versao: TERMOS_VERSAO,
        ...(userAgent ? { user_agent: userAgent } : {}),
      },
    },
  });

  if (error) return { error: traduzErro(error.message) };

  // A trigger handle_new_user() cria public.users e grava o consentimento (ver acima).
  if (data.user?.id) {
    // E-mail de boas-vindas — disparo assíncrono, sem bloquear o retorno
    // Se falhar, não quebra o cadastro (o usuário já foi criado)
    enviarBoasVindas({ nome, email }).catch((err) => {
      console.error("[signUp] falha ao enviar e-mail de boas-vindas:", err);
    });
  }

  // success:false = confirmação de e-mail pendente (sessão ainda não existe)
  if (!data.session) {
    return { error: null, success: false };
  }

  return { error: null, success: true };
}
