import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { authLimiter } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authController as c } from "./auth.controller.js";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post("/login", authLimiter, validate({ body: loginSchema }), asyncHandler(c.login));
authRouter.post("/refresh", authLimiter, asyncHandler(c.refresh));
authRouter.post("/logout", asyncHandler(c.logout));
authRouter.get("/me", authenticate, asyncHandler(c.me));
authRouter.post("/forgot-password", authLimiter, validate({ body: forgotPasswordSchema }), asyncHandler(c.forgotPassword));
authRouter.post("/reset-password", authLimiter, validate({ body: resetPasswordSchema }), asyncHandler(c.resetPassword));
