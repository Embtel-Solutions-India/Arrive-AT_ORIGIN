import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Button, Card, Field, Modal, PageHeader, Select, Textarea } from "../../components/ui";
import { MediaPickerModal } from "../../components/MediaPickerModal";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export function BlogEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== "new");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("Dr. Alka Chopra Madan");
  const [categoryName, setCategoryName] = useState("Metaphysics");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "SCHEDULED">("DRAFT");
  const [scheduledDate, setScheduledDate] = useState("");

  // SEO State
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [twitterTitle, setTwitterTitle] = useState("");
  const [twitterDescription, setTwitterDescription] = useState("");
  const [twitterImage, setTwitterImage] = useState("");
  const [noIndex, setNoIndex] = useState(false);
  const [noFollow, setNoFollow] = useState(false);

  // Active tab & Preview
  const [activeTab, setActiveTab] = useState<"editor" | "seo">("editor");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // Load existing post if editing
  const { data: blogData, isLoading } = useQuery({
    queryKey: ["admin", "blog", id],
    queryFn: () => api.get<{ blog: any }>(`/admin/blogs/${id}`),
    enabled: isEditing,
  });

  // Load categories
  const { data: catData } = useQuery({
    queryKey: ["admin", "blog-categories"],
    queryFn: () => api.get<{ categories: Array<{ name: string; slug: string }> }>("/admin/blog-categories"),
  });

  // Load media items for media picker
  const { data: mediaData } = useQuery({
    queryKey: ["admin", "media-picker"],
    queryFn: () => api.get<{ media: Array<{ url: string; originalName: string }> }>("/admin/media?limit=24"),
    enabled: mediaPickerOpen,
  });

  useEffect(() => {
    if (blogData?.blog) {
      const b = blogData.blog;
      setTitle(b.title || "");
      setSlug(b.slug || "");
      setSlugManuallyEdited(true);
      setExcerpt(b.excerpt || "");
      setContent(b.content || "");
      setAuthorName(b.authorName || "Dr. Alka Chopra Madan");
      setCategoryName(b.categoryName || "Metaphysics");
      setTags(b.tags || []);
      setFeaturedImage(b.featuredImage || "");
      setIsFeatured(Boolean(b.isFeatured));
      setStatus(b.status || "DRAFT");
      if (b.scheduledDate) {
        setScheduledDate(new Date(b.scheduledDate).toISOString().slice(0, 16));
      }
      if (b.seo) {
        setSeoTitle(b.seo.seoTitle || "");
        setMetaDescription(b.seo.metaDescription || "");
        setFocusKeyword(b.seo.focusKeyword || "");
        setCanonicalUrl(b.seo.canonicalUrl || "");
        setOgTitle(b.seo.ogTitle || "");
        setOgDescription(b.seo.ogDescription || "");
        setOgImage(b.seo.ogImage || "");
        setTwitterTitle(b.seo.twitterTitle || "");
        setTwitterDescription(b.seo.twitterDescription || "");
        setTwitterImage(b.seo.twitterImage || "");
        setNoIndex(Boolean(b.seo.noIndex));
        setNoFollow(Boolean(b.seo.noFollow));
      }
    }
  }, [blogData]);

  // Title to slug
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugManuallyEdited) {
      setSlug(slugify(val));
    }
  };

  // Tags handling
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = tagInput.trim().replace(/^,+|,+$/g, "");
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Content formatting toolbar
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const insertFormatting = (prefix: string, suffix: string = "", placeholder: string = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end) || placeholder;
    const replacement = `${prefix}${selected}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: (targetStatus?: "DRAFT" | "PUBLISHED" | "SCHEDULED") => {
      const payload = {
        title,
        slug,
        excerpt,
        content,
        authorName,
        categoryName,
        tags,
        featuredImage,
        isFeatured,
        status: targetStatus || status,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
        seo: {
          seoTitle: seoTitle || title,
          metaDescription: metaDescription || excerpt,
          focusKeyword,
          canonicalUrl,
          ogTitle: ogTitle || seoTitle || title,
          ogDescription: ogDescription || metaDescription || excerpt,
          ogImage: ogImage || featuredImage,
          twitterTitle: twitterTitle || ogTitle || title,
          twitterDescription: twitterDescription || ogDescription || excerpt,
          twitterImage: twitterImage || ogImage || featuredImage,
          noIndex,
          noFollow,
        },
      };

      if (isEditing) {
        return api.put(`/admin/blogs/${id}`, payload);
      } else {
        return api.post(`/admin/blogs`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      navigate("/admin/blog");
    },
  });

  if (isEditing && isLoading) {
    return <div className="py-12 text-center text-[var(--admin-text-muted)]">Loading post details…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="admin-sticky-header flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/admin/blog" className="text-xs text-[var(--admin-accent)] hover:underline mb-1 inline-block">
            ← Back to All Posts
          </Link>
          <h1 className="font-display text-[1.8rem] font-light text-[var(--admin-text-primary)]">
            {isEditing ? "Edit Blog Post" : "Create New Blog Post"}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
          >
            Preview
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={saveMutation.isPending || !title || !content}
            onClick={() => saveMutation.mutate("DRAFT")}
          >
            Save Draft
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={saveMutation.isPending || !title || !content}
            onClick={() => saveMutation.mutate("PUBLISHED")}
          >
            {isEditing && status === "PUBLISHED" ? "Update Post" : "Publish Now"}
          </Button>
        </div>
      </div>

      {/* Tabs Switcher: Content Editor vs SEO */}
      <div className="flex gap-4 border-b border-[var(--admin-border)] pb-2 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab("editor")}
          className={`pb-2 font-medium transition-colors border-b-2 -mb-2.5 ${
            activeTab === "editor"
              ? "border-[var(--admin-accent)] text-[var(--admin-accent)]"
              : "border-transparent text-[var(--admin-text-secondary)] hover:text-white"
          }`}
        >
          1. Content & Media
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("seo")}
          className={`pb-2 font-medium transition-colors border-b-2 -mb-2.5 ${
            activeTab === "seo"
              ? "border-[var(--admin-accent)] text-[var(--admin-accent)]"
              : "border-transparent text-[var(--admin-text-secondary)] hover:text-white"
          }`}
        >
          2. SEO & Social Metadata
        </button>
      </div>

      {activeTab === "editor" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
          {/* Main content column (2 cols) */}
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <Card title="Post Details">
              <Field
                label="Blog Title *"
                placeholder="e.g. What does “meta-human” actually mean?"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />

              <div className="mb-4">
                <label className="mb-1 block text-[0.85rem] font-medium text-[var(--admin-text-secondary)]">
                  URL Slug *
                </label>
                <div className="flex items-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm">
                  <span className="text-[var(--admin-text-muted)] select-none">/blog/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlug(slugify(e.target.value));
                      setSlugManuallyEdited(true);
                    }}
                    placeholder="post-slug"
                    className="flex-1 py-2 text-[var(--admin-text-primary)] focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <Textarea
                label="Excerpt / Short Summary"
                rows={3}
                placeholder="A compelling 1-2 sentence preview for search results and social cards…"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                helperText="Recommended 120-160 characters."
              />
            </Card>

            {/* Rich Content Editor */}
            <Card title="Post Content (Rich Text / HTML / Markdown)">
              {/* Formatting Toolbar */}
              <div className="mb-3 flex flex-wrap gap-1.5 rounded-xl border border-[var(--admin-border)]/60 bg-[var(--admin-background)] p-1.5 text-xs">
                <button
                  type="button"
                  title="Heading 1"
                  onClick={() => insertFormatting("<h1>", "</h1>", "Heading 1")}
                  className="rounded px-2 py-1 font-bold hover:bg-[rgba(237,231,218,0.1)]"
                >
                  H1
                </button>
                <button
                  type="button"
                  title="Heading 2"
                  onClick={() => insertFormatting("<h2>", "</h2>", "Heading 2")}
                  className="rounded px-2 py-1 font-bold hover:bg-[rgba(237,231,218,0.1)]"
                >
                  H2
                </button>
                <button
                  type="button"
                  title="Heading 3"
                  onClick={() => insertFormatting("<h3>", "</h3>", "Heading 3")}
                  className="rounded px-2 py-1 font-bold hover:bg-[rgba(237,231,218,0.1)]"
                >
                  H3
                </button>
                <span className="w-px bg-[var(--admin-border)] my-1" />
                <button
                  type="button"
                  title="Bold"
                  onClick={() => insertFormatting("<strong>", "</strong>", "bold text")}
                  className="rounded px-2 py-1 font-bold hover:bg-[rgba(237,231,218,0.1)]"
                >
                  B
                </button>
                <button
                  type="button"
                  title="Italic"
                  onClick={() => insertFormatting("<em>", "</em>", "italic text")}
                  className="rounded px-2 py-1 italic hover:bg-[rgba(237,231,218,0.1)]"
                >
                  I
                </button>
                <button
                  type="button"
                  title="Underline"
                  onClick={() => insertFormatting("<u>", "</u>", "underlined text")}
                  className="rounded px-2 py-1 underline hover:bg-[rgba(237,231,218,0.1)]"
                >
                  U
                </button>
                <button
                  type="button"
                  title="Strikethrough"
                  onClick={() => insertFormatting("<s>", "</s>", "strike")}
                  className="rounded px-2 py-1 line-through hover:bg-[rgba(237,231,218,0.1)]"
                >
                  S
                </button>
                <span className="w-px bg-[var(--admin-border)] my-1" />
                <button
                  type="button"
                  title="Blockquote"
                  onClick={() => insertFormatting("<blockquote>“", "”</blockquote>", "Thought-provoking quote")}
                  className="rounded px-2 py-1 hover:bg-[rgba(237,231,218,0.1)]"
                >
                  “ Quote
                </button>
                <button
                  type="button"
                  title="Bullet List"
                  onClick={() =>
                    insertFormatting("<ul>\n  <li>", "</li>\n  <li>Second item</li>\n</ul>", "First item")
                  }
                  className="rounded px-2 py-1 hover:bg-[rgba(237,231,218,0.1)]"
                >
                  • List
                </button>
                <button
                  type="button"
                  title="Numbered List"
                  onClick={() =>
                    insertFormatting("<ol>\n  <li>", "</li>\n  <li>Second step</li>\n</ol>", "First step")
                  }
                  className="rounded px-2 py-1 hover:bg-[rgba(237,231,218,0.1)]"
                >
                  1. List
                </button>
                <button
                  type="button"
                  title="Code Block"
                  onClick={() => insertFormatting("<pre><code>", "</code></pre>", "// code snippet")}
                  className="rounded px-2 py-1 font-mono hover:bg-[rgba(237,231,218,0.1)]"
                >
                  &lt;/&gt;
                </button>
                <button
                  type="button"
                  title="Horizontal Rule"
                  onClick={() => insertFormatting("\n<hr />\n")}
                  className="rounded px-2 py-1 hover:bg-[rgba(237,231,218,0.1)]"
                >
                  ― Divider
                </button>
                <span className="w-px bg-[var(--admin-border)] my-1" />
                <button
                  type="button"
                  title="Insert Link"
                  onClick={() => {
                    const url = prompt("Enter URL:", "https://");
                    if (url) insertFormatting(`<a href="${url}">`, "</a>", "link text");
                  }}
                  className="rounded px-2 py-1 text-[var(--admin-accent)] hover:bg-[rgba(237,231,218,0.1)]"
                >
                  🔗 Link
                </button>
                <button
                  type="button"
                  title="Insert Image"
                  onClick={() => {
                    const imgUrl = prompt("Enter Image URL or pick from media library:", "/dr-alka-chopra-madan.png");
                    if (imgUrl) insertFormatting(`<img src="${imgUrl}" alt="`, '" class="my-6 rounded-2xl w-full" />', "Image description");
                  }}
                  className="rounded px-2 py-1 text-[var(--admin-accent)] hover:bg-[rgba(237,231,218,0.1)]"
                >
                  🖼 Image
                </button>
                <button
                  type="button"
                  title="YouTube Embed"
                  onClick={() => {
                    const ytId = prompt("Enter YouTube Video ID (e.g. dQw4w9WgXcQ):");
                    if (ytId) {
                      insertFormatting(
                        `\n<div class="aspect-video my-6 overflow-hidden rounded-2xl"><iframe class="w-full h-full" src="https://www.youtube.com/embed/${ytId}" allowfullscreen></iframe></div>\n`
                      );
                    }
                  }}
                  className="rounded px-2 py-1 text-rose-400 hover:bg-[rgba(237,231,218,0.1)]"
                >
                  ▶ YouTube
                </button>
              </div>

              <textarea
                ref={textareaRef}
                rows={16}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article in rich HTML or standard prose here…"
                className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] p-4 font-mono text-[0.875rem] text-[var(--admin-text-primary)] focus:border-[var(--admin-accent)] focus:outline-none"
              />
            </Card>
          </div>

          {/* Right sidebar options (1 col) - Sticky when scrolling article */}
          <div className="min-w-0 space-y-6 admin-sticky-sidebar">
            {/* Publishing Settings */}
            <Card title="Publishing Status">
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-[var(--admin-text-muted)] uppercase">
                  Workflow State
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus("DRAFT")}
                    className={`rounded-xl border p-2 text-xs font-semibold ${
                      status === "DRAFT"
                        ? "border-[var(--admin-accent)] bg-[var(--admin-accent)] text-black"
                        : "border-[var(--admin-border)] text-[var(--admin-text-secondary)]"
                    }`}
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("PUBLISHED")}
                    className={`rounded-xl border p-2 text-xs font-semibold ${
                      status === "PUBLISHED"
                        ? "border-emerald-500 bg-emerald-500 text-black"
                        : "border-[var(--admin-border)] text-[var(--admin-text-secondary)]"
                    }`}
                  >
                    Published
                  </button>
                </div>
              </div>

              <Field
                label="Schedule Publish Date (Optional)"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />

              <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--admin-border)]/50 p-3 bg-[var(--admin-background)]">
                <div>
                  <span className="block text-sm font-medium text-[var(--admin-text-primary)]">Featured Post</span>
                  <span className="text-xs text-[var(--admin-text-muted)]">Pin to top of public blog</span>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="h-5 w-5 rounded border-[var(--admin-border)]"
                />
              </div>
            </Card>

            {/* Classification */}
            <Card title="Organization">
              <Select
                label="Category"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              >
                {catData?.categories?.length ? (
                  catData.categories.map((c) => (
                    <option key={c.slug} value={c.name} className="bg-[#14161f]">
                      {c.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Metaphysics" className="bg-[#14161f]">Metaphysics</option>
                    <option value="Grief & Loss" className="bg-[#14161f]">Grief & Loss</option>
                    <option value="Arrive at Origin" className="bg-[#14161f]">Arrive at Origin</option>
                    <option value="Healing & Calmness" className="bg-[#14161f]">Healing & Calmness</option>
                  </>
                )}
              </Select>

              <Field
                label="Author"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />

              {/* Tags */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-semibold text-[var(--admin-text-muted)] uppercase">
                  Tags (Press Enter or comma to add)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-lg bg-[rgba(237,231,218,0.1)] px-2.5 py-1 text-xs text-[var(--admin-text-primary)]"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="text-[var(--admin-text-muted)] hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="e.g. AAO, Consciousness, Meditation"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="min-h-[40px] w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text-primary)] focus:outline-none"
                />
              </div>
            </Card>

            {/* Featured Image */}
            <Card title="Featured Image">
              <div className="space-y-3">
                {featuredImage ? (
                  <div className="relative overflow-hidden rounded-xl border border-[var(--admin-border)]">
                    <img src={featuredImage} alt="Featured Preview" className="h-44 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setFeaturedImage("")}
                      className="absolute top-2 right-2 rounded-lg bg-black/75 px-2 py-1 text-xs text-white"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-background)] text-center text-xs text-[var(--admin-text-muted)] p-4">
                    <span>No image selected</span>
                    <span className="mt-1">Recommended: 1200 × 630 px</span>
                  </div>
                )}

                <Field
                  label="Image URL"
                  placeholder="/your-path-to-healing.png or https://…"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:flex-1 text-xs"
                    onClick={() => setMediaPickerOpen(true)}
                  >
                    Choose from Library
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="w-full sm:w-auto text-xs"
                    onClick={() => setMediaPickerOpen(true)}
                  >
                    ⬆️ Upload Image
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* SEO & Social Metadata Tab */}
      {activeTab === "seo" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Search Engine Optimization */}
          <Card title="Google Search Optimization">
            <Field
              label="SEO Meta Title"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder={title || "SEO optimized headline"}
              helperText={`${seoTitle.length || title.length} / 60 characters recommended`}
            />

            <Textarea
              label="Meta Description"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder={excerpt || "Search engine description snippet…"}
              rows={3}
              helperText={`${metaDescription.length || excerpt.length} / 160 characters recommended`}
            />

            <Field
              label="Focus Keyword"
              value={focusKeyword}
              onChange={(e) => setFocusKeyword(e.target.value)}
              placeholder="e.g. metaphysics, meta-human"
            />

            <Field
              label="Canonical URL (Optional)"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              placeholder="https://soulbodyhealingcenter.com/blog/..."
            />

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2.5 text-sm text-[var(--admin-text-primary)]">
                <input
                  type="checkbox"
                  checked={noIndex}
                  onChange={(e) => setNoIndex(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--admin-border)]"
                />
                Instruct search engines NOT to index this post (noindex)
              </label>
              <label className="flex items-center gap-2.5 text-sm text-[var(--admin-text-primary)]">
                <input
                  type="checkbox"
                  checked={noFollow}
                  onChange={(e) => setNoFollow(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--admin-border)]"
                />
                Instruct search engines NOT to follow links on this page (nofollow)
              </label>
            </div>
          </Card>

          {/* Open Graph & Social Sharing */}
          <Card title="Social Cards (Open Graph & Twitter)">
            <Field
              label="Open Graph / Facebook Title"
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              placeholder={seoTitle || title}
            />

            <Textarea
              label="Open Graph Description"
              value={ogDescription}
              onChange={(e) => setOgDescription(e.target.value)}
              placeholder={metaDescription || excerpt}
              rows={2}
            />

            <Field
              label="Open Graph Image URL"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder={featuredImage || "/dr-alka-chopra-madan.png"}
            />

            <hr className="my-4 border-[var(--admin-border)]/50" />

            <Field
              label="Twitter / X Card Title"
              value={twitterTitle}
              onChange={(e) => setTwitterTitle(e.target.value)}
              placeholder={ogTitle || title}
            />

            <Textarea
              label="Twitter / X Description"
              value={twitterDescription}
              onChange={(e) => setTwitterDescription(e.target.value)}
              placeholder={ogDescription || excerpt}
              rows={2}
            />
          </Card>
        </div>
      )}

      {/* Live Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Live Post Preview"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6 text-[#EDE7DA] bg-[#0B0D13] p-6 rounded-xl border border-[var(--admin-border)]">
          <div className="text-xs uppercase tracking-widest text-[#E0C9A6]">
            {categoryName} · {authorName}
          </div>
          <h1 className="font-display text-3xl font-light leading-tight">{title || "Untitled Post"}</h1>
          {excerpt && <p className="text-[#A9B0C2] italic text-base">{excerpt}</p>}
          {featuredImage && (
            <img src={featuredImage} alt={title} className="w-full h-64 object-cover rounded-xl" />
          )}
          <div
            className="prose prose-invert max-w-none text-sm leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: content || "<p>No content entered yet.</p>" }}
          />
        </div>
      </Modal>

      {/* Media Picker Modal with Upload from Browser and Edit/Update */}
      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        title="Select Image from Media Library"
        currentValue={featuredImage}
        onSelect={(url) => setFeaturedImage(url)}
      />
    </div>
  );
}
