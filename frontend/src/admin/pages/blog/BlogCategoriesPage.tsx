import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Button, Card, Field, Modal, PageHeader, Textarea } from "../../components/ui";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
}

export function BlogCategoriesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { data, isLoading } = useQuery<{ categories: Category[] }>({
    queryKey: ["admin", "blog-categories"],
    queryFn: () => api.get<{ categories: Category[] }>("/admin/blog-categories"),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { name: string; slug?: string; description?: string }) => {
      if (editingCat) {
        return api.put(`/admin/blog-categories/${editingCat._id}`, payload);
      } else {
        return api.post("/admin/blog-categories", payload);
      }
    },
    onSuccess: () => {
      setModalOpen(false);
      setEditingCat(null);
      setName("");
      setSlug("");
      setDescription("");
      setErrorMsg("");
      queryClient.invalidateQueries({ queryKey: ["admin", "blog-categories"] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to save category");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/blog-categories/${id}?force=true`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "blog-categories"] }),
  });

  const openCreateModal = () => {
    setEditingCat(null);
    setName("");
    setSlug("");
    setDescription("");
    setErrorMsg("");
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setErrorMsg("");
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog Categories"
        description="Organize articles by core themes. Posts are automatically filtered by category on the public blog."
        action={
          <div className="flex items-center gap-3">
            <Link to="/admin/blog">
              <Button size="sm" variant="outline">
                ← Back to Posts
              </Button>
            </Link>
            <Button size="sm" variant="primary" onClick={openCreateModal}>
              + Add Category
            </Button>
          </div>
        }
      />

      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-muted)]">Loading categories…</div>
        ) : !data?.categories?.length ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-secondary)]">
            No categories defined yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)]/50 text-[0.75rem] text-[var(--admin-text-muted)] uppercase">
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Slug</th>
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold">Articles</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]/30">
                {data.categories.map((c) => (
                  <tr key={c._id} className="hover:bg-[rgba(237,231,218,0.03)]">
                    <td className="py-3.5 font-medium text-[var(--admin-text-primary)]">{c.name}</td>
                    <td className="py-3.5 font-mono text-xs text-[var(--admin-text-muted)]">{c.slug}</td>
                    <td className="py-3.5 text-xs text-[var(--admin-text-secondary)] max-w-sm truncate">
                      {c.description || "—"}
                    </td>
                    <td className="py-3.5 text-xs font-semibold text-[var(--admin-accent)]">
                      {c.postCount} post(s)
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEditModal(c)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            if (confirm(`Delete category "${c.name}"? Existing posts will be reassigned to General.`)) {
                              deleteMutation.mutate(c._id);
                            }
                          }}
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
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCat ? "Edit Category" : "New Blog Category"}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name) return;
            saveMutation.mutate({ name, slug: slug || undefined, description });
          }}
          className="space-y-4"
        >
          {errorMsg && <p className="text-xs text-[var(--admin-danger)]">{errorMsg}</p>}
          <Field
            label="Category Name *"
            placeholder="e.g. Metaphysics"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Field
            label="Slug (Optional)"
            placeholder="e.g. metaphysics"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <Textarea
            label="Description"
            placeholder="Brief purpose of this category…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saveMutation.isPending || !name}>
              {saveMutation.isPending ? "Saving…" : "Save Category"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
