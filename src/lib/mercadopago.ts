import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

/**
 * Cliente Mercado Pago — instanciado com ACCESS_TOKEN privado.
 * Só importar em Server Components, Server Actions ou Route Handlers.
 * Nunca importar em Client Components (a chave vazaria pro bundle).
 */
function getMPClient() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  return new MercadoPagoConfig({ accessToken: token });
}

export function getPreferenceClient() {
  return new Preference(getMPClient());
}

export function getPaymentClient() {
  return new Payment(getMPClient());
}
