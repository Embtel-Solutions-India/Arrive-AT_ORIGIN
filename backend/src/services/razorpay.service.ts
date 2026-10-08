import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export function isRazorpayConfigured(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

let _razorpayClient: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!_razorpayClient) {
    if (!isRazorpayConfigured()) {
      throw new Error(
        "Razorpay credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are not configured in environment variables."
      );
    }
    _razorpayClient = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpayClient;
}

// Proxied razorpayInstance for backwards-compatibility without crashing on module import
export const razorpayInstance = new Proxy({} as Razorpay, {
  get(_target, prop) {
    return (getRazorpayClient() as any)[prop];
  },
});

export interface CreateOrderParams {
  amount: number; // in primary currency (e.g. 250 for $250)
  currency?: string; // "USD" or "INR"
  receipt: string;
  notes?: Record<string, string>;
}

export const razorpayService = {
  /**
   * Create an order in Razorpay
   */
  async createOrder({ amount, currency = "USD", receipt, notes = {} }: CreateOrderParams) {
    try {
      // Amount in smallest currency unit (cents or paise)
      const amountInSubunits = Math.round(amount * 100);

      try {
        const order = await razorpayInstance.orders.create({
          amount: amountInSubunits,
          currency,
          receipt,
          notes,
        });

        logger.info(
          { orderId: order.id, amount: order.amount, currency: order.currency },
          "Razorpay order created successfully"
        );
        return order;
      } catch (err: any) {
        // If international currency (USD) is not active on this test account, fallback to INR
        const errDescription = err?.error?.description || err?.message || "";
        if (
          currency !== "INR" &&
          (errDescription.toLowerCase().includes("currency") ||
            errDescription.toLowerCase().includes("international") ||
            errDescription.toLowerCase().includes("not supported"))
        ) {
          logger.warn(
            { errDescription },
            "USD not supported on this Razorpay key, falling back to INR"
          );
          // Convert USD to INR (approx 85 INR/USD)
          const inrAmountInPaise = Math.round(amount * 85 * 100);
          const order = await razorpayInstance.orders.create({
            amount: inrAmountInPaise,
            currency: "INR",
            receipt,
            notes: { ...notes, originalCurrency: currency, originalAmount: String(amount) },
          });
          return order;
        }
        throw err;
      }
    } catch (error) {
      logger.error({ error }, "Failed to create Razorpay order");
      throw error;
    }
  },

  /**
   * Verify Razorpay payment signature
   */
  verifyPaymentSignature({
    orderId,
    paymentId,
    signature,
  }: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    try {
      if (!env.RAZORPAY_KEY_SECRET) {
        logger.error("Cannot verify Razorpay payment signature: RAZORPAY_KEY_SECRET is not configured");
        return false;
      }

      const generatedSignature = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      const isValid = generatedSignature === signature;
      if (!isValid) {
        logger.warn(
          { orderId, paymentId },
          "Razorpay payment signature mismatch"
        );
      }
      return isValid;
    } catch (err) {
      logger.error({ err }, "Error verifying Razorpay signature");
      return false;
    }
  },
};
