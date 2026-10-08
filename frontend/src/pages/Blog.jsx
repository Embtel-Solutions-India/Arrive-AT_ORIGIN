import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import { blogPosts as fallbackPosts, formatPostDate } from "../data/blogPosts";
import { apiUrl } from "../utils/api";

const shell = "mx-auto w-full max-w-[1240px] px-[clamp(20px,5vw,64px)]";
const heading = "font-display font-light leading-[1.02] tracking-[-0.015em]";

function Blog() {
  const [posts, setPosts] = useState(fallbackPosts);
  const [categories, setCategories] = useState(["All"]);
  const [selectedCat, setSelectedCat] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Fetch dynamic published posts from MongoDB API
    fetch(apiUrl(`/public/blogs${selectedCat !== "All" ? `?category=${encodeURIComponent(selectedCat)}` : ""}`))
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.blogs?.length > 0) {
          setPosts(json.data.blogs);
          // Collect distinct categories
          const cats = new Set(["All"]);
          json.data.blogs.forEach((b) => {
            if (b.categoryName) cats.add(b.categoryName);
          });
          setCategories(Array.from(cats));
        }
      })
      .catch(() => {
        // Fallback to static posts
      })
      .finally(() => setLoading(false));
  }, [selectedCat]);

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.excerpt && p.excerpt.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="min-h-svh bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.62] selection:bg-gold selection:text-void">
      <ScrollProgress />
      <SiteNav />
      <main className="py-[clamp(56px,8vw,110px)]">
        <div className={shell}>
          <div className="mb-[clamp(36px,5vw,64px)] flex flex-wrap items-end justify-between gap-6 border-b border-[rgba(237,231,218,0.12)] pb-8">
            <div>
              <h1 className={`${heading} mb-[0.3em] text-[clamp(2.4rem,6vw,4.6rem)]`}>Publications & Notes</h1>
              <p className="max-w-[56ch] text-[#C6CBD8]">
                Inquiries on metaphysics, grief, relationship and the practice of arriving at origin.
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full max-w-sm">
              <input
                type="text"
                placeholder="Search articles & themes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-[rgba(237,231,218,0.2)] bg-white/5 px-4 py-2.5 text-sm text-vellum placeholder:text-dim focus:border-halo focus:outline-none"
              />
            </div>
          </div>

          {/* Categories Filter Tabs */}
          {categories.length > 1 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wider transition-all uppercase ${
                    selectedCat === cat
                      ? "bg-halo text-void"
                      : "border border-[rgba(237,231,218,0.15)] text-dim hover:border-vellum hover:text-vellum"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Posts Grid */}
          <div className="grid grid-cols-1 gap-[clamp(20px,3vw,32px)] md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Link
                key={post.slug || post._id}
                to={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-[rgba(237,231,218,0.14)] bg-[rgba(237,231,218,0.03)] p-[clamp(24px,3vw,36px)] no-underline transition-all duration-300 hover:-translate-y-1 hover:border-halo hover:bg-[rgba(237,231,218,0.06)]"
              >
                {post.featuredImage && (
                  <div className="mb-4 overflow-hidden rounded-xl aspect-[16/10] bg-black/40">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="mb-3 flex items-center justify-between text-[0.8rem] tracking-[0.06em] text-dim">
                  <span>{post.categoryName || "Essay"}</span>
                  <span>{post.readTime || "5 min read"}</span>
                </div>
                <h2 className={`${heading} mb-3 text-[clamp(1.35rem,2.1vw,1.75rem)] font-normal text-vellum group-hover:text-halo transition-colors`}>
                  {post.title}
                </h2>
                <p className="mb-6 flex-1 text-[0.92rem] text-[#A9B0C2] leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between border-t border-[rgba(237,231,218,0.08)] pt-4 text-xs">
                  <span className="text-dim">
                    {post.publishDate
                      ? new Date(post.publishDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "Recently published"}
                  </span>
                  <span className="font-semibold text-halo group-hover:translate-x-0.5 transition-transform">
                    Read article →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {filteredPosts.length === 0 && !loading && (
            <div className="py-24 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-halo text-2xl">
                ✦
              </div>
              <h3 className="font-display text-2xl text-vellum mb-2">Publications & Articles Coming Soon</h3>
              <p className="max-w-[50ch] mx-auto text-sm text-[#A9B0C2]">
                Official writings, metaphysical essays, and concept clearing commentaries by Dr. Alka Chopra Madan will be published here soon.
              </p>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default Blog;
