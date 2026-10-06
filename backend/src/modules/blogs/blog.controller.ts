import type { Request, Response } from "express";
import { BlogPost } from "../../models/BlogPost.js";
import { BlogCategory } from "../../models/BlogCategory.js";
import { BlogTag } from "../../models/BlogTag.js";
import { ok } from "../../utils/response.js";
import { HttpError } from "../../utils/httpError.js";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export const blogController = {
  // ─── Posts ───
  async getBlogs(req: Request, res: Response) {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const search = (req.query.search as string) || "";
    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;
    const sort = (req.query.sort as string) || "-createdAt";

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
        { authorName: { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "ALL") {
      query.status = status;
    }
    if (category && category !== "ALL") {
      query.$or = [{ categoryName: category }, { category }];
    }

    const [blogs, total] = await Promise.all([
      BlogPost.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      BlogPost.countDocuments(query),
    ]);

    ok(res, {
      blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  },

  async getBlogById(req: Request, res: Response) {
    const { id } = req.params;
    const blog = (await BlogPost.findById(id)) || (await BlogPost.findOne({ slug: id }));
    if (!blog) throw HttpError.notFound("Blog post not found");
    ok(res, { blog });
  },

  async createBlog(req: Request, res: Response) {
    const { title, slug, content, excerpt, authorName, categoryName, tags, featuredImage, isFeatured, status, scheduledDate, seo } =
      req.body;

    if (!title || !content) {
      throw HttpError.badRequest("Title and content are required");
    }

    let finalSlug = slug ? slugify(slug) : slugify(title);
    const existing = await BlogPost.findOne({ slug: finalSlug });
    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    // Estimate reading time
    const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

    const blog = await BlogPost.create({
      title,
      slug: finalSlug,
      content,
      excerpt: excerpt || content.replace(/<[^>]*>/g, "").slice(0, 160) + "…",
      authorName: authorName || "Dr. Alka Chopra Madan",
      categoryName: categoryName || "General",
      tags: Array.isArray(tags) ? tags : [],
      featuredImage: featuredImage || "",
      isFeatured: !!isFeatured,
      status: status || "DRAFT",
      publishDate: status === "PUBLISHED" ? new Date() : undefined,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      readTime,
      seo: seo || {},
    });

    ok(res, { blog }, "Blog post created successfully", 201);
  },

  async updateBlog(req: Request, res: Response) {
    const { id } = req.params;
    const { title, slug, content, excerpt, authorName, categoryName, tags, featuredImage, isFeatured, status, scheduledDate, seo } =
      req.body;

    const blog = await BlogPost.findById(id);
    if (!blog) throw HttpError.notFound("Blog post not found");

    if (slug && slug !== blog.slug) {
      const slugCandidate = slugify(slug);
      const duplicate = await BlogPost.findOne({ slug: slugCandidate, _id: { $ne: id } });
      if (duplicate) throw HttpError.badRequest("A post with this slug already exists");
      blog.slug = slugCandidate;
    }

    if (title !== undefined) blog.title = title;
    if (content !== undefined) {
      blog.content = content;
      const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
      blog.readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
    }
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (authorName !== undefined) blog.authorName = authorName;
    if (categoryName !== undefined) blog.categoryName = categoryName;
    if (tags !== undefined) blog.tags = Array.isArray(tags) ? tags : [];
    if (featuredImage !== undefined) blog.featuredImage = featuredImage;
    if (isFeatured !== undefined) blog.isFeatured = isFeatured;
    if (scheduledDate !== undefined) blog.scheduledDate = scheduledDate ? new Date(scheduledDate) : undefined;
    if (seo !== undefined) blog.seo = { ...blog.seo, ...seo };

    if (status && status !== blog.status) {
      blog.status = status;
      if (status === "PUBLISHED" && !blog.publishDate) {
        blog.publishDate = new Date();
      }
    }

    await blog.save();
    ok(res, { blog }, "Blog post updated successfully");
  },

  async deleteBlog(req: Request, res: Response) {
    const { id } = req.params;
    const blog = await BlogPost.findByIdAndDelete(id);
    if (!blog) throw HttpError.notFound("Blog post not found");
    ok(res, null, "Blog post deleted successfully");
  },

  async publishBlog(req: Request, res: Response) {
    const { id } = req.params;
    const blog = await BlogPost.findById(id);
    if (!blog) throw HttpError.notFound("Blog post not found");
    blog.status = "PUBLISHED";
    blog.publishDate = new Date();
    await blog.save();
    ok(res, { blog }, "Blog published successfully");
  },

  async unpublishBlog(req: Request, res: Response) {
    const { id } = req.params;
    const blog = await BlogPost.findById(id);
    if (!blog) throw HttpError.notFound("Blog post not found");
    blog.status = "DRAFT";
    await blog.save();
    ok(res, { blog }, "Blog set to draft");
  },

  async duplicateBlog(req: Request, res: Response) {
    const { id } = req.params;
    const original = await BlogPost.findById(id);
    if (!original) throw HttpError.notFound("Blog post not found");

    const copySlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;
    const copy = await BlogPost.create({
      title: `${original.title} (Copy)`,
      slug: copySlug,
      content: original.content,
      excerpt: original.excerpt,
      featuredImage: original.featuredImage,
      authorName: original.authorName,
      categoryName: original.categoryName,
      tags: original.tags,
      status: "DRAFT",
      isFeatured: false,
      readTime: original.readTime,
      seo: original.seo,
    });

    ok(res, { blog: copy }, "Blog post duplicated successfully", 201);
  },

  async bulkAction(req: Request, res: Response) {
    const { ids, action } = req.body as { ids: string[]; action: string };
    if (!Array.isArray(ids) || ids.length === 0) {
      throw HttpError.badRequest("No post IDs provided");
    }

    if (action === "publish") {
      await BlogPost.updateMany({ _id: { $in: ids } }, { status: "PUBLISHED", publishDate: new Date() });
    } else if (action === "unpublish") {
      await BlogPost.updateMany({ _id: { $in: ids } }, { status: "DRAFT" });
    } else if (action === "delete") {
      await BlogPost.deleteMany({ _id: { $in: ids } });
    } else {
      throw HttpError.badRequest("Invalid bulk action");
    }

    ok(res, null, `Bulk action '${action}' applied to ${ids.length} posts`);
  },

  // ─── Categories ───
  async getCategories(_req: Request, res: Response) {
    const categories = await BlogCategory.find().sort({ name: 1 });
    // Also include count of posts per category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const postCount = await BlogPost.countDocuments({
          $or: [{ categoryName: cat.name }, { category: cat._id }],
        });
        return {
          ...cat.toObject(),
          postCount,
        };
      })
    );
    ok(res, { categories: categoriesWithCount });
  },

  async createCategory(req: Request, res: Response) {
    const { name, slug, description, image, seoTitle, seoDescription } = req.body;
    if (!name) throw HttpError.badRequest("Category name is required");
    const catSlug = slug ? slugify(slug) : slugify(name);

    const existing = await BlogCategory.findOne({ slug: catSlug });
    if (existing) throw HttpError.badRequest("Category with this slug already exists");

    const category = await BlogCategory.create({
      name,
      slug: catSlug,
      description,
      image,
      seoTitle,
      seoDescription,
    });
    ok(res, { category }, "Category created", 201);
  },

  async updateCategory(req: Request, res: Response) {
    const { id } = req.params;
    const { name, slug, description, image, seoTitle, seoDescription } = req.body;

    const category = await BlogCategory.findById(id);
    if (!category) throw HttpError.notFound("Category not found");

    if (name) category.name = name;
    if (slug) category.slug = slugify(slug);
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (seoTitle !== undefined) category.seoTitle = seoTitle;
    if (seoDescription !== undefined) category.seoDescription = seoDescription;

    await category.save();
    ok(res, { category }, "Category updated");
  },

  async deleteCategory(req: Request, res: Response) {
    const { id } = req.params;
    const force = req.query.force === "true";
    const category = await BlogCategory.findById(id);
    if (!category) throw HttpError.notFound("Category not found");

    const postCount = await BlogPost.countDocuments({
      $or: [{ categoryName: category.name }, { category: category._id }],
    });

    if (postCount > 0 && !force) {
      throw HttpError.badRequest(
        `Category is used by ${postCount} blog post(s). Confirm deletion or reassign first.`
      );
    }

    if (postCount > 0 && force) {
      await BlogPost.updateMany(
        { $or: [{ categoryName: category.name }, { category: category._id }] },
        { categoryName: "General" }
      );
    }

    await BlogCategory.findByIdAndDelete(id);
    ok(res, null, "Category deleted");
  },

  // ─── Tags ───
  async getTags(_req: Request, res: Response) {
    const tags = await BlogTag.find().sort({ name: 1 });
    ok(res, { tags });
  },

  async createTag(req: Request, res: Response) {
    const { name, slug, description } = req.body;
    if (!name) throw HttpError.badRequest("Tag name is required");
    const tagSlug = slug ? slugify(slug) : slugify(name);

    const existing = await BlogTag.findOne({ slug: tagSlug });
    if (existing) throw HttpError.badRequest("Tag with this slug already exists");

    const tag = await BlogTag.create({ name, slug: tagSlug, description });
    ok(res, { tag }, "Tag created", 201);
  },

  async deleteTag(req: Request, res: Response) {
    const { id } = req.params;
    await BlogTag.findByIdAndDelete(id);
    ok(res, null, "Tag deleted");
  },

  async exportBlogs(req: Request, res: Response) {
    const format = ((req.query.format as string) || "json").toLowerCase();
    const blogs = await BlogPost.find().sort({ createdAt: -1 });

    if (format === "csv") {
      const headers = ["Title", "Slug", "Author", "Category", "Status", "PublishDate", "Views", "CreatedAt"];
      const escapeCsv = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;
      const rows = blogs.map((b) => [
        escapeCsv(b.title),
        escapeCsv(b.slug),
        escapeCsv(b.authorName),
        escapeCsv(b.categoryName),
        escapeCsv(b.status),
        escapeCsv(b.publishDate ? b.publishDate.toISOString() : ""),
        escapeCsv(b.viewsCount),
        escapeCsv(b.createdAt ? b.createdAt.toISOString() : ""),
      ].join(","));

      const csvContent = [headers.join(","), ...rows].join("\r\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="soulbody-blogs-export.csv"');
      return res.send(csvContent);
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="soulbody-blogs-export.json"');
    return res.send(JSON.stringify(blogs, null, 2));
  },
};
