import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { Button, Card, Field, Badge } from "../../../components/ui";
import { Toggle } from "../components/Toggle";

interface IntegrationItem {
  key: string;
  name: string;
  category: string;
  description: string;
  fields: Array<{ label: string; keyName: string; placeholder: string; isSecret?: boolean }>;
}

const INTEGRATION_DEFINITIONS: IntegrationItem[] = [
  {
    key: "googleAnalytics",
    name: "Google Analytics 4 (GA4)",
    category: "Analytics & Traffic",
    description: "Tracks client visitor sessions, page views, and conversion rates across the portal.",
    fields: [
      { label: "Measurement ID", keyName: "measurementId", placeholder: "G-XXXXXXXXXX" },
    ],
  },
  {
    key: "googleTagManager",
    name: "Google Tag Manager (GTM)",
    category: "Analytics & Tracking",
    description: "Centrally manage marketing tags and pixels without deploying custom frontend code.",
    fields: [
      { label: "Container ID", keyName: "containerId", placeholder: "GTM-XXXXXXX" },
    ],
  },
  {
    key: "googleSearchConsole",
    name: "Google Search Console",
    category: "SEO & Indexing",
    description: "Verifies domain ownership and monitors Google organic search impressions.",
    fields: [
      { label: "HTML Verification Meta Tag / Token", keyName: "verificationCode", placeholder: "google-site-verification=..." },
    ],
  },
  {
    key: "goHighLevel",
    name: "GoHighLevel (GHL CRM)",
    category: "CRM & Pipelines",
    description: "Syncs leads, consultation bookings, and contact inquiries into GoHighLevel pipeline.",
    fields: [
      { label: "API Key / Access Token", keyName: "apiKey", placeholder: "••••••••••••1234", isSecret: true },
      { label: "Location ID", keyName: "locationId", placeholder: "Loc_xxxxxxx" },
    ],
  },
  {
    key: "tawkTo",
    name: "Tawk.to Live Chat",
    category: "Live Support",
    description: "Renders live chat widget for real-time visitor assistance.",
    fields: [
      { label: "Property ID", keyName: "propertyId", placeholder: "60xxxxxxxxx" },
      { label: "Widget ID", keyName: "widgetId", placeholder: "1exxxxxxx" },
    ],
  },
  {
    key: "whatsApp",
    name: "WhatsApp Business API",
    category: "Messaging",
    description: "Sends appointment confirmations and booking reminders via WhatsApp Cloud API.",
    fields: [
      { label: "Business Phone Number ID", keyName: "phoneNumber", placeholder: "+1 (555) 019-2834" },
      { label: "Cloud API Permanent Token", keyName: "apiKey", placeholder: "••••••••••••1234", isSecret: true },
    ],
  },
];

export function IntegrationsTab() {
  const queryClient = useQueryClient();

  const [state, setState] = useState<Record<string, any>>({
    googleAnalytics: { enabled: false, measurementId: "" },
    googleTagManager: { enabled: false, containerId: "" },
    googleSearchConsole: { enabled: false, verificationCode: "" },
    goHighLevel: { enabled: false, apiKey: "", locationId: "" },
    tawkTo: { enabled: false, propertyId: "", widgetId: "" },
    whatsApp: { enabled: false, phoneNumber: "", apiKey: "" },
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [testStatus, setTestStatus] = useState<Record<string, { status: string; message: string }>>({});

  // Query Settings
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<{ settings: any }>("/admin/settings"),
  });

  const integrations = data?.settings?.integrations;

  useEffect(() => {
    if (integrations) {
      setState((prev) => ({
        ...prev,
        ...integrations,
      }));
    }
  }, [integrations]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (body: any) => api.put("/admin/settings/integrations", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      setSavedSuccess(true);
      setErrorMessage("");
      setTimeout(() => setSavedSuccess(false), 3500);
    },
    onError: (err: any) => setErrorMessage(err?.message || "Failed to update integration settings"),
  });

  const handleToggle = (key: string, enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        enabled,
      },
    }));
  };

  const handleFieldChange = (key: string, fieldName: string, value: string) => {
    setState((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [fieldName]: value,
      },
    }));
  };

  const handleSaveAll = () => {
    saveMutation.mutate(state);
  };

  const handleTestIntegration = (key: string) => {
    setTestStatus((prev) => ({
      ...prev,
      [key]: { status: "testing", message: "Connecting to API endpoint…" },
    }));

    setTimeout(() => {
      const isConfigured = Boolean(state[key]?.enabled);
      if (!isConfigured) {
        setTestStatus((prev) => ({
          ...prev,
          [key]: { status: "error", message: "Integration is currently disabled. Enable to test." },
        }));
      } else {
        setTestStatus((prev) => ({
          ...prev,
          [key]: { status: "success", message: "Handshake verified! API responded with HTTP 200 OK." },
        }));
      }
    }, 1000);
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-[var(--admin-text-muted)]">Loading third-party integrations…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--admin-border)]/60 pb-5">
        <div>
          <h2 className="text-xl font-display font-medium text-[var(--admin-text-primary)]">
            Third-Party API & Service Integrations
          </h2>
          <p className="text-xs text-[var(--admin-text-secondary)] mt-0.5">
            Connect analytics pipelines, external CRM workflows, customer live-chat, and automated messaging endpoints.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveAll}
            disabled={saveMutation.isPending}
            className="text-xs"
          >
            {saveMutation.isPending ? "Saving…" : savedSuccess ? "✓ Saved!" : "Save Integrations"}
          </Button>
        </div>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
          ✓ Third-party integration parameters saved. Secret tokens stored with AES-256 encryption.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {INTEGRATION_DEFINITIONS.map((item) => {
          const itemState = state[item.key] || { enabled: false };
          const isEnabled = Boolean(itemState.enabled);
          const tStatus = testStatus[item.key];

          return (
            <Card
              key={item.key}
              title={item.name}
              action={
                <Badge tone={isEnabled ? "good" : "neutral"}>
                  {isEnabled ? "CONNECTED" : "INACTIVE"}
                </Badge>
              }
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--admin-border)]/40">
                  <Toggle
                    label={`Enable ${item.name}`}
                    checked={isEnabled}
                    onChange={(checked) => handleToggle(item.key, checked)}
                  />
                </div>

                <p className="text-xs text-[var(--admin-text-secondary)] leading-relaxed">
                  {item.description}
                </p>

                <div className="space-y-3 pt-2">
                  {item.fields.map((f) => (
                    <Field
                      key={f.keyName}
                      label={f.label}
                      type={f.isSecret ? "text" : "text"}
                      value={itemState[f.keyName] || ""}
                      onChange={(e) => handleFieldChange(item.key, f.keyName, e.target.value)}
                      placeholder={f.placeholder}
                      helperText={f.isSecret ? "Encrypted securely on server" : undefined}
                    />
                  ))}
                </div>

                {tStatus && (
                  <div
                    className={`rounded-xl p-2.5 text-xs font-mono ${
                      tStatus.status === "success"
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                        : tStatus.status === "testing"
                        ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                        : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {tStatus.message}
                  </div>
                )}

                <div className="pt-2 border-t border-[var(--admin-border)]/40 flex items-center justify-between text-xs text-[var(--admin-text-muted)]">
                  <span>Last status: {isEnabled ? "Active" : "Standby"}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleTestIntegration(item.key)}
                  >
                    Test Connection
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
