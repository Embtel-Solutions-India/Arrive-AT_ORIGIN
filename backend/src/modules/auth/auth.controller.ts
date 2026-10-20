import type { Request, Response } from "express";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  clearOptions,
  refreshCookieOptions,
} from "../../config/cookies.js";
import { User } from "../../models/User.js";
import { ok } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";
import { authService, signAccess, signRefresh, toPublicUser, type SessionTokens } from "./auth.service.js";
import { twoFactorService, verify2FATicket } from "./twoFactor.service.js";
import type { Confirm2FASetupInput, LoginInput, Verify2FAInput } from "./auth.schemas.js";

const ctx = (req: Request) => ({ userAgent: req.get("user-agent"), ip: req.ip });

function setSession(res: Response, t: SessionTokens) {
  res.cookie(ACCESS_COOKIE, t.accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE, t.refreshToken, refreshCookieOptions(t.refreshMaxAgeMs));
}

export const authController = {
  async login(req: Request, res: Response) {
    const { email, password, remember } = req.body as LoginInput;
    const result = await authService.login(email, password, remember ?? false, ctx(req));

    if (result.requires2FA) {
      return ok(
        res,
        result,
        result.requiresSetup
          ? "Two-factor authentication enrollment required"
          : "Two-factor authentication code required"
      );
    }

    setSession(res, result.tokens);
    ok(res, { user: result.user, token: result.tokens.accessToken }, "Logged in");
  },

  async verify2FA(req: Request, res: Response) {
    const { twoFactorTicket, code, isRecoveryCode } = req.body as Verify2FAInput;
    const ticketPayload = verify2FATicket(twoFactorTicket);

    const user = await User.findById(ticketPayload.sub);
    if (!user || user.status !== "ACTIVE") {
      throw HttpError.unauthorized("User account not found or inactive");
    }

    await twoFactorService.verifyLoginCode(user, code, isRecoveryCode, req);

    user.lastLogin = new Date();
    await user.save();

    const { token: refreshToken, refreshMaxAgeMs } = signRefresh(user, ticketPayload.remember);
    const accessToken = signAccess(user);
    const tokens = { accessToken, refreshToken, refreshMaxAgeMs };

    setSession(res, tokens);
    ok(res, { user: toPublicUser(user), token: tokens.accessToken }, "Two-factor authentication verified");
  },

  async start2FASetup(req: Request, res: Response) {
    let userId: string | undefined = req.user?.id;
    if (!userId && req.body?.twoFactorTicket) {
      const payload = verify2FATicket(req.body.twoFactorTicket);
      userId = payload.sub;
    }

    if (!userId) {
      throw HttpError.unauthorized("Authentication required to set up two-factor authentication");
    }

    const user = await User.findById(userId);
    if (!user || user.status !== "ACTIVE") {
      throw HttpError.unauthorized("User not found or inactive");
    }

    const setupData = await twoFactorService.startSetup(user);
    ok(res, setupData, "2FA setup initialized");
  },

  async confirm2FASetup(req: Request, res: Response) {
    const { twoFactorTicket, secret, code, backupCodes } = req.body as Confirm2FASetupInput;

    let userId: string | undefined = req.user?.id;
    let remember = false;

    if (!userId && twoFactorTicket) {
      const payload = verify2FATicket(twoFactorTicket);
      userId = payload.sub;
      remember = payload.remember ?? false;
    }

    if (!userId) {
      throw HttpError.unauthorized("Authentication required to confirm 2FA setup");
    }

    const user = await User.findById(userId);
    if (!user || user.status !== "ACTIVE") {
      throw HttpError.unauthorized("User not found or inactive");
    }

    await twoFactorService.confirmSetup(user, secret, code, backupCodes, req);

    // If initiated during the login flow, issue full session tokens so the user logs in immediately
    if (twoFactorTicket) {
      user.lastLogin = new Date();
      await user.save();

      const { token: refreshToken, refreshMaxAgeMs } = signRefresh(user, remember);
      const accessToken = signAccess(user);
      const tokens = { accessToken, refreshToken, refreshMaxAgeMs };

      setSession(res, tokens);
      return ok(
        res,
        { user: toPublicUser(user), token: tokens.accessToken },
        "Two-factor authentication enabled and logged in"
      );
    }

    ok(res, { user: toPublicUser(user) }, "Two-factor authentication enabled successfully");
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
