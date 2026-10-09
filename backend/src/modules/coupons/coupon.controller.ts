import type { Request, Response } from "express";
import { Coupon, type CouponApplicableScope, type CouponDiscountType, type CouponCurrency } from "../../models/Coupon.js";
import { ok } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  currency: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discountValueINR?: number | null;
  discountAmount: number;
  newAmount: number;
  applicableTo: CouponApplicableScope;
  description: string;
  minOrderAmount: number;
  minOrderAmountINR?: number | null;
}

/**
 * Shared helper to validate and compute coupon discount
 */
export async function calculateCouponDiscount(
  rawCode: string,
  context: "CHECKOUT" | "CONSULTATION",
  amount: number,
  currency?: string
): Promise<CouponValidationResult> {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) {
    throw HttpError.badRequest("Coupon code is required");
  }

  const coupon = await (Coupon as any).findOne({ code });
  if (!coupon) {
    throw HttpError.notFound(`Coupon code "${code}" is invalid or does not exist`);
  }

  if (!coupon.isActive) {
    throw HttpError.badRequest(`Coupon code "${code}" is currently inactive`);
  }

  const now = new Date();
  if (coupon.startDate && new Date(coupon.startDate) > now) {
    throw HttpError.badRequest(`Coupon code "${code}" is not yet active`);
  }
  if (coupon.endDate && new Date(coupon.endDate) < now) {
    throw HttpError.badRequest(`Coupon code "${code}" has expired`);
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw HttpError.badRequest(`Coupon code "${code}" has reached its maximum usage limit`);
  }

  if (coupon.applicableTo !== "ALL" && coupon.applicableTo !== context) {
    const target = coupon.applicableTo === "CHECKOUT" ? "Book Store Checkout" : "Consultation Bookings";
    throw HttpError.badRequest(`Coupon "${code}" is only valid for ${target}`);
  }

  // Normalize requested currency & validate currency compatibility
  const reqCurrency = currency?.toUpperCase();
  const couponCurrency: CouponCurrency = coupon.currency || "ALL";

  if (couponCurrency !== "ALL" && reqCurrency && reqCurrency !== couponCurrency) {
    const expected = couponCurrency === "INR" ? "INR (₹)" : "USD ($)";
    throw HttpError.badRequest(`Coupon "${code}" is only valid for purchases in ${expected}`);
  }

  const isINR = reqCurrency === "INR" || (couponCurrency === "INR" && !reqCurrency);
  const currencySymbol = isINR ? "₹" : "$";

  // Determine effective minimum order threshold
  let minOrder = coupon.minOrderAmount || 0;
  if (isINR && couponCurrency === "ALL" && typeof coupon.minOrderAmountINR === "number" && coupon.minOrderAmountINR > 0) {
    minOrder = coupon.minOrderAmountINR;
  }

  if (minOrder > 0 && amount < minOrder) {
    throw HttpError.badRequest(
      `Coupon "${code}" requires a minimum order amount of ${currencySymbol}${minOrder.toFixed(2)}`
    );
  }

  let discountAmount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = (amount * coupon.discountValue) / 100;
    const maxCap = (isINR && couponCurrency === "ALL" && typeof coupon.maxDiscountAmountINR === "number" && coupon.maxDiscountAmountINR > 0)
      ? coupon.maxDiscountAmountINR
      : coupon.maxDiscountAmount;
    if (maxCap && discountAmount > maxCap) {
      discountAmount = maxCap;
    }
  } else {
    // FIXED
    let fixedVal = coupon.discountValue;
    if (isINR && couponCurrency === "ALL" && typeof coupon.discountValueINR === "number" && coupon.discountValueINR > 0) {
      fixedVal = coupon.discountValueINR;
    }
    discountAmount = Math.min(fixedVal, amount);
  }

  // Round to 2 decimal places
  discountAmount = Math.round(discountAmount * 100) / 100;
  const newAmount = Math.max(0, Math.round((amount - discountAmount) * 100) / 100);

  return {
    valid: true,
    code: coupon.code,
    currency: couponCurrency,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountValueINR: coupon.discountValueINR,
    discountAmount,
    newAmount,
    applicableTo: coupon.applicableTo,
    description: coupon.description,
    minOrderAmount: coupon.minOrderAmount,
    minOrderAmountINR: coupon.minOrderAmountINR,
  };
}

