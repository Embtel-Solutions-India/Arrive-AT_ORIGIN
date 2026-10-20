import rateLimit from "express-rate-limit";

const json = (message: string) => ({ success: false, message, errors: [] });

export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: json("Too many requests, please slow down"),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: process.env.NODE_ENV === "production" ? 20 : 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: json("Too many attempts, try again later"),
  skip: (req) => process.env.NODE_ENV !== "production" && (req.ip === "127.0.0.1" || req.ip === "::1" || req.ip?.includes("127.0.0.1")),
});

export const twoFactorLimiter = rateLimit({
  windowMs: 5 * 60_000,
  limit: process.env.NODE_ENV === "production" ? 10 : 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: json("Too many two-factor authentication attempts. Please wait 5 minutes before trying again."),
  skip: (req) => process.env.NODE_ENV !== "production" && (req.ip === "127.0.0.1" || req.ip === "::1" || req.ip?.includes("127.0.0.1")),
});

