import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Button, Card, Field, Modal, PageHeader, Textarea } from "../../components/ui";

interface Tag {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export function BlogTagsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading } = useQuery<{ tags: Tag[] }>({
    queryKey: ["admin", "blog-tags"],
    queryFn: () => api.get<{ tags: Tag[] }>("/admin/blog-tags"),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; slug?: string; description?: string }) =>
      api.post("/admin/blog-tags", payload),
    onSuccess: () => {
      setModalOpen(false);
      setName("");
      setSlug("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["admin", "blog-tags"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/blog-tags/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "blog-tags"] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog Tags"
        description="Granular topics and keywords attached to articles."
        action={
          <div className="flex items-center gap-3">
            <Link to="/admin/blog">
              <Button size="sm" variant="outline">
                ← Back to Posts
              </Button>
            </Link>
            <Button size="sm" variant="primary" onClick={() => setModalOpen(true)}>
              + Add Tag
            </Button>
          </div>
        }
      />

      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-muted)]">Loading tags…</div>
        ) : !data?.tags?.length ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-secondary)]">No tags defined yet.</div>
        ) : (
          <div className="flex flex-wrap gap-2.5 p-2">
            {data.tags.map((t) => (
              <div
                key={t._id}
                className="flex items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 py-1.5 text-sm"
              >
                <span className="font-medium text-[var(--admin-text-primary)]">#{t.name}</span>
                <span className="font-mono text-xs text-[var(--admin-text-muted)]">({t.slug})</span>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(t._id)}
                  className="text-xs text-[var(--admin-text-muted)] hover:text-rose-400 ml-1"
                  title="Delete tag"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Blog Tag">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name) return;
            createMutation.mutate({ name, slug: slug || undefined, description });
          }}
          className="space-y-4"
        >
          <Field label="Tag Name *" placeholder="e.g. Concept Clearing" value={name} onChange={(e) => setName(e.target.value)} />
          <Field label="Slug (Optional)" placeholder="e.g. concept-clearing" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Textarea label="Description" placeholder="Optional context…" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending || !name}>
              Save Tag
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
