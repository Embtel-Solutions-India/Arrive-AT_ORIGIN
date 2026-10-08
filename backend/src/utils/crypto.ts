import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "../config/env.js";

export const randomToken = (bytes = 48) => randomBytes(bytes).toString("base64url");
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/**
 * Returns a masked version of a sensitive key/credential, e.g. "••••••••••••1234".
 * If empty or already masked, returns the input or empty string.
 */
export function maskSecret(val?: string, visibleTail = 4): string {
  if (!val || typeof val !== "string") return "";
  const trimmed = val.trim();
  if (trimmed.startsWith("••••")) return trimmed;
  if (trimmed.length <= visibleTail) return "••••••••";
  const tail = trimmed.slice(-visibleTail);
  return `••••••••••••${tail}`;
}

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(customKey?: string): Buffer {
  const secret = customKey || env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "Encryption key unavailable: JWT_SECRET is not configured in environment variables. Refusing to operate with an insecure fallback key."
    );
  }
  return createHash("sha256").update(secret).digest();
}

/**
 * Encrypts sensitive credentials with AES-256-GCM.
 * Output format: "enc:iv:authTag:cipherHex"
 */
export function encryptSecret(plainText: string, key?: string): string {
  if (!plainText) return "";
  // If already encrypted or masked, return as-is
  if (plainText.startsWith("enc:") || plainText.startsWith("••••")) return plainText;

  const encKey = getEncryptionKey(key);
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, encKey, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `enc:${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM cipher text.
 */
export function decryptSecret(cipherText: string, key?: string): string {
  if (!cipherText || typeof cipherText !== "string") return "";
  if (!cipherText.startsWith("enc:")) return cipherText;

  try {
    const parts = cipherText.split(":");
    if (parts.length !== 4) return cipherText;

    const [, ivHex, authTagHex, encryptedHex] = parts;
    if (!ivHex || !authTagHex || !encryptedHex) return cipherText;

    const encKey = getEncryptionKey(key);
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = createDecipheriv(ALGORITHM, encKey, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, "hex")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    // If decryption fails, return original
    return cipherText;
  }
}

export interface PasswordPolicy {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumber?: boolean;
  requireSpecialChar?: boolean;
}

export function validatePasswordAgainstPolicy(
  password: string,
  policy: PasswordPolicy = {}
): { valid: boolean; reason?: string } {
  const minLength = policy.minLength ?? 8;
  const reqUpper = policy.requireUppercase ?? true;
  const reqLower = policy.requireLowercase ?? true;
  const reqNum = policy.requireNumber ?? true;
  const reqSpecial = policy.requireSpecialChar ?? true;

  if (!password || password.length < minLength) {
    return { valid: false, reason: `Password must be at least ${minLength} characters long.` };
  }
  if (reqUpper && !/[A-Z]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one uppercase letter (A-Z)." };
  }
  if (reqLower && !/[a-z]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one lowercase letter (a-z)." };
  }
  if (reqNum && !/[0-9]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one number (0-9)." };
  }
  if (reqSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one special character (!@#$%...)." };
  }

  return { valid: true };
}
