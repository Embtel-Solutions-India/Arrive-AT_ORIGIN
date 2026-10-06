import mongoose, { Schema, Document } from "mongoose";

export interface IMedia extends Document {
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  title?: string;
  altText?: string;
  caption?: string;
  seoDescription?: string;
  customUrl?: string;
  uploadedBy?: string;
  s3Key?: string;
  storage?: "s3" | "local";
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    filename: { type: String, required: true, trim: true },
    originalName: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    mimeType: { type: String, default: "image/jpeg" },
    size: { type: Number, default: 0 },
    width: { type: Number },
    height: { type: Number },
    title: { type: String, default: "" },
    altText: { type: String, default: "" },
    caption: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    customUrl: { type: String, default: "" },
    uploadedBy: { type: String, default: "admin" },
    s3Key: { type: String, trim: true },
    storage: { type: String, enum: ["s3", "local"], default: "s3" },
  },
  { timestamps: true }
);

MediaSchema.index({ createdAt: -1 });

export const Media = mongoose.models.Media || mongoose.model<IMedia>("Media", MediaSchema);
