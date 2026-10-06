import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Button, Modal, Field, Textarea } from "./ui";

export interface MediaItem {
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

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, item?: MediaItem) => void;
  title?: string;
  currentValue?: string;
}

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  title = "Select Image from Media Library",
  currentValue,
}: MediaPickerModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneInputRef = useRef<HTMLInputElement>(null);

  // Active Tab: "library" or "upload"
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // Drag and Drop state
  const [isDragging, setIsDragging] = useState(false);

  // Edit / Update Form State
  const [editTitle, setEditTitle] = useState("");
  const [editAltText, setEditAltText] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editSeoDescription, setEditSeoDescription] = useState("");
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Query Media Library
  const { data: mediaData, isLoading } = useQuery<MediaResponse>({
    queryKey: ["admin", "media-picker", { search }],
    queryFn: () =>
      api.get<MediaResponse>(
        `/admin/media?page=1&limit=48&search=${encodeURIComponent(search)}`
      ),
    enabled: open,
  });

  const mediaList = mediaData?.media || [];

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: (files: FileList | File[]) => {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }
      return api.upload<{ media: MediaItem[] }>("/admin/media/upload", formData);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "media-picker"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
      setUploadError("");
      setActiveTab("library");

      // Auto-select the newly uploaded file if available
      if (res?.media && res.media.length > 0) {
        const newest = res.media[0];
        handleSelectItem(newest);
      }
    },
    onError: (err: any) => {
      setUploadError(err?.message || "Failed to upload image from browser.");
    },
  });

  // Update Media Details Mutation
  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; data: any }) =>
      api.put<{ media: MediaItem }>(`/admin/media/${payload.id}`, payload.data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "media-picker"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2500);
      if (res?.media) {
        setSelectedItem((prev) => (prev ? { ...prev, ...res.media } : res.media));
      }
    },
  });

  // Delete Media Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/media/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "media-picker"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
      setSelectedItem(null);
    },
  });

  const handleSelectItem = (item: MediaItem) => {
    setSelectedItem(item);
    setEditTitle(item.title || item.originalName || "");
    setEditAltText(item.altText || "");
    setEditCaption(item.caption || "");
    setEditSeoDescription(item.seoDescription || "");
    setSaveFeedback(false);
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (files && files.length > 0) {
      uploadMutation.mutate(files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadMutation.mutate(e.dataTransfer.files);
    }
  };

  const handleSaveDetails = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedItem) return;
    updateMutation.mutate({
      id: selectedItem._id,
      data: {
        title: editTitle,
        altText: editAltText,
        caption: editCaption,
        seoDescription: editSeoDescription,
      },
    });
  };

  const handleConfirmSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem.url, selectedItem);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-5xl">
      <div className="flex flex-col h-[75vh] max-h-[750px] min-h-[500px]">
        {/* Top Controls: Tabs & Upload Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--admin-border)]/60 flex-shrink-0">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--admin-background)] border border-[var(--admin-border)]">
            <button
              type="button"
              onClick={() => setActiveTab("library")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "library"
                  ? "bg-[var(--admin-accent)] text-[#0B0D13] font-semibold shadow-sm"
                  : "text-[var(--admin-text-secondary)] hover:text-white"
              }`}
            >
              <span>🖼️</span>
              <span>Media Library</span>
              <span className="text-[0.65rem] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">
                {mediaList.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "upload"
                  ? "bg-[var(--admin-accent)] text-[#0B0D13] font-semibold shadow-sm"
                  : "text-[var(--admin-text-secondary)] hover:text-white"
              }`}
            >
              <span>⬆️</span>
              <span>Upload from Browser</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "library" && (
              <>
                <input
                  type="text"
                  placeholder="Search media files..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 py-1.5 text-xs text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)] focus:outline-none focus:border-[var(--admin-accent)] w-48 sm:w-60"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  className="text-xs"
                >
                  {uploadMutation.isPending ? "Uploading…" : "+ Upload from Browser"}
                </Button>
              </>
            )}
          </div>
        </div>

        {uploadError && (
          <div className="mt-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300 flex-shrink-0">
            {uploadError}
          </div>
        )}

        {/* Tab 1: MEDIA LIBRARY (Browse, Select & Edit/Update) */}
        {activeTab === "library" && (
          <div className="flex-1 min-h-0 pt-3 grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Grid of Images (8 cols when inspector active, 12 cols when empty) */}
            <div
              className={`${
                selectedItem ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"
              } overflow-y-auto pr-1 min-h-0 h-full`}
            >
              {isLoading ? (
                <div className="py-20 text-center text-xs text-[var(--admin-text-muted)]">
                  Loading assets from media library…
                </div>
              ) : mediaList.length === 0 ? (
                /* Interactive Empty State with Direct Browser Upload Dropzone */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`h-full min-h-[300px] rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center text-center transition-all ${
                    isDragging
                      ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]/10 scale-[0.99]"
                      : "border-[var(--admin-border)] bg-[var(--admin-background)]/50 hover:border-[var(--admin-border)]/80"
                  }`}
                >
                  <div className="h-16 w-16 rounded-2xl bg-[var(--admin-accent)]/10 border border-[var(--admin-accent)]/30 flex items-center justify-center text-3xl mb-4 text-[var(--admin-accent)]">
                    ⬆️
                  </div>
                  <h3 className="font-display text-base font-semibold text-[var(--admin-text-primary)]">
                    No Media Files Uploaded Yet
                  </h3>
                  <p className="text-xs text-[var(--admin-text-muted)] mt-1.5 max-w-md">
                    Drag and drop photos, book covers, or banners directly from your browser, or browse files on your computer.
                  </p>

                  <input
                    ref={dropzoneInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />

                  <div className="mt-5 flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => dropzoneInputRef.current?.click()}
                      disabled={uploadMutation.isPending}
                      className="text-xs"
                    >
                      {uploadMutation.isPending ? "Uploading…" : "Browse from Computer"}
                    </Button>
                  </div>
                  <span className="text-[0.68rem] text-[var(--admin-text-muted)] mt-2">
                    Supports JPG, PNG, WEBP, GIF, SVG up to 20MB
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {mediaList.map((m) => {
                    const isSelected = selectedItem?._id === m._id;
                    const isCurrent = currentValue === m.url;
                    return (
                      <div
                        key={m._id}
                        onClick={() => handleSelectItem(m)}
                        onDoubleClick={() => {
                          onSelect(m.url, m);
                          onClose();
                        }}
                        className={`group relative rounded-xl overflow-hidden border aspect-square cursor-pointer transition-all bg-[var(--admin-background)] ${
                          isSelected
                            ? "border-[var(--admin-accent)] ring-2 ring-[var(--admin-accent)]/40 shadow-lg"
                            : "border-[var(--admin-border)] hover:border-white/30"
                        }`}
                      >
                        <img
                          src={m.url}
                          alt={m.altText || m.originalName}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />

                        {/* Current badge */}
                        {isCurrent && (
                          <div className="absolute top-1.5 left-1.5 rounded-full bg-emerald-500/90 text-white text-[0.62rem] px-2 py-0.5 font-bold shadow">
                            Active
                          </div>
                        )}

                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-[var(--admin-accent)] text-[#0B0D13] flex items-center justify-center text-xs font-bold shadow">
                            ✓
                          </div>
                        )}

                        {/* Bottom file overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-[0.68rem] text-white/90 truncate opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                          <span className="truncate">{m.originalName}</span>
                          <span className="text-white/60 font-mono text-[0.6rem] ml-1">
                            {formatBytes(m.size)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Inspector & Edit / Update Details Panel */}
            {selectedItem && (
              <div className="lg:col-span-5 xl:col-span-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3.5 flex flex-col justify-between overflow-y-auto min-h-0 h-full">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--admin-border)]/50 pb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--admin-text-primary)]">
                      Asset Details & Edit
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(null)}
                      className="text-xs text-[var(--admin-text-muted)] hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Selected Preview Box */}
                  <div className="rounded-xl overflow-hidden border border-[var(--admin-border)] bg-black/40 aspect-video relative flex items-center justify-center">
                    <img
                      src={selectedItem.url}
                      alt={selectedItem.altText || selectedItem.originalName}
                      className="h-full w-full object-contain"
                    />
                    <a
                      href={selectedItem.url}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute top-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-[0.65rem] text-white/80 hover:text-white hover:bg-black"
                    >
                      ↗ View Full
                    </a>
                  </div>

                  {/* Metadata Summary */}
                  <div className="text-[0.7rem] text-[var(--admin-text-muted)] space-y-0.5 font-mono">
                    <div className="truncate">
                      <strong>File:</strong> {selectedItem.originalName}
                    </div>
                    <div>
                      <strong>Size:</strong> {formatBytes(selectedItem.size)} • {selectedItem.mimeType}
                    </div>
                    <div>
                      <strong>Uploaded:</strong>{" "}
                      {new Date(selectedItem.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {saveFeedback && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-300 font-medium">
                      ✓ Image details updated successfully!
                    </div>
                  )}

                  {/* Edit / Update Form Fields */}
                  <form onSubmit={handleSaveDetails} className="space-y-2.5 pt-1">
                    <Field
                      label="Title / Display Name"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="e.g. Hero Cover Image"
                      className="!mb-2"
                    />

                    <Field
                      label="Alt Text (SEO & Accessibility) *"
                      value={editAltText}
                      onChange={(e) => setEditAltText(e.target.value)}
                      placeholder="Descriptive alt text for Google SEO"
                      helperText="Essential for SEO ranking & screen readers"
                      className="!mb-2"
                    />

                    <Textarea
                      label="Caption / Subtitle"
                      rows={2}
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      placeholder="Optional caption displayed under image"
                      className="!mb-2"
                    />

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        disabled={updateMutation.isPending}
                        className="text-xs flex-1"
                      >
                        {updateMutation.isPending ? "Updating…" : "Update Details"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this media asset?")) {
                            deleteMutation.mutate(selectedItem._id);
                          }
                        }}
                        className="rounded-xl px-2.5 py-1.5 text-xs text-rose-400 hover:bg-rose-400/10 font-medium"
                        title="Delete from Library"
                      >
                        Delete
                      </button>
                    </div>
                  </form>
                </div>

                {/* Final Selection Confirmation Button */}
                <div className="pt-3 border-t border-[var(--admin-border)]/50 mt-3">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmSelect}
                    className="w-full text-xs font-semibold py-2"
                  >
                    ✓ Use This Image
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: UPLOAD FROM BROWSER (Direct Drag-and-Drop Dropzone) */}
        {activeTab === "upload" && (
          <div className="flex-1 min-h-0 pt-3 flex flex-col justify-center">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center text-center transition-all ${
                isDragging
                  ? "border-[var(--admin-accent)] bg-[var(--admin-accent)]/10 scale-[0.99]"
                  : "border-[var(--admin-border)] bg-[var(--admin-background)] hover:border-[var(--admin-border)]/80"
              }`}
            >
              <div className="h-20 w-20 rounded-2xl bg-[var(--admin-accent)]/10 border border-[var(--admin-accent)]/30 flex items-center justify-center text-4xl mb-4 text-[var(--admin-accent)]">
                ☁️
              </div>

              <h3 className="font-display text-lg font-semibold text-[var(--admin-text-primary)]">
                Upload Images Directly from Browser
              </h3>
              <p className="text-xs text-[var(--admin-text-muted)] mt-1.5 max-w-md">
                Drag and drop your image files here, or click the button below to browse photos from your computer or device.
              </p>

              <input
                ref={dropzoneInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />

              <div className="mt-6 flex flex-col items-center gap-3">
                <Button
                  size="md"
                  variant="primary"
                  onClick={() => dropzoneInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  className="px-6 text-xs font-semibold"
                >
                  {uploadMutation.isPending ? "Uploading Files…" : "📁 Choose Files to Upload"}
                </Button>

                <span className="text-[0.72rem] text-[var(--admin-text-muted)]">
                  Supports JPEG, PNG, WEBP, GIF, SVG (up to 20MB per image)
                </span>
              </div>

              {uploadMutation.isPending && (
                <div className="mt-4 w-full max-w-xs">
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--admin-accent)] animate-pulse w-3/4 rounded-full"></div>
                  </div>
                  <span className="text-[0.68rem] text-[var(--admin-accent)] mt-1.5 block">
                    Uploading and generating optimized URLs…
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Bottom Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--admin-border)]/60 mt-3 flex-shrink-0 text-xs">
          <span className="text-[var(--admin-text-muted)]">
            {selectedItem
              ? `Selected: ${selectedItem.originalName}`
              : "Tip: Click an asset to edit metadata or double-click to insert immediately."}
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            {selectedItem && (
              <Button size="sm" variant="primary" onClick={handleConfirmSelect}>
                Select Image
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
