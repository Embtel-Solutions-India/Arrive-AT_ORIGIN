import { useEffect } from "react";

const DEFAULT_TITLE = "Dr. Alka Chopra Madan — Metaphysics, the Meta-Human & AAO | Soul Body Healing Center";
const DEFAULT_DESCRIPTION =
  "Dr. Alka Chopra Madan, D.Msc., works with the meta-human — the part of a person that conditioning did not build. Metaphysical counsel, Concept Clearing, AAO (Arrive at Origin) and Living from Origin. Fremont, California and online.";
const DEFAULT_KEYWORDS =
  "Dr. Alka Chopra Madan, metaphysics, meta-human, Arrive at Origin, AAO, Soul Body Healing Center, Concept Clearing, Living from Origin, spiritual counsel Fremont CA, grief counsel";
const DEFAULT_IMAGE = "https://arriveatorigin.com/dr-alka-chopra-madan.png";
const BASE_URL = "https://arriveatorigin.com";

function setMeta(nameOrProperty, value, isProperty = false) {
  if (!value) return;
  const selector = isProperty ? `meta[property="${nameOrProperty}"]` : `meta[name="${nameOrProperty}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    if (isProperty) {
      el.setAttribute("property", nameOrProperty);
    } else {
      el.setAttribute("name", nameOrProperty);
    }
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function setCanonical(url) {
  if (!url) return;
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

function setJsonLd(id, data) {
  let script = document.getElementById(id);
  if (!data) {
    if (script) script.remove();
    return;
  }
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

/**
 * Universal SEO & Meta Tags Manager for all pages
 * Updates document title, meta descriptions, focus keywords, canonical tags,
 * Open Graph, Twitter cards, and Schema.org JSON-LD.
 */
export default function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  ogType = "website",
  ogImage = DEFAULT_IMAGE,
  noindex = false,
  jsonLd = null,
}) {
  useEffect(() => {
    // 1. Title
    document.title = title;

    // 2. Standard Meta Tags
    setMeta("title", title);
    setMeta("description", description);
    setMeta("keywords", keywords);
    setMeta(
      "robots",
      noindex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );

    // 3. Canonical Link
    const targetCanonical = canonical || (typeof window !== "undefined" ? window.location.href.split("?")[0] : BASE_URL);
    setCanonical(targetCanonical);

    // 4. Open Graph Tags
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:type", ogType, true);
    setMeta("og:url", targetCanonical, true);
    setMeta("og:image", ogImage, true);
    setMeta("og:site_name", "Dr. Alka Chopra Madan — Arrive at Origin", true);

    // 5. Twitter Card Tags
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    setMeta("twitter:image", ogImage);

    // 6. Structured Data
    if (jsonLd) {
      setJsonLd("page-seo-schema", jsonLd);
    } else {
      setJsonLd("page-seo-schema", null);
    }
  }, [title, description, keywords, canonical, ogType, ogImage, noindex, jsonLd]);

  return null;
}

