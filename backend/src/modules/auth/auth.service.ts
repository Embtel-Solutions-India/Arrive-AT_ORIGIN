import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { Permission, ROLE_PERMISSIONS, RoleName } from "../../config/permissions.js";
import { User, IUser } from "../../models/User.js";
import { HttpError } from "../../utils/httpError.js";
import { randomToken, sha256 } from "../../utils/crypto.js";
import { sendPasswordResetEmail } from "../../services/email.service.js";
import { logger } from "../../utils/logger.js";

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

import { sign2FATicket } from "./twoFactor.service.js";

export const toPublicUser = (u: IUser) => {
  const role = (u.role || "ADMIN") as RoleName;
  const permissions = (ROLE_PERMISSIONS[role] || []) as Permission[];
  return {
    id: u._id.toString(),
    email: u.email,
    name: u.name,
    role,
    avatar: u.avatar || "",
    permissions,
    twoFactorEnabled: Boolean(u.twoFactorEnabled),
  };
};

export function signAccess(user: IUser) {
  return jwt.sign({ role: user.role, is2FA: true }, env.JWT_SECRET, {
    subject: user._id.toString(),
    expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`,
    algorithm: "HS256",
  });
}

export function signRefresh(user: IUser, remember: boolean) {
  const days = remember ? env.REFRESH_TOKEN_REMEMBER_TTL_DAYS : env.REFRESH_TOKEN_TTL_DAYS;
  return {
    token: jwt.sign({ type: "refresh", is2FA: true }, env.JWT_SECRET, {
      subject: user._id.toString(),
      expiresIn: `${days}d`,
      algorithm: "HS256",
    }),
    refreshMaxAgeMs: days * DAY_MS,
  };
}

export type LoginResult =
  | {
      requires2FA: true;
      requiresSetup: boolean;
      twoFactorTicket: string;
      user: ReturnType<typeof toPublicUser>;
      tokens?: undefined;
    }
  | {
      requires2FA: false;
      user: ReturnType<typeof toPublicUser>;
      tokens: SessionTokens;
    };

export const authService = {
  async login(email: string, password: string, remember: boolean, _ctx: SessionContext): Promise<LoginResult> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.status !== "ACTIVE") {
      throw HttpError.unauthorized("Invalid email or password");
    }

    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutesRemaining = Math.max(1, Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60_000));
      throw HttpError.tooManyRequests(
        `Account is temporarily locked. Please try again in ${minutesRemaining} minute(s).`
      );
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60_000);
      }
      await user.save();
      throw HttpError.unauthorized("Invalid email or password");
    }

    // Require Two-Factor Authentication for the admin panel
    const twoFactorTicket = sign2FATicket(user, remember);

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      return {
        requires2FA: true,
        requiresSetup: false,
        twoFactorTicket,
        user: toPublicUser(user),
      };
    }

    // First-time 2FA setup required for admin access
    return {
      requires2FA: true,
      requiresSetup: true,
      twoFactorTicket,
      user: toPublicUser(user),
    };
  },

  async refresh(refreshToken: string, _ctx: SessionContext) {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_SECRET) as jwt.JwtPayload;
      if (!payload.sub) throw HttpError.unauthorized("Invalid refresh token");

      const user = await User.findById(payload.sub);
      if (!user || user.status !== "ACTIVE" || !user.twoFactorEnabled) {
        throw HttpError.unauthorized("User not found or two-factor authentication required");
      }

      const { token: newRefresh, refreshMaxAgeMs } = signRefresh(user, true);
      const accessToken = signAccess(user);

      return {
        user: toPublicUser(user),
        tokens: { accessToken, refreshToken: newRefresh, refreshMaxAgeMs },
      };
    } catch {
      throw HttpError.unauthorized("Session expired. Please log in again.");
    }
  },

  async getMe(userId: string) {
    const user = await User.findById(userId);
    if (!user || user.status !== "ACTIVE") throw HttpError.unauthorized();
    return toPublicUser(user);
  },

  async forgotPassword(email: string, appUrl?: string) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return; // Silent return for security

    const resetToken = randomToken();
    user.resetPasswordToken = sha256(resetToken);
    user.resetPasswordExpires = new Date(Date.now() + 3600_000); // 1 hour
    await user.save();

    // Send password reset email via Resend
    sendPasswordResetEmail(user.email, user.name, resetToken, appUrl).catch((err) =>
      logger.error({ err: err?.message }, "Failed to send password reset email")
    );
  },

  async resetPassword(token: string, newPassword: string) {
    const hashed = sha256(token);
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw HttpError.badRequest("Invalid or expired reset token");
    }

    user.passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  },
};
