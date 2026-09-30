import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import ScrollProgress from "../components/landing/ScrollProgress";
import SiteNav from "../components/landing/SiteNav";
import SiteFooter from "../components/landing/SiteFooter";
import NotFound from "./NotFound";
import { blogPosts, formatPostDate } from "../data/blogPosts";

const shell = "mx-auto w-full max-w-[760px] px-[clamp(20px,5vw,64px)]";
const heading = "font-display font-light leading-[1.05] tracking-[-0.015em]";

function BlogPost() {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) return <NotFound />;

  return (
    <div className="min-h-svh bg-void text-vellum text-[clamp(16px,1.05vw,18px)] leading-[1.7] selection:bg-gold selection:text-void">
      <ScrollProgress />
      <SiteNav />
      <main className="py-[clamp(56px,8vw,110px)]">
        <article className={shell}>
          <Link to="/blog" className="mb-8 inline-block text-[0.9rem] text-halo no-underline">
            ← All posts
          </Link>
          <p className="mb-3 text-[0.8rem] tracking-[0.06em] text-dim">
            {formatPostDate(post.date)} · {post.readTime}
          </p>
          <h1 className={`${heading} mb-8 text-[clamp(2.2rem,5vw,3.6rem)]`}>{post.title}</h1>
          {post.body.map((para) => (
            <p key={para} className="mb-5 text-[#C6CBD8]">
              {para}
            </p>
          ))}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

export default BlogPost;
