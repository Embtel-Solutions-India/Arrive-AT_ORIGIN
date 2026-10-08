import type { Request, Response } from "express";
import { Book } from "../../models/Book.js";
import { BookCategory } from "../../models/BookCategory.js";
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

export const bookController = {
  async getBooks(req: Request, res: Response) {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const search = (req.query.search as string) || "";
    const status = req.query.status as string | undefined;
    const category = req.query.category as string | undefined;
    const stock = req.query.stock as string | undefined;
    const sort = (req.query.sort as string) || "-createdAt";

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { authorName: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { isbn: { $regex: search, $options: "i" } },
      ];
    }
    if (status && status !== "ALL") {
      query.status = status;
    }
    if (category && category !== "ALL") {
      query.$or = [{ categoryName: category }, { category }];
    }
    if (stock === "low_stock") {
      query.$expr = { $lte: ["$stockQuantity", "$lowStockThreshold"] };
      query.stockQuantity = { $gt: 0 };
    } else if (stock === "out_of_stock") {
      query.stockQuantity = { $lte: 0 };
    } else if (stock === "in_stock") {
      query.stockQuantity = { $gt: 0 };
    }

    const [books, total] = await Promise.all([
      Book.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Book.countDocuments(query),
    ]);

    ok(res, {
      books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  },

  async getBookById(req: Request, res: Response) {
    const { id } = req.params;
    const book = (await Book.findById(id)) || (await Book.findOne({ slug: id }));
    if (!book) throw HttpError.notFound("Book not found");
    ok(res, { book });
  },

  async createBook(req: Request, res: Response) {
    const {
      title,
      slug,
      authorName,
      isbn,
      publisher,
      publicationDate,
      language,
      pages,
      format,
      formats,
      description,
      shortDescription,
      coverImage,
      images,
      categoryName,
      tags,
      price,
      priceINR,
      priceUSD,
      salePrice,
      salePriceINR,
      salePriceUSD,
      currency,
      sku,
      stockQuantity,
      lowStockThreshold,
      status,
      amazonUrl,
      isFeatured,
      seo,
    } = req.body;

    const effectivePrice =
      priceINR !== undefined && priceINR !== ""
        ? Number(priceINR)
        : price !== undefined && price !== ""
        ? Number(price)
        : priceUSD !== undefined && priceUSD !== ""
        ? Number(priceUSD)
        : undefined;

    if (!title || effectivePrice === undefined) {
      throw HttpError.badRequest("Title and price are required");
    }

    let finalSlug = slug ? slugify(slug) : slugify(title);
    const existingSlug = await Book.findOne({ slug: finalSlug });
    if (existingSlug) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const finalSku = sku ? sku.trim() : `BK-${Date.now().toString().slice(-6)}`;
    const existingSku = await Book.findOne({ sku: finalSku });
    if (existingSku) {
      throw HttpError.badRequest("A book with this SKU already exists");
    }

    const book = await Book.create({
      title,
      slug: finalSlug,
      authorName: authorName || "Dr. Alka Chopra Madan",
      isbn: isbn || "",
      publisher: publisher || "Soul Body Publishing",
      publicationDate: publicationDate ? new Date(publicationDate) : undefined,
      language: language || "English",
      pages: Number(pages) || 200,
      format: format || "Paperback",
      formats: Array.isArray(formats) ? formats : [{ format: format || "Paperback", price: Number(price) }],
      description: description || title,
      shortDescription: shortDescription || "",
      coverImage: coverImage || "/aao-part-one.png",
      images: Array.isArray(images) ? images : [],
      categoryName: categoryName || "Metaphysics",
      tags: Array.isArray(tags) ? tags : [],
      price: effectivePrice,
      priceINR: priceINR !== undefined && priceINR !== "" ? Number(priceINR) : (currency === "INR" ? effectivePrice : undefined),
      priceUSD: priceUSD !== undefined && priceUSD !== "" ? Number(priceUSD) : (currency === "USD" ? effectivePrice : undefined),
      salePrice: salePriceINR ? Number(salePriceINR) : (salePrice ? Number(salePrice) : (salePriceUSD ? Number(salePriceUSD) : undefined)),
      salePriceINR: salePriceINR ? Number(salePriceINR) : undefined,
      salePriceUSD: salePriceUSD ? Number(salePriceUSD) : undefined,
      currency: currency || "INR",
      sku: finalSku,
      stockQuantity: Number(stockQuantity) ?? 50,
      lowStockThreshold: Number(lowStockThreshold) ?? 5,
      status: status || "DRAFT",
      amazonUrl: amazonUrl || "",
      isFeatured: !!isFeatured,
      seo: seo || {},
    });

    ok(res, { book }, "Book created successfully", 201);
  },

  async updateBook(req: Request, res: Response) {
    const { id } = req.params;
    const body = req.body;

    const book = await Book.findById(id);
    if (!book) throw HttpError.notFound("Book not found");

    if (body.slug && body.slug !== book.slug) {
      const slugCandidate = slugify(body.slug);
      const duplicate = await Book.findOne({ slug: slugCandidate, _id: { $ne: id } });
      if (duplicate) throw HttpError.badRequest("A book with this slug already exists");
      book.slug = slugCandidate;
    }

    if (body.sku && body.sku !== book.sku) {
      const duplicate = await Book.findOne({ sku: body.sku, _id: { $ne: id } });
      if (duplicate) throw HttpError.badRequest("A book with this SKU already exists");
      book.sku = body.sku;
    }

    const fields = [
      "title",
      "authorName",
      "isbn",
      "publisher",
      "language",
      "pages",
      "format",
      "formats",
      "description",
      "shortDescription",
      "coverImage",
      "images",
      "categoryName",
      "tags",
      "price",
      "priceINR",
      "priceUSD",
      "salePrice",
      "salePriceINR",
      "salePriceUSD",
      "currency",
      "stockQuantity",
      "lowStockThreshold",
      "status",
      "amazonUrl",
      "isFeatured",
    ];

    fields.forEach((f) => {
      if (body[f] !== undefined) {
        (book as any)[f] = body[f];
      }
    });

    if (body.publicationDate) {
      book.publicationDate = new Date(body.publicationDate);
    }
    if (body.seo) {
      book.seo = { ...book.seo, ...body.seo };
    }

    // Auto-update status if out of stock
    if (book.stockQuantity <= 0 && book.status === "PUBLISHED") {
      book.status = "OUT_OF_STOCK";
    }

    await book.save();
    ok(res, { book }, "Book updated successfully");
  },

  async deleteBook(req: Request, res: Response) {
    const { id } = req.params;
    const book = await Book.findByIdAndDelete(id);
    if (!book) throw HttpError.notFound("Book not found");
    ok(res, null, "Book deleted successfully");
  },

  async duplicateBook(req: Request, res: Response) {
    const { id } = req.params;
    const original = await Book.findById(id);
    if (!original) throw HttpError.notFound("Book not found");

    const copySlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;
    const copySku = `${original.sku}-COPY-${Date.now().toString().slice(-4)}`;

    const copy = await Book.create({
      title: `${original.title} (Copy)`,
      slug: copySlug,
      authorName: original.authorName,
      isbn: original.isbn,
      publisher: original.publisher,
      publicationDate: original.publicationDate,
      language: original.language,
      pages: original.pages,
      format: original.format,
      formats: original.formats,
      description: original.description,
      shortDescription: original.shortDescription,
      coverImage: original.coverImage,
      images: original.images,
      categoryName: original.categoryName,
      tags: original.tags,
      price: original.price,
      salePrice: original.salePrice,
      currency: original.currency,
      sku: copySku,
      stockQuantity: original.stockQuantity,
      lowStockThreshold: original.lowStockThreshold,
      status: "DRAFT",
      amazonUrl: original.amazonUrl,
      isFeatured: false,
      seo: original.seo,
    });

    ok(res, { book: copy }, "Book duplicated successfully", 201);
  },

  async updateInventory(req: Request, res: Response) {
    const { items } = req.body as { items: Array<{ id: string; stockQuantity: number; lowStockThreshold?: number }> };
    if (!Array.isArray(items)) throw HttpError.badRequest("Items array is required");

    for (const item of items) {
      const book = await Book.findById(item.id);
      if (book) {
        book.stockQuantity = item.stockQuantity;
        if (item.lowStockThreshold !== undefined) {
          book.lowStockThreshold = item.lowStockThreshold;
        }
        if (book.stockQuantity <= 0 && book.status === "PUBLISHED") {
          book.status = "OUT_OF_STOCK";
        } else if (book.stockQuantity > 0 && book.status === "OUT_OF_STOCK") {
          book.status = "PUBLISHED";
        }
        await book.save();
      }
    }

    ok(res, null, "Inventory updated successfully");
  },

  // ─── Book Categories ───
  async getCategories(_req: Request, res: Response) {
    const categories = await BookCategory.find().sort({ name: 1 });
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const bookCount = await Book.countDocuments({
          $or: [{ categoryName: cat.name }, { category: cat._id }],
        });
        return {
          ...cat.toObject(),
          bookCount,
        };
      })
    );
    ok(res, { categories: categoriesWithCount });
  },

  async createCategory(req: Request, res: Response) {
    const { name, slug, description, image } = req.body;
    if (!name) throw HttpError.badRequest("Category name is required");
    const catSlug = slug ? slugify(slug) : slugify(name);
    const category = await BookCategory.create({ name, slug: catSlug, description, image });
    ok(res, { category }, "Book category created", 201);
  },

  async deleteCategory(req: Request, res: Response) {
    const { id } = req.params;
    await BookCategory.findByIdAndDelete(id);
    ok(res, null, "Book category deleted");
  },

  async exportBooks(req: Request, res: Response) {
    const format = ((req.query.format as string) || "json").toLowerCase();
    const books = await Book.find().sort({ createdAt: -1 });

    if (format === "csv") {
      const headers = [
        "Title",
        "Slug",
        "SKU",
        "ISBN",
        "Author",
        "Category",
        "Format",
        "Price",
        "SalePrice",
        "StockQuantity",
        "Status",
        "SalesCount",
        "Revenue",
        "CreatedAt",
      ];
      const escapeCsv = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;
      const rows = books.map((b) => [
        escapeCsv(b.title),
        escapeCsv(b.slug),
        escapeCsv(b.sku),
        escapeCsv(b.isbn),
        escapeCsv(b.authorName),
        escapeCsv(b.categoryName),
        escapeCsv(b.format),
        escapeCsv(b.price),
        escapeCsv(b.salePrice ?? ""),
        escapeCsv(b.stockQuantity),
        escapeCsv(b.status),
        escapeCsv(b.salesCount),
        escapeCsv(b.revenue),
        escapeCsv(b.createdAt ? b.createdAt.toISOString() : ""),
      ].join(","));

      const csvContent = [headers.join(","), ...rows].join("\r\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="soulbody-books-export.csv"');
      return res.send(csvContent);
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="soulbody-books-export.json"');
    return res.send(JSON.stringify(books, null, 2));
  },
};
