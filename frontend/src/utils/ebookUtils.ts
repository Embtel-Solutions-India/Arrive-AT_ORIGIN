/**
 * Shared utility for E-Book PDF URL generation, sanitization, and reading/download handling.
 * Ensures consistent `/ebooks/<slug>.pdf` URL generation across all frontend pages
 * (AccountPortal, OrderSuccess, CartContext, BookCatalog, Admin) and normalizes any legacy
 * `/uploads/ebooks/` paths so that neither "Read Online" nor "Download PDF" ever fail or return SPA HTML.
 */

export const KNOWN_EBOOK_FILES: Record<string, string> = {
  "arrive-at-origin-part-one": "arrive-at-origin-part-one.pdf",
  "arrive-at-origin-part-two": "arrive-at-origin-part-two.pdf",
  "keeping-it-simple": "keeping-it-simple.pdf",
  "life-force-lost-and-found": "life-force-lost-and-found.pdf",
  "the-process-of-healing": "the-process-of-healing.pdf",
  "your-path-to-healing": "your-path-to-healing.pdf",
  "your-path-to-spirituality": "your-path-to-spirituality.pdf",
  "your-path-to-transformation": "your-path-to-transformation.pdf",
};

/**
 * Normalizes any string (title, slug, or filename) to a clean kebab-case slug.
 *
 * @example
 * normalizeBookSlug("arrive-at-origin-part-two.pdf") // "arrive-at-origin-part-two"
 * normalizeBookSlug("/uploads/ebooks/arrive-at-origin-part-two.pdf") // "arrive-at-origin-part-two"
 * normalizeBookSlug("Arrive at Origin - Part Two") // "arrive-at-origin-part-two"
 */
export function normalizeBookSlug(slugOrTitle?: string | null): string {
  if (!slugOrTitle || typeof slugOrTitle !== "string") return "";
  let clean = slugOrTitle.trim().toLowerCase();

  // Strip query strings and hash
  clean = clean.split("?")[0].split("#")[0];

  // Strip URL paths / directory prefixes
  clean = clean.replace(/^.*[/\\]/, "");

  // Strip .pdf extension
  clean = clean.replace(/\.pdf$/i, "");

  // Clean characters to kebab-case
  clean = clean.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  return clean;
}

/**
 * Resolves the clean public PDF URL for a given book or path.
 * Always returns a path with the expected `/ebooks/<filename>.pdf` prefix,
 * converting any legacy `/uploads/ebooks/` URLs or bare filenames/slugs.
 *
 * @example
 * getEbookPdfUrl("/uploads/ebooks/arrive-at-origin-part-two.pdf")
 * // => "/ebooks/arrive-at-origin-part-two.pdf"
 *
 * getEbookPdfUrl(null, "arrive-at-origin-part-two")
 * // => "/ebooks/arrive-at-origin-part-two.pdf"
 *
 * getEbookPdfUrl("https://arriveatorigin.com/uploads/ebooks/keeping-it-simple.pdf")
 * // => "/ebooks/keeping-it-simple.pdf"
 */
export function getEbookPdfUrl(
  pdfUrlOrSlug?: string | null,
  fallbackSlug?: string | null
): string {
  const raw = (pdfUrlOrSlug || "").trim();
  const rawFallback = (fallbackSlug || "").trim();

  // If a full or relative URL is provided that contains /uploads/ebooks/
  if (raw) {
    // If it's an authed API route, keep it unless we want direct static access
    if (raw.startsWith("/api/public/books/") && (raw.includes("/read-pdf") || raw.includes("/download-pdf"))) {
      // If caller explicitly passed an API endpoint, verify if fallbackSlug or path has slug
      const slugMatch = raw.match(/\/api\/public\/books\/([^/?]+)/);
      if (slugMatch && slugMatch[1] && KNOWN_EBOOK_FILES[slugMatch[1]]) {
        return `/ebooks/${KNOWN_EBOOK_FILES[slugMatch[1]]}`;
      }
    }

    // Replace /uploads/ebooks/ or uploads/ebooks/ with /ebooks/
    if (raw.includes("uploads/ebooks/")) {
      const filename = raw.replace(/^.*uploads\/ebooks\//i, "").split("?")[0].split("#")[0];
      if (filename) {
        return `/ebooks/${filename}`;
      }
    }

    // If it already starts with /ebooks/
    if (raw.startsWith("/ebooks/")) {
      const filename = raw.slice("/ebooks/".length).split("?")[0].split("#")[0];
      return `/ebooks/${filename}`;
    }

    // If it's a direct .pdf filename without directories
    if (raw.toLowerCase().endsWith(".pdf") && !raw.includes("/") && !raw.includes("\\")) {
      return `/ebooks/${raw}`;
    }

    // If it's a bare slug
    const normalized = normalizeBookSlug(raw);
    if (normalized) {
      const mapped = KNOWN_EBOOK_FILES[normalized];
      return mapped ? `/ebooks/${mapped}` : `/ebooks/${normalized}.pdf`;
    }
  }

  // Fallback to fallbackSlug if provided
  if (rawFallback) {
    const normalizedFallback = normalizeBookSlug(rawFallback);
    if (normalizedFallback) {
      const mapped = KNOWN_EBOOK_FILES[normalizedFallback];
      return mapped ? `/ebooks/${mapped}` : `/ebooks/${normalizedFallback}.pdf`;
    }
  }

  return "";
}

/**
 * Returns a sanitized filename suitable for the HTML5 download attribute.
 *
 * @example
 * getEbookDownloadFilename("arrive-at-origin-part-two")
 * // => "arrive-at-origin-part-two.pdf"
 */
export function getEbookDownloadFilename(slugOrTitle?: string | null): string {
  const clean = normalizeBookSlug(slugOrTitle);
  return clean ? `${clean}.pdf` : "ebook.pdf";
}

/**
 * Programmatic helper to trigger a clean PDF download in the browser.
 * Uses a blob fetch with fallback to anchor click to ensure reliable downloading
 * across all browsers without opening HTML error pages.
 */
export async function downloadEbookPdf(pdfUrlOrSlug: string, fallbackName?: string): Promise<void> {
  const targetUrl = getEbookPdfUrl(pdfUrlOrSlug, fallbackName);
  if (!targetUrl) return;

  const downloadFilename = getEbookDownloadFilename(fallbackName || targetUrl);

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    // Safety check: ensure response is not HTML (e.g. from 404 fallback)
    if (blob.type.includes("text/html")) {
      throw new Error("Received HTML instead of PDF document");
    }

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = downloadFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
  } catch (err) {
    // Fallback: direct standard navigation download
    const link = document.createElement("a");
    link.href = targetUrl;
    link.download = downloadFilename;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
