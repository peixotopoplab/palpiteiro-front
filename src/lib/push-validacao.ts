/**
 * Validação de entrada de /api/push/subscribe (rota pública que usa a service role).
 * Funções puras — testadas em separado da rota.
 *
 * Por que o endpoint é validado: o Admin envia push para os endpoints guardados. Um
 * endpoint arbitrário vira uma requisição feita pelo servidor do Admin (SSRF), então só
 * aceitamos HTTPS nos hosts dos serviços de push dos navegadores.
 */

/**
 * Serviços de push aceitos. MANTER IGUAL ao Admin (`lib/push-hosts.ts`) e à consulta de
 * auditoria do ledger de migrations — o Admin ignora no envio o que o Front não aceitaria.
 *  - fcm.googleapis.com e updates.push.services.mozilla.com: host EXATO
 *  - *.push.apple.com e *.notify.windows.com: ao menos um rótulo antes do sufixo
 * HTTPS, sem credenciais, porta padrão.
 */
const HOSTS_EXATOS = ["fcm.googleapis.com", "updates.push.services.mozilla.com"] as const;
const SUFIXOS_COM_SUBDOMINIO = ["push.apple.com", "notify.windows.com"] as const;
const ROTULOS = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/;

export const LIMITES = { endpoint: 2048, userAgent: 300, corpo: 4096 } as const;

const BASE64URL = /^[A-Za-z0-9_-]+$/;
// eslint-disable-next-line no-control-regex
const CONTROLE = /[\u0000-\u001f\u007f]/;
// eslint-disable-next-line no-control-regex
const CONTROLE_GLOBAL = /[\u0000-\u001f\u007f]/g;

function hostPermitido(host: string): boolean {
  if ((HOSTS_EXATOS as readonly string[]).includes(host)) return true;
  return SUFIXOS_COM_SUBDOMINIO.some(
    (s) => host.endsWith("." + s) && ROTULOS.test(host.slice(0, -(s.length + 1)))
  );
}

/** Retorna o endpoint se for HTTPS, sem credenciais, porta padrão e host de serviço de push. */
export function endpointPermitido(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > LIMITES.endpoint) return null;
  if (raw !== raw.trim() || CONTROLE.test(raw)) return null;
  let url: URL;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "443") return null;
  if (!hostPermitido(url.hostname)) return null;
  return raw;
}

function chaveValida(v: unknown, min: number, max: number): v is string {
  return typeof v === "string" && v.length >= min && v.length <= max && BASE64URL.test(v);
}

export interface Inscricao {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
}

type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string };

function obj(v: unknown): Record<string, unknown> | null {
  return v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function validarInscricao(body: unknown): Resultado<Inscricao> {
  const b = obj(body);
  if (!b) return { ok: false, erro: "Corpo inválido" };
  const endpoint = endpointPermitido(b.endpoint);
  if (!endpoint) return { ok: false, erro: "Endpoint inválido" };
  const keys = obj(b.keys);
  if (!keys || !chaveValida(keys.p256dh, 80, 100) || !chaveValida(keys.auth, 16, 32)) {
    return { ok: false, erro: "Chaves inválidas" };
  }
  const ua = typeof b.userAgent === "string"
    ? b.userAgent.replace(CONTROLE_GLOBAL, " ").slice(0, LIMITES.userAgent)
    : null;
  return { ok: true, valor: { endpoint, p256dh: keys.p256dh as string, auth: keys.auth as string, userAgent: ua } };
}

/** Remover exige o endpoint E o segredo `auth` da inscrição (prova de posse do dispositivo). */
export function validarRemocao(body: unknown): Resultado<{ endpoint: string; auth: string }> {
  const b = obj(body);
  if (!b) return { ok: false, erro: "Corpo inválido" };
  const endpoint = endpointPermitido(b.endpoint);
  const keys = obj(b.keys);
  if (!endpoint || !keys || !chaveValida(keys.auth, 16, 32)) return { ok: false, erro: "Dados inválidos" };
  return { ok: true, valor: { endpoint, auth: keys.auth as string } };
}

/** Defesa em profundidade contra POST cross-site: se há Origin, ele precisa ser o próprio host. */
export function origemPermitida(origin: string | null, host: string | null): boolean {
  if (!origin) return true; // chamadas sem Origin caem nas demais validações
  if (!host) return false;
  try { return new URL(origin).host === host; } catch { return false; }
}
