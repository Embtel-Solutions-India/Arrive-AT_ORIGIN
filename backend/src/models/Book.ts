import mongoose, { Schema, Document } from "mongoose";

export interface IBook extends Document {
  title: string;
  slug: string;
  author?: mongoose.Types.ObjectId;
  authorName: string;
  isbn?: string;
  publisher?: string;
  publicationDate?: Date;
  language: string;
  pages?: number;
  format: "Hardcover" | "Paperback" | "E-book" | "Other";
  formats?: Array<{
    format: string;
    price: number;
    sku?: string;
    stockQuantity?: number;
  }>;
  description: string;
  shortDescription?: string;
  coverImage: string;
  images: string[];
  category?: mongoose.Types.ObjectId;
  categoryName: string;
  tags: string[];
  price: number;
  salePrice?: number;
  currency: string;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
  status: "DRAFT" | "PUBLISHED" | "OUT_OF_STOCK" | "ARCHIVED";
  salesCount: number;
  revenue: number;
  amazonUrl?: string;
  isFeatured: boolean;
  seo: {
    seoTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    noIndex?: boolean;
    noFollow?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: "Author" },
    authorName: { type: String, default: "Dr. Alka Chopra Madan" },
    isbn: { type: String, trim: true, index: true },
    publisher: { type: String, default: "Soul Body Publishing" },
    publicationDate: { type: Date },
    language: { type: String, default: "English" },
    pages: { type: Number, default: 200 },
    format: {
      type: String,
      enum: ["Hardcover", "Paperback", "E-book", "Other"],
      default: "Paperback",
    },
    formats: [
      {
        format: { type: String },
        price: { type: Number },
        sku: { type: String },
        stockQuantity: { type: Number },
      },
    ],
    description: { type: String, required: true },
    shortDescription: { type: String, default: "" },
    coverImage: { type: String, required: true },
    images: [{ type: String }],
    category: { type: Schema.Types.ObjectId, ref: "BookCategory" },
    categoryName: { type: String, default: "Metaphysics", index: true },
    tags: [{ type: String, trim: true }],
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0 },
    currency: { type: String, default: "USD" },
    sku: { type: String, required: true, unique: true, trim: true, index: true },
    stockQuantity: { type: Number, default: 50 },
    lowStockThreshold: { type: Number, default: 5 },
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "OUT_OF_STOCK", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    salesCount: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    amazonUrl: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false },
    seo: {
      seoTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
      canonicalUrl: { type: String, default: "" },
      ogTitle: { type: String, default: "" },
      ogDescription: { type: String, default: "" },
      ogImage: { type: String, default: "" },
      noIndex: { type: Boolean, default: false },
      noFollow: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

BookSchema.index({ status: 1, salesCount: -1 });

export const Book = mongoose.models.Book || mongoose.model<IBook>("Book", BookSchema);
