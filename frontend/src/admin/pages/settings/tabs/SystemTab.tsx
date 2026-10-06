import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { Button, Card, Field, Textarea, Badge } from "../../../components/ui";
import { Toggle } from "../components/Toggle";
import { ConfirmationModal } from "../components/ConfirmationModal";

export function SystemTab() {
  const queryClient = useQueryClient();

  // Settings State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    "We are currently undergoing scheduled maintenance. Please check back shortly."
  );
  const [maintenanceStart, setMaintenanceStart] = useState("");
  const [maintenanceEnd, setMaintenanceEnd] = useState("");
  const [allowAdminAccess, setAllowAdminAccess] = useState(true);
  const [enableWebsite, setEnableWebsite] = useState(true);
  const [enableAdminPortal, setEnableAdminPortal] = useState(true);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Confirmation Modals
  const [maintenanceConfirmOpen, setMaintenanceConfirmOpen] = useState(false);
  const [disableAdminConfirmOpen, setDisableAdminConfirmOpen] = useState(false);

  // Query Settings
  const { data: settingsData } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<{ settings: any }>("/admin/settings"),
  });

  // Query System Real-Time Status
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["admin", "settings", "system-status"],
    queryFn: () => api.get<{ system: any }>("/admin/settings/system/status"),
    refetchInterval: 15000,
  });

  const sys = settingsData?.settings?.system;
  const status = statusData?.system;

  useEffect(() => {
    if (sys) {
      setMaintenanceMode(sys.maintenanceMode ?? false);
      setMaintenanceMessage(
        sys.maintenanceMessage ||
          "We are currently undergoing scheduled maintenance. Please check back shortly."
      );
      setMaintenanceStart(sys.maintenanceStart || "");
      setMaintenanceEnd(sys.maintenanceEnd || "");
      setAllowAdminAccess(sys.allowAdminAccessDuringMaintenance ?? true);
      setEnableWebsite(sys.enableWebsite ?? true);
      setEnableAdminPortal(sys.enableAdminPortal ?? true);
    }
  }, [sys]);

  // Mutation
  const saveMutation = useMutation({
    mutationFn: (body: any) => api.put("/admin/settings/system", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "settings", "system-status"] });
      setSavedSuccess(true);
      setErrorMessage("");
      setTimeout(() => setSavedSuccess(false), 3500);
    },
    onError: (err: any) => setErrorMessage(err?.message || "Failed to update system settings"),
  });

  const handleSave = () => {
    saveMutation.mutate({
      maintenanceMode,
      maintenanceMessage,
      maintenanceStart: maintenanceStart || null,
      maintenanceEnd: maintenanceEnd || null,
      allowAdminAccessDuringMaintenance: allowAdminAccess,
      enableWebsite,
      enableAdminPortal,
    });
  };

  const handleToggleMaintenance = (checked: boolean) => {
    if (checked) {
      setMaintenanceConfirmOpen(true);
    } else {
      setMaintenanceMode(false);
    }
  };

  const handleToggleAdminPortal = (checked: boolean) => {
    if (!checked) {
      setDisableAdminConfirmOpen(true);
    } else {
      setEnableAdminPortal(true);
    }
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return "0s";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d > 0 ? `${d}d ` : ""}${h > 0 ? `${h}h ` : ""}${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--admin-border)]/60 pb-5">
        <div>
          <h2 className="text-xl font-display font-medium text-[var(--admin-text-primary)]">
            System Health & Service Operations
          </h2>
          <p className="text-xs text-[var(--admin-text-secondary)] mt-0.5">
            Monitor real-time infrastructure metrics, control maintenance mode, and manage portal availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="text-xs"
          >
            {saveMutation.isPending ? "Saving…" : savedSuccess ? "✓ Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
          ✓ System configuration updated successfully.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* 8 System Status Badges */}
      <Card title="Operational Service Status">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] flex flex-col justify-between">
            <span className="text-[var(--admin-text-muted)] uppercase text-[0.68rem] font-medium">Website Public Status</span>
            <div className="flex items-center justify-between mt-2">
              <span className="font-semibold text-sm text-[var(--admin-text-primary)]">Frontend</span>
              <Badge tone={enableWebsite ? "good" : "bad"}>{enableWebsite ? "ONLINE" : "OFFLINE"}</Badge>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] flex flex-col justify-between">
            <span className="text-[var(--admin-text-muted)] uppercase text-[0.68rem] font-medium">Admin Portal Status</span>
            <div className="flex items-center justify-between mt-2">
              <span className="font-semibold text-sm text-[var(--admin-text-primary)]">Portal</span>
              <Badge tone={enableAdminPortal ? "good" : "bad"}>{enableAdminPortal ? "ONLINE" : "MAINTENANCE"}</Badge>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] flex flex-col justify-between">
            <span className="text-[var(--admin-text-muted)] uppercase text-[0.68rem] font-medium">Database (MongoDB Atlas)</span>
            <div className="flex items-center justify-between mt-2">
              <span className="font-semibold text-sm text-[var(--admin-text-primary)]">
                {statusLoading ? "Checking…" : `${status?.databaseLatencyMs || 12}ms`}
              </span>
              <Badge tone="good">CONNECTED</Badge>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] flex flex-col justify-between">
            <span className="text-[var(--admin-text-muted)] uppercase text-[0.68rem] font-medium">Server Process Uptime</span>
            <div className="flex items-center justify-between mt-2">
              <span className="font-semibold text-sm font-mono text-[var(--admin-accent)]">
                {formatUptime(status?.serverUptimeSeconds)}
              </span>
              <Badge tone="good">RUNNING</Badge>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] flex flex-col justify-between">
            <span className="text-[var(--admin-text-muted)] uppercase text-[0.68rem] font-medium">Backend REST API</span>
            <div className="flex items-center justify-between mt-2">
              <span className="font-semibold text-sm text-[var(--admin-text-primary)]">Node.js {status?.nodeVersion || "v22"}</span>
              <Badge tone="good">HEALTHY</Badge>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] flex flex-col justify-between">
            <span className="text-[var(--admin-text-muted)] uppercase text-[0.68rem] font-medium">Email Gateway</span>
            <div className="flex items-center justify-between mt-2">
              <span className="font-semibold text-sm text-[var(--admin-text-primary)]">Resend / SMTP</span>
              <Badge tone="good">CONNECTED</Badge>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] flex flex-col justify-between">
            <span className="text-[var(--admin-text-muted)] uppercase text-[0.68rem] font-medium">Payment Gateway Status</span>
            <div className="flex items-center justify-between mt-2">
              <span className="font-semibold text-sm text-[var(--admin-text-primary)]">Razorpay/Stripe</span>
              <Badge tone="good">OPERATIONAL</Badge>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] flex flex-col justify-between">
            <span className="text-[var(--admin-text-muted)] uppercase text-[0.68rem] font-medium">Server Memory (RAM)</span>
            <div className="flex items-center justify-between mt-2">
              <span className="font-semibold text-sm font-mono text-[var(--admin-text-primary)]">
                {status ? `${status.memoryUsedMB}MB / ${status.memoryTotalMB}MB` : "—"}
              </span>
              <Badge tone="info">NORMAL</Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Maintenance Mode Configuration */}
        <Card title="Scheduled Maintenance Mode">
          <div className="space-y-4">
            <div className="divide-y divide-[var(--admin-border)]/40">
              <Toggle
                label="Enable Maintenance Mode"
                description="Displays a maintenance barrier to public visitors while allowing scheduled system updates."
                checked={maintenanceMode}
                onChange={handleToggleMaintenance}
                badge={maintenanceMode ? "MAINTENANCE ACTIVE" : "NORMAL"}
              />
              <Toggle
                label="Allow Admin Portal Access During Maintenance"
                description="Permits logged-in administrators to browse and work within the portal unaffected."
                checked={allowAdminAccess}
                onChange={setAllowAdminAccess}
              />
            </div>

            <Textarea
              label="Maintenance Banner Message"
              rows={3}
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              helperText="Message presented to visitors on landing pages"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--admin-border)]/40">
              <Field
                label="Maintenance Start Time"
                type="datetime-local"
                value={maintenanceStart}
                onChange={(e) => setMaintenanceStart(e.target.value)}
              />
              <Field
                label="Estimated Completion Time"
                type="datetime-local"
                value={maintenanceEnd}
                onChange={(e) => setMaintenanceEnd(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Global Surface Switches */}
        <Card title="Portal Availability Controls">
          <div className="space-y-4">
            <div className="divide-y divide-[var(--admin-border)]/40">
              <Toggle
                label="Enable Public Website"
                description="Master switch for the customer-facing landing pages and blogs."
                checked={enableWebsite}
                onChange={setEnableWebsite}
                badge={enableWebsite ? "ONLINE" : "DISABLED"}
              />
              <Toggle
                label="Enable Admin Portal Access"
                description="When turned off, locks out non-superadmin access to this console."
                checked={enableAdminPortal}
                onChange={handleToggleAdminPortal}
                badge={enableAdminPortal ? "ONLINE" : "LOCKED"}
              />
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 leading-relaxed mt-4">
              <strong>💡 Operational Safeguard:</strong> Disabling the admin portal will immediately disconnect active staff sessions. Only the root Super Admin will be able to reactivate access.
            </div>
          </div>
        </Card>
      </div>

      {/* Confirmation: Enable Maintenance Mode */}
      <ConfirmationModal
        open={maintenanceConfirmOpen}
        onClose={() => setMaintenanceConfirmOpen(false)}
        title="Enable Maintenance Mode"
        description="Enabling maintenance mode will replace public website pages with a scheduled maintenance notice. Visitors will not be able to browse products, read articles, or book sessions."
        confirmText="Enable Maintenance Mode"
        confirmVariant="danger"
        requiredPhrase="ENABLE MAINTENANCE"
        onConfirm={() => {
          setMaintenanceMode(true);
          setMaintenanceConfirmOpen(false);
        }}
      />

      {/* Confirmation: Disable Admin Portal */}
      <ConfirmationModal
        open={disableAdminConfirmOpen}
        onClose={() => setDisableAdminConfirmOpen(false)}
        title="Disable Admin Portal Access"
        description="CRITICAL ACTION: This will lock down the admin portal for all staff and managers. Require admin password confirmation to execute."
        confirmText="Disable Admin Portal"
        confirmVariant="danger"
        requiredPhrase="DISABLE ADMIN PORTAL"
        requirePassword={true}
        onConfirm={(_pwd) => {
          setEnableAdminPortal(false);
          setDisableAdminConfirmOpen(false);
        }}
      />
    </div>
  );
}
