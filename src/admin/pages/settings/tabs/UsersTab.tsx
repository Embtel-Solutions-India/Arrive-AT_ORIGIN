import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { Button, Card, Field, Select, Badge, Modal } from "../../../components/ui";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { MediaPickerModal } from "../../../components/MediaPickerModal";

const PERMISSION_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "users", label: "Users" },
  { key: "products", label: "Products/Books" },
  { key: "orders", label: "Orders" },
  { key: "payments", label: "Payments" },
  { key: "bookings", label: "Bookings" },
  { key: "customers", label: "Customers" },
  { key: "leads", label: "Leads" },
  { key: "blog", label: "Blog" },
  { key: "media", label: "Media" },
  { key: "reports", label: "Reports" },
  { key: "settings", label: "Settings" },
] as const;

const PERMISSION_ACTIONS = ["view", "create", "edit", "delete", "export"] as const;

type ModuleKey = (typeof PERMISSION_MODULES)[number]["key"];
type ActionKey = (typeof PERMISSION_ACTIONS)[number];
type PermissionMatrix = Record<string, Record<ActionKey, boolean>>;

const ROLE_OPTIONS = [
  { label: "Super Admin", value: "SUPER_ADMIN" },
  { label: "Admin", value: "ADMIN" },
  { label: "Manager", value: "MANAGER" },
  { label: "Editor", value: "EDITOR" },
  { label: "Staff", value: "STAFF" },
  { label: "Custom Role", value: "CUSTOM" },
];

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Pending Verification", value: "PENDING_VERIFICATION" },
];

function getRoleDefaultPermissions(role: string): PermissionMatrix {
  const matrix: PermissionMatrix = {};
  PERMISSION_MODULES.forEach((m) => {
    const isSuper = role === "SUPER_ADMIN";
    const isAdmin = role === "ADMIN";
    const isManager = role === "MANAGER";
    const isEditor = role === "EDITOR";
    const isStaff = role === "STAFF";

    matrix[m.key] = {
      view: isSuper || isAdmin || isManager || isEditor || isStaff,
      create: isSuper || isAdmin || (isManager && m.key !== "settings" && m.key !== "users") || (isEditor && (m.key === "blog" || m.key === "media" || m.key === "products")),
      edit: isSuper || isAdmin || (isManager && m.key !== "settings" && m.key !== "users") || (isEditor && (m.key === "blog" || m.key === "media" || m.key === "products")),
      delete: isSuper || (isAdmin && m.key !== "settings" && m.key !== "users"),
      export: isSuper || isAdmin || isManager,
    };
  });
  return matrix;
}

