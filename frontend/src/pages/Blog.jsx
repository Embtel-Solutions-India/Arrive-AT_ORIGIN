import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import BlogSidebar from "../components/blog/BlogSidebar";
import { blogPosts as fallbackPosts } from "../data/blogPosts";
import { apiUrl } from "../utils/api";

const shell = "mx-auto w-full max-w-[1360px] px-[clamp(20px,4vw,64px)]";
const heading = "font-display font-light leading-[1.04] tracking-[-0.015em]";

function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial filter values from URL search params if present
  const initialCategory = searchParams.get("category") || "All";
  const initialTag = searchParams.get("tag") || null;
  const initialSearch = searchParams.get("search") || "";

  const [posts, setPosts] = useState(fallbackPosts);
  const [recentPosts, setRecentPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedCat, setSelectedCat] = useState(initialCategory);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Sync state when URL params change
  useEffect(() => {
    const urlCat = searchParams.get("category") || "All";
    const urlTag = searchParams.get("tag") || null;
    const urlSearch = searchParams.get("search") || "";
    setSelectedCat(urlCat);
    setSelectedTag(urlTag);
    setSearch(urlSearch);
  }, [searchParams]);

  // Update URL params when user modifies filters
  const updateUrlFilters = (newCat, newTag, newSearch) => {
    const params = new URLSearchParams();
    if (newCat && newCat !== "All") params.set("category", newCat);
    if (newTag) params.set("tag", newTag);
    if (newSearch && newSearch.trim()) params.set("search", newSearch.trim());
    setSearchParams(params, { replace: true });
  };

  const handleSelectCategory = (cat) => {
    setSelectedCat(cat);
    updateUrlFilters(cat, selectedTag, search);
  };

  const handleSelectTag = (tag) => {
    setSelectedTag(tag);
    updateUrlFilters(selectedCat, tag, search);
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    updateUrlFilters(selectedCat, selectedTag, val);
  };

  const clearAllFilters = () => {
    setSelectedCat("All");
    setSelectedTag(null);
    setSearch("");
    setSearchParams({}, { replace: true });
  };

  // Fetch dynamic published posts from backend API
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setLoading(true);

    const queryParams = new URLSearchParams();
    if (selectedCat !== "All") queryParams.set("category", selectedCat);
    if (selectedTag) queryParams.set("tag", selectedTag);
    if (search.trim()) queryParams.set("search", search.trim());
    queryParams.set("page", page.toString());
    queryParams.set("limit", "12");

    fetch(apiUrl(`/public/blogs?${queryParams.toString()}`))
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setPosts(json.data.blogs || []);
          if (json.data.recentPosts?.length > 0) {
            setRecentPosts(json.data.recentPosts);
          }
          if (json.data.categories?.length > 0) {
            setCategories(json.data.categories);
          }
          if (json.data.tags?.length > 0) {
            setTags(json.data.tags);
          }
          if (json.data.pagination) {
            setPagination(json.data.pagination);
          }
        }
      })
      .catch(() => {
        // Fallback to static posts if API fails
      })
      .finally(() => setLoading(false));
  }, [selectedCat, selectedTag, search, page]);

  const hasActiveFilters = selectedCat !== "All" || Boolean(selectedTag) || Boolean(search.trim());

  return (
    <div className="min-h-svh bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.62] selection:bg-gold selection:text-void">
      <ScrollProgress />
      <SiteNav />

      <main className="py-[clamp(48px,6vw,96px)]">
        <div className={shell}>
          {/* ─── Hero Header ─── */}
          <div className="mb-[clamp(32px,4vw,56px)] border-b border-[rgba(237,231,218,0.12)] pb-8">
            <div className="max-w-3xl">
              <span className="text-[0.72rem] font-mono uppercase tracking-[0.2em] text-halo">
                Arrive at Origin · Recent Blogs
              </span>
              <h1 className={`${heading} mt-2 mb-[0.3em] text-[clamp(2.4rem,5.5vw,4.2rem)] text-vellum`}>
                Recent Blogs
              </h1>
              <p className="max-w-[62ch] text-[#C6CBD8] leading-relaxed">
                Inquiries on metaphysics, grief, relationship and the practice of arriving at origin by Dr. Alka Chopra Madan.
              </p>
            </div>
          </div>

          {/* ─── Main 2-Column Grid: Left Posts Stream | Right Sidebar ─── */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10 xl:gap-14">
            {/* ─── Left Column: Posts Stream ─── */}
            <div className="lg:col-span-8">
              {/* Active Filter Chips Banner */}
              {hasActiveFilters && (
                <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-halo/25 bg-halo/5 p-3.5 text-xs text-[#C6CBD8]">
                  <span className="font-semibold text-halo flex items-center gap-1.5">
                    <span className="text-halo text-xs">✦</span> Active Filters:
                  </span>

                  {selectedCat !== "All" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-halo/40 bg-halo/15 px-3 py-1 font-medium text-halo">
                      Category: {selectedCat}
                      <button
                        type="button"
                        onClick={() => handleSelectCategory("All")}
                        className="text-halo hover:text-white cursor-pointer ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {selectedTag && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-halo/40 bg-halo/15 px-3 py-1 font-medium text-halo">
                      Tag: #{selectedTag}
                      <button
                        type="button"
                        onClick={() => handleSelectTag(null)}
                        className="text-halo hover:text-white cursor-pointer ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {search && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-halo/40 bg-halo/15 px-3 py-1 font-medium text-halo">
                      Search: &ldquo;{search}&rdquo;
                      <button
                        type="button"
                        onClick={() => handleSearchChange("")}
                        className="text-halo hover:text-white cursor-pointer ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="ml-auto text-xs text-halo hover:underline cursor-pointer font-medium"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}

              {/* Posts Count Summary */}
              {!loading && posts.length > 0 && (
                <div className="mb-6 flex items-center justify-between text-xs text-[#8A92A6]">
                  <span>
                    Showing {posts.length} {posts.length === 1 ? "blog" : "blogs"}
                    {pagination.total > posts.length && ` of ${pagination.total}`}
                  </span>
                  {selectedCat !== "All" && (
                    <span className="text-halo font-medium">{selectedCat}</span>
                  )}
                </div>
              )}

              {/* Posts Grid (2-column layout on medium/large) */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {posts.map((post) => (
                  <Link
                    key={post.slug || post._id}
                    to={`/blog/${post.slug}`}
                    className="group flex flex-col rounded-2xl border border-[rgba(237,231,218,0.14)] bg-[rgba(237,231,218,0.03)] p-5 sm:p-6 no-underline transition-all duration-300 hover:-translate-y-1 hover:border-halo hover:bg-[rgba(237,231,218,0.06)] shadow-sm"
                  >
                    {post.featuredImage ? (
                      <div className="mb-4 overflow-hidden rounded-xl aspect-[16/10] bg-black/40 border border-[rgba(237,231,218,0.1)]">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="mb-4 flex aspect-[16/10] items-center justify-center rounded-xl border border-[rgba(237,231,218,0.1)] bg-gold/5 text-halo font-serif text-3xl">
                        ✦
                      </div>
                    )}

                    <div className="mb-2.5 flex items-center justify-between text-[0.78rem] tracking-[0.06em] text-[#8A92A6]">
                      <span className="font-mono text-halo uppercase text-[0.7rem] tracking-wider">
                        {post.categoryName || "Essay"}
                      </span>
                      <span>{post.readTime || "5 min read"}</span>
                    </div>

                    <h2
                      className={`${heading} mb-2.5 text-[clamp(1.2rem,1.8vw,1.45rem)] font-normal text-vellum transition-colors group-hover:text-halo line-clamp-2`}
                    >
                      {post.title}
                    </h2>

                    <p className="mb-5 flex-1 text-[0.88rem] leading-relaxed text-[#A9B0C2] line-clamp-3">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between border-t border-[rgba(237,231,218,0.08)] pt-3.5 text-xs">
                      <span className="text-[#8A92A6]">
                        {post.publishDate
                          ? new Date(post.publishDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Published"}
                      </span>
                      <span className="font-semibold text-halo transition-transform group-hover:translate-x-1">
                        Read blog →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Empty State */}
              {posts.length === 0 && !loading && (
                <div className="rounded-2xl border border-[rgba(237,231,218,0.1)] bg-white/[0.02] py-20 px-6 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-halo text-2xl">
                    ✦
                  </div>
                  <h3 className="font-display text-2xl text-vellum mb-2">No Blogs Found</h3>
                  <p className="max-w-[48ch] mx-auto text-sm text-[#A9B0C2] mb-6">
                    {hasActiveFilters
                      ? "No blog articles matched your current search filters or category selection. Try resetting your search."
                      : "Official writings, metaphysical essays, and concept clearing commentaries by Dr. Alka Chopra Madan will be published here soon."}
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="rounded-full border border-halo bg-halo/10 px-5 py-2 text-xs font-semibold text-halo hover:bg-halo hover:text-void transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              )}

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2 border-t border-[rgba(237,231,218,0.1)] pt-8">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-[rgba(237,231,218,0.2)] px-4 py-2 text-xs font-medium text-vellum disabled:opacity-40 disabled:cursor-not-allowed hover:border-halo transition-colors cursor-pointer"
                  >
                    ← Previous
                  </button>
                  <span className="px-3 text-xs text-[#8A92A6]">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    className="rounded-lg border border-[rgba(237,231,218,0.2)] px-4 py-2 text-xs font-medium text-vellum disabled:opacity-40 disabled:cursor-not-allowed hover:border-halo transition-colors cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            {/* ─── Right Column: Luxury Right-Side Sidebar ─── */}
            <div className="lg:col-span-4">
              <div className="sticky top-28">
                <BlogSidebar
                  search={search}
                  onSearchChange={handleSearchChange}
                  categories={categories}
                  selectedCategory={selectedCat}
                  onSelectCategory={handleSelectCategory}
                  tags={tags}
                  selectedTag={selectedTag}
                  onSelectTag={handleSelectTag}
                  recentPosts={recentPosts.length > 0 ? recentPosts : posts}
                  isArticlePage={false}
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

export default Blog;
