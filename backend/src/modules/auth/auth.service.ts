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
  };
};

function signAccess(user: IUser) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user._id.toString(),
    expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`,
    algorithm: "HS256",
  });
}

function signRefresh(user: IUser, remember: boolean) {
  const days = remember ? env.REFRESH_TOKEN_REMEMBER_TTL_DAYS : env.REFRESH_TOKEN_TTL_DAYS;
  return {
    token: jwt.sign({ type: "refresh" }, env.JWT_SECRET, {
      subject: user._id.toString(),
      expiresIn: `${days}d`,
      algorithm: "HS256",
    }),
    refreshMaxAgeMs: days * DAY_MS,
  };
}

export const authService = {
  async login(email: string, password: string, remember: boolean, _ctx: SessionContext) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.status !== "ACTIVE") {
      throw HttpError.unauthorized("Invalid email or password");
    }

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw HttpError.unauthorized("Invalid email or password");
    }

    user.lastLogin = new Date();
    await user.save();

    const { token: refreshToken, refreshMaxAgeMs } = signRefresh(user, remember);
    const accessToken = signAccess(user);

    return {
      user: toPublicUser(user),
      tokens: { accessToken, refreshToken, refreshMaxAgeMs },
    };
  },

  async refresh(refreshToken: string, _ctx: SessionContext) {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_SECRET) as jwt.JwtPayload;
      if (!payload.sub) throw HttpError.unauthorized("Invalid refresh token");

      const user = await User.findById(payload.sub);
      if (!user || user.status !== "ACTIVE") throw HttpError.unauthorized("User not found or inactive");

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

  async forgotPassword(email: string) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return; // Silent return for security

    const resetToken = randomToken();
    user.resetPasswordToken = sha256(resetToken);
    user.resetPasswordExpires = new Date(Date.now() + 3600_000); // 1 hour
    await user.save();

    // Send password reset email via Resend
    sendPasswordResetEmail(user.email, user.name, resetToken).catch((err) =>
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
