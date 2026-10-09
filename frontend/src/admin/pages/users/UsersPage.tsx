import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Badge, Button, Card, Field, Modal, PageHeader, Select } from "../../components/ui";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "INACTIVE";
  lastLogin?: string;
  createdAt: string;
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [errorMsg, setErrorMsg] = useState("");

  const { data, isLoading } = useQuery<{ users: AdminUser[]; roles: string[] }>({
    queryKey: ["admin", "users"],
    queryFn: () => api.get<{ users: AdminUser[]; roles: string[] }>("/admin/users"),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post("/admin/users", payload),
    onSuccess: () => {
      setModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("ADMIN");
      setErrorMsg("");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to create user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/admin/users/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Users & Role Permissions"
        description="Manage portal administrators, editorial roles, order management staff, and account statuses."
        action={
          <Button size="sm" variant="primary" onClick={() => setModalOpen(true)}>
            + Add Administrator
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-muted)]">Loading users…</div>
        ) : !data?.users?.length ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-secondary)]">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)]/50 text-[0.75rem] text-[var(--admin-text-muted)] uppercase">
                  <th className="pb-3 font-semibold whitespace-nowrap">User</th>
                  <th className="pb-3 font-semibold whitespace-nowrap">Role</th>
                  <th className="pb-3 font-semibold whitespace-nowrap">Account Status</th>
                  <th className="pb-3 font-semibold whitespace-nowrap">Last Login</th>
                  <th className="pb-3 font-semibold text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]/30">
                {data.users.map((u) => (
                  <tr key={u._id} className="hover:bg-[rgba(237,231,218,0.03)]">
                    <td className="py-3.5 min-w-[160px]">
                      <div className="font-medium text-[var(--admin-text-primary)]">{u.name}</div>
                      <div className="text-xs text-[var(--admin-text-muted)] truncate max-w-[200px]">{u.email}</div>
                    </td>
                    <td className="py-3.5 whitespace-nowrap">
                      <Badge tone={u.role === "SUPER_ADMIN" ? "good" : "info"}>
                        {u.role.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3.5 whitespace-nowrap">
                      <Badge tone={u.status === "ACTIVE" ? "good" : "bad"}>{u.status}</Badge>
                    </td>
                    <td className="py-3.5 text-xs text-[var(--admin-text-muted)] whitespace-nowrap">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: u._id,
                              status: u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                            })
                          }
                        >
                          {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            if (confirm(`Remove administrator "${u.name}"?`)) {
                              deleteMutation.mutate(u._id);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Administrator Account">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name || !email || !password) return;
            createMutation.mutate({ name, email, password, role });
          }}
          className="space-y-4"
        >
          {errorMsg && <p className="text-xs text-[var(--admin-danger)]">{errorMsg}</p>}
          <Field label="Full Name *" placeholder="e.g. Sarah Jenkins" value={name} onChange={(e) => setName(e.target.value)} />
          <Field label="Email Address *" type="email" placeholder="sarah@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Field label="Temporary Password *" type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
          
          <Select label="Role Permission Group *" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="SUPER_ADMIN" className="bg-[#14161f]">Super Admin (Full Platform Access)</option>
            <option value="ADMIN" className="bg-[#14161f]">Admin (Blogs, Books, Orders, Customers, Media)</option>
            <option value="EDITOR" className="bg-[#14161f]">Editor (Blog CMS & Media Only)</option>
            <option value="ORDER_MANAGER" className="bg-[#14161f]">Order Manager (Orders & Customers Only)</option>
          </Select>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending || !name || !email || !password}>
              {createMutation.isPending ? "Creating…" : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
