import { randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { generateSecret, generateURI, verifySync } from "otplib";
import QRCode from "qrcode";
import { env } from "../../config/env.js";
import { User, IUser } from "../../models/User.js";
import { decryptSecret, encryptSecret, sha256 } from "../../utils/crypto.js";
import { HttpError } from "../../utils/httpError.js";
import { logAudit } from "../../utils/auditLogger.js";
import type { Request } from "express";

export interface TwoFactorTicketPayload {
  sub: string;
  type: "2fa_ticket";
  email: string;
  remember: boolean;
  iat?: number;
  exp?: number;
}

export interface Setup2FAData {
  secret: string;
  manualEntryKey: string;
  otpauthUrl: string;
  qrCode: string;
  backupCodes: string[];
}

const UNAMBIGUOUS_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Generates 10 high-entropy recovery codes in XXXX-XXXX-XXXX format.
 */
export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(12);
    let code = "";
    for (let j = 0; j < 12; j++) {
      if (j > 0 && j % 4 === 0) code += "-";
      code += UNAMBIGUOUS_CHARS[bytes[j] % UNAMBIGUOUS_CHARS.length];
    }
    codes.push(code);
  }
  return codes;
}

/**
 * Normalizes and hashes a backup recovery code using SHA-256 for secure storage.
 */
export function hashBackupCode(code: string): string {
  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return sha256(normalized);
}

/**
 * Signs a short-lived (5-minute) 2FA verification ticket.
 */
export function sign2FATicket(user: IUser, remember = false): string {
  return jwt.sign(
    {
      sub: user._id.toString(),
      type: "2fa_ticket",
      email: user.email,
      remember,
    },
    env.JWT_SECRET,
    {
      expiresIn: "5m",
      algorithm: "HS256",
    }
  );
}

/**
 * Validates and unpacks a 2FA verification ticket.
 */
export function verify2FATicket(ticket: string): TwoFactorTicketPayload {
  try {
    const payload = jwt.verify(ticket, env.JWT_SECRET, { algorithms: ["HS256"] }) as TwoFactorTicketPayload;
    if (payload.type !== "2fa_ticket" || !payload.sub) {
      throw new Error("Invalid ticket type");
    }
    return payload;
  } catch {
    throw HttpError.unauthorized("Your 2FA session ticket has expired or is invalid. Please sign in again.");
  }
}

