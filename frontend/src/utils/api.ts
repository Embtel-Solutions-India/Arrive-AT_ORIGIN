/**
 * Global API base configuration.
 * Resolves to the production API URL when VITE_API_URL is set,
 * or falls back to relative `/api` for local development (which Vite proxies to localhost:4000).
 *
 * Automatically ensures the URL includes the `/api` prefix without duplicates,
 * regardless of whether VITE_API_URL is configured as:
 * - "https://api.arriveatorigin.com"
 * - "https://api.arriveatorigin.com/api"
 * - "https://api.arriveatorigin.com/"
 * - undefined / empty (local dev -> "/api")
 */
const rawBase = (import.meta.env.VITE_API_URL ?? "").trim();

export const API_BASE = !rawBase
  ? "/api"
  : rawBase.replace(/\/+$/, "").endsWith("/api")
  ? rawBase.replace(/\/+$/, "")
  : `${rawBase.replace(/\/+$/, "")}/api`;

export const BASE = API_BASE;

/**
 * Builds a clean endpoint URL using API_BASE.
 * Accepts paths with or without leading `/api` or `/`.
 *
 * @example
 * apiUrl("/public/books") // "https://api.arriveatorigin.com/api/public/books"
 * apiUrl("/api/public/books") // "https://api.arriveatorigin.com/api/public/books"
 * apiUrl(`/public/books/${slug}`)
 */
export function apiUrl(path: string): string {
  const cleanPath = path.startsWith("/api/")
    ? path.slice(4)
    : path.startsWith("api/")
    ? path.slice(3)
    : path.startsWith("/")
    ? path
    : `/${path}`;

  return `${API_BASE}${cleanPath}`;
}
