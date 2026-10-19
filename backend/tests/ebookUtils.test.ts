import { describe, it, expect } from "vitest";
import {
  getEbookPdfUrl,
  normalizeBookSlug,
  getEbookDownloadFilename,
  KNOWN_EBOOK_FILES,
} from "../../frontend/src/utils/ebookUtils.js";

describe("E-Book Shared URL & Download Helper (ebookUtils)", () => {
  describe("normalizeBookSlug", () => {
    it("strips directory paths and .pdf extension", () => {
      expect(normalizeBookSlug("/uploads/ebooks/arrive-at-origin-part-two.pdf")).toBe("arrive-at-origin-part-two");
      expect(normalizeBookSlug("/ebooks/arrive-at-origin-part-two.pdf")).toBe("arrive-at-origin-part-two");
      expect(normalizeBookSlug("arrive-at-origin-part-two.pdf")).toBe("arrive-at-origin-part-two");
    });

    it("converts title to clean kebab-case", () => {
      expect(normalizeBookSlug("Arrive at Origin - Part Two")).toBe("arrive-at-origin-part-two");
      expect(normalizeBookSlug("Keeping It Simple")).toBe("keeping-it-simple");
    });
  });

  describe("getEbookPdfUrl", () => {
    it("converts legacy /uploads/ebooks/ to /ebooks/", () => {
      const url = getEbookPdfUrl("/uploads/ebooks/arrive-at-origin-part-two.pdf");
      expect(url).toBe("/ebooks/arrive-at-origin-part-two.pdf");
    });

    it("preserves correct /ebooks/ URLs", () => {
      const url = getEbookPdfUrl("/ebooks/arrive-at-origin-part-two.pdf");
      expect(url).toBe("/ebooks/arrive-at-origin-part-two.pdf");
    });

    it("normalizes full URLs containing /uploads/ebooks/", () => {
      const url = getEbookPdfUrl("https://arriveatorigin.com/uploads/ebooks/keeping-it-simple.pdf");
      expect(url).toBe("/ebooks/keeping-it-simple.pdf");
    });

    it("uses fallbackSlug when pdfUrl is missing or empty", () => {
      expect(getEbookPdfUrl("", "arrive-at-origin-part-two")).toBe("/ebooks/arrive-at-origin-part-two.pdf");
      expect(getEbookPdfUrl(null, "your-path-to-transformation")).toBe("/ebooks/your-path-to-transformation.pdf");
      expect(getEbookPdfUrl(undefined, "Life Force Lost and Found")).toBe("/ebooks/life-force-lost-and-found.pdf");
    });

    it("resolves all 8 known publications correctly", () => {
      for (const [slug, filename] of Object.entries(KNOWN_EBOOK_FILES)) {
        expect(getEbookPdfUrl(null, slug)).toBe(`/ebooks/${filename}`);
        expect(getEbookPdfUrl(`/uploads/ebooks/${filename}`)).toBe(`/ebooks/${filename}`);
      }
    });
  });

  describe("getEbookDownloadFilename", () => {
    it("generates clean download filename with .pdf extension", () => {
      expect(getEbookDownloadFilename("arrive-at-origin-part-two")).toBe("arrive-at-origin-part-two.pdf");
      expect(getEbookDownloadFilename("/uploads/ebooks/arrive-at-origin-part-two.pdf")).toBe("arrive-at-origin-part-two.pdf");
      expect(getEbookDownloadFilename("Arrive At Origin Part Two")).toBe("arrive-at-origin-part-two.pdf");
    });
  });
});
