import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { Button, Card, Field, Select, Badge } from "../../../components/ui";
import { Toggle } from "../components/Toggle";
import { ConfirmationModal } from "../components/ConfirmationModal";

const TIMEOUT_OPTIONS = [
  { label: "15 minutes", value: "15" },
  { label: "30 minutes", value: "30" },
  { label: "1 hour", value: "60" },
  { label: "4 hours", value: "240" },
  { label: "8 hours", value: "480" },
  { label: "24 hours", value: "1440" },
  { label: "Custom", value: "custom" },
];

export function SessionsTab() {
  const queryClient = useQueryClient();

  // Settings State
  const [timeoutSelection, setTimeoutSelection] = useState("60");
  const [customTimeout, setCustomTimeout] = useState(60);
  const [rememberMeDays, setRememberMeDays] = useState(30);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [lockoutDurationMinutes, setLockoutDurationMinutes] = useState(15);
  const [autoLogout, setAutoLogout] = useState(true);
  const [maxActiveSessionsPerUser, setMaxActiveSessionsPerUser] = useState(5);
  const [allowMultipleDevices, setAllowMultipleDevices] = useState(true);
  const [loginNotification, setLoginNotification] = useState(true);
  const [newDeviceNotification, setNewDeviceNotification] = useState(true);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Confirmation Modals
  const [confirmRevokeSessionOpen, setConfirmRevokeSessionOpen] = useState(false);
  const [sessionToRevoke, setSessionToRevoke] = useState<string | null>(null);
  const [confirmRevokeAllOpen, setConfirmRevokeAllOpen] = useState(false);

  // Query Settings
  const { data: settingsData } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<{ settings: any }>("/admin/settings"),
  });

  // Query Active Sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["admin", "settings", "sessions"],
    queryFn: () => api.get<{ sessions: any[] }>("/admin/settings/sessions"),
    refetchInterval: 30000,
  });

  const sessions = sessionsData?.sessions || [];
  const currentSettings = settingsData?.settings?.sessions;

  useEffect(() => {
    if (currentSettings) {
      const min = currentSettings.timeoutMinutes ?? 60;
      const match = TIMEOUT_OPTIONS.find((t) => t.value === String(min));
      if (match) {
        setTimeoutSelection(String(min));
      } else {
        setTimeoutSelection("custom");
        setCustomTimeout(min);
      }
      setRememberMeDays(currentSettings.rememberMeDays ?? 30);
      setMaxLoginAttempts(currentSettings.maxLoginAttempts ?? 5);
      setLockoutDurationMinutes(currentSettings.lockoutDurationMinutes ?? 15);
      setAutoLogout(currentSettings.autoLogout ?? true);
      setMaxActiveSessionsPerUser(currentSettings.maxActiveSessionsPerUser ?? 5);
      setAllowMultipleDevices(currentSettings.allowMultipleDevices ?? true);
      setLoginNotification(currentSettings.loginNotification ?? true);
      setNewDeviceNotification(currentSettings.newDeviceNotification ?? true);
    }
  }, [currentSettings]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (body: any) => api.put("/admin/settings/sessions", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      setSavedSuccess(true);
      setErrorMessage("");
      setTimeout(() => setSavedSuccess(false), 3500);
    },
    onError: (err: any) => setErrorMessage(err?.message || "Failed to update session settings"),
  });

  const revokeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/admin/settings/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings", "sessions"] });
      setConfirmRevokeSessionOpen(false);
      setSessionToRevoke(null);
    },
  });

  const revokeAllSessionsMutation = useMutation({
    mutationFn: () => api.delete("/admin/settings/sessions/all/revoke"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings", "sessions"] });
      setConfirmRevokeAllOpen(false);
    },
  });

  const handleSave = () => {
    const finalTimeout =
      timeoutSelection === "custom" ? Number(customTimeout) : Number(timeoutSelection);

    saveMutation.mutate({
      timeoutMinutes: finalTimeout,
      rememberMeDays: Number(rememberMeDays),
      maxLoginAttempts: Number(maxLoginAttempts),
      lockoutDurationMinutes: Number(lockoutDurationMinutes),
      autoLogout,
      maxActiveSessionsPerUser: Number(maxActiveSessionsPerUser),
      allowMultipleDevices,
      loginNotification,
      newDeviceNotification,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--admin-border)]/60 pb-5">
        <div>
          <h2 className="text-xl font-display font-medium text-[var(--admin-text-primary)]">
            Session & Login Settings
          </h2>
          <p className="text-xs text-[var(--admin-text-secondary)] mt-0.5">
            Control authentication lifetime, monitor active device sessions, and handle forced logouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmRevokeAllOpen(true)}
            className="text-xs"
          >
            Logout All Sessions
          </Button>
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
          ✓ Session settings saved successfully.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* Session Rules Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Timeout & Duration Rules">
          <div className="space-y-4">
            <Select
              label="Session Inactivity Timeout"
              value={timeoutSelection}
              onChange={(e) => setTimeoutSelection(e.target.value)}
              options={TIMEOUT_OPTIONS}
            />

            {timeoutSelection === "custom" && (
              <Field
                label="Custom Timeout (Minutes)"
                type="number"
                min={5}
                max={10080}
                value={customTimeout}
                onChange={(e) => setCustomTimeout(Math.max(5, parseInt(e.target.value) || 15))}
                helperText="Specify between 5 and 10080 minutes (7 days)"
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="Remember Me Token (Days)"
                type="number"
                min={1}
                max={90}
                value={rememberMeDays}
                onChange={(e) => setRememberMeDays(Math.max(1, parseInt(e.target.value) || 30))}
                helperText="Persistent cookie duration"
              />
              <Field
                label="Max Sessions Per User"
                type="number"
                min={1}
                max={20}
                value={maxActiveSessionsPerUser}
                onChange={(e) => setMaxActiveSessionsPerUser(Math.max(1, parseInt(e.target.value) || 5))}
                helperText="Max concurrent active logins"
              />
            </div>

            <div className="divide-y divide-[var(--admin-border)]/40 pt-2">
              <Toggle
                label="Automatic Inactivity Logout"
                description="Automatically sign out users when the browser remains idle past the timeout."
                checked={autoLogout}
                onChange={setAutoLogout}
              />
              <Toggle
                label="Allow Multiple Devices Concurrently"
                description="If disabled, signing in from a new device immediately terminates prior sessions."
                checked={allowMultipleDevices}
                onChange={setAllowMultipleDevices}
              />
            </div>
          </div>
        </Card>

        <Card title="Device & Login Alerts">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="Max Consecutive Failed Logins"
                type="number"
                min={3}
                max={20}
                value={maxLoginAttempts}
                onChange={(e) => setMaxLoginAttempts(Math.max(3, parseInt(e.target.value) || 5))}
              />
              <Field
                label="Lockout Duration (Minutes)"
                type="number"
                min={1}
                max={1440}
                value={lockoutDurationMinutes}
                onChange={(e) => setLockoutDurationMinutes(Math.max(1, parseInt(e.target.value) || 15))}
              />
            </div>

            <div className="divide-y divide-[var(--admin-border)]/40 pt-2">
              <Toggle
                label="Session Login Notification"
                description="Send an email whenever an admin begins a new session."
                checked={loginNotification}
                onChange={setLoginNotification}
              />
              <Toggle
                label="New Device / IP Notification"
                description="Send immediate alert when login originates from an unrecognized device or country."
                checked={newDeviceNotification}
                onChange={setNewDeviceNotification}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Active Sessions Display Table */}
      <Card
        title="Active Device Sessions"
        action={
          <span className="text-xs text-[var(--admin-text-muted)]">
            Total Active: <strong className="text-[var(--admin-accent)]">{sessions.length}</strong>
          </span>
        }
      >
        <div className="overflow-x-auto min-w-0">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--admin-border)] text-[var(--admin-text-muted)] uppercase tracking-wider font-semibold">
              <tr>
                <th className="pb-3 px-3">Device / OS</th>
                <th className="pb-3 px-3">Browser</th>
                <th className="pb-3 px-3">IP Address</th>
                <th className="pb-3 px-3">Location</th>
                <th className="pb-3 px-3">Login Time</th>
                <th className="pb-3 px-3">Last Active</th>
                <th className="pb-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]/40 text-[var(--admin-text-primary)]">
              {sessionsLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--admin-text-muted)]">
                    Loading active sessions…
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--admin-text-muted)]">
                    No active sessions found.
                  </td>
                </tr>
              ) : (
                sessions.map((sess: any) => (
                  <tr key={sess._id || sess.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[var(--admin-text-primary)]">
                          {sess.device || "Desktop"}
                        </span>
                        {sess.isCurrent && (
                          <Badge tone="good">Current Session</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[var(--admin-text-secondary)]">
                      {sess.browser || "Chrome"}
                    </td>
                    <td className="py-3 px-3 font-mono text-[0.75rem] text-[var(--admin-accent)]">
                      {sess.ipAddress || "127.0.0.1"}
                    </td>
                    <td className="py-3 px-3 text-[var(--admin-text-secondary)]">
                      {sess.location || "Localhost / Unknown"}
                    </td>
                    <td className="py-3 px-3 text-[var(--admin-text-muted)] text-[0.72rem]">
                      {sess.createdAt ? new Date(sess.createdAt).toLocaleString() : "Just now"}
                    </td>
                    <td className="py-3 px-3 text-[var(--admin-text-muted)] text-[0.72rem]">
                      {sess.lastActive ? new Date(sess.lastActive).toLocaleString() : "Just now"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {sess.isCurrent ? (
                        <span className="text-[0.72rem] text-[var(--admin-text-muted)] italic">
                          Active Now
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSessionToRevoke(sess._id || sess.id);
                            setConfirmRevokeSessionOpen(true);
                          }}
                          className="rounded-lg px-2.5 py-1 text-[0.72rem] font-medium text-rose-400 hover:bg-rose-400/10"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirmation: Revoke Single Session */}
      <ConfirmationModal
        open={confirmRevokeSessionOpen}
        onClose={() => setConfirmRevokeSessionOpen(false)}
        title="Revoke Device Session"
        description="Terminating this session will immediately disconnect the user on that device and require them to sign in again."
        confirmText="Revoke Session"
        confirmVariant="danger"
        isLoading={revokeSessionMutation.isPending}
        onConfirm={() => {
          if (sessionToRevoke) revokeSessionMutation.mutate(sessionToRevoke);
        }}
      />

      {/* Confirmation: Revoke All Sessions */}
      <ConfirmationModal
        open={confirmRevokeAllOpen}
        onClose={() => setConfirmRevokeAllOpen(false)}
        title="Logout All Active Sessions"
        description="This will terminate all other active administrator sessions across all browsers and devices. Your current session will remain active."
        confirmText="Logout All Other Sessions"
        confirmVariant="danger"
        isLoading={revokeAllSessionsMutation.isPending}
        onConfirm={() => revokeAllSessionsMutation.mutate()}
      />
    </div>
  );
}
