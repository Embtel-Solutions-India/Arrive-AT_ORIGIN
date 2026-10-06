import mongoose, { Schema, Document } from "mongoose";

export interface IBlogCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BlogCategorySchema = new Schema<IBlogCategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
  },
  { timestamps: true }
);

export const BlogCategory =
  mongoose.models.BlogCategory || mongoose.model<IBlogCategory>("BlogCategory", BlogCategorySchema);
