import type { Request, Response } from "express";
import { Coupon, type CouponApplicableScope, type CouponDiscountType } from "../../models/Coupon.js";
import { ok } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discountAmount: number;
  newAmount: number;
  applicableTo: CouponApplicableScope;
  description: string;
  minOrderAmount: number;
}

/**
 * Shared helper to validate and compute coupon discount
 */
export async function calculateCouponDiscount(
  rawCode: string,
  context: "CHECKOUT" | "CONSULTATION",
  amount: number
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

  if (coupon.minOrderAmount && amount < coupon.minOrderAmount) {
    throw HttpError.badRequest(
      `Coupon "${code}" requires a minimum order amount of $${coupon.minOrderAmount.toFixed(2)}`
    );
  }

  let discountAmount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = (amount * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else {
    // FIXED
    discountAmount = Math.min(coupon.discountValue, amount);
  }

  // Round to 2 decimal places
  discountAmount = Math.round(discountAmount * 100) / 100;
  const newAmount = Math.max(0, Math.round((amount - discountAmount) * 100) / 100);

  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    newAmount,
    applicableTo: coupon.applicableTo,
    description: coupon.description,
    minOrderAmount: coupon.minOrderAmount,
  };
}

export const couponController = {
  // ─── Public Validation ───
  async validate(req: Request, res: Response) {
    const { code, context = "CHECKOUT", amount } = req.body;
    if (typeof amount !== "number" || amount < 0) {
      throw HttpError.badRequest("Valid purchase amount is required to calculate discount");
    }
    if (context !== "CHECKOUT" && context !== "CONSULTATION") {
      throw HttpError.badRequest("Context must be either 'CHECKOUT' or 'CONSULTATION'");
    }

    const result = await calculateCouponDiscount(code, context, amount);
    ok(res, result, `Coupon ${result.code} applied successfully!`);
  },

  // ─── Admin: List All Coupons ───
  async getCoupons(req: Request, res: Response) {
    const { search, scope, status } = req.query as {
      search?: string;
      scope?: string;
      status?: string;
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
      discountType = "PERCENTAGE",
      discountValue,
      applicableTo = "ALL",
      minOrderAmount = 0,
      maxDiscountAmount,
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
      discountType,
      discountValue,
      applicableTo,
      minOrderAmount: Math.max(0, Number(minOrderAmount) || 0),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
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
      discountType,
      discountValue,
      applicableTo,
      minOrderAmount,
      maxDiscountAmount,
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
    if (discountType !== undefined) coupon.discountType = discountType;
    if (discountValue !== undefined) {
      if (discountValue <= 0) throw HttpError.badRequest("Discount value must be greater than 0");
      if (coupon.discountType === "PERCENTAGE" && discountValue > 100) {
        throw HttpError.badRequest("Percentage discount cannot exceed 100%");
      }
      coupon.discountValue = discountValue;
    }
    if (applicableTo !== undefined) coupon.applicableTo = applicableTo;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = Math.max(0, Number(minOrderAmount) || 0);
    if (maxDiscountAmount !== undefined) {
      coupon.maxDiscountAmount = maxDiscountAmount ? Number(maxDiscountAmount) : null;
    }
    if (startDate !== undefined) coupon.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) coupon.endDate = endDate ? new Date(endDate) : null;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit ? Number(usageLimit) : null;
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
