import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Badge, Button, Card, PageHeader, Pagination } from "../../components/ui";

interface PurchasedBookItem {
  _id: string;
  customer?: { _id: string; name: string; email: string; phone?: string };
  customerEmail: string;
  customerName: string;
  book?: { _id: string; title: string; slug: string; coverImage: string; format: string; pdfUrl?: string };
  order: string;
  orderNumber: string;
  title: string;
  slug: string;
  format: string;
  coverImage?: string;
  authorName?: string;
  price: number;
  currency: string;
  pdfUrl?: string;
  hasPdf: boolean;
  pdfFilename?: string;
  purchasedAt: string;
}

interface PurchasedBooksResponse {
  purchasedBooks: PurchasedBookItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  stats: { totalPurchases: number };
}

export function PurchasedBooksPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useQuery<PurchasedBooksResponse>({
    queryKey: ["admin", "purchased-books", { page, search }],
    queryFn: () =>
      api.get<PurchasedBooksResponse>(
        `/admin/books/purchased?page=${page}&limit=15&search=${encodeURIComponent(search)}`
      ),
  });

  const booksWithPdf = data?.purchasedBooks?.filter((b) => b.hasPdf).length || 0;
  const booksMissingPdf = data?.purchasedBooks?.filter((b) => !b.hasPdf).length || 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchased Books & Digital Library"
        description="Monitor automated e-book fulfillment, view customer book assignments, and manage associated PDF files."
        action={
          <div className="flex items-center gap-2">
            <Link to="/admin/books">
              <Button size="sm" variant="outline">
                ← Books Catalog
              </Button>
            </Link>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              ↻ Refresh
            </Button>
          </div>
        }
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <div>
              <span className="text-xs uppercase tracking-wider text-[var(--admin-text-muted)] font-semibold block">
                Total E-Book Grants
              </span>
              <span className="text-2xl font-bold text-[var(--admin-text-primary)]">
                {data?.stats?.totalPurchases || 0}
              </span>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <span className="text-xs uppercase tracking-wider text-[var(--admin-text-muted)] font-semibold block">
                Active Ready Copies
              </span>
              <span className="text-2xl font-bold text-emerald-400">
                {booksWithPdf}
              </span>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <span className="text-xs uppercase tracking-wider text-[var(--admin-text-muted)] font-semibold block">
                Pending File Upload
              </span>
              <span className="text-2xl font-bold text-amber-400">
                {booksMissingPdf}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            placeholder="Search by customer name, email, book title, or order #…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3.5 py-2 text-sm text-[var(--admin-text-primary)] placeholder-[var(--admin-text-muted)] focus:border-[var(--admin-accent)] focus:outline-none"
          />
          {search && (
            <Button size="sm" variant="ghost" onClick={() => setSearch("")}>
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-[var(--admin-text-muted)]">Loading purchased books…</div>
        ) : !data?.purchasedBooks?.length ? (
          <div className="py-12 text-center">
            <span className="text-4xl block mb-2">📖</span>
            <p className="text-sm text-[var(--admin-text-secondary)] font-medium">
              No purchased books found matching your query
            </p>
            <p className="text-xs text-[var(--admin-text-muted)] mt-1">
              When customers complete checkout for digital editions, purchases automatically appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--admin-border)] text-xs uppercase tracking-wider text-[var(--admin-text-muted)]">
                <tr>
                  <th className="pb-3">Book & Edition</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Order #</th>
                  <th className="pb-3">Purchase Date</th>
                  <th className="pb-3">PDF File Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]/30">
                {data.purchasedBooks.map((item) => {
                  const targetBookId = item.book?._id || (typeof item.book === "string" ? item.book : "");
                  const targetSlug = item.slug || item.book?.slug || "";

                  return (
                    <tr key={item._id} className="hover:bg-[rgba(237,231,218,0.03)]">
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.coverImage || item.book?.coverImage || "/aao-part-one.png"}
                            alt={item.title}
                            className="h-14 w-10 shrink-0 rounded object-cover border border-[var(--admin-border)]/40 shadow-sm"
                          />
                          <div className="min-w-0 max-w-[220px]">
                            <div className="font-semibold text-[var(--admin-text-primary)] truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-[var(--admin-text-muted)] truncate">
                              {item.authorName || "Dr. Alka Chopra Madan"}
                            </div>
                            <span className="inline-block mt-0.5 rounded bg-[var(--admin-surface)] border border-[var(--admin-border)] px-1.5 py-0.2 text-[0.68rem] text-[var(--admin-accent)]">
                              {item.format || "E-Book"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5">
                        <div>
                          <div className="font-medium text-[var(--admin-text-primary)]">
                            {item.customerName || item.customer?.name || "Customer"}
                          </div>
                          <div className="text-xs text-[var(--admin-text-muted)]">
                            {item.customerEmail}
                          </div>
                          {item.customer?.phone && (
                            <div className="text-[0.7rem] text-[var(--admin-text-muted)]">
                              📞 {item.customer.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 font-mono text-xs">
                        <Link
                          to={`/admin/orders/${item.order}`}
                          className="text-[var(--admin-accent)] hover:underline"
                        >
                          {item.orderNumber}
                        </Link>
                      </td>

                      <td className="py-3.5 text-xs text-[var(--admin-text-secondary)] whitespace-nowrap">
                        {new Date(item.purchasedAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      <td className="py-3.5">
                        {item.hasPdf ? (
                          <div>
                            <Badge tone="good">✓ PDF Ready</Badge>
                            <span className="block text-[0.68rem] text-[var(--admin-text-muted)] font-mono truncate max-w-[150px] mt-0.5">
                              {item.pdfFilename || "attached.pdf"}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <Badge tone="warn">⚠️ Pending Upload</Badge>
                            <span className="block text-[0.68rem] text-amber-400/80 mt-0.5">
                              No PDF attached
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {targetBookId && (
                            <Link to={`/admin/books/${targetBookId}`}>
                              <Button size="sm" variant="ghost">
                                Manage File
                              </Button>
                            </Link>
                          )}
                          {targetSlug && (
                            <a
                              href={`/books/${targetSlug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="no-underline"
                            >
                              <Button size="sm" variant="ghost">
                                Store
                              </Button>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="pt-4 border-t border-[var(--admin-border)]/30">
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
