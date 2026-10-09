import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Button, Card, PageHeader, Pagination } from "../../components/ui";

interface CustomerItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
}

interface CustomersResponse {
  customers: CustomerItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const money = (n: number) => `$${(n || 0).toFixed(2)}`;

export function CustomersListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<CustomersResponse>({
    queryKey: ["admin", "customers", { page, search }],
    queryFn: () =>
      api.get<CustomersResponse>(
        `/admin/customers?page=${page}&limit=12&search=${encodeURIComponent(search)}`
      ),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory"
        description="View registered readers, order histories, total lifetime spending, and shipping profiles."
      />

      <Card>
        <input
          type="text"
          placeholder="Search customers by name, email, or phone…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-h-[40px] w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)] focus:outline-none focus:border-[var(--admin-accent)]"
        />
      </Card>

      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-muted)]">Loading customers from MongoDB…</div>
        ) : !data?.customers?.length ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-secondary)]">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)]/50 text-[0.75rem] text-[var(--admin-text-muted)] uppercase whitespace-nowrap">
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Phone</th>
                  <th className="pb-3 font-semibold">Total Orders</th>
                  <th className="pb-3 font-semibold">Lifetime Spend</th>
                  <th className="pb-3 font-semibold">Last Order</th>
                  <th className="pb-3 font-semibold">Registered</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]/30">
                {data.customers.map((c) => (
                  <tr key={c._id} className="hover:bg-[rgba(237,231,218,0.03)]">
                    <td className="py-3.5 whitespace-nowrap">
                      <div className="font-medium text-[var(--admin-text-primary)]">{c.name}</div>
                      <div className="text-xs text-[var(--admin-text-muted)]">{c.email}</div>
                    </td>
                    <td className="py-3.5 text-xs text-[var(--admin-text-secondary)] whitespace-nowrap">{c.phone || "—"}</td>
                    <td className="py-3.5 font-semibold text-[var(--admin-text-primary)] whitespace-nowrap">{c.totalOrders}</td>
                    <td className="py-3.5 font-semibold text-[var(--admin-accent)] whitespace-nowrap">{money(c.totalSpent)}</td>
                    <td className="py-3.5 text-xs text-[var(--admin-text-muted)] whitespace-nowrap">
                      {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3.5 text-xs text-[var(--admin-text-muted)] whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <Link to={`/admin/customers/${c._id}`}>
                        <Button size="sm" variant="ghost">View Profile</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
}
