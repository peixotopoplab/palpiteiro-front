"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export interface CupomActionState {
  error: string | null;
  success: string | null;
}

export async function aplicarCupom(
  _prev: CupomActionState,
  formData: FormData
): Promise<CupomActionState> {
  const codigo = String(formData.get("codigo") ?? "").trim().toUpperCase();
  if (!codigo) return { error: "Digite o código do cupom.", success: null };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Você precisa estar logado.", success: null };

  const { data, error } = await supabase.rpc("validar_cupom", {
    p_codigo: codigo,
    p_user_id: user.id,
  });

  if (error) return { error: "Erro ao validar cupom.", success: null };

  const resultado = data as {
    status: string;
    mensagem?: string;
    tipo_desconto?: string;
    valor_desconto?: number;
    duracao_meses?: number;
  };

  if (resultado.status !== "valido") {
    return { error: resultado.mensagem ?? "Cupom inválido.", success: null };
  }

  const desconto = resultado.tipo_desconto === "percentual"
    ? `${resultado.valor_desconto}% de desconto`
    : `R$ ${resultado.valor_desconto?.toFixed(2).replace(".", ",")} de desconto`;

  return {
    error: null,
    success: `Cupom válido! ${desconto} por ${resultado.duracao_meses} mês(es). Aplique no checkout ao assinar.`,
  };
}
