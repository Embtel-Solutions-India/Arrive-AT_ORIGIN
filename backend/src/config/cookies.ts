import type { CookieOptions } from "express";
import { env, isProd } from "./env.js";

export const ACCESS_COOKIE = "sb_access";
export const REFRESH_COOKIE = "sb_refresh";

const base: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "strict" : "lax",
  domain: env.COOKIE_DOMAIN || undefined,
};

export const accessCookieOptions = (): CookieOptions => ({
  ...base,
  path: "/",
  maxAge: env.ACCESS_TOKEN_TTL_MINUTES * 60_000,
});

// Refresh cookie is only ever sent to the auth routes.
export const refreshCookieOptions = (maxAgeMs: number): CookieOptions => ({
  ...base,
  path: "/api/auth",
  maxAge: maxAgeMs,
});

export const clearOptions = (path: string): CookieOptions => ({ ...base, path });
