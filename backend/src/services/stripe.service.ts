import Stripe from "stripe";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { HttpError } from "../utils/httpError.js";

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY.trim() !== "");
}

let _stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!_stripeClient) {
    const key = env.STRIPE_SECRET_KEY?.trim() || "";
    if (!key) {
      throw HttpError.badRequest(
        "Stripe Secret Key (STRIPE_SECRET_KEY) is not configured in backend environment variables."
      );
    }

    if (key.startsWith("mk_")) {
      throw HttpError.badRequest(
        `Invalid Stripe Secret Key provided (${key}). This appears to be a Stripe Key Identifier (Key ID) from your Stripe Dashboard rather than the Secret Key itself. Stripe secret keys start with "sk_live_" (or "sk_test_") or "rk_live_" (restricted key). Please retrieve your secret key from https://dashboard.stripe.com/apikeys.`
      );
    }

    _stripeClient = new Stripe(key);
  }
  return _stripeClient;
}

export interface StripeBookItem {
  bookId: string;
  title: string;
  price: number;
  quantity: number;
  format?: string;
  coverImage?: string;
}

export interface CreateBookSessionParams {
  orderNumber: string;
  items: StripeBookItem[];
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  subtotal: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  total: number;
  currency?: string; // "USD" or "INR"
  couponCode?: string;
  successUrl: string;
  cancelUrl: string;
  returnUrl?: string;
  uiMode?: "embedded" | "hosted";
}

export interface CreateConsultationSessionParams {
  bookingNumber: string;
  packageId: string;
  packageName: string;
  meetingType: string;
  sessionsCount: number;
  meetingMode: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  appointmentDate: string;
  appointmentTime: string;
  finalPrice: number;
  originalPrice: number;
  discount?: number;
  couponCode?: string;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  returnUrl?: string;
  uiMode?: "embedded" | "hosted";
}

