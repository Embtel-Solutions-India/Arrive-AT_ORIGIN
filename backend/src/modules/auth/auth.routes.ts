import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authLimiter, twoFactorLimiter } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authController as c } from "./auth.controller.js";
import {
  confirm2FASetupSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  start2FASetupSchema,
  verify2FASchema,
} from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post("/login", authLimiter, validate({ body: loginSchema }), asyncHandler(c.login));
authRouter.post("/refresh", authLimiter, asyncHandler(c.refresh));
authRouter.post("/logout", asyncHandler(c.logout));
authRouter.get("/me", authenticate, asyncHandler(c.me));
authRouter.post("/forgot-password", authLimiter, validate({ body: forgotPasswordSchema }), asyncHandler(c.forgotPassword));
authRouter.post("/reset-password", authLimiter, validate({ body: resetPasswordSchema }), asyncHandler(c.resetPassword));

// ─── Two-Factor Authentication ───
authRouter.post("/2fa/verify", twoFactorLimiter, validate({ body: verify2FASchema }), asyncHandler(c.verify2FA));
authRouter.post("/2fa/setup/start", twoFactorLimiter, validate({ body: start2FASetupSchema }), asyncHandler(c.start2FASetup));
authRouter.post("/2fa/setup/confirm", twoFactorLimiter, validate({ body: confirm2FASetupSchema }), asyncHandler(c.confirm2FASetup));

