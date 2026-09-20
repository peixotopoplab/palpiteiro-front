"use server";

import { createClient } from "@/lib/supabase/server";

export interface RecuperarState {
  error: string | null;
  success: boolean;
}

export async function solicitarRecuperacao(
  _prev: RecuperarState,
  formData: FormData
): Promise<RecuperarState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Digite seu e-mail.", success: false };

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://palpiteiro-front.vercel.app";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/entrar/redefinir`,
  });

  if (error) {
    console.error("[recuperar] resetPasswordForEmail:", error.message);
    // Não revela se o e-mail existe ou não (segurança)
  }

  // Sempre retorna sucesso — não confirma se o e-mail existe
  return { error: null, success: true };
}