export const couponController = {
  // ─── Public Validation ───
  async validate(req: Request, res: Response) {
    const { code, context = "CHECKOUT", amount, currency } = req.body;
    if (typeof amount !== "number" || amount < 0) {
      throw HttpError.badRequest("Valid purchase amount is required to calculate discount");
    }
    if (context !== "CHECKOUT" && context !== "CONSULTATION") {
      throw HttpError.badRequest("Context must be either 'CHECKOUT' or 'CONSULTATION'");
    }

    const result = await calculateCouponDiscount(code, context, amount, currency);
    ok(res, result, `Coupon ${result.code} applied successfully!`);
  },

  // ─── Admin: List All Coupons ───
  async getCoupons(req: Request, res: Response) {
    const { search, scope, status, currency } = req.query as {
      search?: string;
      scope?: string;
      status?: string;
      currency?: string;
    };

    const filter: Record<string, any> = {};

    if (search) {
      filter.$or = [
        { code: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (scope && scope !== "ALL_FILTER") {
      filter.applicableTo = scope;
    }

    if (currency && currency !== "ALL_FILTER") {
      filter.currency = currency;
    }

    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    const coupons = await (Coupon as any).find(filter).sort({ createdAt: -1 });

    const totalCoupons = await (Coupon as any).countDocuments();
    const activeCoupons = await (Coupon as any).countDocuments({ isActive: true });
    const totalUses = (await (Coupon as any).aggregate([{ $group: { _id: null, total: { $sum: "$usedCount" } } }]))[0]?.total || 0;

    ok(res, {
      coupons,
      stats: {
        totalCoupons,
        activeCoupons,
        totalUses,
      },
    });
  },

  // ─── Admin: Create Coupon ───
  async createCoupon(req: Request, res: Response) {
    const {
      code,
      description,
      currency = "INR",
      discountType = "PERCENTAGE",
      discountValue,
      discountValueINR,
      applicableTo = "ALL",
      minOrderAmount = 0,
      minOrderAmountINR,
      maxDiscountAmount,
      maxDiscountAmountINR,
      startDate,
      endDate,
      usageLimit,
      isActive = true,
    } = req.body;

    if (!code || typeof code !== "string" || !code.trim()) {
      throw HttpError.badRequest("Coupon code is required");
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await (Coupon as any).findOne({ code: cleanCode });
    if (existing) {
      throw HttpError.badRequest(`A coupon with code "${cleanCode}" already exists`);
    }

    if (typeof discountValue !== "number" || discountValue <= 0) {
      throw HttpError.badRequest("Discount value must be greater than 0");
    }

    if (discountType === "PERCENTAGE" && discountValue > 100) {
      throw HttpError.badRequest("Percentage discount cannot exceed 100%");
    }

    const coupon = await (Coupon as any).create({
      code: cleanCode,
      description: description?.trim() || "",
      currency: ["INR", "USD", "ALL"].includes(currency) ? currency : "INR",
      discountType,
      discountValue: Number(discountValue) || 0,
      discountValueINR: discountValueINR !== undefined && discountValueINR !== null && discountValueINR !== "" ? Number(discountValueINR) : null,
      applicableTo,
      minOrderAmount: Math.max(0, Number(minOrderAmount) || 0),
      minOrderAmountINR: minOrderAmountINR !== undefined && minOrderAmountINR !== null && minOrderAmountINR !== "" ? Math.max(0, Number(minOrderAmountINR) || 0) : null,
      maxDiscountAmount: maxDiscountAmount !== undefined && maxDiscountAmount !== null && maxDiscountAmount !== "" ? Number(maxDiscountAmount) : null,
      maxDiscountAmountINR: maxDiscountAmountINR !== undefined && maxDiscountAmountINR !== null && maxDiscountAmountINR !== "" ? Number(maxDiscountAmountINR) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      usedCount: 0,
      isActive: Boolean(isActive),
    });

    ok(res, { coupon }, "Coupon created successfully", 201);
  },

  // ─── Admin: Get Coupon by ID ───
  async getCouponById(req: Request, res: Response) {
    const { id } = req.params;
    const coupon = await (Coupon as any).findById(id);
    if (!coupon) throw HttpError.notFound("Coupon not found");
    ok(res, { coupon });
  },

  // ─── Admin: Update Coupon ───
  async updateCoupon(req: Request, res: Response) {
    const { id } = req.params;
    const coupon = await (Coupon as any).findById(id);
    if (!coupon) throw HttpError.notFound("Coupon not found");

    const {
      code,
      description,
      currency,
      discountType,
      discountValue,
      discountValueINR,
      applicableTo,
      minOrderAmount,
      minOrderAmountINR,
      maxDiscountAmount,
      maxDiscountAmountINR,
      startDate,
      endDate,
      usageLimit,
      isActive,
    } = req.body;

    if (code && typeof code === "string") {
      const cleanCode = code.trim().toUpperCase();
      if (cleanCode !== coupon.code) {
        const existing = await (Coupon as any).findOne({ code: cleanCode, _id: { $ne: id } });
        if (existing) {
          throw HttpError.badRequest(`A coupon with code "${cleanCode}" already exists`);
        }
        coupon.code = cleanCode;
      }
    }

    if (description !== undefined) coupon.description = description.trim();
    if (currency !== undefined && ["INR", "USD", "ALL"].includes(currency)) {
      coupon.currency = currency;
    }
    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) {
      if (discountValue <= 0) throw HttpError.badRequest("Discount value must be greater than 0");
      if (coupon.discountType === "PERCENTAGE" && discountValue > 100) {
        throw HttpError.badRequest("Percentage discount cannot exceed 100%");
      }
      coupon.discountValue = discountValue;
    }
    if (discountValueINR !== undefined) {
      coupon.discountValueINR = discountValueINR !== "" && discountValueINR !== null ? Number(discountValueINR) : null;
    }
    if (applicableTo !== undefined) coupon.applicableTo = applicableTo;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = Math.max(0, Number(minOrderAmount) || 0);
    if (minOrderAmountINR !== undefined) {
      coupon.minOrderAmountINR = minOrderAmountINR !== "" && minOrderAmountINR !== null ? Math.max(0, Number(minOrderAmountINR) || 0) : null;
    }
    if (maxDiscountAmount !== undefined) {
      coupon.maxDiscountAmount = maxDiscountAmount !== "" && maxDiscountAmount !== null ? Number(maxDiscountAmount) : null;
    }
    if (maxDiscountAmountINR !== undefined) {
      coupon.maxDiscountAmountINR = maxDiscountAmountINR !== "" && maxDiscountAmountINR !== null ? Number(maxDiscountAmountINR) : null;
    }
    if (startDate !== undefined) coupon.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) coupon.endDate = endDate ? new Date(endDate) : null;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit !== "" && usageLimit !== null ? Number(usageLimit) : null;
    if (isActive !== undefined) coupon.isActive = Boolean(isActive);

    await coupon.save();
    ok(res, { coupon }, "Coupon updated successfully");
  },

  // ─── Admin: Delete Coupon ───
  async deleteCoupon(req: Request, res: Response) {
    const { id } = req.params;
    const coupon = await (Coupon as any).findByIdAndDelete(id);
    if (!coupon) throw HttpError.notFound("Coupon not found");
    ok(res, null, `Coupon "${coupon.code}" deleted successfully`);
  },

  // ─── Admin: Toggle Coupon Active State ───
  async toggleCoupon(req: Request, res: Response) {
    const { id } = req.params;
    const coupon = await (Coupon as any).findById(id);
    if (!coupon) throw HttpError.notFound("Coupon not found");
    coupon.isActive = !coupon.isActive;
    await coupon.save();
    ok(res, { coupon }, `Coupon "${coupon.code}" is now ${coupon.isActive ? "active" : "inactive"}`);
  },
};
