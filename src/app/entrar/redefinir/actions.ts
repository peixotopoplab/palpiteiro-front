"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface RedefinirState {
  error: string | null;
}

export async function redefinirSenha(
  _prev: RedefinirState,
  formData: FormData
): Promise<RedefinirState> {
  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  if (senha.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  if (senha !== confirmacao) return { error: "As senhas não coincidem." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: senha });

  if (error) {
    console.error("[redefinir] updateUser:", error.message);
    if (error.message.includes("session")) {
      return { error: "Link expirado. Solicite um novo link de recuperação." };
    }
    return { error: "Não foi possível redefinir a senha. Tente novamente." };
  }

  redirect("/?senha_redefinida=1");
}
