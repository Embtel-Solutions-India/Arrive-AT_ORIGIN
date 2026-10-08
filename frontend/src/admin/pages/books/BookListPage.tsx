import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Badge, Button, Card, Modal, PageHeader, Pagination } from "../../components/ui";

interface BookItem {
  _id: string;
  title: string;
  slug: string;
  authorName: string;
  sku: string;
  isbn?: string;
  price: number;
  priceINR?: number;
  priceUSD?: number;
  salePrice?: number;
  currency: string;
  stockQuantity: number;
  lowStockThreshold: number;
  status: "DRAFT" | "PUBLISHED" | "OUT_OF_STOCK" | "ARCHIVED";
  salesCount: number;
  coverImage: string;
  categoryName: string;
}

interface BookListResponse {
  books: BookItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const money = (n: number, cur = "INR") => {
  const val = (n || 0).toFixed(2);
  return cur === "USD" ? `$${val}` : `₹${val}`;
};

export function BookListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [stock, setStock] = useState("ALL");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleExport = async (fmt: "json" | "csv") => {
    setDownloading(true);
    try {
      await api.download(`/admin/books/export?format=${fmt}`, `soulbody-books-export.${fmt}`);
    } catch {
      alert("Failed to export book data");
    } finally {
      setDownloading(false);
    }
  };

  const { data, isLoading } = useQuery<BookListResponse>({
    queryKey: ["admin", "books", { page, search, status, category, stock }],
    queryFn: () =>
      api.get<BookListResponse>(
        `/admin/books?page=${page}&limit=10&search=${encodeURIComponent(search)}&status=${status}&category=${category}&stock=${stock}`
      ),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/books/${id}/duplicate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "books"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/books/${id}`),
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "books"] });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Book Management"
        description="Catalog, inventory, pricing, export, and fulfillment for publications and printed volumes."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Download Book Data */}
            <div className="flex items-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-1">
              <span className="px-2 text-[0.7rem] uppercase tracking-wider text-[var(--admin-text-muted)] font-semibold">
                Download:
              </span>
              <button
                type="button"
                disabled={downloading}
                onClick={() => handleExport("json")}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--admin-text-secondary)] hover:bg-[var(--admin-background)] hover:text-white transition-colors"
                title="Download all books and inventory as JSON"
              >
                {downloading ? "…" : "JSON"}
              </button>
              <span className="text-[var(--admin-border)]">|</span>
              <button
                type="button"
                disabled={downloading}
                onClick={() => handleExport("csv")}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--admin-text-secondary)] hover:bg-[var(--admin-background)] hover:text-white transition-colors"
                title="Download all books and inventory as CSV spreadsheet"
              >
                {downloading ? "…" : "CSV"}
              </button>
            </div>

            <Link to="/admin/books/inventory">
              <Button size="sm" variant="outline">
                📦 Quick Inventory
              </Button>
            </Link>
            <Link to="/admin/books/categories">
              <Button size="sm" variant="outline">
                Categories
              </Button>
            </Link>
            <Link to="/admin/books/new">
              <Button size="sm" variant="primary">
                + Add New Book
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by title, author, SKU, or ISBN…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="min-h-[40px] flex-1 min-w-[240px] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)] focus:outline-none focus:border-[var(--admin-accent)]"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="min-h-[40px] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text-primary)] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
          <select
            value={stock}
            onChange={(e) => {
              setStock(e.target.value);
              setPage(1);
            }}
            className="min-h-[40px] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text-primary)] focus:outline-none"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="in_stock">In Stock (&gt; 0)</option>
            <option value="low_stock">Low Stock (≤ threshold)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
        </div>
      </Card>

      {/* Books Table */}
      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-muted)]">Loading books from MongoDB…</div>
        ) : !data?.books?.length ? (
          <div className="py-12 text-center">
            <p className="text-[var(--admin-text-secondary)]">No books found in catalog.</p>
            <Link to="/admin/books/new" className="mt-3 inline-block">
              <Button size="sm" variant="primary">Add Your First Book</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)]/50 text-[0.75rem] text-[var(--admin-text-muted)] uppercase">
                  <th className="pb-3 font-semibold">Book</th>
                  <th className="pb-3 font-semibold">SKU / ISBN</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Price</th>
                  <th className="pb-3 font-semibold">Stock</th>
                  <th className="pb-3 font-semibold">Sales</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]/30">
                {data.books.map((bk) => (
                  <tr key={bk._id} className="hover:bg-[rgba(237,231,218,0.03)]">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={bk.coverImage || "/aao-part-one.png"}
                          alt={bk.title}
                          className="h-14 w-10 shrink-0 rounded object-cover border border-[var(--admin-border)]/40 shadow-sm"
                        />
                        <div className="min-w-0 max-w-[240px]">
                          <div className="font-medium text-[var(--admin-text-primary)] truncate">{bk.title}</div>
                          <div className="text-xs text-[var(--admin-text-muted)] truncate">{bk.authorName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-xs font-mono text-[var(--admin-text-secondary)]">
                      <div>{bk.sku}</div>
                      {bk.isbn && <div className="text-[var(--admin-text-muted)]">{bk.isbn}</div>}
                    </td>
                    <td className="py-3 text-xs text-[var(--admin-text-secondary)]">{bk.categoryName}</td>
                    <td className="py-3 font-semibold text-[var(--admin-text-primary)]">
                      {bk.salePrice ? (
                        <div>
                          <span className="text-[var(--admin-accent)]">
                            {money(bk.salePrice, bk.priceINR ? "INR" : bk.currency)}
                          </span>
                          <span className="ml-1.5 text-xs line-through text-[var(--admin-text-muted)]">
                            {money(bk.price, bk.priceINR ? "INR" : bk.currency)}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span>{money(bk.priceINR ?? bk.price, bk.priceINR ? "INR" : bk.currency)}</span>
                          {bk.priceUSD && (
                            <span className="block text-[0.72rem] text-[var(--admin-text-muted)] font-mono">
                              ${bk.priceUSD.toFixed(2)} USD
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3">
                      <Badge
                        tone={
                          bk.stockQuantity <= 0
                            ? "bad"
                            : bk.stockQuantity <= bk.lowStockThreshold
                            ? "warn"
                            : "good"
                        }
                      >
                        {bk.stockQuantity <= 0 ? "Out of stock" : `${bk.stockQuantity} in stock`}
                      </Badge>
                    </td>
                    <td className="py-3 text-xs font-semibold text-[var(--admin-text-secondary)]">
                      {bk.salesCount || 0}
                    </td>
                    <td className="py-3">
                      <Badge tone={bk.status === "PUBLISHED" ? "good" : bk.status === "DRAFT" ? "neutral" : "bad"}>
                        {bk.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/admin/books/${bk._id}`}>
                          <Button size="sm" variant="ghost">Edit</Button>
                        </Link>
                        <a href={`/books/${bk.slug}`} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost">Store Page</Button>
                        </a>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => duplicateMutation.mutate(bk._id)}
                          title="Duplicate book record"
                        >
                          Duplicate
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleteId(bk._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data?.pagination && (
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onPageChange={setPage}
          />
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Book">
        <p className="text-[var(--admin-text-secondary)] text-sm mb-6">
          Are you sure you want to delete this book record? This will permanently remove it from MongoDB.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
          >
            Confirm Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
