import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Button, Card, Field, PageHeader, Textarea } from "../../components/ui";

export function SeoSettingsPage() {
  const queryClient = useQueryClient();

  const [siteTitle, setSiteTitle] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [canonicalDomain, setCanonicalDomain] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [robotsIndex, setRobotsIndex] = useState(true);
  const [robotsFollow, setRobotsFollow] = useState(true);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "seo-settings"],
    queryFn: () => api.get<{ settings: any }>("/admin/seo/settings"),
  });

  useEffect(() => {
    if (data?.settings) {
      const s = data.settings;
      setSiteTitle(s.siteTitle || "");
      setSiteDescription(s.siteDescription || "");
      setCanonicalDomain(s.canonicalDomain || "");
      setOgImage(s.ogImage || "");
      setTwitterHandle(s.twitterHandle || "");
      setRobotsIndex(s.robotsIndex !== false);
      setRobotsFollow(s.robotsFollow !== false);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (settings: any) => api.put("/admin/seo/settings", settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "seo-settings"] });
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 3000);
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      siteTitle,
      siteDescription,
      canonicalDomain,
      ogImage,
      twitterHandle,
      robotsIndex,
      robotsFollow,
    });
  };

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-[var(--admin-text-muted)]">Loading SEO settings…</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO & Search Engine Indexing"
        description="Global search engine defaults, Open Graph social cards, and live XML sitemap generators."
        action={
          <div className="flex items-center gap-3">
            {savedFeedback && <span className="text-xs text-emerald-400 font-semibold">✓ Settings Saved</span>}
            <Button
              size="sm"
              variant="primary"
              disabled={saveMutation.isPending}
              onClick={handleSave}
            >
              {saveMutation.isPending ? "Saving…" : "Save SEO Settings"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        <div className="space-y-6 lg:col-span-2 min-w-0">
          <Card title="Global Meta Defaults">
            <Field
              label="Default Site Title"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="Soul Body Healing Center | Arrive at Origin"
            />

            <Textarea
              label="Default Meta Description"
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              rows={3}
            />

            <Field
              label="Canonical Domain"
              value={canonicalDomain}
              onChange={(e) => setCanonicalDomain(e.target.value)}
              placeholder="https://soulbodyhealingcenter.com"
            />
          </Card>

          <Card title="Social Cards & Open Graph">
            <Field
              label="Default Social Share Image (OG Image)"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="/dr-alka-chopra-madan.png"
            />

            <Field
              label="Twitter / X Creator Handle"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value)}
              placeholder="@soulbodyorigin"
            />
          </Card>
        </div>

        <div className="space-y-6 min-w-0 admin-sticky-sidebar">
          <Card title="Robots & Indexing Controls">
            <div className="space-y-4 text-sm">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={robotsIndex}
                  onChange={(e) => setRobotsIndex(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[var(--admin-border)]"
                />
                <div>
                  <span className="font-medium text-[var(--admin-text-primary)] block">Allow Search Indexing</span>
                  <span className="text-xs text-[var(--admin-text-muted)]">Includes index directive in robots meta</span>
                </div>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={robotsFollow}
                  onChange={(e) => setRobotsFollow(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[var(--admin-border)]"
                />
                <div>
                  <span className="font-medium text-[var(--admin-text-primary)] block">Allow Link Crawling</span>
                  <span className="text-xs text-[var(--admin-text-muted)]">Includes follow directive in robots meta</span>
                </div>
              </label>
            </div>
          </Card>

          <Card title="Sitemap & Robots.txt Feeds">
            <div className="space-y-3 text-xs">
              <p className="text-[var(--admin-text-secondary)]">
                The sitemap automatically aggregates all published blog posts and active books in MongoDB.
              </p>
              <div className="rounded-xl border border-[var(--admin-border)] p-3 bg-[var(--admin-background)]">
                <span className="text-[var(--admin-text-muted)] block mb-1">Live XML Sitemap:</span>
                <a
                  href="/api/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[var(--admin-accent)] hover:underline block truncate"
                >
                  /api/sitemap.xml ↗
                </a>
              </div>
              <div className="rounded-xl border border-[var(--admin-border)] p-3 bg-[var(--admin-background)]">
                <span className="text-[var(--admin-text-muted)] block mb-1">Live Robots.txt:</span>
                <a
                  href="/api/robots.txt"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[var(--admin-accent)] hover:underline block truncate"
                >
                  /api/robots.txt ↗
                </a>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
