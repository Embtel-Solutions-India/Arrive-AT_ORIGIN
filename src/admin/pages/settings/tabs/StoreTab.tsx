import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { Button, Card, Field, Select } from "../../../components/ui";
import { Toggle } from "../components/Toggle";
import { ConfirmationModal } from "../components/ConfirmationModal";

export function StoreTab() {
  const queryClient = useQueryClient();

  // State
  const [enableStore, setEnableStore] = useState(true);
  const [enableBookOrdering, setEnableBookOrdering] = useState(true);
  const [enableConsultationPurchase, setEnableConsultationPurchase] = useState(true);
  const [guestCheckout, setGuestCheckout] = useState(true);
  const [customerAccountRequired, setCustomerAccountRequired] = useState(false);
  const [enableCoupons, setEnableCoupons] = useState(true);
  const [enableReviews, setEnableReviews] = useState(true);
  const [enableRefunds, setEnableRefunds] = useState(true);
  const [lowStockThresholdAlert, setLowStockThresholdAlert] = useState(5);

  const [orderNumberPrefix, setOrderNumberPrefix] = useState("AAO-");
  const [autoConfirmOrders, setAutoConfirmOrders] = useState(true);
  const [autoCancelUnpaidOrders, setAutoCancelUnpaidOrders] = useState(true);
  const [orderCancellationHours, setOrderCancellationHours] = useState(24);
  const [defaultOrderStatus, setDefaultOrderStatus] = useState("PENDING");

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Confirmation for disabling store
  const [disableStoreModalOpen, setDisableStoreModalOpen] = useState(false);

  // Query Settings
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<{ settings: any }>("/admin/settings"),
  });

  const store = data?.settings?.store;

  useEffect(() => {
    if (store) {
      setEnableStore(store.enableStore ?? true);
      setEnableBookOrdering(store.enableBookOrdering ?? true);
      setEnableConsultationPurchase(store.enableConsultationPurchase ?? true);
      setGuestCheckout(store.guestCheckout ?? true);
      setCustomerAccountRequired(store.customerAccountRequired ?? false);
      setEnableCoupons(store.enableCoupons ?? true);
      setEnableReviews(store.enableReviews ?? true);
      setEnableRefunds(store.enableRefunds ?? true);
      setLowStockThresholdAlert(store.lowStockThresholdAlert ?? 5);

      setOrderNumberPrefix(store.orderNumberPrefix || "AAO-");
      setAutoConfirmOrders(store.autoConfirmOrders ?? true);
      setAutoCancelUnpaidOrders(store.autoCancelUnpaidOrders ?? true);
      setOrderCancellationHours(store.orderCancellationHours ?? 24);
      setDefaultOrderStatus(store.defaultOrderStatus || "PENDING");
    }
  }, [store]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (body: any) => api.put("/admin/settings/store", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      setSavedSuccess(true);
      setErrorMessage("");
      setTimeout(() => setSavedSuccess(false), 3500);
    },
    onError: (err: any) => setErrorMessage(err?.message || "Failed to update store settings"),
  });

  const handleSave = () => {
    saveMutation.mutate({
      enableStore,
      enableBookOrdering,
      enableConsultationPurchase,
      guestCheckout,
      customerAccountRequired,
      enableCoupons,
      enableReviews,
      enableRefunds,
      lowStockThresholdAlert: Number(lowStockThresholdAlert),
      orderNumberPrefix,
      autoConfirmOrders,
      autoCancelUnpaidOrders,
      orderCancellationHours: Number(orderCancellationHours),
      defaultOrderStatus,
    });
  };

  const handleToggleStore = (checked: boolean) => {
    if (!checked) {
      setDisableStoreModalOpen(true);
    } else {
      setEnableStore(true);
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-[var(--admin-text-muted)]">Loading store and order settings…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--admin-border)]/60 pb-5">
        <div>
          <h2 className="text-xl font-display font-medium text-[var(--admin-text-primary)]">
            Store, Products & Order Workflow Settings
          </h2>
          <p className="text-xs text-[var(--admin-text-secondary)] mt-0.5">
            Configure e-commerce catalog toggles, guest checkout policies, order prefixing, and automated fulfillment timers.
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
          ✓ Store and order parameters saved successfully.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Catalog & Checkout Operations */}
        <Card title="E-Commerce & Catalog Switches">
          <div className="space-y-4">
            <div className="divide-y divide-[var(--admin-border)]/40">
              <Toggle
                label="Master Storefront Status"
                description="Master switch. When disabled, public store pages display a scheduled maintenance message."
                checked={enableStore}
                onChange={handleToggleStore}
                badge={enableStore ? "STORE ACTIVE" : "STORE DISABLED"}
              />
              <Toggle
                label="Enable Book Ordering"
                description="Allows purchases of physical and digital publications (e.g., 'Arrive at Origin' books)."
                checked={enableBookOrdering}
                onChange={setEnableBookOrdering}
              />
              <Toggle
                label="Enable Consultation Purchases"
                description="Allows clients to checkout private sessions online."
                checked={enableConsultationPurchase}
                onChange={setEnableConsultationPurchase}
              />
              <Toggle
                label="Allow Guest Checkout"
                description="Permit visitors to purchase without pre-registering an account first."
                checked={guestCheckout}
                onChange={(checked) => {
                  setGuestCheckout(checked);
                  if (checked) setCustomerAccountRequired(false);
                }}
              />
              <Toggle
                label="Require Customer Account Creation"
                description="Forces customers to create credentials and verify their email prior to final payment."
                checked={customerAccountRequired}
                onChange={(checked) => {
                  setCustomerAccountRequired(checked);
                  if (checked) setGuestCheckout(false);
                }}
              />
              <Toggle
                label="Enable Promo Discount Coupons"
                description="Displays discount coupon code input at checkout."
                checked={enableCoupons}
                onChange={setEnableCoupons}
              />
              <Toggle
                label="Enable Customer Product Reviews"
                description="Allows verified buyers to leave ratings and testimonials."
                checked={enableReviews}
                onChange={setEnableReviews}
              />
              <Toggle
                label="Enable Self-Service Refunds"
                description="Allows customer portal refund requests within policy limits."
                checked={enableRefunds}
                onChange={setEnableRefunds}
              />
            </div>
          </div>
        </Card>

        {/* Order Processing & Inventory Limits */}
        <Card title="Order Processing & Inventory Limits">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="Order Number Prefix"
                value={orderNumberPrefix}
                onChange={(e) => setOrderNumberPrefix(e.target.value.toUpperCase())}
                placeholder="AAO-"
                helperText="Appended to generated invoices (e.g. AAO-10042)"
              />
              <Field
                label="Low Stock Threshold Alert"
                type="number"
                min={0}
                max={100}
                value={lowStockThresholdAlert}
                onChange={(e) => setLowStockThresholdAlert(parseInt(e.target.value) || 5)}
                helperText="Send alert when book inventory dips below this count"
              />
            </div>

            <Select
              label="Default Initial Order Status"
              value={defaultOrderStatus}
              onChange={(e) => setDefaultOrderStatus(e.target.value)}
              options={[
                { label: "Pending Payment (PENDING)", value: "PENDING" },
                { label: "Processing / Paid (PROCESSING)", value: "PROCESSING" },
                { label: "Completed Immediately (COMPLETED)", value: "COMPLETED" },
              ]}
            />

            <div className="divide-y divide-[var(--admin-border)]/40 pt-2">
              <Toggle
                label="Auto-Confirm Paid Orders"
                description="Automatically advance order status to Confirmed upon successful payment webhook receipt."
                checked={autoConfirmOrders}
                onChange={setAutoConfirmOrders}
              />
              <Toggle
                label="Auto-Cancel Unpaid Orders"
                description="Automatically release reserved inventory if invoice remains unpaid after designated window."
                checked={autoCancelUnpaidOrders}
                onChange={setAutoCancelUnpaidOrders}
              />
              {autoCancelUnpaidOrders && (
                <div className="py-2">
                  <Field
                    label="Auto-Cancel Grace Period (Hours)"
                    type="number"
                    min={1}
                    max={168}
                    value={orderCancellationHours}
                    onChange={(e) => setOrderCancellationHours(parseInt(e.target.value) || 24)}
                    helperText="Hours before unpaid pending order expires"
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Confirmation: Disable Store */}
      <ConfirmationModal
        open={disableStoreModalOpen}
        onClose={() => setDisableStoreModalOpen(false)}
        title="Disable Online Storefront"
        description="CRITICAL ACTION: Disabling the store will prevent visitors from browsing books, ordering physical products, or purchasing services. Ongoing checkouts will be rejected."
        confirmText="Disable Store"
        confirmVariant="danger"
        requiredPhrase="DISABLE STORE"
        onConfirm={() => {
          setEnableStore(false);
          setDisableStoreModalOpen(false);
        }}
      />
    </div>
  );
}
