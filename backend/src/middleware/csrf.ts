import type { RequestHandler } from "express";
import { isAllowedOrigin } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Cookie-auth CSRF defence: SameSite cookies plus a strict Origin check on every
 * state-changing request. Requests without an Origin (server-to-server, e.g. payment
 * webhooks) carry no cookies, so they cannot ride a victim's session.
 */
export const originGuard: RequestHandler = (req, _res, next) => {
  if (SAFE.has(req.method)) return next();
  const origin = req.get("origin");
  if (!origin) return req.cookies?.sb_access || req.cookies?.sb_refresh ? next(HttpError.forbidden("Missing origin")) : next();
  if (!isAllowedOrigin(origin)) return next(HttpError.forbidden("Origin not allowed"));
  next();
};
