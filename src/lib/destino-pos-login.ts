/**
 * Para onde o usuário vai depois de entrar em /entrar.
 * Padrão: Home. Única exceção: o fluxo de compra, que precisa continuar em /assinar.
 * Lista fechada de propósito: qualquer outro valor de `redirect` (inclusive endereços
 * externos como "https://..." ou "//...") é ignorado — evita open redirect no login.
 */
const RETORNOS_PERMITIDOS = ["/assinar"] as const;

export function destinoPosLogin(redirect: string | null | undefined): string {
  return RETORNOS_PERMITIDOS.find((r) => r === redirect) ?? "/";
}
