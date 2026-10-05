// Service Worker — Palpiteiro PWA
// v3 — sem interceptação de fetch (corrige drawer "This page couldn't load")

const SW_VERSION = "3";

// Força atualização imediata — substitui SW antigo sem esperar fechar abas
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    // Limpa caches antigos que possam ter sido criados por versões anteriores
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); }
  catch { payload = { title: "Palpiteiro", body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Palpiteiro 🍀", {
      body: payload.body ?? "",
      icon: payload.icon ?? "/icons/icon-192.png",
      badge: "/icons/icon-48.png",
      data: { url: payload.url ?? "/" },
      requireInteraction: false,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  if (self.__SUPABASE_URL__ && self.__SUPABASE_ANON_KEY__) {
    fetch(`${self.__SUPABASE_URL__}/rest/v1/usage_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": self.__SUPABASE_ANON_KEY__,
        "Authorization": `Bearer ${self.__SUPABASE_ANON_KEY__}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ tipo_evento: "push_clicado", metadata: { url } }),
    }).catch(() => {});
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) { client.focus(); return; }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "INIT_CONFIG") {
    self.__SUPABASE_URL__ = event.data.supabaseUrl;
    self.__SUPABASE_ANON_KEY__ = event.data.supabaseAnonKey;
  }
});

// SEM evento "fetch" — o SW não intercepta nenhuma requisição HTTP.
// Isso é intencional: evita interferir com navegação e carregamento de páginas.
console.log("[SW] Palpiteiro Service Worker v" + SW_VERSION + " ativo");
