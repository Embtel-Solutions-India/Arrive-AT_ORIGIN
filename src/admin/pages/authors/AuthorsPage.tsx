import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Button, Card, Field, Modal, PageHeader, Textarea } from "../../components/ui";

interface Author {
  _id: string;
  name: string;
  slug: string;
  biography?: string;
  profileImage?: string;
  website?: string;
  socialLinks?: {
    instagram?: string;
    youtube?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export function AuthorsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [biography, setBiography] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [linkedin, setLinkedin] = useState("");

  const { data, isLoading } = useQuery<{ authors: Author[] }>({
    queryKey: ["admin", "authors"],
    queryFn: () => api.get<{ authors: Author[] }>("/admin/authors"),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editingAuthor) {
        return api.put(`/admin/authors/${editingAuthor._id}`, payload);
      } else {
        return api.post("/admin/authors", payload);
      }
    },
    onSuccess: () => {
      setModalOpen(false);
      setEditingAuthor(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "authors"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/authors/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "authors"] }),
  });

  const openCreate = () => {
    setEditingAuthor(null);
    setName("");
    setSlug("");
    setBiography("");
    setProfileImage("/dr-alka-chopra-madan.png");
    setWebsite("");
    setInstagram("");
    setYoutube("");
    setLinkedin("");
    setModalOpen(true);
  };

  const openEdit = (author: Author) => {
    setEditingAuthor(author);
    setName(author.name);
    setSlug(author.slug);
    setBiography(author.biography || "");
    setProfileImage(author.profileImage || "/dr-alka-chopra-madan.png");
    setWebsite(author.website || "");
    setInstagram(author.socialLinks?.instagram || "");
    setYoutube(author.socialLinks?.youtube || "");
    setLinkedin(author.socialLinks?.linkedin || "");
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Author Profiles"
        description="Manage writer credentials, biographies, and author attributions across books and articles."
        action={
          <Button size="sm" variant="primary" onClick={openCreate}>
            + Add Author
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-3 py-12 text-center text-sm text-[var(--admin-text-muted)]">Loading authors…</div>
        ) : !data?.authors?.length ? (
          <div className="col-span-3 py-12 text-center text-sm text-[var(--admin-text-secondary)]">No authors registered yet.</div>
        ) : (
          data.authors.map((a) => (
            <Card key={a._id} className="flex flex-col justify-between min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-3.5 mb-3 min-w-0">
                  <img
                    src={a.profileImage || "/dr-alka-chopra-madan.png"}
                    alt={a.name}
                    className="h-14 w-14 shrink-0 rounded-full object-cover border border-[var(--admin-border)]"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-[var(--admin-text-primary)] text-base truncate">{a.name}</h3>
                    <p className="font-mono text-xs text-[var(--admin-text-muted)] truncate">/{a.slug}</p>
                  </div>
                </div>
                <p className="text-xs text-[var(--admin-text-secondary)] line-clamp-3 leading-relaxed mb-4">
                  {a.biography || "No biography provided."}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--admin-border)]/50 pt-3 text-xs">
                <span className="text-[var(--admin-accent)]">{a.website || "Author"}</span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(a)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (confirm(`Delete author "${a.name}"?`)) {
                        deleteMutation.mutate(a._id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingAuthor ? "Edit Author" : "New Author Profile"}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name) return;
            saveMutation.mutate({
              name,
              slug: slug || undefined,
              biography,
              profileImage,
              website,
              socialLinks: { instagram, youtube, linkedin },
            });
          }}
          className="space-y-4"
        >
          <Field label="Author Name *" placeholder="e.g. Dr. Alka Chopra Madan" value={name} onChange={(e) => setName(e.target.value)} />
          <Field label="Slug (Optional)" placeholder="e.g. dr-alka-chopra-madan" value={slug} onChange={(e) => setSlug(e.target.value)} />
          <Field label="Profile Image URL" placeholder="/dr-alka-chopra-madan.png" value={profileImage} onChange={(e) => setProfileImage(e.target.value)} />
          <Field label="Website (Optional)" placeholder="https://soulbodyhealingcenter.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
          <Textarea label="Biography" placeholder="Brief author profile and background…" value={biography} onChange={(e) => setBiography(e.target.value)} rows={3} />
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Instagram" placeholder="https://instagram.com/..." value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            <Field label="YouTube" placeholder="https://youtube.com/..." value={youtube} onChange={(e) => setYoutube(e.target.value)} />
            <Field label="LinkedIn" placeholder="https://linkedin.com/..." value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saveMutation.isPending || !name}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
