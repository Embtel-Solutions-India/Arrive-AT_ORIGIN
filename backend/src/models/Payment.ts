import mongoose, { Schema, Document } from "mongoose";

export interface IPayment extends Document {
  order: mongoose.Types.ObjectId;
  orderNumber?: string;
  transactionId: string;
  paymentGateway: string;
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCESSFUL" | "FAILED" | "REFUNDED";
  paymentMethod: string;
  gatewayResponse?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    orderNumber: { type: String, index: true },
    transactionId: { type: String, required: true, unique: true, index: true },
    paymentGateway: { type: String, default: "stripe" },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESSFUL", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    paymentMethod: { type: String, default: "Credit Card" },
    gatewayResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Payment = mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
