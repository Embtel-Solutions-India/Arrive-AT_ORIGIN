import mongoose, { Schema, Document } from "mongoose";

export interface IPurchasedBook extends Document {
  customer?: mongoose.Types.ObjectId;
  customerEmail: string;
  customerName: string;
  book: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  orderNumber: string;
  title: string;
  slug: string;
  format: string;
  coverImage?: string;
  authorName?: string;
  price: number;
  currency: string;
  pdfUrl?: string;
  purchasedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PurchasedBookSchema = new Schema<IPurchasedBook>(
  {
    customer: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    customerName: { type: String, required: true, trim: true },
    book: { type: Schema.Types.ObjectId, ref: "Book", required: true, index: true },
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    format: { type: String, default: "E-Book" },
    coverImage: { type: String, default: "" },
    authorName: { type: String, default: "Dr. Alka Chopra Madan" },
    price: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    pdfUrl: { type: String, default: "" },
    purchasedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate book assignment if webhook or confirmation is called multiple times (Requirement 8)
PurchasedBookSchema.index({ customerEmail: 1, book: 1 }, { unique: true });
PurchasedBookSchema.index({ customerEmail: 1, purchasedAt: -1 });
PurchasedBookSchema.index({ book: 1, purchasedAt: -1 });
PurchasedBookSchema.index({ orderNumber: 1 });

export const PurchasedBook: mongoose.Model<IPurchasedBook> =
  (mongoose.models.PurchasedBook as mongoose.Model<IPurchasedBook>) ||
  mongoose.model<IPurchasedBook>("PurchasedBook", PurchasedBookSchema);
