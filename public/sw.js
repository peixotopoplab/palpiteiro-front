// Service Worker — Palpiteiro PWA
// Versão mínima: só gerencia push e notificationclick.
// NÃO intercepta fetch — evita quebrar navegação e carregamento de páginas.

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

  // Grava evento push_clicado no Supabase via REST (SW não tem acesso ao SDK)
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

// Recebe config do Front (SUPABASE_URL e SUPABASE_ANON_KEY)
self.addEventListener("message", (event) => {
  if (event.data?.type === "INIT_CONFIG") {
    self.__SUPABASE_URL__ = event.data.supabaseUrl;
    self.__SUPABASE_ANON_KEY__ = event.data.supabaseAnonKey;
  }
});

// IMPORTANTE: sem evento "fetch" — o SW não intercepta nenhuma requisição.
// Isso evita quebrar navegação, carregamento de páginas e o drawer da análise.
