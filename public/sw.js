/* Service worker mínimo de AGENTE PRUEBA.
 *
 * Reglas:
 * - Cache-first SOLO para los assets estáticos propios (íconos y manifest).
 * - Todo lo demás del mismo origen: red directa (passthrough).
 * - Navegaciones: red primero, con una página de fallback offline generada acá.
 * - Nada de otro origen se toca nunca (Supabase y cualquier API externa quedan
 *   fuera del service worker: no se cachea ni se inspecciona su respuesta).
 */

const VERSION = "v1";
const STATIC_CACHE = `agente-static-${VERSION}`;

const STATIC_ASSETS = [
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
  "/favicon.svg",
  "/manifest.webmanifest",
];

const OFFLINE_HTML = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sin conexión · Agente</title>
<style>
  :root { color-scheme: light; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f4f1;
    color: #1f3d2b;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  main { max-width: 22rem; padding: 2rem; text-align: left; }
  .mark { width: 56px; height: 56px; border-radius: 50%; background: #1f3d2b; }
  h1 { font-size: 1.05rem; font-weight: 600; margin: 1.75rem 0 0.5rem; }
  p { font-size: 0.9rem; line-height: 1.5; margin: 0; opacity: 0.75; }
</style>
</head>
<body>
  <main>
    <div class="mark"></div>
    <h1>Sin conexión</h1>
    <p>No hay red disponible. Volvé a intentar cuando recuperes la conexión.</p>
  </main>
</body>
</html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("agente-static-") && key !== STATIC_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return STATIC_ASSETS.includes(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Sólo mismo origen. Supabase y cualquier otro host quedan intactos.
  if (url.origin !== self.location.origin) return;

  // Cache-first para los assets estáticos propios.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navegaciones: red primero, fallback offline si no hay conexión.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(OFFLINE_HTML, {
            status: 503,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-store",
            },
          })
      )
    );
    return;
  }

  // Resto: passthrough, sin cachear nada.
});
