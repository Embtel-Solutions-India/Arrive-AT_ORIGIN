import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Badge, Button, Card, PageHeader, Pagination } from "../../components/ui";

interface OrderItem {
  _id: string;
  orderNumber: string;
  customerInfo: { name: string; email: string; phone?: string };
  items: Array<{ title: string; quantity: number; price: number }>;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
}

interface OrdersResponse {
  orders: OrderItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const money = (n: number) => `$${(n || 0).toFixed(2)}`;

const ORDER_STATUS_TABS = [
  { label: "All Orders", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Payment Confirmed", value: "PAYMENT_CONFIRMED" },
  { label: "Processing", value: "PROCESSING" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Refunded", value: "REFUNDED" },
];

export function OrdersListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("status") || "ALL";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery<OrdersResponse>({
    queryKey: ["admin", "orders", { page, search, status: currentTab }],
    queryFn: () =>
      api.get<OrdersResponse>(
        `/admin/orders?page=${page}&limit=12&search=${encodeURIComponent(search)}&orderStatus=${currentTab}`
      ),
  });

  const handleTabChange = (val: string) => {
    setSearchParams(val === "ALL" ? {} : { status: val });
    setPage(1);
  };

  const getStatusTone = (s: string) => {
    if (s === "DELIVERED" || s === "PAYMENT_CONFIRMED") return "good";
    if (s === "PROCESSING" || s === "SHIPPED") return "info";
    if (s === "PENDING") return "warn";
    return "bad";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders & Shipments"
        description="Fulfill book purchases, track shipments, and manage customer order lifecycles."
      />

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-sm border-b border-[var(--admin-border)]">
        {ORDER_STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`whitespace-nowrap px-3.5 py-2 font-medium rounded-t-xl transition-all border-b-2 -mb-px ${
              currentTab === tab.value
                ? "border-[var(--admin-accent)] text-[var(--admin-accent)] bg-[rgba(237,231,218,0.06)]"
                : "border-transparent text-[var(--admin-text-secondary)] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <Card>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by order #, customer name, or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="min-h-[40px] w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)] focus:outline-none focus:border-[var(--admin-accent)]"
          />
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-muted)]">Loading orders from MongoDB…</div>
        ) : !data?.orders?.length ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-secondary)]">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)]/50 text-[0.75rem] text-[var(--admin-text-muted)] uppercase">
                  <th className="pb-3 font-semibold">Order #</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Items</th>
                  <th className="pb-3 font-semibold">Total Amount</th>
                  <th className="pb-3 font-semibold">Payment Status</th>
                  <th className="pb-3 font-semibold">Order Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]/30">
                {data.orders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-[rgba(237,231,218,0.03)]">
                    <td className="py-3.5 font-mono font-medium text-[var(--admin-text-primary)]">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3.5">
                      <div className="font-medium text-[var(--admin-text-primary)]">{ord.customerInfo.name}</div>
                      <div className="text-xs text-[var(--admin-text-muted)]">{ord.customerInfo.email}</div>
                    </td>
                    <td className="py-3.5 text-xs text-[var(--admin-text-secondary)]">
                      {ord.items.map((it) => `${it.title} (×${it.quantity})`).join(", ")}
                    </td>
                    <td className="py-3.5 font-semibold text-[var(--admin-text-primary)]">
                      {money(ord.total)}
                    </td>
                    <td className="py-3.5">
                      <Badge tone={ord.paymentStatus === "PAID" ? "good" : "warn"}>{ord.paymentStatus}</Badge>
                    </td>
                    <td className="py-3.5">
                      <Badge tone={getStatusTone(ord.orderStatus)}>{ord.orderStatus.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="py-3.5 text-xs text-[var(--admin-text-muted)]">
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <Link to={`/admin/orders/${ord._id}`}>
                        <Button size="sm" variant="ghost">View Details</Button>
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
