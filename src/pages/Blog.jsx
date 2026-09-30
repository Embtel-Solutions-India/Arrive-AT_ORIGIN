import { useEffect } from "react";
import { Link } from "react-router-dom";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import { blogPosts, formatPostDate } from "../data/blogPosts";

const shell = "mx-auto w-full max-w-[1240px] px-[clamp(20px,5vw,64px)]";
const heading = "font-display font-light leading-[1.02] tracking-[-0.015em]";

function Blog() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-svh bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.62] selection:bg-gold selection:text-void">
      <ScrollProgress />
      <SiteNav />
      <main className="py-[clamp(56px,8vw,110px)]">
        <div className={shell}>
          <h1 className={`${heading} mb-[0.3em] text-[clamp(2.4rem,6vw,4.6rem)]`}>Blog</h1>
          <p className="mb-[clamp(36px,5vw,64px)] max-w-[56ch] text-[#C6CBD8]">
            Notes on metaphysics, grief, relationship and the practice of arriving.
          </p>
          <div className="grid grid-cols-1 gap-[clamp(20px,3vw,32px)] md:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="flex flex-col rounded-2xl border border-[rgba(237,231,218,0.16)] bg-[rgba(237,231,218,0.04)] p-[clamp(24px,3vw,36px)] no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-halo"
              >
                <span className="mb-3 text-[0.8rem] tracking-[0.06em] text-dim">
                  {formatPostDate(post.date)} · {post.readTime}
                </span>
                <h2 className={`${heading} mb-3 text-[clamp(1.4rem,2.2vw,1.8rem)] font-normal text-vellum`}>
                  {post.title}
                </h2>
                <p className="mb-6 flex-1 text-[0.95rem] text-[#A9B0C2]">{post.excerpt}</p>
                <span className="text-[0.9rem] font-semibold text-halo">Read more →</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default Blog;