export const twoFactorService = {
  /**
   * Generates a new TOTP secret, QR code data URL, and 10 emergency recovery codes.
   */
  async startSetup(user: IUser): Promise<Setup2FAData> {
    const secret = generateSecret();
    const issuer = "Soul Body Admin";
    const label = user.email;

    const otpauthUrl = generateURI({
      secret,
      label,
      issuer,
    });

    const qrCode = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      scale: 6,
      color: {
        dark: "#0a0f24",
        light: "#ffffff",
      },
    });

    const backupCodes = generateBackupCodes(10);

    return {
      secret,
      manualEntryKey: secret,
      otpauthUrl,
      qrCode,
      backupCodes,
    };
  },

  /**
   * Verifies the initial OTP code entered during enrollment, saves the encrypted secret and backup codes.
   */
  async confirmSetup(
    user: IUser,
    secret: string,
    code: string,
    backupCodes: string[],
    req?: Request
  ): Promise<void> {
    // Clean token
    const token = code.trim().replace(/\s+/g, "");

    // Verify token with 30s epoch tolerance
    const result = verifySync({
      secret,
      token,
      epochTolerance: 30,
    });

    if (!result.valid) {
      throw HttpError.badRequest(
        "Invalid 6-digit code. Please check that your device's time is synchronized and re-enter the code."
      );
    }

    // Encrypt secret with AES-256-GCM before database storage
    const encryptedSecret = encryptSecret(secret);

    // Hash backup codes before saving
    const hashedBackupCodes = backupCodes.map((c) => hashBackupCode(c));

    user.twoFactorSecret = encryptedSecret;
    user.backupCodes = hashedBackupCodes;
    user.twoFactorEnabled = true;
    user.twoFactorEnrolledAt = new Date();
    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;
    await user.save();

    await logAudit({
      req,
      action: "2FA_ENROLLED",
      module: "SECURITY",
      status: "SUCCESS",
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      details: {
        enrolledAt: user.twoFactorEnrolledAt,
        backupCodesCount: hashedBackupCodes.length,
      },
    });
  },

  /**
   * Validates a 6-digit OTP code or emergency recovery code during the login flow.
   */
  async verifyLoginCode(
    user: IUser,
    code: string,
    isRecoveryCode = false,
    req?: Request
  ): Promise<{ usedRecoveryCode: boolean }> {
    // Check if account is temporarily locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const minutesRemaining = Math.max(1, Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60_000));
      throw HttpError.tooManyRequests(
        `Account is temporarily locked due to multiple failed 2FA attempts. Please try again in ${minutesRemaining} minute(s).`
      );
    }

    const cleanCode = code.trim();
    // Auto-detect recovery code format if contains hyphen or length > 6
    const recoveryAttempt = isRecoveryCode || cleanCode.includes("-") || cleanCode.length > 8;

    if (recoveryAttempt) {
      const hashed = hashBackupCode(cleanCode);
      const index = (user.backupCodes || []).findIndex((stored) => stored === hashed);

      if (index === -1) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= 5) {
          user.lockoutUntil = new Date(Date.now() + 15 * 60_000);
        }
        await user.save();

        await logAudit({
          req,
          action: "LOGIN_RECOVERY_CODE_FAILED",
          module: "AUTH",
          status: "FAILED",
          userId: user._id.toString(),
          userName: user.name,
          userEmail: user.email,
          details: { failedAttempts: user.failedLoginAttempts },
        });

        throw HttpError.unauthorized("Invalid recovery code. Please check your backup codes list and try again.");
      }

      // One-time use: consume the backup code immediately
      user.backupCodes.splice(index, 1);
      user.failedLoginAttempts = 0;
      user.lockoutUntil = undefined;
      await user.save();

      await logAudit({
        req,
        action: "LOGIN_RECOVERY_CODE_SUCCESS",
        module: "AUTH",
        status: "SUCCESS",
        userId: user._id.toString(),
        userName: user.name,
        userEmail: user.email,
        details: { remainingBackupCodes: user.backupCodes.length },
      });

      return { usedRecoveryCode: true };
    }

    // Standard 6-digit TOTP verification
    if (!user.twoFactorSecret) {
      throw HttpError.badRequest("Two-factor authentication is not configured for this account.");
    }

    const secret = decryptSecret(user.twoFactorSecret);
    const token = cleanCode.replace(/\s+/g, "");

    const result = verifySync({
      secret,
      token,
      epochTolerance: 30, // 30s window drift tolerance
    });

    if (!result.valid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockoutUntil = new Date(Date.now() + 15 * 60_000);
      }
      await user.save();

      await logAudit({
        req,
        action: "LOGIN_2FA_FAILED",
        module: "AUTH",
        status: "FAILED",
        userId: user._id.toString(),
        userName: user.name,
        userEmail: user.email,
        details: { failedAttempts: user.failedLoginAttempts },
      });

      if (user.failedLoginAttempts >= 5) {
        throw HttpError.tooManyRequests(
          "Account is temporarily locked for 15 minutes due to 5 failed 2FA verification attempts."
        );
      }

      const attemptsRemaining = 5 - user.failedLoginAttempts;
      throw HttpError.unauthorized(
        `Invalid 6-digit authenticator code. ${attemptsRemaining} attempt(s) remaining before temporary lockout.`
      );
    }

    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;
    await user.save();

    await logAudit({
      req,
      action: "LOGIN_2FA_SUCCESS",
      module: "AUTH",
      status: "SUCCESS",
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
    });

    return { usedRecoveryCode: false };
  },

  /**
   * Regenerates a new set of 10 emergency recovery codes for an enrolled user.
   */
  async regenerateBackupCodes(user: IUser, req?: Request): Promise<string[]> {
    if (!user.twoFactorEnabled) {
      throw HttpError.badRequest("Two-factor authentication must be enabled before generating recovery codes.");
    }

    const freshCodes = generateBackupCodes(10);
    user.backupCodes = freshCodes.map((c) => hashBackupCode(c));
    await user.save();

    await logAudit({
      req,
      action: "2FA_RECOVERY_CODES_REGENERATED",
      module: "SECURITY",
      status: "SUCCESS",
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      details: { newCodesCount: freshCodes.length },
    });

    return freshCodes;
  },

  /**
   * Resets / disables 2FA for a user.
   */
  async disable2FA(user: IUser, req?: Request): Promise<void> {
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorEnrolledAt = undefined;
    user.backupCodes = [];
    await user.save();

    await logAudit({
      req,
      action: "2FA_RESET",
      module: "SECURITY",
      status: "WARNING",
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      details: { resetBy: req?.user?.email || "Self" },
    });
  },
};
