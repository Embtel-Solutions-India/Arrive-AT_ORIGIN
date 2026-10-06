import mongoose, { Schema, Document } from "mongoose";

export interface IBookCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookCategorySchema = new Schema<IBookCategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

export const BookCategory =
  mongoose.models.BookCategory || mongoose.model<IBookCategory>("BookCategory", BookCategorySchema);
