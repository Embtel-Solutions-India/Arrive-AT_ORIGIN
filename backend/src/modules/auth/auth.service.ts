import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { Permission } from "../../config/permissions.js";
import { HttpError } from "../../utils/httpError.js";
import { randomToken, sha256 } from "../../utils/crypto.js";
import { sendEmail } from "../../services/email.service.js";
import { authRepository as repo } from "./auth.repository.js";

type UserWithRole = NonNullable<Awaited<ReturnType<typeof repo.findUserById>>>;

export interface SessionContext {
  userAgent?: string;
  ip?: string;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  refreshMaxAgeMs: number;
}

const DAY_MS = 86_400_000;
// Verified against when the email is unknown so response time does not reveal which emails exist.
const DUMMY_HASH = await argon2.hash("not-a-real-password", { type: argon2.argon2id });

export const toPublicUser = (u: UserWithRole) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role.name,
  permissions: u.role.permissions.map((p) => p.key as Permission),
});

function signAccess(user: UserWithRole) {
  return jwt.sign({ role: user.role.name }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`,
    algorithm: "HS256",
  });
}

async function issueSession(user: UserWithRole, remember: boolean, ctx: SessionContext): Promise<SessionTokens> {
  const refreshToken = randomToken();
  const refreshMaxAgeMs = (remember ? env.REFRESH_TOKEN_REMEMBER_TTL_DAYS : env.REFRESH_TOKEN_TTL_DAYS) * DAY_MS;
  await repo.createRefreshToken({
    userId: user.id,
    tokenHash: sha256(refreshToken),
    expiresAt: new Date(Date.now() + refreshMaxAgeMs),
    userAgent: ctx.userAgent?.slice(0, 255),
    ip: ctx.ip,
  });
  return { accessToken: signAccess(user), refreshToken, refreshMaxAgeMs };
}

export const authService = {
  async login(email: string, password: string, remember: boolean, ctx: SessionContext) {
    const user = await repo.findUserByEmail(email);
    const valid = await argon2.verify(user?.passwordHash ?? DUMMY_HASH, password);
    if (!user || !valid || !user.active) throw HttpError.unauthorized("Invalid email or password");
    await repo.touchLogin(user.id);
    return { user: toPublicUser(user), tokens: await issueSession(user, remember, ctx) };
  },

  /** Rotates the refresh token. Re-use of an already-rotated token revokes all of the user's sessions. */
  async refresh(rawToken: string | undefined, ctx: SessionContext) {
    if (!rawToken) throw HttpError.unauthorized();
    const stored = await repo.findRefreshToken(sha256(rawToken));
    if (!stored) throw HttpError.unauthorized();
    if (stored.revokedAt) {
      await repo.revokeAllForUser(stored.userId);
      throw HttpError.unauthorized("Session no longer valid");
    }
    if (stored.expiresAt < new Date()) throw HttpError.unauthorized("Session expired");

    const user = await repo.findUserById(stored.userId);
    if (!user || !user.active) throw HttpError.unauthorized();

    const remainingMs = stored.expiresAt.getTime() - Date.now();
    const remember = remainingMs > env.REFRESH_TOKEN_TTL_DAYS * DAY_MS;
    const tokens = await issueSession(user, remember, ctx);
    await repo.revokeRefreshToken(stored.id, sha256(tokens.refreshToken));
    return { user: toPublicUser(user), tokens };
  },

  async logout(rawToken: string | undefined) {
    if (!rawToken) return;
    const stored = await repo.findRefreshToken(sha256(rawToken));
    if (stored && !stored.revokedAt) await repo.revokeRefreshToken(stored.id);
  },

  async me(userId: string) {
    const user = await repo.findUserById(userId);
    if (!user || !user.active) throw HttpError.unauthorized();
    return toPublicUser(user);
  },

  /** Always resolves the same way so callers cannot probe which emails are registered. */
  async forgotPassword(email: string) {
    const user = await repo.findUserByEmail(email);
    if (!user || !user.active) return;
    const token = randomToken(32);
    await repo.createResetToken({
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + 60 * 60_000),
    });
    const link = `${env.APP_URL}/admin/reset-password?token=${encodeURIComponent(token)}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your Soul Body Healing Center admin password",
      html: `<p>Use this link within 1 hour to set a new password:</p><p><a href="${link}">${link}</a></p><p>If you did not request this, ignore this email.</p>`,
      text: `Reset your password (valid 1 hour): ${link}`,
    });
  },

  async resetPassword(token: string, password: string) {
    const stored = await repo.findResetToken(sha256(token));
    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw HttpError.badRequest("This reset link is invalid or has expired");
    }
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await repo.consumeResetAndSetPassword(stored.id, stored.userId, passwordHash);
  },
};
