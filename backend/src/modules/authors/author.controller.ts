import type { Request, Response } from "express";
import { Author } from "../../models/Author.js";
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

export const authorController = {
  async getAuthors(_req: Request, res: Response) {
    const authors = await Author.find().sort({ name: 1 });
    ok(res, { authors });
  },

  async getAuthorById(req: Request, res: Response) {
    const { id } = req.params;
    const author = (await Author.findById(id)) || (await Author.findOne({ slug: id }));
    if (!author) throw HttpError.notFound("Author not found");
    ok(res, { author });
  },

  async createAuthor(req: Request, res: Response) {
    const { name, slug, biography, profileImage, website, socialLinks } = req.body;
    if (!name) throw HttpError.badRequest("Author name is required");

    let finalSlug = slug ? slugify(slug) : slugify(name);
    const existing = await Author.findOne({ slug: finalSlug });
    if (existing) finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;

    const author = await Author.create({
      name,
      slug: finalSlug,
      biography,
      profileImage,
      website,
      socialLinks: socialLinks || {},
    });

    ok(res, { author }, "Author created", 201);
  },

  async updateAuthor(req: Request, res: Response) {
    const { id } = req.params;
    const { name, slug, biography, profileImage, website, socialLinks } = req.body;

    const author = await Author.findById(id);
    if (!author) throw HttpError.notFound("Author not found");

    if (name) author.name = name;
    if (slug) author.slug = slugify(slug);
    if (biography !== undefined) author.biography = biography;
    if (profileImage !== undefined) author.profileImage = profileImage;
    if (website !== undefined) author.website = website;
    if (socialLinks !== undefined) author.socialLinks = { ...author.socialLinks, ...socialLinks };

    await author.save();
    ok(res, { author }, "Author updated");
  },

  async deleteAuthor(req: Request, res: Response) {
    const { id } = req.params;
    await Author.findByIdAndDelete(id);
    ok(res, null, "Author deleted");
  },
};
