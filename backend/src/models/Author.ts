import mongoose, { Schema, Document } from "mongoose";

export interface IAuthor extends Document {
  name: string;
  slug: string;
  biography?: string;
  profileImage?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AuthorSchema = new Schema<IAuthor>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    biography: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    website: { type: String, default: "" },
    socialLinks: {
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      instagram: { type: String, default: "" },
      facebook: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export const Author = mongoose.models.Author || mongoose.model<IAuthor>("Author", AuthorSchema);
