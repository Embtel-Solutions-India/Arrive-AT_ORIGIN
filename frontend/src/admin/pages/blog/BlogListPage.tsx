import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Badge, Button, Card, Modal, PageHeader, Pagination } from "../../components/ui";

interface BlogItem {
  _id: string;
  title: string;
  slug: string;
  authorName: string;
  categoryName: string;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
  publishDate?: string;
  updatedAt: string;
  isFeatured: boolean;
  readTime?: string;
}

interface BlogListResponse {
  blogs: BlogItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function BlogListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleExport = async (fmt: "json" | "csv") => {
    setDownloading(true);
    try {
      await api.download(`/admin/blogs/export?format=${fmt}`, `soulbody-blogs-export.${fmt}`);
    } catch {
      alert("Failed to export blog data");
    } finally {
      setDownloading(false);
    }
  };

  const { data, isLoading } = useQuery<BlogListResponse>({
    queryKey: ["admin", "blogs", { page, search, status, category }],
    queryFn: () =>
      api.get<BlogListResponse>(
        `/admin/blogs?page=${page}&limit=10&search=${encodeURIComponent(search)}&status=${status}&category=${category}`
      ),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/blogs/${id}/publish`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] }),
  });

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/blogs/${id}/unpublish`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/blogs/${id}/duplicate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/blogs/${id}`),
    onSuccess: () => {
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: string }) =>
      api.post(`/admin/blogs/bulk`, { ids, action }),
    onSuccess: () => {
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] });
    },
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && data?.blogs) {
      setSelectedIds(data.blogs.map((b) => b._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog CMS"
        description="Create, manage, export, and publish metaphysical essays, teachings, and reflections."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-1">
              <span className="px-2 text-[0.7rem] uppercase tracking-wider text-[var(--admin-text-muted)] font-semibold">
                Download:
              </span>
              <button
                type="button"
                disabled={downloading}
                onClick={() => handleExport("json")}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--admin-text-secondary)] hover:bg-[var(--admin-background)] hover:text-white transition-colors"
                title="Download all blog posts as JSON"
              >
                {downloading ? "…" : "JSON"}
              </button>
              <span className="text-[var(--admin-border)]">|</span>
              <button
                type="button"
                disabled={downloading}
                onClick={() => handleExport("csv")}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--admin-text-secondary)] hover:bg-[var(--admin-background)] hover:text-white transition-colors"
                title="Download all blog posts as CSV spreadsheet"
              >
                {downloading ? "…" : "CSV"}
              </button>
            </div>

            <Link to="/admin/blog/categories">
              <Button size="sm" variant="outline">
                Categories
              </Button>
            </Link>
            <Link to="/admin/blog/tags">
              <Button size="sm" variant="outline">
                Tags
              </Button>
            </Link>
            <Link to="/admin/blog/new">
              <Button size="sm" variant="primary">
                + Add New Post
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <Card>
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-1 flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto min-w-0">
            <input
              type="text"
              placeholder="Search posts by title, author, keyword…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="min-h-[40px] flex-1 w-full sm:w-auto min-w-0 sm:min-w-[220px] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)] focus:border-[var(--admin-accent)] focus:outline-none"
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
              <option value="SCHEDULED">Scheduled</option>
            </select>
          </div>

          {/* Bulk actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-[var(--admin-accent)]/30 bg-[var(--admin-accent)]/10 px-3 py-1.5 text-xs text-[var(--admin-text-primary)]">
              <span>{selectedIds.length} selected</span>
              <button
                type="button"
                onClick={() => bulkMutation.mutate({ ids: selectedIds, action: "publish" })}
                className="font-medium text-[var(--admin-accent)] hover:underline ml-2"
              >
                Publish
              </button>
              <button
                type="button"
                onClick={() => bulkMutation.mutate({ ids: selectedIds, action: "unpublish" })}
                className="font-medium text-[var(--admin-text-secondary)] hover:underline ml-2"
              >
                Unpublish
              </button>
              <button
                type="button"
                onClick={() => bulkMutation.mutate({ ids: selectedIds, action: "delete" })}
                className="font-medium text-[var(--admin-danger)] hover:underline ml-2"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Posts Table */}
      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-muted)]">Loading posts from MongoDB…</div>
        ) : !data?.blogs?.length ? (
          <div className="py-12 text-center">
            <p className="text-[var(--admin-text-secondary)]">No blog posts found matching your criteria.</p>
            <Link to="/admin/blog/new" className="mt-3 inline-block">
              <Button size="sm" variant="primary">Create First Post</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)]/50 text-[0.75rem] text-[var(--admin-text-muted)] uppercase">
                  <th className="w-8 pb-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === data.blogs.length && data.blogs.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-[var(--admin-border)]"
                    />
                  </th>
                  <th className="pb-3 font-semibold">Post Title</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Author</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Published</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]/30">
                {data.blogs.map((b) => (
                  <tr key={b._id} className="hover:bg-[rgba(237,231,218,0.03)]">
                    <td className="py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(b._id)}
                        onChange={() => handleToggleSelect(b._id)}
                        className="rounded border-[var(--admin-border)]"
                      />
                    </td>
                    <td className="py-3.5 max-w-[320px]">
                      <div className="flex items-center gap-2">
                        {b.isFeatured && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[0.65rem] font-semibold text-amber-300">
                            ★ Featured
                          </span>
                        )}
                        <span className="font-medium text-[var(--admin-text-primary)] truncate">{b.title}</span>
                      </div>
                      <div className="text-[0.75rem] text-[var(--admin-text-muted)] font-mono truncate mt-0.5">
                        /blog/{b.slug}
                      </div>
                    </td>
                    <td className="py-3.5 text-[var(--admin-text-secondary)]">{b.categoryName}</td>
                    <td className="py-3.5 text-[var(--admin-text-secondary)]">{b.authorName}</td>
                    <td className="py-3.5">
                      <Badge tone={b.status === "PUBLISHED" ? "good" : b.status === "DRAFT" ? "neutral" : "info"}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-xs text-[var(--admin-text-muted)]">
                      {b.publishDate ? new Date(b.publishDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/admin/blog/${b._id}`}>
                          <Button size="sm" variant="ghost">Edit</Button>
                        </Link>
                        <a href={`/blog/${b.slug}`} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost">Preview</Button>
                        </a>
                        {b.status === "PUBLISHED" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => unpublishMutation.mutate(b._id)}
                            title="Unpublish post"
                          >
                            Unpublish
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => publishMutation.mutate(b._id)}
                            title="Publish now"
                          >
                            Publish
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => duplicateMutation.mutate(b._id)}
                          title="Duplicate post"
                        >
                          Duplicate
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleteId(b._id)}
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
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Blog Post"
      >
        <p className="text-[var(--admin-text-secondary)] text-sm mb-6">
          Are you sure you want to permanently delete this blog post? This action cannot be undone.
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
