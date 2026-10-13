import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function BlogSidebar({
  search = "",
  onSearchChange,
  onSearchSubmit,
  categories = [],
  selectedCategory = "All",
  onSelectCategory,
  tags = [],
  selectedTag = null,
  onSelectTag,
  recentPosts = [],
  isArticlePage = false,
}) {
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(search);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = localSearch.trim();
    if (isArticlePage) {
      navigate(`/blog${query ? `?search=${encodeURIComponent(query)}` : ""}`);
    } else if (onSearchSubmit) {
      onSearchSubmit(query);
    } else if (onSearchChange) {
      onSearchChange(query);
    }
  };

  const handleCategoryClick = (catName) => {
    if (isArticlePage) {
      navigate(`/blog${catName !== "All" ? `?category=${encodeURIComponent(catName)}` : ""}`);
    } else if (onSelectCategory) {
      onSelectCategory(catName);
    }
  };

  const handleTagClick = (tagName) => {
    if (isArticlePage) {
      navigate(`/blog?tag=${encodeURIComponent(tagName)}`);
    } else if (onSelectTag) {
      onSelectTag(tagName === selectedTag ? null : tagName);
    }
  };

  return (
    <aside className="space-y-8">
      {/* ─── 1. Search Bar Widget ─── */}
      <div className="rounded-2xl border border-[rgba(237,231,218,0.12)] bg-[rgba(237,231,218,0.03)] p-6 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-base font-medium tracking-wide text-vellum flex items-center gap-2">
            <span className="text-halo text-xs">✦</span> Search Blogs
          </h3>
          {search && !isArticlePage && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch("");
                if (onSearchChange) onSearchChange("");
              }}
              className="text-[0.72rem] text-halo hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search blogs, themes, keywords…"
            value={isArticlePage ? localSearch : search}
            onChange={(e) => {
              const val = e.target.value;
              setLocalSearch(val);
              if (!isArticlePage && onSearchChange) {
                onSearchChange(val);
              }
            }}
            className="w-full rounded-xl border border-[rgba(237,231,218,0.18)] bg-white/[0.04] px-4 py-3 pl-10 text-sm text-vellum placeholder:text-[#8A92A6] transition-all focus:border-halo focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-halo/50"
          />
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-halo/70"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {((isArticlePage && localSearch) || (!isArticlePage && search)) && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch("");
                if (!isArticlePage && onSearchChange) onSearchChange("");
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A92A6] hover:text-vellum cursor-pointer text-xs"
            >
              ✕
            </button>
          )}
        </form>
      </div>

      {/* ─── 2. Categories Widget (Only Blog Categories with blogs) ─── */}
      <div className="rounded-2xl border border-[rgba(237,231,218,0.12)] bg-[rgba(237,231,218,0.03)] p-6 backdrop-blur-md">
        <h3 className="mb-4 flex items-center justify-between border-b border-[rgba(237,231,218,0.08)] pb-3 font-display text-base font-medium tracking-wide text-vellum">
          <span className="flex items-center gap-2">
            <span className="text-halo text-xs">✦</span> Blog Categories
          </span>
          <span className="text-[0.72rem] font-mono text-[#8A92A6]">
            {categories.filter((c) => (typeof c === "object" && c.count !== undefined ? c.count > 0 : true)).length || categories.length}
          </span>
        </h3>
        <ul className="space-y-1.5">
          {/* "All" Category Item */}
          <li>
            <button
              type="button"
              onClick={() => handleCategoryClick("All")}
              className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === "All"
                  ? "bg-halo/15 text-halo border border-halo/30 shadow-xs"
                  : "text-[#C6CBD8] hover:bg-white/[0.05] hover:text-vellum"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-transform ${
                    selectedCategory === "All" ? "bg-halo scale-125" : "bg-white/20 group-hover:bg-halo/50"
                  }`}
                />
                All Blogs
              </span>
              <span
                className={`text-[0.7rem] px-2 py-0.5 rounded-full ${
                  selectedCategory === "All"
                    ? "bg-halo/20 text-halo font-semibold"
                    : "bg-white/5 text-[#8A92A6] group-hover:text-vellum"
                }`}
              >
                All
              </span>
            </button>
          </li>

          {categories
            .filter((cat) => {
              // Only show blog categories that have posts (> 0), or if none have count yet, show all
              const hasCounts = categories.some((c) => typeof c === "object" && c.count > 0);
              if (hasCounts && typeof cat === "object" && cat.count !== undefined) {
                return cat.count > 0;
              }
              return true;
            })
            .map((cat) => {
              const catName = typeof cat === "string" ? cat : cat.name;
              const count = typeof cat === "object" && cat.count !== undefined ? cat.count : null;
              const isSelected = selectedCategory.toLowerCase() === catName.toLowerCase();

              return (
                <li key={catName}>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(catName)}
                    className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-halo/15 text-halo border border-halo/30 shadow-xs"
                        : "text-[#C6CBD8] hover:bg-white/[0.05] hover:text-vellum"
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate pr-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full transition-transform ${
                          isSelected ? "bg-halo scale-125" : "bg-white/20 group-hover:bg-halo/50"
                        }`}
                      />
                      <span className="truncate">{catName}</span>
                    </span>
                    {count !== null && (
                      <span
                        className={`text-[0.68rem] px-2 py-0.5 rounded-full font-mono shrink-0 ${
                          isSelected
                            ? "bg-halo/20 text-halo font-bold"
                            : "bg-white/5 text-[#8A92A6] group-hover:text-vellum"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
        </ul>
      </div>

      {/* ─── 3. Recent Blogs Widget ─── */}
      {recentPosts && recentPosts.length > 0 && (
        <div className="rounded-2xl border border-[rgba(237,231,218,0.12)] bg-[rgba(237,231,218,0.03)] p-6 backdrop-blur-md">
          <h3 className="mb-4 flex items-center justify-between border-b border-[rgba(237,231,218,0.08)] pb-3 font-display text-base font-medium tracking-wide text-vellum">
            <span className="flex items-center gap-2">
              <span className="text-halo text-xs">✦</span> Recent Blogs
            </span>
            <span className="text-[0.72rem] font-mono text-[#8A92A6]">Latest</span>
          </h3>

          <div className="space-y-4">
            {recentPosts.slice(0, 5).map((post) => (
              <Link
                key={post.slug || post._id}
                to={`/blog/${post.slug}`}
                className="group flex items-start gap-3.5 no-underline transition-all"
              >
                {post.featuredImage ? (
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[rgba(237,231,218,0.15)] bg-black/40">
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[rgba(237,231,218,0.15)] bg-gold/10 text-halo font-serif text-base">
                    ✦
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {post.categoryName && (
                    <span className="inline-block text-[0.65rem] font-mono uppercase tracking-wider text-halo/80">
                      {post.categoryName}
                    </span>
                  )}
                  <h4 className="font-display text-[0.88rem] leading-snug text-vellum transition-colors group-hover:text-halo line-clamp-2">
                    {post.title}
                  </h4>
                  <div className="mt-1 flex items-center gap-2 text-[0.7rem] text-[#8A92A6]">
                    <span>
                      {post.publishDate
                        ? new Date(post.publishDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "Recent"}
                    </span>
                    {post.readTime && (
                      <>
                        <span>·</span>
                        <span>{post.readTime}</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ─── 4. Tags Cloud Widget ─── */}
      {tags && tags.length > 0 && (
        <div className="rounded-2xl border border-[rgba(237,231,218,0.12)] bg-[rgba(237,231,218,0.03)] p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between border-b border-[rgba(237,231,218,0.08)] pb-3">
            <h3 className="font-display text-base font-medium tracking-wide text-vellum flex items-center gap-2">
              <span className="text-halo text-xs">✦</span> Explore Tags
            </h3>
            {selectedTag && (
              <button
                type="button"
                onClick={() => onSelectTag && onSelectTag(null)}
                className="text-[0.72rem] text-halo hover:underline cursor-pointer"
              >
                Clear Tag
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const tagName = typeof tag === "string" ? tag : tag.name;
              const isSelected = selectedTag?.toLowerCase() === tagName.toLowerCase();

              return (
                <button
                  key={tagName}
                  type="button"
                  onClick={() => handleTagClick(tagName)}
                  className={`rounded-full px-3 py-1.5 text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-halo text-void font-bold shadow-sm shadow-halo/30 scale-105"
                      : "border border-[rgba(237,231,218,0.15)] bg-white/[0.03] text-[#C6CBD8] hover:border-halo hover:bg-gold/10 hover:text-halo"
                  }`}
                >
                  <span>#{tagName}</span>
                  {typeof tag === "object" && tag.count > 0 && (
                    <span
                      className={`text-[0.62rem] rounded-full px-1.5 py-0.2 ${
                        isSelected ? "bg-void/20 text-void font-bold" : "bg-white/10 text-[#8A92A6]"
                      }`}
                    >
                      {tag.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 5. Author Spotlight & Inquiry Card ─── */}
      <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-b from-gold/10 via-[rgba(237,231,218,0.03)] to-transparent p-6 backdrop-blur-md">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-gold/10 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3.5 mb-3.5">
          <img
            src="/dr-alka-chopra-madan.png"
            alt="Dr. Alka Chopra Madan"
            className="h-12 w-12 rounded-full object-cover border border-halo/40 shadow-sm"
          />
          <div>
            <h4 className="font-display text-sm font-semibold text-vellum">Dr. Alka Chopra Madan</h4>
            <p className="text-[0.72rem] text-halo">Author & Metaphysical Counselor</p>
          </div>
        </div>
        <p className="text-xs text-[#A9B0C2] leading-relaxed mb-4">
          “When you clear the conceptual fog, you don&apos;t build peace from scratch—you arrive where it always was.”
        </p>
        <div className="flex items-center gap-2">
          <Link
            to="/schedule"
            className="flex-1 rounded-full border border-halo/40 bg-halo/10 py-2 text-center text-xs font-semibold text-halo hover:bg-halo hover:text-void transition-colors no-underline"
          >
            Book Consultation
          </Link>
          <Link
            to="/books"
            className="rounded-full border border-[rgba(237,231,218,0.2)] bg-white/5 px-3 py-2 text-center text-xs text-[#C6CBD8] hover:text-vellum hover:border-vellum transition-colors no-underline"
          >
            Books →
          </Link>
        </div>
      </div>
    </aside>
  );
}
