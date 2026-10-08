import mongoose, { Schema, Document } from "mongoose";
import { IAddress } from "./Customer.js";

export interface IOrderItem {
  book?: mongoose.Types.ObjectId;
  title: string;
  sku: string;
  format?: string;
  price: number;
  quantity: number;
  coverImage?: string;
  subtotal: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  orderType?: "BOOK_ORDER" | "CONSULTATION";
  customer?: mongoose.Types.ObjectId;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  items: IOrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  couponCode?: string;
  total: number;
  currency: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  orderStatus:
    | "PENDING"
    | "PAYMENT_CONFIRMED"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUNDED";
  billingAddress: IAddress;
  shippingAddress: IAddress;
  payment?: mongoose.Types.ObjectId;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    book: { type: Schema.Types.ObjectId, ref: "Book", required: false },
    title: { type: String, required: true },
    sku: { type: String, default: "" },
    format: { type: String, default: "Paperback" },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    coverImage: { type: String, default: "" },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    orderType: { type: String, enum: ["BOOK_ORDER", "CONSULTATION"], default: "BOOK_ORDER", index: true },
    customer: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    customerInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true, index: true },
      phone: { type: String, default: "" },
    },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: "" },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"],
      default: "PENDING",
      index: true,
    },
    orderStatus: {
      type: String,
      enum: ["PENDING", "PAYMENT_CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    billingAddress: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "United States" },
    },
    shippingAddress: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "United States" },
    },
    payment: { type: Schema.Types.ObjectId, ref: "Payment" },
    trackingNumber: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

OrderSchema.index({ createdAt: -1 });

export const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
