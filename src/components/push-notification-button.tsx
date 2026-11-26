"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

type PushState = "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

/** Tempo máximo de cada etapa, em ms. Exportado para os testes poderem encurtá-lo. */
export const TEMPOS_PUSH = { registro: 8000, subscribe: 15000, rede: 10000 };

/** Falha em uma etapa conhecida do fluxo — a mensagem é para o usuário, `etapa` é para o diagnóstico. */
class FalhaPush extends Error {
  constructor(public etapa: string, mensagem: string) {
    super(mensagem);
    this.name = "FalhaPush";
  }
}

/** Rejeita com FalhaPush se a promessa não resolver no prazo — nenhuma etapa pode travar o botão. */
function comLimite<T>(promessa: Promise<T>, ms: number, etapa: string, mensagem: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new FalhaPush(etapa, mensagem)), ms);
    promessa.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}

function mensagemHttp(status: number, corpo: string): string {
  switch (status) {
    case 400: return `O servidor não aceitou esta inscrição${corpo ? ` (${corpo})` : ""}.`;
    case 403: return "Pedido bloqueado por segurança (origem não permitida).";
    case 409: return "Este dispositivo já está registrado com outra chave. Desative e ative de novo.";
    case 413: return "Pedido grande demais.";
    case 429: return "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.";
    default:
      return status >= 500
        ? "Erro no servidor ao registrar o alerta. Tente mais tarde."
        : `Falha inesperada (HTTP ${status}).`;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch { return null; }
}

/** fetch com limite de tempo; diferencia "sem resposta" de "sem conexão". */
async function chamarApi(metodo: "POST" | "DELETE", corpo: unknown, token?: string | null): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TEMPOS_PUSH.rede);
  try {
    return await fetch("/api/push/subscribe", {
      method: metodo,
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(corpo),
    });
  } catch {
    throw new FalhaPush("rede", ctrl.signal.aborted ? "O servidor não respondeu a tempo." : "Sem conexão com o servidor.");
  } finally {
    clearTimeout(timer);
  }
}

export function PushNotificationButton({ className }: { className?: string }) {
  const [estado, setEstado] = useState<PushState>("loading");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEstado("unsupported"); return;
    }
    if (Notification.permission === "denied") {
      setEstado("denied"); return;
    }
    // Verifica a inscrição existente, com prazo para não ficar em "Verificando..."
    const timer = setTimeout(() => setEstado("unsubscribed"), 3000);
    navigator.serviceWorker.getRegistration("/sw.js").then((reg) => {
      clearTimeout(timer);
      if (!reg) { setEstado("unsubscribed"); return; }
      reg.pushManager.getSubscription().then((sub) => {
        setEstado(sub ? "subscribed" : "unsubscribed");
      }).catch(() => setEstado("unsubscribed"));
    }).catch(() => { clearTimeout(timer); setEstado("unsubscribed"); });
    return () => clearTimeout(timer);
  }, []);

  const ativar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    let sub: PushSubscription | null = null;
    try {
      const permission = await Notification.requestPermission();
      if (permission === "denied") { setEstado("denied"); return; }
      if (permission !== "granted") {
        setErro("Permissão não concedida. Toque de novo e escolha “Permitir”.");
        return;
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new FalhaPush("config", "A chave de alertas (VAPID) não está configurada neste ambiente.");

      await comLimite(navigator.serviceWorker.register("/sw.js"), TEMPOS_PUSH.registro, "registro",
        "O navegador não conseguiu registrar o serviço de alertas (tempo esgotado).");
      const pronto = await comLimite(navigator.serviceWorker.ready, TEMPOS_PUSH.registro, "ativacao",
        "O serviço de alertas não ficou ativo (tempo esgotado).");

      // Etapa em que o navegador fala com o serviço de push (Google, Mozilla, Apple…): a que mais trava
      sub = await comLimite(
        pronto.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as ArrayBuffer,
        }),
        TEMPOS_PUSH.subscribe, "subscribe",
        "O navegador não conseguiu criar a inscrição de push (tempo esgotado). Em alguns navegadores é preciso permitir o serviço de push do Google nas configurações."
      );

      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new FalhaPush("subscribe", "O navegador devolveu uma inscrição incompleta.");
      }

      const res = await chamarApi("POST", { endpoint: json.endpoint, keys: json.keys, userAgent: navigator.userAgent }, await getAuthToken());
      if (!res.ok) {
        let corpo = "";
        try { corpo = String((await res.json())?.error ?? ""); } catch { /* corpo não é JSON */ }
        throw new FalhaPush(`http-${res.status}`, mensagemHttp(res.status, corpo));
      }
      setEstado("subscribed");
    } catch (err) {
      // desfaz a inscrição do navegador: sem o servidor saber dela, "ativo" seria mentira
      if (sub) { try { await sub.unsubscribe(); } catch { /* melhor esforço */ } }
      console.error("[push] falha ao ativar:", err);
      if (err instanceof FalhaPush) setErro(`${err.message} [${err.etapa}]`);
      else {
        const nome = err instanceof Error ? err.name : "Erro";
        const detalhe = err instanceof Error && err.message ? `: ${err.message}` : "";
        setErro(`Não foi possível ativar os alertas [${nome}${detalhe}].`);
      }
      setEstado("unsubscribed");
    } finally {
      setCarregando(false);
    }
  }, []);

  const desativar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        // `auth` = prova de posse do dispositivo. Avisar o servidor é melhor esforço (com prazo):
        // o navegador desinscreve de qualquer forma.
        try { await chamarApi("DELETE", { endpoint: sub.endpoint, keys: { auth: sub.toJSON().keys?.auth } }); }
        catch (err) { console.error("[push] servidor não confirmou a remoção:", err); }
        await sub.unsubscribe();
      }
      setEstado("unsubscribed");
    } catch (err) {
      console.error("[push] falha ao desativar:", err);
      setErro("Não foi possível desativar os alertas agora. Tente de novo.");
    } finally {
      setCarregando(false);
    }
  }, []);

  if (estado === "unsupported") return null;

  if (estado === "loading") return (
    <div className={`flex items-center gap-2 text-label-md text-text-muted ${className ?? ""}`}>
      <Loader2 className="size-4 animate-spin" /><span>Verificando...</span>
    </div>
  );

  if (estado === "denied") return (
    <div className={`flex items-center gap-2 text-label-md text-text-muted ${className ?? ""}`}>
      <BellOff className="size-4" /><span>Alertas bloqueados no navegador</span>
    </div>
  );

  const ativo = estado === "subscribed";
  return (
    <div className="flex flex-col items-end">
      <button type="button" onClick={carregando ? undefined : ativo ? desativar : ativar} disabled={carregando}
        className={`flex items-center gap-2 text-label-md transition-colors ${
          ativo ? "text-tertiary hover:text-text-muted" : "text-text-muted hover:text-text-primary"
        } ${className ?? ""}`}>
        {carregando ? <Loader2 className="size-4 animate-spin" /> : ativo ? <BellRing className="size-4" /> : <Bell className="size-4" />}
        <span>{carregando ? "Aguarde..." : ativo ? "Alertas ativos" : "Ativar alertas"}</span>
      </button>
      {erro && (
        <span role="alert" className="mt-1 block max-w-[260px] text-right text-label-sm text-error-red">{erro}</span>
      )}
    </div>
  );
}
