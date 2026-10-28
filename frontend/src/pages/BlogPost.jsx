import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import BlogSidebar from "../components/blog/BlogSidebar";
import NotFound from "./NotFound";
import SEO from "../components/seo/SEO";
import { blogPosts as fallbackPosts } from "../data/blogPosts";
import { apiUrl } from "../utils/api";

const shell = "mx-auto w-full max-w-[1360px] px-[clamp(20px,4vw,64px)]";
const heading = "font-display font-light leading-[1.08] tracking-[-0.015em]";

function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [sidebarData, setSidebarData] = useState({
    recentPosts: [],
    categories: [],
    tags: [],
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setLoading(true);

    fetch(apiUrl(`/public/blogs/${slug}`))
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.blog) {
          setPost(json.data.blog);
          setRelated(json.data.related || []);
          setSidebarData({
            recentPosts: json.data.recentPosts || [],
            categories: json.data.categories || [],
            tags: json.data.tags || [],
          });
        } else {
          // Check static fallback
          const fb = fallbackPosts.find((p) => p.slug === slug);
          if (fb) {
            setPost({
              ...fb,
              authorName: "Dr. Alka Chopra Madan",
              categoryName: "Metaphysics",
              publishDate: fb.date,
              content: fb.body.map((p) => `<p class="mb-4">${p}</p>`).join(""),
            });
          } else {
            setPost(null);
          }
        }
      })
      .catch(() => {
        const fb = fallbackPosts.find((p) => p.slug === slug);
        if (fb) {
          setPost({
            ...fb,
            authorName: "Dr. Alka Chopra Madan",
            categoryName: "Metaphysics",
            publishDate: fb.date,
            content: fb.body.map((p) => `<p class="mb-4">${p}</p>`).join(""),
          });
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-svh bg-void text-vellum grid place-items-center">
        <p className="text-dim">Loading essay…</p>
      </div>
    );
  }

  if (!post) return <NotFound />;

  const postTitle = post.seo?.seoTitle || `${post.title} | Dr. Alka Chopra Madan`;
  const postDesc =
    post.seo?.metaDescription ||
    post.excerpt ||
    (post.content ? post.content.replace(/<[^>]+>/g, "").slice(0, 160) : "") ||
    "An inquiry by Dr. Alka Chopra Madan.";
  const postKeywords =
    post.seo?.focusKeyword ||
    (Array.isArray(post.tags) && post.tags.length > 0
      ? post.tags.join(", ")
      : "metaphysics, Dr Alka Chopra Madan, Arrive at Origin, spiritual inquiry");
  const postOgImage =
    post.seo?.ogImage || post.featuredImage || "https://arriveatorigin.com/dr-alka-chopra-madan.png";
  const postCanonical = post.seo?.canonicalUrl || `https://arriveatorigin.com/blog/${slug}`;
  const postNoIndex = Boolean(post.seo?.noIndex);

  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: postDesc,
    image: postOgImage,
    url: postCanonical,
    datePublished: post.publishDate || post.createdAt,
    dateModified: post.updatedAt || post.publishDate || post.createdAt,
    author: {
      "@type": "Person",
      "name": post.authorName || "Dr. Alka Chopra Madan, D.Msc.",
      "url": "https://arriveatorigin.com/about"
    },
    publisher: {
      "@type": "Organization",
      "name": "Soul Body Healing Center",
      "url": "https://arriveatorigin.com"
    }
  };

  return (
    <div className="min-h-svh bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.75] selection:bg-gold selection:text-void">
      <SEO
        title={postTitle}
        description={postDesc}
        keywords={postKeywords}
        canonical={postCanonical}
        ogType="article"
        ogImage={postOgImage}
        noindex={postNoIndex}
        jsonLd={blogSchema}
      />
      <ScrollProgress />
      <SiteNav />

      <main className="py-[clamp(48px,6vw,96px)]">
        <div className={shell}>
          {/* ─── 2-Column Layout: Article Body | Right-Side Sidebar ─── */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10 xl:gap-14">
            {/* ─── Main Article Column ─── */}
            <article className="lg:col-span-8 min-w-0">
              {/* Breadcrumbs */}
              <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-dim">
                <Link to="/" className="text-dim hover:text-vellum">Home</Link>
                <span>/</span>
                <Link to="/blog" className="text-dim hover:text-vellum">Blog</Link>
                <span>/</span>
                <span className="text-halo truncate max-w-[180px] xs:max-w-[260px] sm:max-w-none">{post.categoryName || "Essay"}</span>
              </nav>

              <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3 text-xs tracking-wider uppercase text-dim">
                <Link
                  to={`/blog?category=${encodeURIComponent(post.categoryName || "Metaphysics")}`}
                  className="rounded bg-halo/10 px-2.5 py-1 font-semibold text-halo hover:bg-halo/20 transition-colors no-underline"
                >
                  {post.categoryName || "Metaphysics"}
                </Link>
                <span>·</span>
                <span>
                  {post.publishDate
                    ? new Date(post.publishDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Published"}
                </span>
                <span>·</span>
                <span>{post.readTime || "5 min read"}</span>
              </div>

              <h1 className={`${heading} mb-6 text-[clamp(2.2rem,4.5vw,3.6rem)] text-vellum`}>
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="mb-8 font-light text-[clamp(1.05rem,1.3vw,1.25rem)] text-[#A9B0C2] leading-relaxed italic border-l-2 border-halo/40 pl-4">
                  {post.excerpt}
                </p>
              )}

              {post.featuredImage && (
                <div className="mb-10 overflow-hidden rounded-2xl border border-[rgba(237,231,218,0.12)] bg-black/40">
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full max-h-[480px] object-cover"
                  />
                </div>
              )}

              {/* Article Body - Preserves full rich HTML, inline styling, images, alignment, tables */}
              <div
                className="blog-rich-content prose prose-invert max-w-none space-y-6 text-[#D7D9E0] text-[1.05rem] leading-[1.8] [&_blockquote]:border-l-2 [&_blockquote]:border-gold [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-[#E0C9A6] [&_blockquote]:my-8 [&_a]:text-halo [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_hr]:border-[rgba(237,231,218,0.15)] [&_hr]:my-10 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl [&_img]:my-6 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-white/20 [&_th]:p-3 [&_td]:border [&_td]:border-white/10 [&_td]:p-3"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {post.tags?.length > 0 && (
                <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-[rgba(237,231,218,0.1)] pt-6">
                  <span className="text-xs text-dim uppercase tracking-wider mr-2 font-mono">Tags:</span>
                  {post.tags.map((t) => (
                    <Link
                      key={t}
                      to={`/blog?tag=${encodeURIComponent(t)}`}
                      className="rounded-full border border-[rgba(237,231,218,0.15)] bg-white/[0.03] px-3 py-1 text-xs text-[#A9B0C2] hover:border-halo hover:text-halo transition-colors no-underline"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              )}

              {/* Author Box & Share */}
              <div className="mt-10 rounded-2xl border border-[rgba(237,231,218,0.14)] bg-[rgba(237,231,218,0.03)] p-4.5 xs:p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 backdrop-blur-md">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <img
                    src="/dr-alka-chopra-madan.png"
                    alt="Dr. Alka Chopra Madan"
                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover border border-halo/40 shrink-0"
                  />
                  <div>
                    <h4 className="font-display text-base sm:text-lg text-vellum">Dr. Alka Chopra Madan</h4>
                    <p className="text-xs text-dim">Author & Metaphysical Counselor · Arrive at Origin</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full sm:w-auto justify-center inline-flex items-center gap-2 rounded-full border border-[rgba(237,231,218,0.25)] bg-white/5 px-4 py-2 text-xs font-semibold text-vellum hover:border-halo hover:bg-white/10 transition-colors cursor-pointer text-center"
                >
                  {copied ? "✓ Link Copied!" : "🔗 Share Article"}
                </button>
              </div>

              {/* Related Articles */}
              {related.length > 0 && (
                <div className="mt-16 border-t border-[rgba(237,231,218,0.12)] pt-12">
                  <h3 className={`${heading} mb-6 text-2xl text-vellum`}>Related Readings</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {related.map((rel) => (
                      <Link
                        key={rel.slug}
                        to={`/blog/${rel.slug}`}
                        className="group rounded-xl border border-[rgba(237,231,218,0.1)] bg-white/[0.02] p-4 transition-all hover:border-halo hover:-translate-y-0.5 no-underline flex flex-col"
                      >
                        {rel.featuredImage && (
                          <div className="mb-3 aspect-[16/10] overflow-hidden rounded-lg bg-black/40">
                            <img
                              src={rel.featuredImage}
                              alt={rel.title}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <h4 className="font-medium text-sm text-vellum group-hover:text-halo line-clamp-2">
                          {rel.title}
                        </h4>
                        <p className="text-xs text-[#A9B0C2] line-clamp-2 mt-1.5 flex-1">{rel.excerpt}</p>
                        <span className="text-[0.75rem] font-semibold text-halo mt-3 block">Read more →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* ─── Right-Side Sidebar Column ─── */}
            <div className="lg:col-span-4">
              <div className="sticky top-28">
                <BlogSidebar
                  categories={sidebarData.categories}
                  tags={sidebarData.tags}
                  recentPosts={sidebarData.recentPosts}
                  isArticlePage={true}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default BlogPost;
