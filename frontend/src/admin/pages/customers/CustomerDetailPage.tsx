import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Badge, Button, Card } from "../../components/ui";

const money = (n: number) => `$${(n || 0).toFixed(2)}`;

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customer", id],
    queryFn: () => api.get<{ customer: any; orders: any[] }>(`/admin/customers/${id}`),
  });

  if (isLoading || !data?.customer) {
    return <div className="py-12 text-center text-sm text-[var(--admin-text-muted)]">Loading customer details…</div>;
  }

  const { customer, orders } = data;

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--admin-border)]/50 pb-4">
        <Link to="/admin/customers" className="text-xs text-[var(--admin-accent)] hover:underline mb-1 inline-block">
          ← Back to Customers
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[1.8rem] font-light text-[var(--admin-text-primary)]">
              {customer.name}
            </h1>
            <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">
              Customer since {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <span className="text-xs text-[var(--admin-text-muted)] block">Total Orders</span>
              <span className="text-lg font-bold text-[var(--admin-text-primary)]">{customer.totalOrders}</span>
            </div>
            <div>
              <span className="text-xs text-[var(--admin-text-muted)] block">Lifetime Spend</span>
              <span className="text-lg font-bold text-[var(--admin-accent)]">{money(customer.totalSpent)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Contact & Addresses (1 col) - Sticky when scrolling order history */}
        <div className="space-y-6 min-w-0 admin-sticky-sidebar">
          <Card title="Contact Details">
            <div className="space-y-2.5 text-sm">
              <div>
                <span className="text-xs text-[var(--admin-text-muted)] block">Email</span>
                <a href={`mailto:${customer.email}`} className="text-[var(--admin-accent)] hover:underline">
                  {customer.email}
                </a>
              </div>
              <div>
                <span className="text-xs text-[var(--admin-text-muted)] block">Phone</span>
                <span className="text-[var(--admin-text-primary)]">{customer.phone || "None on file"}</span>
              </div>
            </div>
          </Card>

          <Card title="Shipping Address">
            <div className="text-sm text-[var(--admin-text-primary)] leading-relaxed">
              <p>{customer.shippingAddress?.street || "No street saved"}</p>
              <p>
                {customer.shippingAddress?.city || ""}, {customer.shippingAddress?.state || ""}{" "}
                {customer.shippingAddress?.postalCode || ""}
              </p>
              <p>{customer.shippingAddress?.country || "United States"}</p>
            </div>
          </Card>
        </div>

        {/* Order History (2 cols) */}
        <div className="lg:col-span-2 min-w-0">
          <Card title={`Order History (${orders.length})`}>
            {orders.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--admin-text-muted)]">No orders recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--admin-border)]/50 text-[0.75rem] text-[var(--admin-text-muted)] uppercase">
                      <th className="pb-3 font-semibold">Order</th>
                      <th className="pb-3 font-semibold">Items</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--admin-border)]/30">
                    {orders.map((ord: any) => (
                      <tr key={ord._id} className="hover:bg-[rgba(237,231,218,0.03)]">
                        <td className="py-3 font-mono font-medium text-[var(--admin-text-primary)]">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3 text-xs text-[var(--admin-text-secondary)]">
                          {ord.items?.map((it: any) => `${it.title} (×${it.quantity})`).join(", ")}
                        </td>
                        <td className="py-3 font-semibold text-[var(--admin-text-primary)]">
                          {money(ord.total)}
                        </td>
                        <td className="py-3">
                          <Badge tone={ord.orderStatus === "DELIVERED" ? "good" : "info"}>
                            {ord.orderStatus?.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="py-3 text-xs text-[var(--admin-text-muted)]">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          <Link to={`/admin/orders/${ord._id}`}>
                            <Button size="sm" variant="ghost">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
