/** Base URL for CmAdmin API (server-side / error messages). */
export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
}

/**
 * URL prefix for browser fetch calls.
 * - Production / remote API: same-origin paths (Next.js rewrites proxy to counsellor admin).
 * - Local dev (localhost API): call counsellor admin directly so new API routes work
 *   immediately without restarting this app after .env changes.
 */
export function getClientApiBase(): string {
  if (typeof window === "undefined") return getApiBase();
  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002").replace(
    /\/$/,
    "",
  );
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base)) {
    return base;
  }
  return "";
}

export function apiUrl(path: string): string {
  const base = getClientApiBase().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
