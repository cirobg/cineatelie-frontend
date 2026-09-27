/**
 * Same-origin proxy to the Cloud Run API (architecture doc, launch dependency A0; ADR-015).
 *
 * Why this exists at all: the refresh cookie is `SameSite=Lax` (ADR-006), which the browser
 * only sends on requests to the same site as the page. The SPA's default host
 * (`*.pages.dev`) and the API's (`*.run.app`) are two different sites, so calling Cloud Run
 * directly would mean the cookie is silently never sent -- every page reload would log the
 * user out (backend BR-ID-02). Routing `/api/*` through this Pages Function instead makes
 * the API part of the SPA's own origin.
 *
 * `[[path]]` is Cloudflare Pages' catch-all route segment: this one function handles every
 * request under `/api/*`. `API_ORIGIN` and `EDGE_SHARED_SECRET` are Pages project environment
 * variables/secrets (Cloudflare dashboard), not anything in this repo's own `.env` --
 * `EDGE_SHARED_SECRET` must be the exact same value as the backend's own (ADR-015), so
 * `EdgeVerificationMiddleware` can tell the request genuinely came through here.
 *
 * Not used in local dev: the Vite dev server calls the API directly at `http://localhost:8000`
 * (CORS is configured there for exactly this reason -- see `cineatelie-backend/docker-
 * compose.yml`), because `localhost:5173` and `localhost:8000` already share a registrable
 * domain, so the SameSite cookie problem this proxy solves doesn't exist locally at all.
 */

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, env.API_ORIGIN);

  const headers = new Headers(request.headers);
  // Drop the incoming Host (the Pages domain) rather than forward it -- fetch() sets the
  // correct one for `target` on its own. Nothing here rewrites it to anything special
  // (architecture doc: "no Host header rewriting is involved") because the target is always
  // the API's own default `*.run.app` address, which doesn't route on Host in the first place.
  headers.delete("host");
  headers.set("X-Edge-Secret", env.EDGE_SHARED_SECRET);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  // Returning the fetch() Response directly streams its body straight through rather than
  // buffering it in memory first.
  return fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: "manual",
  });
}
