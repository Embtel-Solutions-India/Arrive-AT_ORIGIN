import mongoose, { Schema, Document } from "mongoose";

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "EDITOR" | "STAFF" | "CUSTOM";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";

export interface IUser extends Document {
  name: string;
  username?: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: AdminRole;
  avatar?: string;
  status: UserStatus;
  permissions: string[];
  passwordHistory: string[];
  lastPasswordChange?: Date;
  lastLogin?: Date;
  failedLoginAttempts: number;
  lockoutUntil?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes: string[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, trim: true, sparse: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["SUPER_ADMIN", "ADMIN", "MANAGER", "EDITOR", "STAFF", "CUSTOM"],
      default: "ADMIN",
    },
    avatar: { type: String, default: "" },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"],
      default: "ACTIVE",
    },
    permissions: [{ type: String }],
    passwordHistory: [{ type: String }],
    lastPasswordChange: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    backupCodes: [{ type: String }],
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
