"use server";

import { createClient } from "@/lib/supabase/server";
import { getPreferenceClient } from "@/lib/mercadopago";
import { getCurrentUser } from "@/lib/queries";

export interface PreferenciaResult {
  error: string | null;
  checkoutUrl?: string;
}

/**
 * Cria uma preferência de pagamento no Mercado Pago e retorna a URL
 * de checkout. Chamada do client após o usuário clicar em "Assinar VIP".
 *
 * Fluxo:
 * 1. Verifica sessão (só free pode assinar — vip já tem)
 * 2. Busca preço vigente no banco (sem hardcode)
 * 3. Cria preferência MP com back_urls pro Front
 * 4. Retorna init_point (URL de checkout do MP)
 */
export async function criarPreferenciaVip(): Promise<PreferenciaResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Você precisa estar logado para assinar." };
  if (user.status === "vip") return { error: "Você já é assinante VIP." };

  // Busca PREÇO BASE no banco — filtra por papel='preco_base' para não
  // confundir com campanhas de desconto que usam a mesma tabela.
  // ATENÇÃO: valor_desconto em campanhas = tamanho do desconto (ex: 10 = R$10 off)
  //          valor_desconto em preco_base = preço final cobrado (ex: 29.9 = R$29,90)
  // Enquanto a coluna 'papel' não existir no banco, o Admin NÃO deve criar
  // campanhas de desconto em produção — use só o registro de preço base.
  const supabase = await createClient();
  const { data: promo } = await supabase
    .from("promotional_pricing")
    .select("nome, valor_desconto, tipo_desconto")
    .eq("ativo", true)
    .eq("tipo_desconto", "fixo") // só registros de preço fixo (nunca percentual)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!promo) {
    console.error("[criarPreferenciaVip] Nenhum preço base ativo encontrado em promotional_pricing");
    return { error: "Preço indisponível. Tente novamente em instantes." };
  }

  const valorFinal = Number(promo.valor_desconto);

  // Validação de segurança — preço nunca pode ser menor que R$ 5,00
  if (valorFinal < 5) {
    console.error(`[criarPreferenciaVip] ALERTA: valor_desconto suspeito: R$${valorFinal}. Abortando checkout.`);
    return { error: "Erro de configuração de preço. Contate o suporte." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://palpiteiro.app";

  try {
    const preference = getPreferenceClient();
    const response = await preference.create({
      body: {
        items: [
          {
            id: "vip-mensal",
            title: "Palpiteiro VIP — Acesso Mensal",
            description: promo?.nome ?? "Análise completa dos 14 jogos da Loteca",
            quantity: 1,
            unit_price: valorFinal,
            currency_id: "BRL",
          },
        ],
        payer: {
          email: user.email,
          name: user.nome,
        },
        back_urls: {
          success: `${siteUrl}/conta?pagamento=sucesso`,
          failure: `${siteUrl}/conta?pagamento=falha`,
          pending: `${siteUrl}/conta?pagamento=pendente`,
        },
        auto_return: "approved",
        external_reference: user.id, // usado no webhook pra identificar o usuário
        metadata: {
          user_id: user.id,
          plano: "vip_mensal",
        },
        notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      },
    });

    return { error: null, checkoutUrl: response.init_point };
  } catch (err) {
    console.error("[criarPreferenciaVip]", err);
    return { error: "Não foi possível iniciar o checkout. Tente novamente." };
  }
}
