import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Badge, Button, Card, Field, Select, Textarea } from "../../components/ui";

const money = (n: number) => `$${(n || 0).toFixed(2)}`;

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "order", id],
    queryFn: () => api.get<{ order: any }>(`/admin/orders/${id}`),
  });

  useEffect(() => {
    if (data?.order) {
      setOrderStatus(data.order.orderStatus);
      setPaymentStatus(data.order.paymentStatus);
      setTrackingNumber(data.order.trackingNumber || "");
      setNotes(data.order.notes || "");
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: () =>
      api.put(`/admin/orders/${id}`, {
        orderStatus,
        paymentStatus,
        trackingNumber,
        notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "order", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      alert("Order updated successfully!");
    },
  });

  if (isLoading || !data?.order) {
    return <div className="py-12 text-center text-sm text-[var(--admin-text-muted)]">Loading order details…</div>;
  }

  const ord = data.order;

  return (
    <div className="space-y-6">
      <div className="admin-sticky-header flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/admin/orders" className="text-xs text-[var(--admin-accent)] hover:underline mb-1 inline-block">
            ← Back to All Orders
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="font-display text-[1.4rem] sm:text-[1.8rem] font-light text-[var(--admin-text-primary)]">
              Order {ord.orderNumber}
            </h1>
            <Badge tone={ord.paymentStatus === "PAID" ? "good" : "warn"}>{ord.paymentStatus}</Badge>
            <Badge tone="info">{ord.orderStatus.replace(/_/g, " ")}</Badge>
          </div>
          <p className="text-xs text-[var(--admin-text-muted)] mt-1">
            Placed on {new Date(ord.createdAt).toLocaleString()}
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          disabled={updateMutation.isPending}
          onClick={() => updateMutation.mutate()}
        >
          {updateMutation.isPending ? "Updating Order…" : "Update Order"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 items-start">
        {/* Left Column: Products & Financials (2 cols) */}
        <div className="space-y-6 lg:col-span-2 min-w-0">
          {/* Order Items */}
          <Card title="Ordered Items">
            <div className="divide-y divide-[var(--admin-border)]/40">
              {ord.items?.map((it: any, idx: number) => (
                <div key={idx} className="flex items-center gap-4 py-3.5">
                  <img
                    src={it.coverImage || "/aao-part-one.png"}
                    alt={it.title}
                    className="h-16 w-12 rounded object-cover border border-[var(--admin-border)]"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-[var(--admin-text-primary)]">{it.title}</h4>
                    <p className="text-xs text-[var(--admin-text-muted)]">
                      Format: {it.format || "Paperback"} · SKU: {it.sku || "N/A"}
                    </p>
                    <p className="text-xs text-[var(--admin-text-secondary)] mt-1">
                      {money(it.price)} × {it.quantity}
                    </p>
                  </div>
                  <div className="text-right font-semibold text-[var(--admin-text-primary)]">
                    {money(it.subtotal || it.price * it.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="mt-4 border-t border-[var(--admin-border)] pt-4 space-y-2 text-sm text-[var(--admin-text-secondary)]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium text-[var(--admin-text-primary)]">{money(ord.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{ord.shipping === 0 ? "FREE" : money(ord.shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (Est.)</span>
                <span>{money(ord.tax)}</span>
              </div>
              {ord.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span>-{money(ord.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[var(--admin-border)] pt-2 text-base font-bold text-[var(--admin-text-primary)]">
                <span>Total Amount</span>
                <span className="text-[var(--admin-accent)]">{money(ord.total)}</span>
              </div>
            </div>
          </Card>

          {/* Payment & Transaction Info */}
          <Card title="Payment & Gateway Details">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[var(--admin-text-muted)] block">Transaction ID:</span>
                <span className="font-mono text-[var(--admin-text-primary)] text-sm">
                  {ord.payment?.transactionId || "txn_live_recorded"}
                </span>
              </div>
              <div>
                <span className="text-[var(--admin-text-muted)] block">Payment Gateway:</span>
                <span className="text-[var(--admin-text-primary)] text-sm">
                  {ord.payment?.paymentGateway || "Stripe / Online"}
                </span>
              </div>
              <div>
                <span className="text-[var(--admin-text-muted)] block">Payment Method:</span>
                <span className="text-[var(--admin-text-primary)] text-sm">
                  {ord.payment?.paymentMethod || "Credit / Debit Card"}
                </span>
              </div>
              <div>
                <span className="text-[var(--admin-text-muted)] block">Amount Charged:</span>
                <span className="text-[var(--admin-text-primary)] text-sm font-semibold">
                  {money(ord.total)} USD
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Customer Info, Addresses & Status Updater (1 col) - Sticky when scrolling order */}
        <div className="space-y-6 min-w-0 admin-sticky-sidebar">
          {/* Order Status Updater */}
          <Card title="Fulfillment Control">
            <Select
              label="Order Status"
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
            >
              <option value="PENDING" className="bg-[#14161f]">Pending</option>
              <option value="PAYMENT_CONFIRMED" className="bg-[#14161f]">Payment Confirmed</option>
              <option value="PROCESSING" className="bg-[#14161f]">Processing</option>
              <option value="SHIPPED" className="bg-[#14161f]">Shipped</option>
              <option value="DELIVERED" className="bg-[#14161f]">Delivered</option>
              <option value="CANCELLED" className="bg-[#14161f]">Cancelled</option>
              <option value="REFUNDED" className="bg-[#14161f]">Refunded</option>
            </Select>

            <Select
              label="Payment Status"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <option value="PENDING" className="bg-[#14161f]">Pending</option>
              <option value="PAID" className="bg-[#14161f]">Paid (Successful)</option>
              <option value="FAILED" className="bg-[#14161f]">Failed</option>
              <option value="REFUNDED" className="bg-[#14161f]">Refunded</option>
            </Select>

            <Field
              label="Tracking Number"
              placeholder="e.g. 1Z9999999999999999"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />

            <Textarea
              label="Internal Admin Notes"
              placeholder="Fulfillment instructions, customer request notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />

            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full mt-2"
              disabled={updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? "Saving Changes…" : "Save Order Changes"}
            </Button>
          </Card>

          {/* Customer Info */}
          <Card title="Customer Information">
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-[var(--admin-text-muted)] block">Customer Name</span>
                <span className="font-medium text-[var(--admin-text-primary)]">{ord.customerInfo.name}</span>
              </div>
              <div>
                <span className="text-xs text-[var(--admin-text-muted)] block">Email Address</span>
                <a href={`mailto:${ord.customerInfo.email}`} className="text-[var(--admin-accent)] hover:underline">
                  {ord.customerInfo.email}
                </a>
              </div>
              {ord.customerInfo.phone && (
                <div>
                  <span className="text-xs text-[var(--admin-text-muted)] block">Phone Number</span>
                  <span className="text-[var(--admin-text-primary)]">{ord.customerInfo.phone}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Shipping Address */}
          <Card title="Shipping Address">
            <div className="text-sm text-[var(--admin-text-primary)] leading-relaxed">
              <p>{ord.customerInfo.name}</p>
              <p>{ord.shippingAddress?.street || "No street provided"}</p>
              <p>
                {ord.shippingAddress?.city || ""}, {ord.shippingAddress?.state || ""}{" "}
                {ord.shippingAddress?.postalCode || ""}
              </p>
              <p>{ord.shippingAddress?.country || "United States"}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
