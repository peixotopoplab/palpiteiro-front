"use server";

import { createClient } from "@/lib/supabase/server";
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
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome } },
  });

  if (error) return { error: traduzErro(error.message) };

  // A trigger handle_new_user() (migration 006 + 007) cria a linha em
  // public.users automaticamente. Aqui registramos o consentimento e o
  // log de auditoria após a trigger ter rodado.
  if (data.user?.id) {
    await supabase
      .from("users")
      .update({
        termos_aceitos: true,
        termos_versao: "v1.0-2026-09",
        termos_aceitos_em: new Date().toISOString(),
      })
      .eq("id", data.user.id);

    await supabase.from("audit_consentimento").insert({
      user_id: data.user.id,
      termos_versao: "v1.0-2026-09",
      acao: "signup",
    });

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
