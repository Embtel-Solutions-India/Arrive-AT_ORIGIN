import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Button, Card, Field, Modal, PageHeader, Textarea } from "../../components/ui";

interface BookCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  bookCount: number;
}

export function BookCategoriesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading } = useQuery<{ categories: BookCategory[] }>({
    queryKey: ["admin", "book-categories"],
    queryFn: () => api.get<{ categories: BookCategory[] }>("/admin/book-categories"),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; slug?: string; description?: string }) =>
      api.post("/admin/book-categories", payload),
    onSuccess: () => {
      setModalOpen(false);
      setName("");
      setSlug("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["admin", "book-categories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/book-categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "book-categories"] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Book Categories"
        description="Classify publications into series, monographs, and thematic groupings."
        action={
          <div className="flex items-center gap-3">
            <Link to="/admin/books">
              <Button size="sm" variant="outline">
                ← Back to Books
              </Button>
            </Link>
            <Button size="sm" variant="primary" onClick={() => setModalOpen(true)}>
              + Add Category
            </Button>
          </div>
        }
      />

      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-muted)]">Loading categories…</div>
        ) : !data?.categories?.length ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-secondary)]">No categories defined yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)]/50 text-[0.75rem] text-[var(--admin-text-muted)] uppercase">
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Slug</th>
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold">Books Count</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]/30">
                {data.categories.map((c) => (
                  <tr key={c._id} className="hover:bg-[rgba(237,231,218,0.03)]">
                    <td className="py-3 font-medium text-[var(--admin-text-primary)]">{c.name}</td>
                    <td className="py-3 font-mono text-xs text-[var(--admin-text-muted)]">{c.slug}</td>
                    <td className="py-3 text-xs text-[var(--admin-text-secondary)] max-w-sm truncate">
                      {c.description || "—"}
                    </td>
                    <td className="py-3 text-xs font-semibold text-[var(--admin-accent)]">
                      {c.bookCount} book(s)
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm(`Delete category "${c.name}"?`)) {
                            deleteMutation.mutate(c._id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Book Category">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name) return;
            createMutation.mutate({ name, slug: slug || undefined, description });
          }}
          className="space-y-4"
        >
          <Field label="Category Name *" placeholder="e.g. AAO Series" value={name} onChange={(e) => setName(e.target.value)} />
          <Field label="Slug (Optional)" placeholder="e.g. aao-series" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Textarea label="Description" placeholder="Optional details…" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending || !name}>
              Save Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
