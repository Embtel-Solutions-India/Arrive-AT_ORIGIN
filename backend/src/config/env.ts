import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  // Node Environment & Port
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),

  // Database Connection (MongoDB Atlas & optional Prisma)
  // NEVER hardcode credentials or connection strings here. Values must come from .env
  MONGODB_URI: z
    .string()
    .default(process.env.DATABASE_URL || ""),
  DATABASE_URL: z.string().optional(),

  // CORS Origins & Application URLs
  CORS_ORIGINS: z
    .string()
    .default(
      "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,https://arriveatorigin.com,https://www.arriveatorigin.com"
    ),
  APP_URL: z.string().default("http://localhost:5173"),
  API_URL: z.string().default("http://localhost:4000"),
  COOKIE_DOMAIN: z.string().optional(),

  // JWT & Authentication Token Lifespans
  // NEVER provide a fallback secret here. Secret must be loaded from .env
  JWT_SECRET: z.string().default(""),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(1),
  REFRESH_TOKEN_REMEMBER_TTL_DAYS: z.coerce.number().default(30),

  // Seed Super Administrator (Initial DB setup)
  SEED_ADMIN_EMAIL: z.string().email().optional().default("admin@arriveatorigin.com"),
  SEED_ADMIN_PASSWORD: z.string().optional().default(""),

  // Media Uploads & S3 Compatible Object Storage
  UPLOAD_DIR: z.string().default("uploads"),
  AWS_S3_BUCKET: z.string().optional().default(process.env.S3_BUCKET || ""),
  AWS_REGION: z.string().default(process.env.S3_REGION || "us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().optional().default(process.env.S3_ACCESS_KEY || ""),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(process.env.S3_SECRET_KEY || ""),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(),

  // Payment Gateway Credentials (Razorpay, Stripe, PayPal)
  PAYMENT_PROVIDER: z.string().default("razorpay"),
  PAYMENT_SECRET_KEY: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),

  // Transactional Email & SMTP (Resend API & SMTP)
  EMAIL_PROVIDER: z.string().default("resend"),
  RESEND_API_KEY: z.string().default(""),
  EMAIL_FROM: z.string().default("Arrive at Origin <info@arriveatorigin.com>"),
  EMAIL_REPLY_TO: z.string().default("info@arriveatorigin.com"),
  SMTP_HOST: z.string().default("smtp.resend.com"),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_USER: z.string().default("resend"),
  SMTP_PASS: z.string().default(""),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  if (process.env.NODE_ENV === "production" && !process.env.CI) {
    process.exit(1);
  }
}

export const env = parsed.success ? parsed.data : schema.parse({});

// Security check: Never run production with missing database or weak/missing JWT secrets
if (env.NODE_ENV === "production" && !process.env.CI) {
  const missingSecrets: string[] = [];
  if (!env.MONGODB_URI) missingSecrets.push("MONGODB_URI");
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    missingSecrets.push("JWT_SECRET (must be at least 32 characters long)");
  }
  if (missingSecrets.length > 0) {
    console.error(
      `❌ FATAL: Production startup prevented due to missing/insecure credentials:\n  - ${missingSecrets.join("\n  - ")}\nPlease configure these in your deployment environment variables.`
    );
    process.exit(1);
  }
} else if (env.NODE_ENV !== "production" && !process.env.CI) {
  if (!env.MONGODB_URI) {
    console.warn("⚠️ Warning: MONGODB_URI is not set in environment. Database connectivity will fail until configured in .env.");
  }
  if (!env.JWT_SECRET) {
    console.warn("⚠️ Warning: JWT_SECRET is not set in environment. Set a 32+ character JWT_SECRET in .env for authentication to function properly.");
  }
}
export const isProd = env.NODE_ENV === "production";
export const corsOrigins = env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);

export function isAllowedOrigin(origin?: string | null): boolean {
  if (!origin) return false;
  if (corsOrigins.includes(origin)) return true;
  if (!isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return true;
  }
  try {
    const hostname = new URL(origin).hostname;
    if (
      hostname.endsWith(".vercel.app") ||
      hostname === "arriveatorigin.com" ||
      hostname.endsWith(".arriveatorigin.com") ||
      hostname.endsWith(".cloudfront.net")
    ) {
      return true;
    }
  } catch {
    // ignore URL parse errors
  }
  return false;
}
