import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { Button, Card, Badge } from "../../../components/ui";

const MODULE_OPTIONS = [
  { label: "All Modules", value: "ALL" },
  { label: "AUTH", value: "AUTH" },
  { label: "USERS", value: "USERS" },
  { label: "SESSIONS", value: "SESSIONS" },
  { label: "PAYMENTS", value: "PAYMENTS" },
  { label: "EMAIL", value: "EMAIL" },
  { label: "BOOKING", value: "BOOKING" },
  { label: "STORE", value: "STORE" },
  { label: "SYSTEM", value: "SYSTEM" },
  { label: "BACKUPS", value: "BACKUPS" },
  { label: "INTEGRATIONS", value: "INTEGRATIONS" },
];

const ACTION_OPTIONS = [
  { label: "All Actions", value: "ALL" },
  { label: "Login (USER_LOGIN)", value: "USER_LOGIN" },
  { label: "Logout (USER_LOGOUT)", value: "USER_LOGOUT" },
  { label: "Failed Login (FAILED_LOGIN)", value: "FAILED_LOGIN" },
  { label: "Password Change (PASSWORD_CHANGED)", value: "PASSWORD_CHANGED" },
  { label: "User Created (USER_CREATED)", value: "USER_CREATED" },
  { label: "User Updated (USER_UPDATED)", value: "USER_UPDATED" },
  { label: "User Deleted (USER_DELETED)", value: "USER_DELETED" },
  { label: "User Activated (USER_ACTIVATED)", value: "USER_ACTIVATED" },
  { label: "User Deactivated (USER_DEACTIVATED)", value: "USER_DEACTIVATED" },
  { label: "Payment Gateway Activated (PAYMENT_GATEWAY_ACTIVATED)", value: "PAYMENT_GATEWAY_ACTIVATED" },
  { label: "Payment Gateway Deactivated (PAYMENT_GATEWAY_DEACTIVATED)", value: "PAYMENT_GATEWAY_DEACTIVATED" },
  { label: "Payment Settings Changed (PAYMENT_SETTINGS_CHANGED)", value: "PAYMENT_SETTINGS_CHANGED" },
  { label: "System Settings Changed (SYSTEM_SETTINGS_CHANGED)", value: "SYSTEM_SETTINGS_CHANGED" },
  { label: "Backup Created (BACKUP_CREATED)", value: "BACKUP_CREATED" },
  { label: "Backup Restored (BACKUP_RESTORED)", value: "BACKUP_RESTORED" },
];

const STATUS_OPTIONS = [
  { label: "All Statuses", value: "ALL" },
  { label: "Success", value: "SUCCESS" },
  { label: "Failed", value: "FAILED" },
  { label: "Warning", value: "WARNING" },
];

export function AuditLogsTab() {
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-logs", { search, moduleFilter, actionFilter, statusFilter, page, limit }],
    queryFn: () =>
      api.get<{ logs: any[]; pagination: { total: number; totalPages: number } }>(
        `/admin/settings/audit-logs?search=${encodeURIComponent(search)}&module=${moduleFilter}&action=${actionFilter}&status=${statusFilter}&page=${page}&limit=${limit}`
      ),
  });

  const logs = data?.logs || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["User", "Email", "Action", "Module", "IP Address", "Device", "Status", "Timestamp"];
    const rows = logs.map((l: any) => [
      `"${l.userName || "System"}"`,
      `"${l.userEmail || "—"}"`,
      `"${l.action}"`,
      `"${l.module}"`,
      `"${l.ipAddress || "—"}"`,
      `"${l.device || "—"}"`,
      `"${l.status || "SUCCESS"}"`,
      `"${new Date(l.createdAt).toISOString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExportJSON = () => {
    if (logs.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audit-logs-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getStatusBadgeTone = (st: string) => {
    switch (st?.toUpperCase()) {
      case "SUCCESS":
        return "good";
      case "FAILED":
        return "bad";
      case "WARNING":
        return "warn";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--admin-border)]/60 pb-5">
        <div>
          <h2 className="text-xl font-display font-medium text-[var(--admin-text-primary)]">
            Activity & Security Audit Trail
          </h2>
          <p className="text-xs text-[var(--admin-text-secondary)] mt-0.5">
            Immutable log of all authentication events, administrative role updates, payments, and system mutations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs">
            📥 Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExportJSON} className="text-xs">
            📄 Export JSON
          </Button>
        </div>
      </div>

      {/* Filter / Search Row */}
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 items-center">
          <div className="sm:col-span-1">
            <input
              type="text"
              placeholder="Search user, action, IP..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 py-2 text-xs text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)] focus:outline-none focus:border-[var(--admin-accent)]"
            />
          </div>

          <div>
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 py-2 text-xs text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)]"
            >
              {MODULE_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 py-2 text-xs text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)]"
            >
              {ACTION_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 py-2 text-xs text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)]"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <div className="overflow-x-auto min-w-0">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--admin-border)] text-[var(--admin-text-muted)] uppercase tracking-wider font-semibold">
              <tr>
                <th className="pb-3 px-3">Admin / User</th>
                <th className="pb-3 px-3">Action</th>
                <th className="pb-3 px-3">Module</th>
                <th className="pb-3 px-3">IP Address</th>
                <th className="pb-3 px-3">Device / Client</th>
                <th className="pb-3 px-3">Date & Time</th>
                <th className="pb-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]/40 text-[var(--admin-text-primary)]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--admin-text-muted)]">
                    Loading audit trail…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--admin-text-muted)]">
                    No activity logs recorded matching current filters.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => {
                  const d = new Date(log.createdAt);
                  return (
                    <tr key={log._id || log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-medium text-[var(--admin-text-primary)]">
                          {log.userName || "System Automated"}
                        </div>
                        <div className="text-[0.7rem] text-[var(--admin-text-muted)] font-mono">
                          {log.userEmail || "system@internal"}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[0.75rem] font-semibold text-[var(--admin-accent)]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[0.7rem] text-[var(--admin-text-secondary)] border border-white/5">
                          {log.module}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[0.72rem] text-[var(--admin-text-secondary)]">
                        {log.ipAddress || "127.0.0.1"}
                      </td>
                      <td className="py-3 px-3 text-[var(--admin-text-secondary)] text-[0.72rem]">
                        {log.device || "Desktop Browser"}
                      </td>
                      <td className="py-3 px-3 text-[var(--admin-text-muted)] text-[0.72rem]">
                        <div>{d.toLocaleDateString()}</div>
                        <div className="font-mono text-[0.68rem]">{d.toLocaleTimeString()}</div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Badge tone={getStatusBadgeTone(log.status)}>
                          {log.status || "SUCCESS"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--admin-text-muted)] pt-3 border-t border-[var(--admin-border)]/50 gap-2">
          <span>
            Showing <strong className="text-[var(--admin-text-primary)]">{logs.length}</strong> of{" "}
            <strong className="text-[var(--admin-text-primary)]">{pagination.total}</strong> log entries
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span>
              {page} / {pagination.totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
