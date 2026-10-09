import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { Button, Card, Field, Select } from "../../../components/ui";
import { Toggle } from "../components/Toggle";

export function ShippingTab() {
  const queryClient = useQueryClient();

  // State
  const [enableShipping, setEnableShipping] = useState(true);
  const [standardShippingFeeUSD, setStandardShippingFeeUSD] = useState<number>(0);
  const [standardShippingFeeINR, setStandardShippingFeeINR] = useState<number>(0);
  const [enableFreeDelivery, setEnableFreeDelivery] = useState(true);
  const [freeDeliveryThresholdUSD, setFreeDeliveryThresholdUSD] = useState<number>(50);
  const [freeDeliveryThresholdINR, setFreeDeliveryThresholdINR] = useState<number>(400);
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState("3–5 Business Days");
  const [deliveryNotes, setDeliveryNotes] = useState(
    "Orders are safely packed and dispatched within 24-48 hours."
  );
  const [enableSalesTax, setEnableSalesTax] = useState(false);
  const [salesTaxPercentage, setSalesTaxPercentage] = useState<number>(0);
  const [taxCalculationMode, setTaxCalculationMode] = useState<"exclusive" | "inclusive">("exclusive");
  const [restrictedPincodes, setRestrictedPincodes] = useState("");
  const [allowInternationalShipping, setAllowInternationalShipping] = useState(true);
  const [internationalShippingFeeUSD, setInternationalShippingFeeUSD] = useState<number>(15);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Query Settings
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<{ settings: any }>("/admin/settings"),
  });

  const shipping = data?.settings?.shipping;

  useEffect(() => {
    if (shipping) {
      setEnableShipping(shipping.enableShipping ?? true);
      setStandardShippingFeeUSD(shipping.standardShippingFeeUSD ?? 0);
      setStandardShippingFeeINR(shipping.standardShippingFeeINR ?? 0);
      setEnableFreeDelivery(shipping.enableFreeDelivery ?? true);
      setFreeDeliveryThresholdUSD(shipping.freeDeliveryThresholdUSD ?? 50);
      setFreeDeliveryThresholdINR(shipping.freeDeliveryThresholdINR ?? 400);
      setEstimatedDeliveryDays(shipping.estimatedDeliveryDays || "3–5 Business Days");
      setDeliveryNotes(
        shipping.deliveryNotes || "Orders are safely packed and dispatched within 24-48 hours."
      );
      setEnableSalesTax(shipping.enableSalesTax ?? false);
      setSalesTaxPercentage(shipping.salesTaxPercentage ?? 0);
      setTaxCalculationMode(shipping.taxCalculationMode || "exclusive");
      setRestrictedPincodes(shipping.restrictedPincodes || "");
      setAllowInternationalShipping(shipping.allowInternationalShipping ?? true);
      setInternationalShippingFeeUSD(shipping.internationalShippingFeeUSD ?? 15);
    }
  }, [shipping]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: (body: any) => api.put("/admin/settings/shipping", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      setSavedSuccess(true);
      setErrorMessage("");
      setTimeout(() => setSavedSuccess(false), 3500);
    },
    onError: (err: any) => setErrorMessage(err?.message || "Failed to update shipping settings"),
  });

  const handleSave = () => {
    saveMutation.mutate({
      enableShipping,
      standardShippingFeeUSD: Number(standardShippingFeeUSD) || 0,
      standardShippingFeeINR: Number(standardShippingFeeINR) || 0,
      enableFreeDelivery,
      freeDeliveryThresholdUSD: Number(freeDeliveryThresholdUSD) || 0,
      freeDeliveryThresholdINR: Number(freeDeliveryThresholdINR) || 0,
      estimatedDeliveryDays,
      deliveryNotes,
      enableSalesTax,
      salesTaxPercentage: Number(salesTaxPercentage) || 0,
      taxCalculationMode,
      restrictedPincodes,
      allowInternationalShipping,
      internationalShippingFeeUSD: Number(internationalShippingFeeUSD) || 0,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--admin-accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--admin-border)] pb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--admin-text-primary)]">
            🚚 Shipping & Delivery Configuration
          </h2>
          <p className="text-xs text-[var(--admin-text-secondary)] mt-0.5">
            Configure delivery charges, free shipping criteria, estimated transit times, and sales tax rules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 animate-fadeIn">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Settings Saved!
            </span>
          )}
          {errorMessage && (
            <span className="text-xs text-rose-400 font-medium">{errorMessage}</span>
          )}
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="px-6"
          >
            {saveMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Card 1: Core Shipping Status & Standard Rates */}
        <Card title="Standard Shipping Rates">
          <div className="space-y-4">
            <Toggle
              label="Enable Shipping Charges"
              description="Calculate shipping charges during online book checkout"
              checked={enableShipping}
              onChange={setEnableShipping}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Field
                label="Standard Shipping Fee (USD $)"
                type="number"
                step="0.01"
                min="0"
                value={standardShippingFeeUSD}
                onChange={(e) => setStandardShippingFeeUSD(parseFloat(e.target.value) || 0)}
                helperText="Set to 0.00 for completely free standard shipping in USD"
              />
              <Field
                label="Standard Shipping Fee (INR ₹)"
                type="number"
                step="1"
                min="0"
                value={standardShippingFeeINR}
                onChange={(e) => setStandardShippingFeeINR(parseFloat(e.target.value) || 0)}
                helperText="Set to 0 for completely free standard shipping in INR"
              />
            </div>
          </div>
        </Card>

        {/* Card 2: Free Delivery Rules */}
        <Card title="Free Delivery Thresholds">
          <div className="space-y-4">
            <Toggle
              label="Enable Free Delivery"
              description="Automatically waive shipping fees when cart total reaches minimum threshold"
              checked={enableFreeDelivery}
              onChange={setEnableFreeDelivery}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Field
                label="Free Delivery Above (USD $)"
                type="number"
                step="1"
                min="0"
                value={freeDeliveryThresholdUSD}
                onChange={(e) => setFreeDeliveryThresholdUSD(parseFloat(e.target.value) || 0)}
                helperText="Orders at or above this amount ship free in USD"
              />
              <Field
                label="Free Delivery Above (INR ₹)"
                type="number"
                step="10"
                min="0"
                value={freeDeliveryThresholdINR}
                onChange={(e) => setFreeDeliveryThresholdINR(parseFloat(e.target.value) || 0)}
                helperText="Orders at or above this amount ship free in INR"
              />
            </div>
          </div>
        </Card>

        {/* Card 3: Estimated Delivery & Fulfillment Notes */}
        <Card title="Transit Times & Fulfillment Notice">
          <div className="space-y-4">
            <Field
              label="Estimated Delivery Window"
              placeholder="e.g. 3–5 Business Days"
              value={estimatedDeliveryDays}
              onChange={(e) => setEstimatedDeliveryDays(e.target.value)}
              helperText="Displayed to customers on checkout and order confirmation receipts"
            />

            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--admin-text-muted)] uppercase">
                Packaging & Delivery Notice
              </label>
              <textarea
                rows={3}
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="e.g. Orders are safely packed and dispatched within 24-48 hours…"
                className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] p-3 text-sm text-[var(--admin-text-primary)] focus:border-[var(--admin-accent)] focus:outline-none"
              />
              <p className="mt-1 text-[0.75rem] text-[var(--admin-text-muted)]">
                Included in the order confirmation email sent to the customer.
              </p>
            </div>
          </div>
        </Card>

        {/* Card 4: Sales Tax Configuration */}
        <Card title="Sales Tax Configuration">
          <div className="space-y-4">
            <Toggle
              label="Enable Sales Tax"
              description="Calculate estimated sales tax during book checkout"
              checked={enableSalesTax}
              onChange={setEnableSalesTax}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Field
                label="Sales Tax Percentage (%)"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={salesTaxPercentage}
                onChange={(e) => setSalesTaxPercentage(parseFloat(e.target.value) || 0)}
                helperText="Set to 0% to remove sales tax from checkout"
              />

              <Select
                label="Calculation Mode"
                value={taxCalculationMode}
                onChange={(e) => setTaxCalculationMode(e.target.value as "exclusive" | "inclusive")}
              >
                <option value="exclusive" className="bg-[#14161f]">Exclusive (Added at checkout)</option>
                <option value="inclusive" className="bg-[#14161f]">Inclusive (Already in price)</option>
              </Select>
            </div>

            <div className="rounded-xl border border-[var(--admin-border)]/60 bg-[rgba(237,231,218,0.03)] p-3 text-xs text-[var(--admin-text-secondary)]">
              💡 When Sales Tax is disabled or set to 0%, the sales tax line is completely omitted from the checkout summary.
            </div>
          </div>
        </Card>

        {/* Card 5: International Shipping */}
        <Card title="International Shipping">
          <div className="space-y-4">
            <Toggle
              label="Allow International Shipping"
              description="Allow customers outside domestic regions to place orders"
              checked={allowInternationalShipping}
              onChange={setAllowInternationalShipping}
            />

            <Field
              label="International Shipping Surcharge (USD $)"
              type="number"
              step="1"
              min="0"
              value={internationalShippingFeeUSD}
              onChange={(e) => setInternationalShippingFeeUSD(parseFloat(e.target.value) || 0)}
              helperText="Additional fee applied for non-domestic destinations"
            />
          </div>
        </Card>

        {/* Card 6: Delivery Restrictions */}
        <Card title="Delivery Restrictions">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--admin-text-muted)] uppercase">
                Restricted Postal / Pincodes (Comma separated)
              </label>
              <textarea
                rows={3}
                value={restrictedPincodes}
                onChange={(e) => setRestrictedPincodes(e.target.value)}
                placeholder="e.g. 110001, 400001, 90210"
                className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] p-3 font-mono text-sm text-[var(--admin-text-primary)] focus:border-[var(--admin-accent)] focus:outline-none"
              />
              <p className="mt-1 text-[0.75rem] text-[var(--admin-text-muted)]">
                Orders with these pincodes will be flagged for manual review or restricted.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex justify-end pt-4 border-t border-[var(--admin-border)]">
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="px-8"
        >
          {saveMutation.isPending ? "Saving Settings…" : "Save Shipping Settings"}
        </Button>
      </div>
    </div>
  );
}
