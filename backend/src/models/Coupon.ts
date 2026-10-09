import mongoose, { Schema, Document } from "mongoose";

export type CouponDiscountType = "PERCENTAGE" | "FIXED";
export type CouponApplicableScope = "ALL" | "CHECKOUT" | "CONSULTATION";
export type CouponCurrency = "ALL" | "INR" | "USD";

export interface ICoupon extends Document {
  code: string;
  description: string;
  currency: CouponCurrency;
  discountType: CouponDiscountType;
  discountValue: number;
  discountValueINR?: number | null;
  applicableTo: CouponApplicableScope;
  minOrderAmount: number;
  minOrderAmountINR?: number | null;
  maxDiscountAmount?: number | null;
  maxDiscountAmountINR?: number | null;
  startDate?: Date;
  endDate?: Date;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    currency: {
      type: String,
      enum: ["ALL", "INR", "USD"],
      default: "ALL",
      required: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED"],
      default: "PERCENTAGE",
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    discountValueINR: {
      type: Number,
      default: null,
    },
    applicableTo: {
      type: String,
      enum: ["ALL", "CHECKOUT", "CONSULTATION"],
      default: "ALL",
      required: true,
      index: true,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    minOrderAmountINR: {
      type: Number,
      default: null,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    maxDiscountAmountINR: {
      type: Number,
      default: null,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const Coupon =
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);
