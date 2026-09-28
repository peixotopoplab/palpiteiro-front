"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

type PushState = "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed";

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
  } catch {
    return null;
  }
}

/**
 * Botão de ativação/desativação de notificações push.
 * Registra o service worker, pede permissão ao usuário, salva
 * a subscription na API /api/push/subscribe.
 *
 * Também injeta as variáveis de ambiente no SW (necessário para
 * o evento push_clicado gravar em usage_events).
 */
export function PushNotificationButton({ className }: { className?: string }) {
  const [estado, setEstado] = useState<PushState>("loading");
  const [carregando, setCarregando] = useState(false);

  // Verifica o estado atual ao montar
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEstado("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setEstado("denied");
      return;
    }

    navigator.serviceWorker.ready.then((reg) => {
      // Injeta config no SW para uso no evento push_clicado
      reg.active?.postMessage({
        type: "INIT_CONFIG",
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      });

      reg.pushManager.getSubscription().then((sub) => {
        setEstado(sub ? "subscribed" : "unsubscribed");
      });
    }).catch(() => setEstado("unsubscribed"));
  }, []);

  const registrarSW = useCallback(async () => {
    const reg = await navigator.serviceWorker.register("/sw.js");
    // Aguarda SW com timeout de 5s para não travar indefinidamente
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("SW timeout")), 5000)
      ),
    ]);
    return reg;
  }, []);

  const ativar = useCallback(async () => {
    setCarregando(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "denied") { setEstado("denied"); return; }
      if (permission !== "granted") { setEstado("unsubscribed"); return; }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) { console.error("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY não configurada"); return; }

      const reg = await registrarSW();
      // Cast para any para contornar incompatibilidade de tipos ArrayBuffer/SharedArrayBuffer no TS
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applicationServerKey: applicationServerKey as any,
      });

      const sub = subscription.toJSON();
      if (!sub.endpoint || !sub.keys) throw new Error("Subscription inválida");

      const token = await getAuthToken();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ endpoint: sub.endpoint, keys: sub.keys, userAgent: navigator.userAgent }),
      });

      if (!res.ok) throw new Error(`API erro: ${res.status}`);
      setEstado("subscribed");
    } catch (err) {
      console.error("[push] erro ao ativar:", err);
      setEstado("unsubscribed"); // volta ao estado inicial em caso de erro
    } finally {
      setCarregando(false);
    }
  }, [registrarSW]);

  const desativar = useCallback(async () => {
    setCarregando(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEstado("unsubscribed");
    } catch (err) {
      console.error("[push] erro ao desativar:", err);
    } finally {
      setCarregando(false);
    }
  }, []);

  if (estado === "unsupported") return null;

  const configs: Record<Exclude<PushState, "loading" | "unsupported">, {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    muted?: boolean;
  }> = {
    unsubscribed: {
      icon: <Bell className="size-4" />,
      label: "Ativar alertas",
      onClick: ativar,
    },
    subscribed: {
      icon: <BellRing className="size-4" />,
      label: "Alertas ativos",
      onClick: desativar,
    },
    denied: {
      icon: <BellOff className="size-4" />,
      label: "Alertas bloqueados",
      muted: true,
    },
  };

  if (estado === "loading") {
    return (
      <div className={`flex items-center gap-2 text-label-md text-text-muted ${className ?? ""}`}>
        <Loader2 className="size-4 animate-spin" />
        <span>Verificando...</span>
      </div>
    );
  }

  const cfg = configs[estado];

  return (
    <button
      type="button"
      onClick={carregando ? undefined : cfg.onClick}
      disabled={carregando || cfg.muted}
      className={`flex items-center gap-2 text-label-md transition-colors ${
        estado === "subscribed"
          ? "text-tertiary hover:text-text-muted"
          : cfg.muted
          ? "text-text-muted cursor-default"
          : "text-text-muted hover:text-text-primary"
      } ${className ?? ""}`}
    >
      {carregando ? <Loader2 className="size-4 animate-spin" /> : cfg.icon}
      <span>{carregando ? "Aguarde..." : cfg.label}</span>
    </button>
  );
}
