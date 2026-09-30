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
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: json("Too many attempts, try again later"),
});