export function UsersTab() {
  const queryClient = useQueryClient();

  // Search & Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [resetPwModalOpen, setResetPwModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  // Form states for Create/Edit
  const [formName, setFormName] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("ADMIN");
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [formAvatar, setFormAvatar] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formConfirmPassword, setFormConfirmPassword] = useState("");
  const [formPermissions, setFormPermissions] = useState<PermissionMatrix>(() => getRoleDefaultPermissions("ADMIN"));
  const [formError, setFormError] = useState("");

  // Reset Password states
  const [newResetPassword, setNewResetPassword] = useState("");
  const [confirmResetPassword, setConfirmResetPassword] = useState("");
  const [resetPwError, setResetPwError] = useState("");
  const [resetPwSuccess, setResetPwSuccess] = useState(false);

  // Confirmation Modals
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [confirmForceLogoutOpen, setConfirmForceLogoutOpen] = useState(false);
  const [confirmLogoutAllOpen, setConfirmLogoutAllOpen] = useState(false);

  // Query users
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", { search, roleFilter, statusFilter, page }],
    queryFn: () =>
      api.get<{ users: any[]; total: number; totalPages: number }>(
        `/admin/users?search=${encodeURIComponent(search)}&role=${roleFilter}&status=${statusFilter}&page=${page}&limit=10`
      ),
  });

  const users = data?.users || [];
  const total = data?.total ?? users.length;
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(total / 10));

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (body: any) => api.post("/admin/users", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setCreateModalOpen(false);
      resetForm();
    },
    onError: (err: any) => setFormError(err?.message || "Failed to create user"),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => api.put(`/admin/users/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setEditModalOpen(false);
      resetForm();
    },
    onError: (err: any) => setFormError(err?.message || "Failed to update user"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setConfirmDeleteOpen(false);
      setSelectedUser(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/admin/users/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setConfirmDeactivateOpen(false);
      setSelectedUser(null);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.post(`/admin/users/${id}/reset-password`, { newPassword: password }),
    onSuccess: () => {
      setResetPwSuccess(true);
      setTimeout(() => {
        setResetPwModalOpen(false);
        setResetPwSuccess(false);
        setNewResetPassword("");
        setConfirmResetPassword("");
      }, 1500);
    },
    onError: (err: any) => setResetPwError(err?.message || "Failed to reset password"),
  });

  const forceLogoutMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/users/${id}/force-logout`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setConfirmForceLogoutOpen(false);
      setSelectedUser(null);
    },
  });

  const logoutAllUsersMutation = useMutation({
    mutationFn: (adminPassword?: string) => api.post("/admin/users/logout-all", { adminPassword }),
    onSuccess: () => {
      setConfirmLogoutAllOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "settings", "sessions"] });
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormUsername("");
    setFormEmail("");
    setFormPhone("");
    setFormRole("ADMIN");
    setFormStatus("ACTIVE");
    setFormAvatar("");
    setFormPassword("");
    setFormConfirmPassword("");
    setFormPermissions(getRoleDefaultPermissions("ADMIN"));
    setFormError("");
  };

  const handleOpenCreate = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setSelectedUser(user);
    setFormName(user.name || "");
    setFormUsername(user.username || "");
    setFormEmail(user.email || "");
    setFormPhone(user.phone || "");
    setFormRole(user.role || "ADMIN");
    setFormStatus(user.status || "ACTIVE");
    setFormAvatar(user.avatar || "");
    setFormPassword("");
    setFormConfirmPassword("");
    setFormPermissions(user.permissions || getRoleDefaultPermissions(user.role || "ADMIN"));
    setFormError("");
    setEditModalOpen(true);
  };

  const handleRoleChange = (newRole: string) => {
    setFormRole(newRole);
    if (newRole !== "CUSTOM") {
      setFormPermissions(getRoleDefaultPermissions(newRole));
    }
  };

  const handlePermissionToggle = (mod: ModuleKey, action: ActionKey) => {
    setFormPermissions((prev) => ({
      ...prev,
      [mod]: {
        ...(prev[mod] || { view: false, create: false, edit: false, delete: false, export: false }),
        [action]: !prev[mod]?.[action],
      },
    }));
  };

  const handleSelectAllPermissions = (enable: boolean) => {
    const updated: PermissionMatrix = {};
    PERMISSION_MODULES.forEach((m) => {
      updated[m.key] = {
        view: enable,
        create: enable,
        edit: enable,
        delete: enable,
        export: enable,
      };
    });
    setFormPermissions(updated);
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formPassword) {
      setFormError("Name, Email, and Password are required.");
      return;
    }
    if (formPassword !== formConfirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (formPassword.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    createUserMutation.mutate({
      name: formName,
      username: formUsername,
      email: formEmail,
      phone: formPhone,
      role: formRole,
      status: formStatus,
      avatar: formAvatar,
      password: formPassword,
      permissions: formPermissions,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!formName || !formEmail) {
      setFormError("Name and Email are required.");
      return;
    }

    const payload: any = {
      name: formName,
      username: formUsername,
      email: formEmail,
      phone: formPhone,
      role: formRole,
      status: formStatus,
      avatar: formAvatar,
      permissions: formPermissions,
    };
    if (formPassword) {
      if (formPassword !== formConfirmPassword) {
        setFormError("Passwords do not match.");
        return;
      }
      payload.password = formPassword;
    }

    updateUserMutation.mutate({ id: selectedUser._id || selectedUser.id, body: payload });
  };

  const getStatusBadgeTone = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "good";
      case "INACTIVE":
        return "neutral";
      case "SUSPENDED":
        return "bad";
      case "PENDING_VERIFICATION":
        return "warn";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Operational Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--admin-border)]/60 pb-5">
        <div>
          <h2 className="text-xl font-display font-medium text-[var(--admin-text-primary)]">
            Admin & User Management
          </h2>
          <p className="text-xs text-[var(--admin-text-secondary)] mt-0.5">
            Manage admin accounts, assign roles, enforce granular access permissions, and regulate active logins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setConfirmLogoutAllOpen(true)}
            className="text-xs"
          >
            Force Logout All Users
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="text-xs">
            + Create New User
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 items-center">
          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3.5 py-2 text-sm text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)] focus:outline-none focus:border-[var(--admin-accent)]"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 py-2 text-xs text-[var(--admin-text-primary)] focus:outline-none focus:border-[var(--admin-accent)]"
            >
              <option value="">All Roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
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
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto min-w-0">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--admin-border)] text-[var(--admin-text-muted)] uppercase tracking-wider font-semibold">
              <tr>
                <th className="pb-3 px-3">User</th>
                <th className="pb-3 px-3">Role</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Phone</th>
                <th className="pb-3 px-3">Last Active</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]/40 text-[var(--admin-text-primary)]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--admin-text-muted)]">
                    Loading users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[var(--admin-text-muted)]">
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                users.map((u: any) => (
                  <tr key={u._id || u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-[var(--admin-accent)]/20 border border-[var(--admin-accent)]/40 flex items-center justify-center font-display font-medium text-[var(--admin-accent)] overflow-hidden flex-shrink-0">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                          ) : (
                            u.name?.slice(0, 2).toUpperCase() || "AD"
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-[var(--admin-text-primary)] truncate">
                            {u.name}
                          </div>
                          <div className="text-[0.72rem] text-[var(--admin-text-muted)] truncate">
                            {u.email} {u.username ? `(@${u.username})` : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[0.75rem] text-[var(--admin-accent)] font-semibold">
                        {u.role || "ADMIN"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge tone={getStatusBadgeTone(u.status || "ACTIVE")}>
                        {u.status || "ACTIVE"}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-[var(--admin-text-secondary)] font-mono text-[0.75rem]">
                      {u.phone || "—"}
                    </td>
                    <td className="py-3 px-3 text-[var(--admin-text-muted)] text-[0.72rem]">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setViewModalOpen(true);
                          }}
                          className="rounded-lg px-2 py-1 text-[0.72rem] font-medium text-[var(--admin-text-secondary)] hover:bg-white/10 hover:text-white"
                          title="View Details"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="rounded-lg px-2 py-1 text-[0.72rem] font-medium text-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/10"
                          title="Edit User"
                        >
                          Edit
                        </button>
                        {u.status === "ACTIVE" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setConfirmDeactivateOpen(true);
                            }}
                            className="rounded-lg px-2 py-1 text-[0.72rem] font-medium text-amber-400 hover:bg-amber-400/10"
                            title="Deactivate"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: u._id || u.id,
                                status: "ACTIVE",
                              })
                            }
                            className="rounded-lg px-2 py-1 text-[0.72rem] font-medium text-emerald-400 hover:bg-emerald-400/10"
                            title="Activate"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setResetPwError("");
                            setNewResetPassword("");
                            setConfirmResetPassword("");
                            setResetPwModalOpen(true);
                          }}
                          className="rounded-lg px-2 py-1 text-[0.72rem] font-medium text-sky-400 hover:bg-sky-400/10"
                          title="Reset Password"
                        >
                          Reset PW
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setConfirmForceLogoutOpen(true);
                          }}
                          className="rounded-lg px-2 py-1 text-[0.72rem] font-medium text-purple-400 hover:bg-purple-400/10"
                          title="Force Logout"
                        >
                          Logout
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setConfirmDeleteOpen(true);
                          }}
                          className="rounded-lg px-2 py-1 text-[0.72rem] font-medium text-rose-400 hover:bg-rose-400/10"
                          title="Delete User"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination summary */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--admin-text-muted)] pt-3 border-t border-[var(--admin-border)]/50 gap-2">
          <span>
            Showing <strong className="text-[var(--admin-text-primary)]">{users.length}</strong> of{" "}
            <strong className="text-[var(--admin-text-primary)]">{total}</strong> users
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
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* CREATE USER MODAL */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Admin / User"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveCreate} className="space-y-5">
          {formError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Full Name *"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Jane Doe"
              required
            />
            <Field
              label="Username"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              placeholder="e.g. janedoe"
            />
            <Field
              label="Email Address *"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="jane@arriveatorigin.com"
              required
            />
            <Field
              label="Phone Number"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
            <Field
              label="Password *"
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
            />
            <Field
              label="Confirm Password *"
              type="password"
              value={formConfirmPassword}
              onChange={(e) => setFormConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
            />
            <Select
              label="Assigned Role"
              value={formRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              options={ROLE_OPTIONS}
            />
            <Select
              label="Account Status"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              options={STATUS_OPTIONS}
            />
            <div className="sm:col-span-2">
              <Field
                label="Profile Image Avatar"
                value={formAvatar}
                onChange={(e) => setFormAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg or choose from media library"
              />
              <div className="flex items-center gap-2 -mt-2 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setMediaPickerOpen(true)}
                >
                  📁 Choose from Library
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => setMediaPickerOpen(true)}
                >
                  ⬆️ Upload from Browser
                </Button>
              </div>
            </div>
          </div>

          {/* Granular Permission Control Table */}
          <div className="space-y-3 pt-2 border-t border-[var(--admin-border)]/60">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-[var(--admin-text-primary)]">
                  Role Permissions Matrix
                </h4>
                <p className="text-[0.72rem] text-[var(--admin-text-muted)]">
                  Fine-tune granular operations across the 12 admin modules.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAllPermissions(true)}
                  className="text-[0.72rem] text-[var(--admin-accent)] hover:underline"
                >
                  Select All
                </button>
                <span className="text-[var(--admin-border)]">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAllPermissions(false)}
                  className="text-[0.72rem] text-[var(--admin-text-muted)] hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)]">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-[var(--admin-border)] bg-white/[0.02] text-[var(--admin-text-muted)] font-semibold uppercase text-[0.68rem]">
                  <tr>
                    <th className="py-2.5 px-3">Module</th>
                    {PERMISSION_ACTIONS.map((act) => (
                      <th key={act} className="py-2.5 px-3 text-center capitalize">
                        {act}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--admin-border)]/30">
                  {PERMISSION_MODULES.map((m) => (
                    <tr key={m.key} className="hover:bg-white/[0.01]">
                      <td className="py-2 px-3 font-medium text-[var(--admin-text-primary)]">
                        {m.label}
                      </td>
                      {PERMISSION_ACTIONS.map((act) => {
                        const checked = !!formPermissions[m.key]?.[act];
                        return (
                          <td key={act} className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handlePermissionToggle(m.key, act)}
                              className="h-4 w-4 rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)] cursor-pointer"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--admin-border)]/50">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Creating…" : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit User: ${selectedUser?.name || ""}`}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveEdit} className="space-y-5">
          {formError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Full Name *"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
            />
            <Field
              label="Username"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
            />
            <Field
              label="Email Address *"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              required
            />
            <Field
              label="Phone Number"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
            />
            <Select
              label="Assigned Role"
              value={formRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              options={ROLE_OPTIONS}
            />
            <Select
              label="Account Status"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
              options={STATUS_OPTIONS}
            />
            <div className="sm:col-span-2">
              <Field
                label="Profile Image Avatar"
                value={formAvatar}
                onChange={(e) => setFormAvatar(e.target.value)}
                placeholder="https://example.com/avatar.jpg or choose from media library"
              />
              <div className="flex items-center gap-2 -mt-2 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setMediaPickerOpen(true)}
                >
                  📁 Choose from Library
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => setMediaPickerOpen(true)}
                >
                  ⬆️ Upload from Browser
                </Button>
              </div>
            </div>
          </div>

          {/* Granular Permission Control Table */}
          <div className="space-y-3 pt-2 border-t border-[var(--admin-border)]/60">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-[var(--admin-text-primary)]">
                  Role Permissions Matrix
                </h4>
                <p className="text-[0.72rem] text-[var(--admin-text-muted)]">
                  Configure specific rights granted to this user.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAllPermissions(true)}
                  className="text-[0.72rem] text-[var(--admin-accent)] hover:underline"
                >
                  Select All
                </button>
                <span className="text-[var(--admin-border)]">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAllPermissions(false)}
                  className="text-[0.72rem] text-[var(--admin-text-muted)] hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)]">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-[var(--admin-border)] bg-white/[0.02] text-[var(--admin-text-muted)] font-semibold uppercase text-[0.68rem]">
                  <tr>
                    <th className="py-2.5 px-3">Module</th>
                    {PERMISSION_ACTIONS.map((act) => (
                      <th key={act} className="py-2.5 px-3 text-center capitalize">
                        {act}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--admin-border)]/30">
                  {PERMISSION_MODULES.map((m) => (
                    <tr key={m.key} className="hover:bg-white/[0.01]">
                      <td className="py-2 px-3 font-medium text-[var(--admin-text-primary)]">
                        {m.label}
                      </td>
                      {PERMISSION_ACTIONS.map((act) => {
                        const checked = !!formPermissions[m.key]?.[act];
                        return (
                          <td key={act} className="py-2 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handlePermissionToggle(m.key, act)}
                              className="h-4 w-4 rounded border-[var(--admin-border)] text-[var(--admin-accent)] focus:ring-[var(--admin-accent)] cursor-pointer"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--admin-border)]/50">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW USER DETAILS MODAL */}
      <Modal
        open={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Admin User Details"
        maxWidth="max-w-lg"
      >
        {selectedUser && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 border-b border-[var(--admin-border)]/50 pb-4">
              <div className="h-14 w-14 rounded-full bg-[var(--admin-accent)]/20 border border-[var(--admin-accent)]/40 flex items-center justify-center font-display font-medium text-lg text-[var(--admin-accent)] overflow-hidden">
                {selectedUser.avatar ? (
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  selectedUser.name?.slice(0, 2).toUpperCase() || "AD"
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--admin-text-primary)]">
                  {selectedUser.name}
                </h3>
                <p className="text-[var(--admin-text-muted)] font-mono">
                  {selectedUser.email}
                </p>
                <div className="flex gap-2 mt-1.5">
                  <Badge tone={getStatusBadgeTone(selectedUser.status)}>
                    {selectedUser.status}
                  </Badge>
                  <span className="font-mono text-[0.72rem] text-[var(--admin-accent)]">
                    {selectedUser.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[var(--admin-text-secondary)]">
              <div>
                <span className="block text-[0.68rem] text-[var(--admin-text-muted)] uppercase">
                  Username
                </span>
                <span className="font-medium text-[var(--admin-text-primary)]">
                  {selectedUser.username || "—"}
                </span>
              </div>
              <div>
                <span className="block text-[0.68rem] text-[var(--admin-text-muted)] uppercase">
                  Phone
                </span>
                <span className="font-medium text-[var(--admin-text-primary)]">
                  {selectedUser.phone || "—"}
                </span>
              </div>
              <div>
                <span className="block text-[0.68rem] text-[var(--admin-text-muted)] uppercase">
                  Created At
                </span>
                <span>
                  {selectedUser.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleDateString()
                    : "—"}
                </span>
              </div>
              <div>
                <span className="block text-[0.68rem] text-[var(--admin-text-muted)] uppercase">
                  Last Login
                </span>
                <span>
                  {selectedUser.lastLogin
                    ? new Date(selectedUser.lastLogin).toLocaleString()
                    : "Never"}
                </span>
              </div>
              <div>
                <span className="block text-[0.68rem] text-[var(--admin-text-muted)] uppercase">
                  Last Password Change
                </span>
                <span>
                  {selectedUser.lastPasswordChange
                    ? new Date(selectedUser.lastPasswordChange).toLocaleDateString()
                    : "Initial"}
                </span>
              </div>
              <div>
                <span className="block text-[0.68rem] text-[var(--admin-text-muted)] uppercase">
                  2FA Status
                </span>
                <span>{selectedUser.twoFactorEnabled ? "Enabled" : "Disabled"}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[var(--admin-border)]/50">
              <Button size="sm" variant="secondary" onClick={() => setViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* RESET PASSWORD MODAL */}
      <Modal
        open={resetPwModalOpen}
        onClose={() => setResetPwModalOpen(false)}
        title={`Reset Password for ${selectedUser?.name || ""}`}
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newResetPassword || newResetPassword.length < 8) {
              setResetPwError("Password must be at least 8 characters.");
              return;
            }
            if (newResetPassword !== confirmResetPassword) {
              setResetPwError("Passwords do not match.");
              return;
            }
            resetPasswordMutation.mutate({
              id: selectedUser._id || selectedUser.id,
              password: newResetPassword,
            });
          }}
          className="space-y-4"
        >
          {resetPwSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              ✓ Password reset successfully! Sessions invalidated.
            </div>
          )}
          {resetPwError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {resetPwError}
            </div>
          )}

          <p className="text-xs text-[var(--admin-text-secondary)]">
            Resetting this user’s password will immediately invalidate all their active sessions and require them to sign in again.
          </p>

          <Field
            label="New Password"
            type="password"
            value={newResetPassword}
            onChange={(e) => setNewResetPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
          />

          <Field
            label="Confirm New Password"
            type="password"
            value={confirmResetPassword}
            onChange={(e) => setConfirmResetPassword(e.target.value)}
            placeholder="Repeat new password"
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--admin-border)]/50">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setResetPwModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Resetting…" : "Reset Password"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRMATION: DELETE USER */}
      <ConfirmationModal
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title={`Delete User: ${selectedUser?.name || ""}`}
        description="Are you sure you want to permanently delete this user account? This action cannot be undone and will revoke all their permissions and sessions."
        confirmText="Delete User"
        confirmVariant="danger"
        requiredPhrase="DELETE USER"
        isLoading={deleteUserMutation.isPending}
        onConfirm={() => {
          if (selectedUser) deleteUserMutation.mutate(selectedUser._id || selectedUser.id);
        }}
      />

      {/* CONFIRMATION: DEACTIVATE USER */}
      <ConfirmationModal
        open={confirmDeactivateOpen}
        onClose={() => setConfirmDeactivateOpen(false)}
        title={`Deactivate User: ${selectedUser?.name || ""}`}
        description="Deactivating this user will prevent them from logging in and access will be locked until an admin reactivates their account."
        confirmText="Deactivate User"
        confirmVariant="danger"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (selectedUser) {
            updateStatusMutation.mutate({
              id: selectedUser._id || selectedUser.id,
              status: "INACTIVE",
            });
          }
        }}
      />

      {/* CONFIRMATION: FORCE LOGOUT USER */}
      <ConfirmationModal
        open={confirmForceLogoutOpen}
        onClose={() => setConfirmForceLogoutOpen(false)}
        title={`Force Logout: ${selectedUser?.name || ""}`}
        description="This will revoke all active sessions for this user across all their devices, forcing them to authenticate again."
        confirmText="Force Logout"
        confirmVariant="danger"
        isLoading={forceLogoutMutation.isPending}
        onConfirm={() => {
          if (selectedUser) forceLogoutMutation.mutate(selectedUser._id || selectedUser.id);
        }}
      />

      {/* CONFIRMATION: FORCE LOGOUT ALL USERS */}
      <ConfirmationModal
        open={confirmLogoutAllOpen}
        onClose={() => setConfirmLogoutAllOpen(false)}
        title="Force Logout All Users"
        description="CRITICAL ACTION: This will invalidate all active sessions for every user and administrator across all web and mobile devices. You will also be signed out and required to log back in."
        confirmText="Logout All Users"
        confirmVariant="danger"
        requiredPhrase="LOGOUT ALL"
        requirePassword={true}
        isLoading={logoutAllUsersMutation.isPending}
        onConfirm={(password) => logoutAllUsersMutation.mutate(password)}
      />
      {/* Media Picker Modal for User Avatar */}
      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        title="Select User Avatar"
        currentValue={formAvatar}
        onSelect={(url) => setFormAvatar(url)}
      />
    </div>
  );
}
