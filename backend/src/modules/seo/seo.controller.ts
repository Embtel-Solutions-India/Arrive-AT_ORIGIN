import type { Request, Response } from "express";
import { BlogPost } from "../../models/BlogPost.js";
import { Book } from "../../models/Book.js";
import { Setting } from "../../models/Setting.js";
import { ok } from "../../utils/response.js";
import { env } from "../../config/env.js";

export const seoController = {
  async getSettings(_req: Request, res: Response) {
    const settings = await Setting.find();
    const map: Record<string, unknown> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });

    // Provide sensible defaults if not yet set
    const data = {
      siteTitle: map.siteTitle || "Soul Body Healing Center | Arrive at Origin",
      siteDescription:
        map.siteDescription ||
        "Metaphysics, grief counsel, spiritual direction, and Induced Calmness with Dr. Alka Chopra Madan.",
      canonicalDomain: map.canonicalDomain || env.APP_URL,
      ogImage: map.ogImage || "/dr-alka-chopra-madan.png",
      twitterHandle: map.twitterHandle || "@soulbodyorigin",
      robotsIndex: map.robotsIndex !== false,
      robotsFollow: map.robotsFollow !== false,
      currency: map.currency || "USD",
      contactEmail: map.contactEmail || "contact@soulbodyhealingcenter.com",
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
    const baseUrl = env.APP_URL.replace(/\/$/, "");

    const staticPages = [
      { loc: `${baseUrl}/`, priority: "1.0", changefreq: "weekly" },
      { loc: `${baseUrl}/blog`, priority: "0.9", changefreq: "daily" },
      { loc: `${baseUrl}/books`, priority: "0.9", changefreq: "weekly" },
      { loc: `${baseUrl}/about`, priority: "0.8", changefreq: "monthly" },
      { loc: `${baseUrl}/schedule`, priority: "0.8", changefreq: "monthly" },
    ];

    const [blogs, books] = await Promise.all([
      BlogPost.find({ status: "PUBLISHED" }).select("slug updatedAt publishDate"),
      Book.find({ status: "PUBLISHED" }).select("slug updatedAt"),
    ]);

    const blogPages = blogs.map((b) => ({
      loc: `${baseUrl}/blog/${b.slug}`,
      lastmod: (b.updatedAt || b.publishDate || new Date()).toISOString().split("T")[0],
      priority: "0.8",
      changefreq: "weekly",
    }));

    const bookPages = books.map((bk) => ({
      loc: `${baseUrl}/books/${bk.slug}`,
      lastmod: (bk.updatedAt || new Date()).toISOString().split("T")[0],
      priority: "0.8",
      changefreq: "weekly",
    }));

    const allPages = [...staticPages, ...blogPages, ...bookPages];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (p) => `  <url>
    <loc>${p.loc}</loc>
    ${(p as any).lastmod ? `<lastmod>${(p as any).lastmod}</lastmod>` : ""}
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
    const baseUrl = env.APP_URL.replace(/\/$/, "");
    const setting = await Setting.findOne({ key: "robotsIndex" });
    const allow = setting ? setting.value !== false : true;

    const content = `User-agent: *
${allow ? "Allow: /" : "Disallow: /"}
Disallow: /admin/
Disallow: /api/

Sitemap: ${baseUrl}/api/sitemap.xml
`;
    res.header("Content-Type", "text/plain");
    res.send(content);
  },
};
