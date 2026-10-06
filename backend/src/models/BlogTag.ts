import mongoose, { Schema, Document } from "mongoose";

export interface IBlogTag extends Document {
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BlogTagSchema = new Schema<IBlogTag>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export const BlogTag = mongoose.models.BlogTag || mongoose.model<IBlogTag>("BlogTag", BlogTagSchema);
