import mongoose, { Schema, Document } from "mongoose";

export interface IAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ICustomer extends Document {
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  billingAddress?: IAddress;
  shippingAddress?: IAddress;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    postalCode: { type: String, default: "" },
    country: { type: String, default: "United States" },
  },
  { _id: false }
);

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: "" },
    passwordHash: { type: String },
    resetPasswordToken: { type: String, index: true },
    resetPasswordExpires: { type: Date },
    billingAddress: { type: AddressSchema, default: () => ({}) },
    shippingAddress: { type: AddressSchema, default: () => ({}) },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderDate: { type: Date },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

export const Customer =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);
