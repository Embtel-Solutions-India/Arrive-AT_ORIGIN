import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  action: string;
  module: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  ipAddress?: string;
  device?: string;
  browser?: string;
  status: "SUCCESS" | "FAILED" | "WARNING";
  details?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    module: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    userName: { type: String, default: "System" },
    userEmail: { type: String, default: "" },
    ipAddress: { type: String, default: "127.0.0.1" },
    device: { type: String, default: "Desktop" },
    browser: { type: String, default: "Chrome" },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "WARNING"],
      default: "SUCCESS",
      index: true,
    },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
