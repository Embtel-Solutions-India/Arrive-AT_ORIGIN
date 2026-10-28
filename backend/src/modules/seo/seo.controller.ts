import type { Request, Response } from "express";
import { BlogPost } from "../../models/BlogPost.js";
import { Book } from "../../models/Book.js";
import { Setting } from "../../models/Setting.js";
import { ok } from "../../utils/response.js";
import { env } from "../../config/env.js";

const DEFAULT_BOOK_SLUGS = [
  "arrive-at-origin-part-one",
  "arrive-at-origin-part-two",
  "keeping-it-simple",
  "your-path-to-peace",
  "life-force-lost-and-found",
  "your-path-to-transformation",
  "your-path-to-spirituality",
  "your-path-to-healing",
];

async function getEffectiveBaseUrl(): Promise<string> {
  try {
    const setting = await Setting.findOne({ key: "canonicalDomain" } as any);
    if (setting?.value && typeof setting.value === "string" && setting.value.startsWith("http")) {
      return setting.value.replace(/\/$/, "");
    }
  } catch {
    // Ignore and fallback
  }

  if (env.APP_URL && !env.APP_URL.includes("localhost") && !env.APP_URL.includes("127.0.0.1")) {
    return env.APP_URL.replace(/\/$/, "");
  }

  return "https://arriveatorigin.com";
}

export const seoController = {
  async getSettings(_req: Request, res: Response) {
    const settings = await Setting.find();
    const map: Record<string, unknown> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });

    const canonicalDomain = (map.canonicalDomain as string) || (await getEffectiveBaseUrl());

    // Provide sensible defaults if not yet set
    const data = {
      siteTitle:
        map.siteTitle ||
        "Dr. Alka Chopra Madan — Metaphysics, the Meta-Human & AAO | Soul Body Healing Center",
      siteDescription:
        map.siteDescription ||
        "Dr. Alka Chopra Madan, D.Msc., works with the meta-human — the part of a person that conditioning did not build. Metaphysical counsel, Concept Clearing, AAO and Living from Origin.",
      canonicalDomain,
      ogImage: map.ogImage || "/dr-alka-chopra-madan.png",
      twitterHandle: map.twitterHandle || "@soulbodyorigin",
      robotsIndex: map.robotsIndex !== false,
      robotsFollow: map.robotsFollow !== false,
      currency: map.currency || "USD",
      contactEmail: map.contactEmail || "info@arriveatorigin.com",
      contactPhone: map.contactPhone || "+1 (555) 019-2834",
    };

    ok(res, { settings: data });
  },

  async updateSettings(req: Request, res: Response) {
    const updates = req.body as Record<string, unknown>;
    for (const [key, value] of Object.entries(updates)) {
      await Setting.findOneAndUpdate(
        { key },
        { key, value, group: key.startsWith("site") || key.startsWith("robots") ? "seo" : "general" },
        { upsert: true, new: true }
      );
    }
    ok(res, null, "Settings updated successfully");
  },

  async getSitemapXml(_req: Request, res: Response) {
    const baseUrl = await getEffectiveBaseUrl();
    const today = new Date().toISOString().split("T")[0];

    const staticPages = [
      { loc: `${baseUrl}/`, priority: "1.0", changefreq: "weekly", lastmod: today },
      { loc: `${baseUrl}/about`, priority: "0.8", changefreq: "monthly", lastmod: today },
      { loc: `${baseUrl}/schedule`, priority: "0.9", changefreq: "weekly", lastmod: today },
      { loc: `${baseUrl}/books`, priority: "0.9", changefreq: "weekly", lastmod: today },
      { loc: `${baseUrl}/blog`, priority: "0.8", changefreq: "daily", lastmod: today },
      { loc: `${baseUrl}/dr-alka-chopra-madan-meta-human.html`, priority: "0.7", changefreq: "monthly", lastmod: today },
    ];

    let blogPages: Array<{ loc: string; lastmod: string; priority: string; changefreq: string }> = [];
    let bookPages: Array<{ loc: string; lastmod: string; priority: string; changefreq: string }> = [];

    try {
      const [blogs, books] = await Promise.all([
        BlogPost.find({ status: "PUBLISHED" }).select("slug updatedAt publishDate"),
        Book.find({ status: "PUBLISHED" }).select("slug updatedAt"),
      ]);

      blogPages = blogs.map((b) => ({
        loc: `${baseUrl}/blog/${b.slug}`,
        lastmod: (b.updatedAt || b.publishDate || new Date()).toISOString().split("T")[0],
        priority: "0.8",
        changefreq: "weekly",
      }));

      const seenBookSlugs = new Set<string>();
      books.forEach((bk) => {
        if (bk.slug) {
          seenBookSlugs.add(bk.slug);
          bookPages.push({
            loc: `${baseUrl}/books/${bk.slug}`,
            lastmod: (bk.updatedAt || new Date()).toISOString().split("T")[0],
            priority: "0.8",
            changefreq: "monthly",
          });
        }
      });

      // Include any standard publication slugs not yet in the DB
      DEFAULT_BOOK_SLUGS.forEach((slug) => {
        if (!seenBookSlugs.has(slug)) {
          bookPages.push({
            loc: `${baseUrl}/books/${slug}`,
            lastmod: today,
            priority: "0.8",
            changefreq: "monthly",
          });
        }
      });
    } catch {
      // Fallback default books if DB query fails
      bookPages = DEFAULT_BOOK_SLUGS.map((slug) => ({
        loc: `${baseUrl}/books/${slug}`,
        lastmod: today,
        priority: "0.8",
        changefreq: "monthly",
      }));
    }

    const allPages = [...staticPages, ...blogPages, ...bookPages];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (p) => `  <url>
    <loc>${p.loc}</loc>
    ${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ""}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  },

  async getRobotsTxt(_req: Request, res: Response) {
    const baseUrl = await getEffectiveBaseUrl();
    let allow = true;
    try {
      const setting = await Setting.findOne({ key: "robotsIndex" } as any);
      allow = setting ? setting.value !== false : true;
    } catch {
      allow = true;
    }

    const content = `# robots.txt for ${baseUrl}
User-agent: *
${allow ? "Allow: /" : "Disallow: /"}
Allow: /about
Allow: /schedule
Allow: /books
Allow: /books/*
Allow: /blog
Allow: /blog/*

# Administrative & private client routes
Disallow: /admin/
Disallow: /account
Disallow: /client-portal
Disallow: /my-account
Disallow: /portal
Disallow: /checkout
Disallow: /order-success/
Disallow: /reset-password
Disallow: /api/

# Canonical Sitemap
Sitemap: ${baseUrl}/sitemap.xml
`;
    res.header("Content-Type", "text/plain");
    res.send(content);
  },
};
