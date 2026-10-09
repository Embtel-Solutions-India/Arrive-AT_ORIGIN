import type { Request, Response } from "express";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  clearOptions,
  refreshCookieOptions,
} from "../../config/cookies.js";
import { ok } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";
import { authService, type SessionTokens } from "./auth.service.js";
import type { LoginInput } from "./auth.schemas.js";

const ctx = (req: Request) => ({ userAgent: req.get("user-agent"), ip: req.ip });

function setSession(res: Response, t: SessionTokens) {
  res.cookie(ACCESS_COOKIE, t.accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE, t.refreshToken, refreshCookieOptions(t.refreshMaxAgeMs));
}

export const authController = {
  async login(req: Request, res: Response) {
    const { email, password, remember } = req.body as LoginInput;
    const { user, tokens } = await authService.login(email, password, remember ?? false, ctx(req));
    setSession(res, tokens);
    ok(res, { user, token: tokens.accessToken }, "Logged in");
  },

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE] || req.body?.refreshToken;
    if (!token) throw HttpError.unauthorized("No refresh token provided");
    const { user, tokens } = await authService.refresh(token, ctx(req));
    setSession(res, tokens);
    ok(res, { user, token: tokens.accessToken }, "Session refreshed");
  },

  async logout(_req: Request, res: Response) {
    res.clearCookie(ACCESS_COOKIE, clearOptions("/"));
    res.clearCookie(REFRESH_COOKIE, clearOptions("/api/auth"));
    ok(res, null, "Logged out");
  },

  async me(req: Request, res: Response) {
    if (!req.user) throw HttpError.unauthorized();
    const user = await authService.getMe(req.user.id);
    ok(res, { user });
  },

  async forgotPassword(req: Request, res: Response) {
    const origin =
      (req.headers.origin as string) ||
      (req.headers.referer ? new URL(req.headers.referer).origin : "") ||
      undefined;
    await authService.forgotPassword(req.body.email, origin);
    ok(res, null, "If that email is registered, a reset link has been sent");
  },

  async resetPassword(req: Request, res: Response) {
    await authService.resetPassword(req.body.token, req.body.password);
    ok(res, null, "Password updated. Please log in.");
  },
};
