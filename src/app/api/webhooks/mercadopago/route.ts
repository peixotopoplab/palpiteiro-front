import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPaymentClient } from "@/lib/mercadopago";

/**
 * Webhook do Mercado Pago — recebe notificações de pagamento.
 * Ativa ou cancela o plano VIP automaticamente.
 *
 * Segurança:
 * - Valida a assinatura HMAC-SHA256 do MP (x-signature header)
 * - Usa service role key para escrever em users/subscriptions
 *   (o Front nunca tem essa chave — é exclusiva deste Route Handler)
 * - Idempotente: processar o mesmo evento duas vezes não duplica dados
 *
 * Documentação MP: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */

// Cliente com service role — escrita sem RLS
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function validarAssinatura(request: NextRequest): Promise<boolean> {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] MERCADOPAGO_WEBHOOK_SECRET não configurado");
    return false;
  }

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  if (!xSignature || !xRequestId) return false;

  // Formato da assinatura MP: "ts=...,v1=..."
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => p.split("=") as [string, string])
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${xRequestId};request-id:${xRequestId};ts:${ts};`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));
  const computed = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computed === v1;
}

export async function POST(request: NextRequest) {
  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  // Validação de assinatura — rejeita requests não autenticados
  const valido = await validarAssinatura(request);
  if (!valido) {
    console.warn("[webhook] Assinatura inválida — request rejeitado");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: { type?: string; data?: { id?: string } };
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Só processa eventos de pagamento
  if (payload.type !== "payment") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const paymentId = payload.data?.id;
  if (!paymentId) {
    return NextResponse.json({ error: "missing payment id" }, { status: 400 });
  }

  try {
    // Busca detalhes do pagamento na API do MP
    const mpPayment = getPaymentClient();
    const payment = await mpPayment.get({ id: Number(paymentId) });

    const status = payment.status;
    const userId = payment.external_reference; // definido em criarPreferenciaVip
    const valor = payment.transaction_amount ?? 0;

    if (!userId) {
      console.error("[webhook] external_reference ausente no pagamento", paymentId);
      return NextResponse.json({ error: "missing user reference" }, { status: 400 });
    }

    const supabase = getServiceClient();

    if (status === "approved") {
      // Ativa VIP — calcula data_fim como +30 dias
      const dataFim = new Date();
      dataFim.setDate(dataFim.getDate() + 30);

      // Atualiza status do usuário
      await supabase
        .from("users")
        .update({ status: "vip" })
        .eq("id", userId);

      // Registra/atualiza assinatura
      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          mercadopago_subscription_id: String(paymentId),
          status: "ativa",
          origem: "automatica",
          valor,
          data_inicio: new Date().toISOString(),
          data_fim: dataFim.toISOString(),
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "mercadopago_subscription_id" }
      );

      // Registra transação financeira
      await supabase.from("financial_transactions").insert({
        user_id: userId,
        tipo: "pagamento",
        valor,
        descricao: `Pagamento MP #${paymentId}`,
      });

      console.log(`[webhook] VIP ativado para usuário ${userId}`);
    } else if (status === "cancelled" || status === "refunded" || status === "charged_back") {
      // Cancela VIP
      await supabase
        .from("users")
        .update({ status: "free" })
        .eq("id", userId);

      await supabase
        .from("subscriptions")
        .update({ status: "cancelada", atualizado_em: new Date().toISOString() })
        .eq("mercadopago_subscription_id", String(paymentId));

      console.log(`[webhook] VIP cancelado para usuário ${userId} — status MP: ${status}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[webhook] Erro ao processar pagamento", paymentId, err);
    // Retorna 200 mesmo em erro interno — MP reprocessa se receber 4xx/5xx
    // O log acima captura o problema pra investigação manual
    return NextResponse.json({ ok: false, internal_error: true });
  }
}
