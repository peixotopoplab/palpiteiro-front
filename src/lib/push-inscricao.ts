/**
 * Regras de posse das inscrições de push, independentes de banco (o acesso entra por `PushDb`).
 *
 * - Inscrever um endpoint que já existe e está ativo só é permitido a quem prova a posse
 *   (mesmo segredo `auth`); caso contrário 409 e a linha NÃO é alterada (sem sequestro).
 * - Remover exige endpoint + `auth`; a resposta é sempre 200 (idempotente, sem revelar
 *   se o endpoint existe).
 */
import type { Inscricao } from "@/lib/push-validacao";

export interface LinhaPush {
  endpoint: string;
  auth: string;
  user_id: string | null;
  ativo: boolean;
}

export interface NovaLinha {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_id: string | null;
  user_agent: string | null;
}

export interface PushDb {
  buscar(endpoint: string): Promise<LinhaPush | null>;
  /** "duplicado" se outro request criou o mesmo endpoint no meio do caminho. */
  inserir(l: NovaLinha): Promise<"ok" | "duplicado">;
  /** Só atualiza se a linha continuar sendo do mesmo dono (mesmo auth) ou estiver inativa; retorna linhas afetadas. */
  atualizar(l: NovaLinha, authAtual: string): Promise<number>;
  /** Desativa só se endpoint E auth baterem; retorna linhas afetadas. */
  desativar(endpoint: string, auth: string): Promise<number>;
}

export interface Resposta { status: number; corpo: Record<string, unknown> }

const CONFLITO: Resposta = { status: 409, corpo: { error: "Inscrição já registrada para este dispositivo" } };

export async function inscrever(db: PushDb, entrada: Inscricao, userId: string | null): Promise<Resposta> {
  const atual = await db.buscar(entrada.endpoint);

  if (atual && atual.ativo && atual.auth !== entrada.auth) return CONFLITO;

  const linha: NovaLinha = {
    endpoint: entrada.endpoint,
    p256dh: entrada.p256dh,
    auth: entrada.auth,
    // o mesmo dispositivo reinscrevendo como visitante mantém o vínculo anterior
    user_id: userId ?? atual?.user_id ?? null,
    user_agent: entrada.userAgent,
  };

  if (!atual) {
    return (await db.inserir(linha)) === "ok" ? { status: 200, corpo: { ok: true } } : CONFLITO;
  }
  const n = await db.atualizar(linha, atual.auth);
  return n > 0 ? { status: 200, corpo: { ok: true } } : CONFLITO;
}

export async function remover(db: PushDb, endpoint: string, auth: string): Promise<Resposta> {
  await db.desativar(endpoint, auth);
  return { status: 200, corpo: { ok: true } };
}
