import { useEffect, useState } from "react";
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

export function BookEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== "new");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Basic Info
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [authorName, setAuthorName] = useState("Dr. Alka Chopra Madan");
  const [isbn, setIsbn] = useState("");
  const [publisher, setPublisher] = useState("Soul Body Publishing");
  const [language, setLanguage] = useState("English");
  const [pages, setPages] = useState<number>(200);
  const [format, setFormat] = useState<"Paperback" | "Hardcover" | "E-book" | "Other">("Paperback");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [coverImage, setCoverImage] = useState("/aao-part-one.png");
  const [amazonUrl, setAmazonUrl] = useState("");

  // Pricing & Inventory
  const [price, setPrice] = useState<number>(483.23);
  const [priceINR, setPriceINR] = useState<string>("");
  const [priceUSD, setPriceUSD] = useState<string>("");
  const [salePrice, setSalePrice] = useState<string>("");
  const [salePriceINR, setSalePriceINR] = useState<string>("");
  const [salePriceUSD, setSalePriceUSD] = useState<string>("");
  const [currency, setCurrency] = useState<string>("INR");
  const [sku, setSku] = useState("");
  const [stockQuantity, setStockQuantity] = useState<number>(50);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [categoryName, setCategoryName] = useState("AAO Series");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "OUT_OF_STOCK">("DRAFT");
  const [isFeatured, setIsFeatured] = useState(false);

  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");

  // Media Picker
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // Load existing book
  const { data: bookData, isLoading } = useQuery({
    queryKey: ["admin", "book", id],
    queryFn: () => api.get<{ book: any }>(`/admin/books/${id}`),
    enabled: isEditing,
  });

  // Load categories
  const { data: catData } = useQuery({
    queryKey: ["admin", "book-categories"],
    queryFn: () => api.get<{ categories: Array<{ name: string; slug: string }> }>("/admin/book-categories"),
  });

  // Media picker data
  const { data: mediaData } = useQuery({
    queryKey: ["admin", "media-picker-book"],
    queryFn: () => api.get<{ media: Array<{ url: string; originalName: string }> }>("/admin/media?limit=24"),
    enabled: mediaPickerOpen,
  });

  useEffect(() => {
    if (bookData?.book) {
      const b = bookData.book;
      setTitle(b.title || "");
      setSlug(b.slug || "");
      setAuthorName(b.authorName || "Dr. Alka Chopra Madan");
      setIsbn(b.isbn || "");
      setPublisher(b.publisher || "Soul Body Publishing");
      setLanguage(b.language || "English");
      setPages(b.pages || 200);
      setFormat(b.format || "Paperback");
      setDescription(b.description || "");
      setShortDescription(b.shortDescription || "");
      setCoverImage(b.coverImage || "/aao-part-one.png");
      setAmazonUrl(b.amazonUrl || "");
      setPrice(b.price || 0);
      setPriceINR(
        b.priceINR !== undefined && b.priceINR !== null
          ? String(b.priceINR)
          : b.currency === "INR" || !b.currency
          ? String(b.price || "")
          : ""
      );
      setPriceUSD(
        b.priceUSD !== undefined && b.priceUSD !== null
          ? String(b.priceUSD)
          : b.currency === "USD"
          ? String(b.price || "")
          : ""
      );
      setSalePrice(b.salePrice ? String(b.salePrice) : "");
      setSalePriceINR(
        b.salePriceINR !== undefined && b.salePriceINR !== null
          ? String(b.salePriceINR)
          : b.currency === "INR" && b.salePrice
          ? String(b.salePrice)
          : ""
      );
      setSalePriceUSD(
        b.salePriceUSD !== undefined && b.salePriceUSD !== null
          ? String(b.salePriceUSD)
          : b.currency === "USD" && b.salePrice
          ? String(b.salePrice)
          : ""
      );
      setCurrency(b.currency || "INR");
      setSku(b.sku || "");
      setStockQuantity(b.stockQuantity ?? 50);
      setLowStockThreshold(b.lowStockThreshold ?? 5);
      setCategoryName(b.categoryName || "AAO Series");
      setStatus(b.status || "DRAFT");
      setIsFeatured(Boolean(b.isFeatured));
      if (b.seo) {
        setSeoTitle(b.seo.seoTitle || "");
        setMetaDescription(b.seo.metaDescription || "");
        setCanonicalUrl(b.seo.canonicalUrl || "");
      }
    }
  }, [bookData]);

  const saveMutation = useMutation({
    mutationFn: (targetStatus?: "DRAFT" | "PUBLISHED" | "OUT_OF_STOCK") => {
      const finalPrice = Number(
        currency === "USD"
          ? (priceUSD !== "" ? priceUSD : price)
          : (priceINR !== "" ? priceINR : price)
      );

      const payload = {
        title,
        slug: slug || slugify(title),
        authorName,
        isbn,
        publisher,
        language,
        pages: Number(pages),
        format,
        description,
        shortDescription,
        coverImage,
        amazonUrl,
        price: finalPrice,
        priceINR: priceINR !== "" ? Number(priceINR) : (currency === "INR" ? finalPrice : undefined),
        priceUSD: priceUSD !== "" ? Number(priceUSD) : (currency === "USD" ? finalPrice : undefined),
        salePrice: salePriceINR ? Number(salePriceINR) : (salePriceUSD ? Number(salePriceUSD) : (salePrice ? Number(salePrice) : undefined)),
        salePriceINR: salePriceINR !== "" ? Number(salePriceINR) : undefined,
        salePriceUSD: salePriceUSD !== "" ? Number(salePriceUSD) : undefined,
        currency: currency || "INR",
        sku: sku || `BK-${Date.now().toString().slice(-6)}`,
        stockQuantity: Number(stockQuantity),
        lowStockThreshold: Number(lowStockThreshold),
        categoryName,
        status: targetStatus || status,
        isFeatured,
        seo: {
          seoTitle: seoTitle || title,
          metaDescription: metaDescription || shortDescription,
          canonicalUrl,
        },
      };

      if (isEditing) {
        return api.put(`/admin/books/${id}`, payload);
      } else {
        return api.post(`/admin/books`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "books"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      navigate("/admin/books");
    },
  });

  if (isEditing && isLoading) {
    return <div className="py-12 text-center text-[var(--admin-text-muted)]">Loading book details…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="admin-sticky-header flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/admin/books" className="text-xs text-[var(--admin-accent)] hover:underline mb-1 inline-block">
            ← Back to Books Catalog
          </Link>
          <h1 className="font-display text-[1.8rem] font-light text-[var(--admin-text-primary)]">
            {isEditing ? `Edit: ${title}` : "Add New Book"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <a href={`/books/${slug}`} target="_blank" rel="noreferrer">
              <Button size="sm" variant="outline">
                View in Store
              </Button>
            </a>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={saveMutation.isPending || !title}
            onClick={() => saveMutation.mutate("DRAFT")}
          >
            Save Draft
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={saveMutation.isPending || !title}
            onClick={() => saveMutation.mutate("PUBLISHED")}
          >
            {isEditing && status === "PUBLISHED" ? "Update Book" : "Publish Book"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Left Column: Details & Description (2 cols) */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card title="Book Overview">
            <Field
              label="Book Title *"
              placeholder="e.g. Arrive at Origin, Part One"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!isEditing) setSlug(slugify(e.target.value));
              }}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="mb-4">
                <label className="mb-1 block text-[0.85rem] font-medium text-[var(--admin-text-secondary)]">
                  URL Slug
                </label>
                <div className="flex items-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm">
                  <span className="text-[var(--admin-text-muted)] select-none">/books/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(slugify(e.target.value))}
                    className="flex-1 py-2 text-[var(--admin-text-primary)] bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <Field
                label="Author Name *"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
            </div>

            <Textarea
              label="Short Summary"
              placeholder="A concise 1-2 sentence hook displayed on book cards…"
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            />

            <Textarea
              label="Full Description *"
              placeholder="Full book synopsis, foreword excerpt, and chapter themes…"
              rows={8}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Card>

          {/* Pricing & Formats */}
          <Card title="Pricing & Formats">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field
                label="Retail Price (INR ₹) *"
                type="number"
                step="0.01"
                placeholder="e.g. 483.23"
                value={priceINR}
                onChange={(e) => {
                  setPriceINR(e.target.value);
                  if (currency === "INR") setPrice(parseFloat(e.target.value) || 0);
                }}
              />

              <Field
                label="Retail Price (USD $) *"
                type="number"
                step="0.01"
                placeholder="e.g. 24.95"
                value={priceUSD}
                onChange={(e) => {
                  setPriceUSD(e.target.value);
                  if (currency === "USD") setPrice(parseFloat(e.target.value) || 0);
                }}
              />

              <Select
                label="Format"
                value={format}
                onChange={(e: any) => setFormat(e.target.value)}
              >
                <option value="Paperback" className="bg-[#14161f]">Paperback</option>
                <option value="Hardcover" className="bg-[#14161f]">Hardcover</option>
                <option value="E-book" className="bg-[#14161f]">E-book (Digital)</option>
                <option value="Other" className="bg-[#14161f]">Other</option>
              </Select>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 pt-3 border-t border-[var(--admin-border)]/40">
              <Field
                label="Sale Price (INR ₹ Optional)"
                type="number"
                step="0.01"
                placeholder="Leave blank if not on sale"
                value={salePriceINR}
                onChange={(e) => setSalePriceINR(e.target.value)}
              />

              <Field
                label="Sale Price (USD $ Optional)"
                type="number"
                step="0.01"
                placeholder="Leave blank if not on sale"
                value={salePriceUSD}
                onChange={(e) => setSalePriceUSD(e.target.value)}
              />

              <Select
                label="Default Currency"
                value={currency}
                onChange={(e: any) => setCurrency(e.target.value)}
              >
                <option value="INR" className="bg-[#14161f]">INR (₹ Indian Rupee)</option>
                <option value="USD" className="bg-[#14161f]">USD ($ US Dollar)</option>
              </Select>
            </div>
          </Card>

          {/* SEO Metadata */}
          <Card title="SEO & Structured Data">
            <Field
              label="Meta Title"
              placeholder={title}
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
            <Textarea
              label="Meta Description"
              placeholder={shortDescription}
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
            />
            <Field
              label="Canonical URL"
              placeholder="https://soulbodyhealingcenter.com/books/..."
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
            />
          </Card>
        </div>

        {/* Right Column: Inventory, Media, Publishing (1 col) - Sticky when scrolling left side */}
        <div className="min-w-0 space-y-6 admin-sticky-sidebar">
          {/* Status Card */}
          <Card title="Status & Visibility">
            <Select
              label="Catalog Status"
              value={status}
              onChange={(e: any) => setStatus(e.target.value)}
            >
              <option value="DRAFT" className="bg-[#14161f]">Draft (Unpublished)</option>
              <option value="PUBLISHED" className="bg-[#14161f]">Published (Live in Store)</option>
              <option value="OUT_OF_STOCK" className="bg-[#14161f]">Out of Stock</option>
            </Select>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--admin-border)]/50 p-3 bg-[var(--admin-background)]">
              <div>
                <span className="block text-sm font-medium text-[var(--admin-text-primary)]">Featured Book</span>
                <span className="text-xs text-[var(--admin-text-muted)]">Showcase prominently</span>
              </div>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-5 w-5 rounded border-[var(--admin-border)]"
              />
            </div>
          </Card>

          {/* Inventory */}
          <Card title="Inventory & Logistics">
            <Field
              label="SKU (Stock Keeping Unit) *"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. AAO-BK-001"
            />

            <Field
              label="ISBN"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              placeholder="e.g. 979-8877665544"
            />

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Stock Quantity *"
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
              />

              <Field
                label="Low Threshold"
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 5)}
              />
            </div>

            <Field
              label="Amazon Listing URL (Optional)"
              value={amazonUrl}
              onChange={(e) => setAmazonUrl(e.target.value)}
              placeholder="https://www.amazon.com/dp/..."
              helperText="Provides a direct link option for Amazon buyers"
            />
          </Card>

          {/* Book Cover Image */}
          <Card title="Cover Image">
            <div className="space-y-3">
              {coverImage ? (
                <div className="relative mx-auto w-40 overflow-hidden rounded-xl border border-[var(--admin-border)] shadow-md">
                  <img src={coverImage} alt="Cover Preview" className="h-56 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCoverImage("")}
                    className="absolute top-2 right-2 rounded-lg bg-black/75 px-2 py-1 text-xs text-white"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-background)] text-xs text-[var(--admin-text-muted)] p-4 text-center">
                  <span>No cover image selected</span>
                </div>
              )}

              <Field
                label="Cover Image URL"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="/aao-part-one.png"
              />

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setMediaPickerOpen(true)}
                  >
                    Choose from Library
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="text-xs"
                    onClick={() => setMediaPickerOpen(true)}
                  >
                    ⬆️ Upload Image
                  </Button>
                </div>
            </div>
          </Card>

          {/* Publishing details */}
          <Card title="Publishing Metadata">
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
                  <option value="AAO Series" className="bg-[#14161f]">AAO Series</option>
                  <option value="Earlier Work" className="bg-[#14161f]">Earlier Work</option>
                  <option value="Metaphysics" className="bg-[#14161f]">Metaphysics</option>
                </>
              )}
            </Select>

            <Field
              label="Publisher"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Pages"
                type="number"
                value={pages}
                onChange={(e) => setPages(parseInt(e.target.value) || 200)}
              />
              <Field
                label="Language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Media Picker Modal with Upload from Browser and Edit/Update */}
      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        title="Select Cover Image"
        currentValue={coverImage}
        onSelect={(url) => setCoverImage(url)}
      />
    </div>
  );
}
