import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import NotFound from "./NotFound";
import { blogPosts as fallbackPosts, formatPostDate } from "../data/blogPosts";

const shell = "mx-auto w-full max-w-[800px] px-[clamp(20px,5vw,64px)]";
const heading = "font-display font-light leading-[1.08] tracking-[-0.015em]";

function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);

    fetch(`/api/public/blogs/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.blog) {
          setPost(json.data.blog);
          setRelated(json.data.related || []);
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

  return (
    <div className="min-h-svh bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.75] selection:bg-gold selection:text-void">
      <ScrollProgress />
      <SiteNav />
      <main className="py-[clamp(56px,8vw,110px)]">
        <article className={shell}>
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-dim">
            <Link to="/" className="text-dim hover:text-vellum">Home</Link>
            <span>/</span>
            <Link to="/blog" className="text-dim hover:text-vellum">Blog</Link>
            <span>/</span>
            <span className="text-halo truncate max-w-[200px]">{post.categoryName || "Essay"}</span>
          </nav>

          <div className="mb-4 flex flex-wrap items-center gap-3 text-xs tracking-wider uppercase text-dim">
            <span className="rounded bg-halo/10 px-2.5 py-1 font-semibold text-halo">
              {post.categoryName || "Metaphysics"}
            </span>
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

          <h1 className={`${heading} mb-6 text-[clamp(2.2rem,5vw,3.8rem)] text-vellum`}>
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mb-8 font-light text-[clamp(1.1rem,1.4vw,1.3rem)] text-[#A9B0C2] leading-relaxed italic border-l-2 border-halo/40 pl-4">
              {post.excerpt}
            </p>
          )}

          {post.featuredImage && (
            <div className="mb-10 overflow-hidden rounded-2xl border border-[rgba(237,231,218,0.12)]">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full max-h-[460px] object-cover"
              />
            </div>
          )}

          {/* Article Body */}
          <div
            className="prose prose-invert max-w-none space-y-6 text-[#D7D9E0] text-[1.05rem] leading-[1.8] [&_h2]:font-display [&_h2]:text-[1.8rem] [&_h2]:font-light [&_h2]:text-vellum [&_h2]:mt-10 [&_h2]:mb-4 [&_h3]:font-display [&_h3]:text-[1.4rem] [&_h3]:text-vellum [&_blockquote]:border-l-2 [&_blockquote]:border-gold [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-[#E0C9A6] [&_blockquote]:my-8 [&_a]:text-halo [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_hr]:border-[rgba(237,231,218,0.15)] [&_hr]:my-10"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-[rgba(237,231,218,0.1)] pt-6">
              <span className="text-xs text-dim uppercase tracking-wider mr-2">Tags:</span>
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-[rgba(237,231,218,0.15)] bg-white/[0.03] px-3 py-1 text-xs text-[#A9B0C2]"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Author Box & Share */}
          <div className="mt-10 rounded-2xl border border-[rgba(237,231,218,0.14)] bg-[rgba(237,231,218,0.03)] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src="/dr-alka-chopra-madan.png"
                alt="Dr. Alka Chopra Madan"
                className="h-16 w-16 rounded-full object-cover border border-halo/40"
              />
              <div>
                <h4 className="font-display text-lg text-vellum">Dr. Alka Chopra Madan</h4>
                <p className="text-xs text-dim">Author & Metaphysical Counselor · Arrive at Origin</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(237,231,218,0.25)] bg-white/5 px-4 py-2 text-xs font-semibold text-vellum hover:border-halo hover:bg-white/10 transition-colors"
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
                    className="group rounded-xl border border-[rgba(237,231,218,0.1)] bg-white/[0.02] p-4 transition-all hover:border-halo hover:-translate-y-0.5"
                  >
                    <h4 className="font-medium text-sm text-vellum group-hover:text-halo line-clamp-2">
                      {rel.title}
                    </h4>
                    <p className="text-xs text-[#A9B0C2] line-clamp-2 mt-2">{rel.excerpt}</p>
                    <span className="text-[0.75rem] font-semibold text-halo mt-3 block">Read more →</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

export default BlogPost;
