import mongoose, { Schema, Document } from "mongoose";

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  author?: mongoose.Types.ObjectId;
  authorName: string;
  category?: mongoose.Types.ObjectId;
  categoryName: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
  publishDate: Date;
  scheduledDate?: Date;
  isFeatured: boolean;
  readTime?: string;
  seo: {
    seoTitle?: string;
    metaDescription?: string;
    focusKeyword?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    noIndex?: boolean;
    noFollow?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BlogPostSchema = new Schema<IBlogPost>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    excerpt: { type: String, default: "" },
    content: { type: String, required: true },
    featuredImage: { type: String, default: "" },
    author: { type: Schema.Types.ObjectId, ref: "Author" },
    authorName: { type: String, default: "Dr. Alka Chopra Madan" },
    category: { type: Schema.Types.ObjectId, ref: "BlogCategory" },
    categoryName: { type: String, default: "General", index: true },
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"],
      default: "DRAFT",
      index: true,
    },
    publishDate: { type: Date, default: Date.now, index: true },
    scheduledDate: { type: Date },
    isFeatured: { type: Boolean, default: false },
    readTime: { type: String, default: "5 min read" },
    seo: {
      seoTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
      focusKeyword: { type: String, default: "" },
      canonicalUrl: { type: String, default: "" },
      ogTitle: { type: String, default: "" },
      ogDescription: { type: String, default: "" },
      ogImage: { type: String, default: "" },
      twitterTitle: { type: String, default: "" },
      twitterDescription: { type: String, default: "" },
      twitterImage: { type: String, default: "" },
      noIndex: { type: Boolean, default: false },
      noFollow: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

BlogPostSchema.index({ status: 1, publishDate: -1 });

export const BlogPost =
  mongoose.models.BlogPost || mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);
