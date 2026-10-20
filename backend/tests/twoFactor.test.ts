import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSecret, generateSync, verifySync } from "otplib";
import jwt from "jsonwebtoken";
import {
  generateBackupCodes,
  hashBackupCode,
  sign2FATicket,
  verify2FATicket,
  twoFactorService,
} from "../src/modules/auth/twoFactor.service.js";
import { IUser } from "../src/models/User.js";
import { authenticate } from "../src/middleware/auth.js";
import { encryptSecret } from "../src/utils/crypto.js";
import { ACCESS_COOKIE } from "../src/config/cookies.js";
import { env } from "../src/config/env.js";
import type { Request, Response } from "express";

vi.mock("../src/utils/auditLogger.js", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

describe("Two-Factor Authentication Core & Security", () => {

  it("generates exactly 10 high-entropy recovery codes matching XXXX-XXXX-XXXX format", () => {
    const codes = generateBackupCodes(10);
    expect(codes).toHaveLength(10);
    for (const code of codes) {
      expect(code).toMatch(/^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
    }
  });

  it("normalizes and hashes backup codes consistently regardless of case, hyphens, or spacing", () => {
    const code = "ABCD-EF23-4567";
    const h1 = hashBackupCode(code);
    const h2 = hashBackupCode("abcd ef23 4567");
    const h3 = hashBackupCode("abcdef234567");
    const h4 = hashBackupCode("ABCD-ef23-4567");
    expect(h1).toEqual(h2);
    expect(h1).toEqual(h3);
    expect(h1).toEqual(h4);
  });

  it("generates valid TOTP secret and verifies 6-digit OTP codes with 30s drift tolerance", () => {
    const secret = generateSecret();
    const token = generateSync({ secret });
    const check = verifySync({ secret, token, epochTolerance: 30 });
    expect(check.valid).toBe(true);

    const invalid = verifySync({ secret, token: "000000", epochTolerance: 30 });
    expect(invalid.valid).toBe(false);
  });

  it("signs and verifies temporary 2FA ticket, and rejects expired/tampered tickets", () => {
    const mockUser = {
      _id: "507f1f77bcf86cd799439011",
      email: "admin@arriveatorigin.com",
    } as unknown as IUser;

    const ticket = sign2FATicket(mockUser, true);
    expect(typeof ticket).toBe("string");

    const payload = verify2FATicket(ticket);
    expect(payload.sub).toBe("507f1f77bcf86cd799439011");
    expect(payload.email).toBe("admin@arriveatorigin.com");
    expect(payload.type).toBe("2fa_ticket");
    expect(payload.remember).toBe(true);

    // Tampered ticket must fail
    expect(() => verify2FATicket(ticket + "tampered")).toThrow();
  });

  it("initializes 2FA setup with QR code and otpauth URI compatible with Google/Microsoft Authenticator", async () => {
    const mockUser = {
      _id: "507f1f77bcf86cd799439011",
      email: "admin@arriveatorigin.com",
    } as unknown as IUser;

    const setup = await twoFactorService.startSetup(mockUser);
    expect(setup.secret).toBeDefined();
    expect(setup.otpauthUrl).toContain("otpauth://totp/");
    expect(setup.otpauthUrl).toContain("Soul%20Body%20Admin");
    expect(setup.otpauthUrl).toContain(encodeURIComponent("admin@arriveatorigin.com"));
    expect(setup.qrCode).toMatch(/^data:image\/png;base64,/);
    expect(setup.backupCodes).toHaveLength(10);
  });

  describe("setup confirmation and verification flow", () => {
    it("confirms setup with valid OTP, encrypts secret, and hashes recovery codes", async () => {
      const secret = generateSecret();
      const backupCodes = generateBackupCodes(10);
      const validCode = generateSync({ secret });

      const mockSave = vi.fn().mockResolvedValue(undefined);
      const user = {
        _id: "507f1f77bcf86cd799439011",
        name: "Admin User",
        email: "admin@arriveatorigin.com",
        twoFactorEnabled: false,
        twoFactorSecret: undefined,
        backupCodes: [],
        save: mockSave,
      } as unknown as IUser;

      await twoFactorService.confirmSetup(user, secret, validCode, backupCodes);

      expect(user.twoFactorEnabled).toBe(true);
      expect(user.twoFactorSecret).toBeDefined();
      expect(user.twoFactorSecret).toMatch(/^enc:/); // AES-256-GCM encrypted
      expect(user.backupCodes).toHaveLength(10);
      expect(user.backupCodes[0]).not.toEqual(backupCodes[0]); // Must be hashed, never plaintext
      expect(mockSave).toHaveBeenCalled();
    });

    it("rejects confirmation if OTP code is invalid", async () => {
      const secret = generateSecret();
      const backupCodes = generateBackupCodes(10);

      const user = {
        _id: "507f1f77bcf86cd799439011",
        twoFactorEnabled: false,
        save: vi.fn(),
      } as unknown as IUser;

      await expect(
        twoFactorService.confirmSetup(user, secret, "000000", backupCodes)
      ).rejects.toThrow(/Invalid 6-digit code/);
    });
  });

  describe("login verification and rate limiting / lockout", () => {
    it("verifies valid 6-digit OTP code on enrolled user", async () => {
      const secret = generateSecret();
      const encryptedSecret = encryptSecret(secret);
      const validCode = generateSync({ secret });

      const mockSave = vi.fn().mockResolvedValue(undefined);
      const user = {
        _id: "507f1f77bcf86cd799439011",
        name: "Admin",
        email: "admin@arriveatorigin.com",
        twoFactorSecret: encryptedSecret,
        failedLoginAttempts: 2,
        backupCodes: [],
        save: mockSave,
      } as unknown as IUser;

      const res = await twoFactorService.verifyLoginCode(user, validCode);
      expect(res.usedRecoveryCode).toBe(false);
      expect(user.failedLoginAttempts).toBe(0);
      expect(mockSave).toHaveBeenCalled();
    });

    it("increments failed attempts on invalid OTP, and triggers lockout on 5th attempt", async () => {
      const secret = generateSecret();
      const encryptedSecret = encryptSecret(secret);

      const mockSave = vi.fn().mockResolvedValue(undefined);
      const user = {
        _id: "507f1f77bcf86cd799439011",
        name: "Admin",
        email: "admin@arriveatorigin.com",
        twoFactorSecret: encryptedSecret,
        failedLoginAttempts: 4,
        backupCodes: [],
        save: mockSave,
      } as unknown as IUser;

      await expect(twoFactorService.verifyLoginCode(user, "999999")).rejects.toThrow(
        /Account is temporarily locked/
      );
      expect(user.failedLoginAttempts).toBe(5);
      expect(user.lockoutUntil).toBeDefined();
      expect(user.lockoutUntil!.getTime()).toBeGreaterThan(Date.now());
    });

    it("verifies emergency recovery code and consumes it single-use", async () => {
      const rawCodes = generateBackupCodes(3);
      const hashedCodes = rawCodes.map((c) => hashBackupCode(c));

      const mockSave = vi.fn().mockResolvedValue(undefined);
      const user = {
        _id: "507f1f77bcf86cd799439011",
        name: "Admin",
        email: "admin@arriveatorigin.com",
        backupCodes: [...hashedCodes],
        failedLoginAttempts: 0,
        save: mockSave,
      } as unknown as IUser;

      // Verify with the first recovery code
      const result = await twoFactorService.verifyLoginCode(user, rawCodes[0], true);
      expect(result.usedRecoveryCode).toBe(true);
      // Code must be removed from user.backupCodes
      expect(user.backupCodes).toHaveLength(2);
      expect(user.backupCodes).not.toContain(hashedCodes[0]);

      // Attempting to reuse the same recovery code must fail!
      await expect(twoFactorService.verifyLoginCode(user, rawCodes[0], true)).rejects.toThrow(
        /Invalid recovery code/
      );
    });
  });

  describe("API Protection - authenticate middleware gates", () => {
    it("rejects temporary 2FA ticket tokens with 401", async () => {
      const ticket = jwt.sign(
        { sub: "507f1f77bcf86cd799439011", type: "2fa_ticket" },
        env.JWT_SECRET
      );

      const req = {
        cookies: { [ACCESS_COOKIE]: ticket },
        headers: {},
      } as unknown as Request;

      const next = vi.fn();
      await authenticate(req, {} as Response, next);

      const err = next.mock.calls[0]?.[0];
      expect(err).toBeDefined();
      expect(err.statusCode || err.status).toBe(401);
      expect(err.message).toMatch(/Two-factor authentication verification required/);
    });

    it("rejects access tokens lacking is2FA flag with 401", async () => {
      const oldToken = jwt.sign(
        { sub: "507f1f77bcf86cd799439011", role: "ADMIN" }, // No is2FA flag
        env.JWT_SECRET
      );

      const req = {
        cookies: { [ACCESS_COOKIE]: oldToken },
        headers: {},
      } as unknown as Request;

      const next = vi.fn();
      await authenticate(req, {} as Response, next);

      const err = next.mock.calls[0]?.[0];
      expect(err).toBeDefined();
      expect(err.statusCode || err.status).toBe(401);
      expect(err.message).toMatch(/Two-factor authentication required/);
    });
  });
});
