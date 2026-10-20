import { z } from "zod";

const password = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128)
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/\d/, "Include a number");

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1).max(128),
  remember: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({ email: z.string().email().toLowerCase() });

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password,
});

export const verify2FASchema = z.object({
  twoFactorTicket: z.string().min(10, "Valid 2FA ticket required"),
  code: z.string().min(6, "Enter the 6-digit code or backup code").max(32),
  isRecoveryCode: z.boolean().optional(),
});

export const start2FASetupSchema = z.object({
  twoFactorTicket: z.string().min(10).optional(),
});

export const confirm2FASetupSchema = z.object({
  twoFactorTicket: z.string().min(10).optional(),
  secret: z.string().min(16, "Invalid authenticator secret"),
  code: z.string().min(6, "6-digit code is required").max(10),
  backupCodes: z.array(z.string()).min(6, "Backup recovery codes are required"),
});

export const regenerateBackupCodesSchema = z.object({
  password: z.string().min(1, "Current password is required"),
});

export const disable2FASchema = z.object({
  password: z.string().min(1, "Current password is required to disable 2FA"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type Verify2FAInput = z.infer<typeof verify2FASchema>;
export type Confirm2FASetupInput = z.infer<typeof confirm2FASetupSchema>;
