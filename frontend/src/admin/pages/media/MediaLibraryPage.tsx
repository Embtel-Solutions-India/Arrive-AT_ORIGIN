import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Button, Card, Field, Modal, PageHeader, Pagination, Textarea } from "../../components/ui";

interface MediaItem {
  _id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  title?: string;
  altText?: string;
  caption?: string;
  seoDescription?: string;
  customUrl?: string;
  uploadedBy?: string;
  createdAt: string;
}

interface MediaResponse {
  media: MediaItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export function MediaLibraryPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Edit fields state
  const [editTitle, setEditTitle] = useState("");
  const [editAltText, setEditAltText] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editSeoDescription, setEditSeoDescription] = useState("");
  const [editCustomUrl, setEditCustomUrl] = useState("");
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { data, isLoading } = useQuery<MediaResponse>({
    queryKey: ["admin", "media", { page, search }],
    queryFn: () =>
      api.get<MediaResponse>(
        `/admin/media?page=${page}&limit=18&search=${encodeURIComponent(search)}`
      ),
  });

  const uploadMutation = useMutation({
    mutationFn: (files: FileList) => {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      return api.upload("/admin/media/upload", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "media-picker"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "media-picker-book"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: any }) =>
      api.put(`/admin/media/${payload.id}`, payload.data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2500);
      if (res?.media) {
        setSelectedItem((prev) => (prev ? { ...prev, ...res.media } : null));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/media/${id}`),
    onSuccess: () => {
      setSelectedItem(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
    },
  });

  const handleSelectItem = (item: MediaItem) => {
    setSelectedItem(item);
    setEditTitle(item.title || item.originalName || "");
    setEditAltText(item.altText || "");
    setEditCaption(item.caption || "");
    setEditSeoDescription(item.seoDescription || "");
    setEditCustomUrl(item.customUrl || "");
    setSaveFeedback(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadMutation.mutate(e.target.files);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopyFeedback(url);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleDownload = async (item: MediaItem) => {
    setDownloading(true);
    try {
      await api.download(`/admin/media/${item._id}/download`, item.originalName || item.filename);
    } catch {
      window.open(item.url, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveDetails = () => {
    if (!selectedItem) return;
    updateMutation.mutate({
      id: selectedItem._id,
      data: {
        title: editTitle,
        altText: editAltText,
        caption: editCaption,
        seoDescription: editSeoDescription,
        customUrl: editCustomUrl,
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description="Centralized asset repository with AWS S3 storage, full SEO metadata editing, and instant downloading."
        action={
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              size="sm"
              variant="primary"
              disabled={uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadMutation.isPending ? "Uploading…" : "Upload Images"}
            </Button>
          </div>
        }
      />

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) {
            uploadMutation.mutate(e.dataTransfer.files);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 text-center transition-colors hover:border-[var(--admin-accent)] hover:bg-[rgba(237,231,218,0.03)]"
      >
        <span className="text-3xl mb-1">📁</span>
        <p className="text-sm font-medium text-[var(--admin-text-primary)]">
          Drag and drop images here, or <span className="text-[var(--admin-accent)] underline">browse files</span>
        </p>
        <p className="text-xs text-[var(--admin-text-muted)] mt-1">Direct upload to AWS S3 (PNG, JPG, WebP up to 10MB each)</p>
      </div>

      {/* Search Bar */}
      <Card>
        <input
          type="text"
          placeholder="Search media files by name, title, or alt text…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-h-[40px] w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)] focus:outline-none focus:border-[var(--admin-accent)]"
        />
      </Card>

      {/* Media Grid */}
      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-muted)]">Loading media…</div>
        ) : !data?.media?.length ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-secondary)]">No media assets found.</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {data.media.map((item) => (
              <div
                key={item._id}
                onClick={() => handleSelectItem(item)}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] transition-all hover:border-[var(--admin-accent)] aspect-square flex flex-col"
              >
                <img
                  src={item.url}
                  alt={item.altText || item.title || item.originalName}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-xs text-white">
                  <p className="truncate font-medium">{item.title || item.originalName}</p>
                  <p className="text-[0.7rem] text-slate-300">{formatBytes(item.size)}</p>
                </div>
              </div>
            ))}
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

      {/* Media Preview & Details Modal */}
      <Modal
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title="Edit Image & SEO Metadata"
        maxWidth="max-w-2xl"
      >
        {selectedItem && (
          <div className="space-y-5">
            {/* Image Preview */}
            <div className="max-h-64 overflow-hidden rounded-xl border border-[var(--admin-border)] bg-black/40 flex items-center justify-center p-2 relative group">
              <img
                src={selectedItem.url}
                alt={editAltText || selectedItem.originalName}
                className="max-h-60 object-contain mx-auto rounded"
              />
              <a
                href={selectedItem.url}
                target="_blank"
                rel="noreferrer"
                className="absolute top-3 right-3 rounded-lg bg-black/70 px-2.5 py-1 text-xs text-white hover:bg-black transition-colors"
              >
                Open Full Size ↗
              </a>
            </div>

            {/* Quick Metadata Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] p-3 text-xs text-[var(--admin-text-secondary)]">
              <div>
                <span className="text-[var(--admin-text-muted)] block text-[0.7rem]">Filename</span>
                <span className="font-medium text-[var(--admin-text-primary)] truncate block">{selectedItem.originalName}</span>
              </div>
              <div>
                <span className="text-[var(--admin-text-muted)] block text-[0.7rem]">Size & Type</span>
                <span>{formatBytes(selectedItem.size)} · {selectedItem.mimeType}</span>
              </div>
              <div>
                <span className="text-[var(--admin-text-muted)] block text-[0.7rem]">Uploaded</span>
                <span>{new Date(selectedItem.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-[var(--admin-text-muted)] block text-[0.7rem]">Storage</span>
                <span className="font-semibold text-emerald-400 uppercase">AWS S3</span>
              </div>
            </div>

            {/* Editable Fields: Title, Alt Text, Caption, SEO Meta Description, Custom URL */}
            <div className="space-y-3.5 border-t border-[var(--admin-border)] pt-4">
              <Field
                label="Image Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g. Arrive at Origin Book Cover"
                hint="Used as display title in CMS pickers and media catalogs"
              />

              <Field
                label="Alt Text (SEO & Accessibility)"
                value={editAltText}
                onChange={(e) => setEditAltText(e.target.value)}
                placeholder="e.g. Front cover of Arrive at Origin by Dr. Alka Chopra Madan"
                hint="Critical for Google Image SEO and screen readers"
              />

              <Field
                label="Image Caption (Optional)"
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="e.g. Official paperback edition published by Soul Body"
              />

              <Textarea
                label="SEO Meta Description (Optional)"
                rows={2}
                value={editSeoDescription}
                onChange={(e) => setEditSeoDescription(e.target.value)}
                placeholder="Meta description for search engines when this image is indexed or shared as social card"
              />

              <Field
                label="Custom / Alias URL (Optional)"
                value={editCustomUrl}
                onChange={(e) => setEditCustomUrl(e.target.value)}
                placeholder="e.g. /media/arrive-at-origin-cover"
                hint="Custom vanity URL or path reference"
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--admin-text-muted)] mb-1">
                  Live Asset Direct URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedItem.url}
                    className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 py-2 text-xs font-mono text-[var(--admin-text-primary)]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyUrl(selectedItem.url)}
                  >
                    {copyFeedback === selectedItem.url ? "✓ Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Actions: Delete, Download Image, Save Changes */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--admin-border)]/50 pt-4">
              <Button
                variant="danger"
                size="sm"
                className="w-full sm:w-auto"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (confirm("Delete this image? It will be permanently removed from AWS S3 and database.")) {
                    deleteMutation.mutate(selectedItem._id);
                  }
                }}
              >
                Delete File
              </Button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={downloading}
                  onClick={() => handleDownload(selectedItem)}
                >
                  {downloading ? "Downloading…" : "⬇ Download Image"}
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={updateMutation.isPending}
                  onClick={handleSaveDetails}
                >
                  {saveFeedback ? "✓ Saved!" : updateMutation.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
