import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Badge, Card, PageHeader, Pagination } from "../../components/ui";

interface PaymentItem {
  _id: string;
  transactionId: string;
  orderNumber?: string;
  order?: { _id: string; orderNumber: string; customerInfo: { name: string; email: string } };
  amount: number;
  currency: string;
  status: "PENDING" | "SUCCESSFUL" | "FAILED" | "REFUNDED";
  paymentGateway: string;
  paymentMethod: string;
  createdAt: string;
}

interface PaymentsResponse {
  payments: PaymentItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const money = (n: number) => `$${(n || 0).toFixed(2)}`;

export function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const { data, isLoading } = useQuery<PaymentsResponse>({
    queryKey: ["admin", "payments", { page, search, status }],
    queryFn: () =>
      api.get<PaymentsResponse>(
        `/admin/payments?page=${page}&limit=12&search=${encodeURIComponent(search)}&status=${status}`
      ),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Transactions"
        description="All payment gateway events, transaction IDs, customer charges, and refund records."
      />

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by transaction ID or order number…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="min-h-[40px] flex-1 min-w-[240px] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)] focus:outline-none focus:border-[var(--admin-accent)]"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="min-h-[40px] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3 text-sm text-[var(--admin-text-primary)] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESSFUL">Successful</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-muted)]">Loading transactions from MongoDB…</div>
        ) : !data?.payments?.length ? (
          <div className="py-12 text-center text-sm text-[var(--admin-text-secondary)]">No payments recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--admin-border)]/50 text-[0.75rem] text-[var(--admin-text-muted)] uppercase">
                  <th className="pb-3 font-semibold">Transaction ID</th>
                  <th className="pb-3 font-semibold">Order</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Gateway / Method</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]/30">
                {data.payments.map((p) => (
                  <tr key={p._id} className="hover:bg-[rgba(237,231,218,0.03)]">
                    <td className="py-3.5 font-mono text-xs text-[var(--admin-text-primary)]">
                      {p.transactionId}
                    </td>
                    <td className="py-3.5 font-mono text-xs">
                      {p.order?._id ? (
                        <Link to={`/admin/orders/${p.order._id}`} className="text-[var(--admin-accent)] hover:underline">
                          {p.order.orderNumber || p.orderNumber}
                        </Link>
                      ) : (
                        p.orderNumber || "—"
                      )}
                    </td>
                    <td className="py-3.5 text-xs text-[var(--admin-text-secondary)]">
                      {p.order?.customerInfo?.name || "Customer"}
                    </td>
                    <td className="py-3.5 font-semibold text-[var(--admin-text-primary)]">
                      {money(p.amount)} {p.currency}
                    </td>
                    <td className="py-3.5 text-xs text-[var(--admin-text-muted)]">
                      <span className="capitalize">{p.paymentGateway}</span> · {p.paymentMethod}
                    </td>
                    <td className="py-3.5">
                      <Badge tone={p.status === "SUCCESSFUL" ? "good" : p.status === "PENDING" ? "warn" : "bad"}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-right text-xs text-[var(--admin-text-muted)]">
                      {new Date(p.createdAt).toLocaleString()}
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
