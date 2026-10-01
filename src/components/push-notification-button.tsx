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
  } catch { return null; }
}

export function PushNotificationButton({ className }: { className?: string }) {
  const [estado, setEstado] = useState<PushState>("loading");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEstado("unsupported"); return;
    }
    if (Notification.permission === "denied") {
      setEstado("denied"); return;
    }
    // Verifica subscription existente com timeout
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
    try {
      const permission = await Notification.requestPermission();
      if (permission === "denied") { setEstado("denied"); setCarregando(false); return; }
      if (permission !== "granted") { setCarregando(false); return; }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) { console.error("[push] VAPID key não configurada"); setCarregando(false); return; }

      // Registra SW com timeout de 4s
      let reg: ServiceWorkerRegistration;
      try {
        reg = await Promise.race([
          navigator.serviceWorker.register("/sw.js"),
          new Promise<never>((_, r) => setTimeout(() => r(new Error("timeout")), 4000)),
        ]);
      } catch {
        console.error("[push] falha ao registrar SW");
        setCarregando(false); return;
      }

      // Aguarda SW ativo com timeout
      if (!reg.active) {
        await Promise.race([
          new Promise<void>((res) => {
            const handler = () => { if (reg.active) { reg.removeEventListener("updatefound", handler); res(); } };
            reg.addEventListener("updatefound", handler);
            if (reg.installing) reg.installing.addEventListener("statechange", () => { if (reg.active) res(); });
          }),
          new Promise<void>((res) => setTimeout(res, 3000)),
        ]);
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as ArrayBuffer,
      });

      const subJson = sub.toJSON();
      if (!subJson.endpoint || !subJson.keys) throw new Error("Subscription inválida");

      const token = await getAuthToken();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys, userAgent: navigator.userAgent }),
      });

      setEstado("subscribed");
    } catch (err) {
      console.error("[push] erro:", err);
      setEstado("unsubscribed");
    } finally {
      setCarregando(false);
    }
  }, []);

  const desativar = useCallback(async () => {
    setCarregando(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEstado("unsubscribed");
    } catch { setEstado("unsubscribed"); }
    finally { setCarregando(false); }
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

  if (estado === "subscribed") return (
    <button type="button" onClick={carregando ? undefined : desativar} disabled={carregando}
      className={`flex items-center gap-2 text-label-md text-tertiary hover:text-text-muted transition-colors ${className ?? ""}`}>
      {carregando ? <Loader2 className="size-4 animate-spin" /> : <BellRing className="size-4" />}
      <span>{carregando ? "Aguarde..." : "Alertas ativos"}</span>
    </button>
  );

  return (
    <button type="button" onClick={carregando ? undefined : ativar} disabled={carregando}
      className={`flex items-center gap-2 text-label-md text-text-muted hover:text-text-primary transition-colors ${className ?? ""}`}>
      {carregando ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
      <span>{carregando ? "Aguarde..." : "Ativar alertas"}</span>
    </button>
  );
}
