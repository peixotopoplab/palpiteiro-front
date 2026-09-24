// Service Worker — Palpiteiro PWA
// Gerado em: 2026-09-24

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Palpiteiro", {
      body: payload.body,
      icon: payload.icon ?? "/icons/icon-192.png",
      badge: payload.badge ?? "/icons/icon-48.png",
      data: { url: payload.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";

  // Evento push_clicado — grava no Supabase via fetch (SW não tem acesso ao client JS)
  const SUPABASE_URL = self.__SUPABASE_URL__ ?? "";
  const SUPABASE_ANON_KEY = self.__SUPABASE_ANON_KEY__ ?? "";

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    fetch(`${SUPABASE_URL}/rest/v1/usage_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        tipo_evento: "push_clicado",
        metadata: { url },
      }),
    }).catch(() => {}); // silencia erros
  }

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});

// Injeta as variáveis de ambiente no SW via página ao registrar
self.addEventListener("message", (event) => {
  if (event.data?.type === "INIT_CONFIG") {
    self.__SUPABASE_URL__ = event.data.supabaseUrl;
    self.__SUPABASE_ANON_KEY__ = event.data.supabaseAnonKey;
  }
});