export const stripeService = {
  /**
   * Create a Stripe Checkout Session for Book Store Cart
   */
  async createBookCheckoutSession(params: CreateBookSessionParams) {
    const stripe = getStripeClient();
    const currency = (params.currency || "USD").toLowerCase();

    // Map cart items into Stripe line items
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = params.items.map((it) => {
      const itemImages: string[] = [];
      if (it.coverImage && (it.coverImage.startsWith("http://") || it.coverImage.startsWith("https://"))) {
        itemImages.push(it.coverImage);
      }

      return {
        price_data: {
          currency,
          product_data: {
            name: it.title,
            description: it.format ? `Format: ${it.format}` : undefined,
            ...(itemImages.length ? { images: itemImages } : {}),
          },
          unit_amount: Math.round(it.price * 100),
        },
        quantity: it.quantity,
      };
    });

    // Add shipping if applicable
    if (params.shipping && params.shipping > 0) {
      line_items.push({
        price_data: {
          currency,
          product_data: {
            name: "Standard Shipping & Handling",
          },
          unit_amount: Math.round(params.shipping * 100),
        },
        quantity: 1,
      });
    }

    // Add tax if applicable
    if (params.tax && params.tax > 0) {
      line_items.push({
        price_data: {
          currency,
          product_data: {
            name: "Sales Tax",
          },
          unit_amount: Math.round(params.tax * 100),
        },
        quantity: 1,
      });
    }

    // Handle discount if coupon applied
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
    if (params.discount && params.discount > 0) {
      try {
        const coupon = await stripe.coupons.create({
          amount_off: Math.round(params.discount * 100),
          currency,
          duration: "once",
          name: params.couponCode ? `Coupon ${params.couponCode}` : "Store Discount",
        });
        discounts = [{ coupon: coupon.id }];
      } catch (couponErr: any) {
        logger.warn(
          { err: couponErr?.message },
          "Unable to create ephemeral Stripe coupon, continuing without line-level coupon"
        );
      }
    }

    const isEmbedded = (params.uiMode || "embedded") !== "hosted";
    const sessionCreateParams: Stripe.Checkout.SessionCreateParams = {
      line_items,
      mode: "payment",
      customer_email: params.customerInfo.email.toLowerCase(),
      client_reference_id: params.orderNumber,
      discounts,
      metadata: {
        orderType: "BOOK_ORDER",
        orderNumber: params.orderNumber,
        customerName: params.customerInfo.name,
        customerEmail: params.customerInfo.email.toLowerCase(),
        customerPhone: params.customerInfo.phone || "",
        couponCode: params.couponCode || "",
        totalAmount: String(params.total),
        currency: currency.toUpperCase(),
      },
    };

    if (isEmbedded) {
      sessionCreateParams.ui_mode = "embedded_page";
      const rawReturn = params.returnUrl || params.successUrl;
      sessionCreateParams.return_url = rawReturn.includes("{CHECKOUT_SESSION_ID}")
        ? rawReturn
        : `${rawReturn}${rawReturn.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;
    } else {
      sessionCreateParams.success_url = params.successUrl;
      sessionCreateParams.cancel_url = params.cancelUrl;
    }

    const session = await stripe.checkout.sessions.create(sessionCreateParams);

    logger.info(
      { sessionId: session.id, orderNumber: params.orderNumber, total: params.total, uiMode: session.ui_mode },
      "Stripe Book Checkout Session created successfully"
    );

    return session;
  },

  /**
   * Create a Stripe Checkout Session for Consultation Booking
   */
  async createConsultationCheckoutSession(params: CreateConsultationSessionParams) {
    const stripe = getStripeClient();
    const currency = (params.currency || "USD").toLowerCase();

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency,
          product_data: {
            name: `Consultation: ${params.packageName}`,
            description: `${params.sessionsCount} Session(s) • ${params.meetingType} • Scheduled for ${params.appointmentDate} at ${params.appointmentTime}`,
          },
          unit_amount: Math.round(params.finalPrice * 100),
        },
        quantity: 1,
      },
    ];

    const isEmbedded = (params.uiMode || "embedded") !== "hosted";
    const sessionCreateParams: Stripe.Checkout.SessionCreateParams = {
      line_items,
      mode: "payment",
      customer_email: params.clientEmail.toLowerCase(),
      client_reference_id: params.bookingNumber,
      metadata: {
        orderType: "CONSULTATION",
        bookingNumber: params.bookingNumber,
        packageId: params.packageId,
        packageName: params.packageName,
        clientName: params.clientName,
        clientEmail: params.clientEmail.toLowerCase(),
        clientPhone: params.clientPhone || "",
        appointmentDate: params.appointmentDate,
        appointmentTime: params.appointmentTime,
        meetingMode: params.meetingMode,
        couponCode: params.couponCode || "",
        finalPrice: String(params.finalPrice),
        currency: currency.toUpperCase(),
      },
    };

    if (isEmbedded) {
      sessionCreateParams.ui_mode = "embedded_page";
      const rawReturn = params.returnUrl || params.successUrl;
      sessionCreateParams.return_url = rawReturn.includes("{CHECKOUT_SESSION_ID}")
        ? rawReturn
        : `${rawReturn}${rawReturn.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;
    } else {
      sessionCreateParams.success_url = params.successUrl;
      sessionCreateParams.cancel_url = params.cancelUrl;
    }

    const session = await stripe.checkout.sessions.create(sessionCreateParams);

    logger.info(
      { sessionId: session.id, bookingNumber: params.bookingNumber, finalPrice: params.finalPrice, uiMode: session.ui_mode },
      "Stripe Consultation Checkout Session created successfully"
    );

    return session;
  },

  /**
   * Retrieve and verify a Stripe Checkout Session
   */
  async retrieveSession(sessionId: string) {
    const stripe = getStripeClient();
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent", "line_items"],
    });
  },
};
