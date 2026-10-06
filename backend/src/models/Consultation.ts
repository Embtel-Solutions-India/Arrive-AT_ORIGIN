import mongoose, { Schema, Document } from "mongoose";

export interface IConsultation extends Document {
  bookingNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  packageName: string;
  meetingType: string;
  sessionsCount: number;
  price: number;
  currency: string;
  appointmentDate: string;
  appointmentTime: string;
  meetingMode: "ONLINE_ZOOM" | "IN_PERSON_FREMONT";
  notes?: string;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  order?: mongoose.Types.ObjectId;
  customer?: mongoose.Types.ObjectId;
  payment?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConsultationSchema = new Schema<IConsultation>(
  {
    bookingNumber: { type: String, required: true, unique: true, index: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true, index: true },
    clientPhone: { type: String, default: "" },
    packageName: { type: String, required: true },
    meetingType: { type: String, required: true },
    sessionsCount: { type: Number, default: 1 },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    appointmentDate: { type: String, required: true },
    appointmentTime: { type: String, required: true },
    meetingMode: {
      type: String,
      enum: ["ONLINE_ZOOM", "IN_PERSON_FREMONT"],
      default: "ONLINE_ZOOM",
    },
    notes: { type: String, default: "" },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
      index: true,
    },
    status: {
      type: String,
      enum: ["CONFIRMED", "COMPLETED", "CANCELLED", "RESCHEDULED"],
      default: "CONFIRMED",
      index: true,
    },
    razorpayOrderId: { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    customer: { type: Schema.Types.ObjectId, ref: "Customer" },
    payment: { type: Schema.Types.ObjectId, ref: "Payment" },
  },
  { timestamps: true }
);

ConsultationSchema.index({ createdAt: -1 });

export const Consultation =
  mongoose.models.Consultation || mongoose.model<IConsultation>("Consultation", ConsultationSchema);
