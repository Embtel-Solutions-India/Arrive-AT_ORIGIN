import mongoose, { Schema, Document } from "mongoose";

export interface IAdminSession extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  tokenHash: string;
  ipAddress: string;
  device: string;
  browser: string;
  location: string;
  lastActive: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSessionSchema = new Schema<IAdminSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userName: { type: String, default: "" },
    userEmail: { type: String, default: "" },
    tokenHash: { type: String, required: true, index: true },
    ipAddress: { type: String, default: "127.0.0.1" },
    device: { type: String, default: "Desktop / Windows" },
    browser: { type: String, default: "Chrome 124" },
    location: { type: String, default: "Local Network" },
    lastActive: { type: Date, default: Date.now },
    isRevoked: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

AdminSessionSchema.index({ userId: 1, isRevoked: 1 });

export const AdminSession =
  mongoose.models.AdminSession || mongoose.model<IAdminSession>("AdminSession", AdminSessionSchema);
