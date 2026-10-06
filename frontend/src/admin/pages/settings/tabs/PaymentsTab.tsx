import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { Button, Card, Field, Select, Badge } from "../../../components/ui";
import { Toggle } from "../components/Toggle";
import { ConfirmationModal } from "../components/ConfirmationModal";

export function PaymentsTab() {
  const queryClient = useQueryClient();

  // Stripe State
  const [stripeActive, setStripeActive] = useState(false);
  const [stripeMode, setStripeMode] = useState<"test" | "live">("test");
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState("");
  const [stripeCurrency, setStripeCurrency] = useState("USD");

  // Razorpay State
  const [razorpayActive, setRazorpayActive] = useState(true);
  const [razorpayMode, setRazorpayMode] = useState<"test" | "live">("test");
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState("");
  const [razorpayCurrency, setRazorpayCurrency] = useState("USD");

  // PayPal State
  const [paypalActive, setPaypalActive] = useState(false);
  const [paypalMode, setPaypalMode] = useState<"sandbox" | "live">("sandbox");
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalClientSecret, setPaypalClientSecret] = useState("");
  const [paypalWebhookId, setPaypalWebhookId] = useState("");
  const [paypalCurrency, setPaypalCurrency] = useState("USD");

  // Rules State
  const [defaultGateway, setDefaultGateway] = useState("razorpay");
  const [allowMultipleGateways, setAllowMultipleGateways] = useState(true);
  const [rulesCurrency, setRulesCurrency] = useState("USD");
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [transactionFeePercentage, setTransactionFeePercentage] = useState(0);
  const [minPaymentAmount, setMinPaymentAmount] = useState(1);
  const [maxPaymentAmount, setMaxPaymentAmount] = useState(10000);
  const [enableRefunds, setEnableRefunds] = useState(true);
  const [enablePartialRefunds, setEnablePartialRefunds] = useState(true);

  // Status and feedback
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean; message: string } | null>(null);

  // Critical Confirmations
  const [liveConfirmOpen, setLiveConfirmOpen] = useState(false);
  const [pendingLiveProvider, setPendingLiveProvider] = useState<"stripe" | "razorpay" | "paypal" | null>(null);
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);
  const [pendingDisableProvider, setPendingDisableProvider] = useState<"stripe" | "razorpay" | "paypal" | null>(null);

  // Query Settings
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<{ settings: any }>("/admin/settings"),
  });

  const pay = data?.settings?.payments;

  useEffect(() => {
    if (pay) {
      if (pay.stripe) {
        setStripeActive(pay.stripe.active ?? false);
        setStripeMode(pay.stripe.mode ?? "test");
        setStripePublishableKey(pay.stripe.publishableKey || "");
        setStripeSecretKey(pay.stripe.secretKey || "");
        setStripeWebhookSecret(pay.stripe.webhookSecret || "");
        setStripeCurrency(pay.stripe.currency || "USD");
      }
      if (pay.razorpay) {
        setRazorpayActive(pay.razorpay.active ?? true);
        setRazorpayMode(pay.razorpay.mode ?? "test");
        setRazorpayKeyId(pay.razorpay.keyId || "");
        setRazorpayKeySecret(pay.razorpay.keySecret || "");
        setRazorpayWebhookSecret(pay.razorpay.webhookSecret || "");
        setRazorpayCurrency(pay.razorpay.currency || "USD");
      }
      if (pay.paypal) {
        setPaypalActive(pay.paypal.active ?? false);
        setPaypalMode(pay.paypal.mode ?? "sandbox");
        setPaypalClientId(pay.paypal.clientId || "");
        setPaypalClientSecret(pay.paypal.clientSecret || "");
        setPaypalWebhookId(pay.paypal.webhookId || "");
        setPaypalCurrency(pay.paypal.currency || "USD");
      }
      if (pay.rules) {
        setDefaultGateway(pay.rules.defaultGateway || "razorpay");
        setAllowMultipleGateways(pay.rules.allowMultipleGateways ?? true);
        setRulesCurrency(pay.rules.currency || "USD");
        setTaxPercentage(pay.rules.taxPercentage ?? 0);
        setTransactionFeePercentage(pay.rules.transactionFeePercentage ?? 0);
        setMinPaymentAmount(pay.rules.minPaymentAmount ?? 1);
        setMaxPaymentAmount(pay.rules.maxPaymentAmount ?? 10000);
        setEnableRefunds(pay.rules.enableRefunds ?? true);
        setEnablePartialRefunds(pay.rules.enablePartialRefunds ?? true);
      }
    }
  }, [pay]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (body: any) => api.put("/admin/settings/payments", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      setSavedSuccess(true);
      setErrorMessage("");
      setTimeout(() => setSavedSuccess(false), 3500);
    },
    onError: (err: any) => setErrorMessage(err?.message || "Failed to update payment settings"),
  });

  const testConnectionMutation = useMutation({
    mutationFn: (provider: string) => api.post(`/admin/settings/payments/${provider}/test`),
    onSuccess: (res: any, provider: string) => {
      setTestResult({
        provider,
        success: true,
        message: res?.message || `Successfully connected and verified ${provider.toUpperCase()} credentials.`,
      });
    },
    onError: (err: any, provider: string) => {
      setTestResult({
        provider,
        success: false,
        message: err?.message || `Failed to establish connection with ${provider.toUpperCase()}.`,
      });
    },
  });

  const handleSaveAll = () => {
    saveMutation.mutate({
      stripe: {
        active: stripeActive,
        mode: stripeMode,
        publishableKey: stripePublishableKey,
        secretKey: stripeSecretKey,
        webhookSecret: stripeWebhookSecret,
        currency: stripeCurrency,
      },
      razorpay: {
        active: razorpayActive,
        mode: razorpayMode,
        keyId: razorpayKeyId,
        keySecret: razorpayKeySecret,
        webhookSecret: razorpayWebhookSecret,
        currency: razorpayCurrency,
      },
      paypal: {
        active: paypalActive,
        mode: paypalMode,
        clientId: paypalClientId,
        clientSecret: paypalClientSecret,
        webhookId: paypalWebhookId,
        currency: paypalCurrency,
      },
      rules: {
        defaultGateway,
        allowMultipleGateways,
        currency: rulesCurrency,
        taxPercentage: Number(taxPercentage),
        transactionFeePercentage: Number(transactionFeePercentage),
        minPaymentAmount: Number(minPaymentAmount),
        maxPaymentAmount: Number(maxPaymentAmount),
        enableRefunds,
        enablePartialRefunds,
      },
    });
  };

  // Helper to handle switching mode to live
  const requestModeChange = (provider: "stripe" | "razorpay" | "paypal", targetMode: "live" | "test" | "sandbox") => {
    if (targetMode === "live") {
      setPendingLiveProvider(provider);
      setLiveConfirmOpen(true);
    } else {
      if (provider === "stripe") setStripeMode("test");
      if (provider === "razorpay") setRazorpayMode("test");
      if (provider === "paypal") setPaypalMode("sandbox");
    }
  };

  // Helper to handle disabling active gateway
  const requestToggleActive = (provider: "stripe" | "razorpay" | "paypal", nextState: boolean) => {
    if (!nextState) {
      setPendingDisableProvider(provider);
      setDisableConfirmOpen(true);
    } else {
      if (provider === "stripe") setStripeActive(true);
      if (provider === "razorpay") setRazorpayActive(true);
      if (provider === "paypal") setPaypalActive(true);
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-[var(--admin-text-muted)]">Loading payment configurations…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--admin-border)]/60 pb-5">
        <div>
          <h2 className="text-xl font-display font-medium text-[var(--admin-text-primary)]">
            Payment Gateways & Transaction Rules
          </h2>
          <p className="text-xs text-[var(--admin-text-secondary)] mt-0.5">
            Configure multi-currency processors, test connections, and manage transaction limits securely.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveAll}
            disabled={saveMutation.isPending}
            className="text-xs"
          >
            {saveMutation.isPending ? "Saving…" : savedSuccess ? "✓ Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
          ✓ Payment gateway configurations saved successfully. Sensitive keys have been encrypted.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      {testResult && (
        <div
          className={`rounded-xl border p-3.5 text-xs flex items-center justify-between gap-3 ${
            testResult.success
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          <div>
            <strong className="uppercase font-mono tracking-wider mr-2">
              [{testResult.provider}]
            </strong>
            {testResult.message}
          </div>
          <button
            type="button"
            onClick={() => setTestResult(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* GATEWAY CARDS GRID */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 1. STRIPE CARD */}
        <Card
          title="Stripe"
          action={
            <div className="flex items-center gap-2">
              <Badge tone={stripeActive ? (stripeMode === "live" ? "good" : "warn") : "neutral"}>
                {!stripeActive ? "Disabled" : stripeMode === "live" ? "Live Mode" : "Test Mode"}
              </Badge>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--admin-border)]/40">
              <Toggle
                label="Enable Stripe"
                checked={stripeActive}
                onChange={(checked) => requestToggleActive("stripe", checked)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[0.85rem] font-medium text-[var(--admin-text-secondary)]">
                Environment Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => requestModeChange("stripe", "test")}
                  className={`rounded-xl py-2 text-xs font-semibold border transition-all ${
                    stripeMode === "test"
                      ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                      : "border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-white"
                  }`}
                >
                  Test Mode
                </button>
                <button
                  type="button"
                  onClick={() => requestModeChange("stripe", "live")}
                  className={`rounded-xl py-2 text-xs font-semibold border transition-all ${
                    stripeMode === "live"
                      ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
                      : "border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-white"
                  }`}
                >
                  Live Production
                </button>
              </div>
            </div>

            <Field
              label="Publishable Key"
              value={stripePublishableKey}
              onChange={(e) => setStripePublishableKey(e.target.value)}
              placeholder="pk_test_..."
            />

            <Field
              label="Secret Key (Masked)"
              type="text"
              value={stripeSecretKey}
              onChange={(e) => setStripeSecretKey(e.target.value)}
              placeholder="••••••••••••1234 or sk_live_..."
              helperText="Secret keys are stored with AES-256 encryption."
            />

            <Field
              label="Webhook Secret (Masked)"
              type="text"
              value={stripeWebhookSecret}
              onChange={(e) => setStripeWebhookSecret(e.target.value)}
              placeholder="whsec_..."
            />

            <Field
              label="Default Currency"
              value={stripeCurrency}
              onChange={(e) => setStripeCurrency(e.target.value.toUpperCase())}
              placeholder="USD"
            />

            <div className="pt-2 border-t border-[var(--admin-border)]/40 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                disabled={testConnectionMutation.isPending}
                onClick={() => testConnectionMutation.mutate("stripe")}
              >
                {testConnectionMutation.isPending ? "Testing…" : "Test Stripe Connection"}
              </Button>
            </div>
          </div>
        </Card>

        {/* 2. RAZORPAY CARD */}
        <Card
          title="Razorpay"
          action={
            <div className="flex items-center gap-2">
              <Badge tone={razorpayActive ? (razorpayMode === "live" ? "good" : "warn") : "neutral"}>
                {!razorpayActive ? "Disabled" : razorpayMode === "live" ? "Live Mode" : "Test Mode"}
              </Badge>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--admin-border)]/40">
              <Toggle
                label="Enable Razorpay"
                checked={razorpayActive}
                onChange={(checked) => requestToggleActive("razorpay", checked)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[0.85rem] font-medium text-[var(--admin-text-secondary)]">
                Environment Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => requestModeChange("razorpay", "test")}
                  className={`rounded-xl py-2 text-xs font-semibold border transition-all ${
                    razorpayMode === "test"
                      ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                      : "border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-white"
                  }`}
                >
                  Test Mode
                </button>
                <button
                  type="button"
                  onClick={() => requestModeChange("razorpay", "live")}
                  className={`rounded-xl py-2 text-xs font-semibold border transition-all ${
                    razorpayMode === "live"
                      ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
                      : "border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-white"
                  }`}
                >
                  Live Production
                </button>
              </div>
            </div>

            <Field
              label="Key ID"
              value={razorpayKeyId}
              onChange={(e) => setRazorpayKeyId(e.target.value)}
              placeholder="rzp_test_..."
            />

            <Field
              label="Key Secret (Masked)"
              type="text"
              value={razorpayKeySecret}
              onChange={(e) => setRazorpayKeySecret(e.target.value)}
              placeholder="••••••••••••1234 or your secret"
              helperText="Encrypted securely on server"
            />

            <Field
              label="Webhook Secret (Masked)"
              type="text"
              value={razorpayWebhookSecret}
              onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
              placeholder="••••••••••••1234"
            />

            <Field
              label="Default Currency"
              value={razorpayCurrency}
              onChange={(e) => setRazorpayCurrency(e.target.value.toUpperCase())}
              placeholder="USD"
            />

            <div className="pt-2 border-t border-[var(--admin-border)]/40 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                disabled={testConnectionMutation.isPending}
                onClick={() => testConnectionMutation.mutate("razorpay")}
              >
                {testConnectionMutation.isPending ? "Testing…" : "Test Razorpay Connection"}
              </Button>
            </div>
          </div>
        </Card>

        {/* 3. PAYPAL CARD */}
        <Card
          title="PayPal"
          action={
            <div className="flex items-center gap-2">
              <Badge tone={paypalActive ? (paypalMode === "live" ? "good" : "warn") : "neutral"}>
                {!paypalActive ? "Disabled" : paypalMode === "live" ? "Live Mode" : "Sandbox"}
              </Badge>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--admin-border)]/40">
              <Toggle
                label="Enable PayPal"
                checked={paypalActive}
                onChange={(checked) => requestToggleActive("paypal", checked)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[0.85rem] font-medium text-[var(--admin-text-secondary)]">
                Environment Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => requestModeChange("paypal", "sandbox")}
                  className={`rounded-xl py-2 text-xs font-semibold border transition-all ${
                    paypalMode === "sandbox"
                      ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                      : "border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-white"
                  }`}
                >
                  Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => requestModeChange("paypal", "live")}
                  className={`rounded-xl py-2 text-xs font-semibold border transition-all ${
                    paypalMode === "live"
                      ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
                      : "border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:text-white"
                  }`}
                >
                  Live Production
                </button>
              </div>
            </div>

            <Field
              label="Client ID"
              value={paypalClientId}
              onChange={(e) => setPaypalClientId(e.target.value)}
              placeholder="PayPal App Client ID"
            />

            <Field
              label="Client Secret (Masked)"
              type="text"
              value={paypalClientSecret}
              onChange={(e) => setPaypalClientSecret(e.target.value)}
              placeholder="••••••••••••1234"
              helperText="Encrypted securely on server"
            />

            <Field
              label="Webhook ID (Masked)"
              type="text"
              value={paypalWebhookId}
              onChange={(e) => setPaypalWebhookId(e.target.value)}
              placeholder="••••••••••••1234"
            />

            <Field
              label="Default Currency"
              value={paypalCurrency}
              onChange={(e) => setPaypalCurrency(e.target.value.toUpperCase())}
              placeholder="USD"
            />

            <div className="pt-2 border-t border-[var(--admin-border)]/40 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                disabled={testConnectionMutation.isPending}
                onClick={() => testConnectionMutation.mutate("paypal")}
              >
                {testConnectionMutation.isPending ? "Testing…" : "Test PayPal Connection"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* PAYMENT RULES & TRANSACTION CONTROLS */}
      <Card title="Payment Rules & Limits">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Default Payment Gateway"
              value={defaultGateway}
              onChange={(e) => setDefaultGateway(e.target.value)}
              options={[
                { label: "Razorpay", value: "razorpay" },
                { label: "Stripe", value: "stripe" },
                { label: "PayPal", value: "paypal" },
              ]}
            />
            <Field
              label="Global Store Currency"
              value={rulesCurrency}
              onChange={(e) => setRulesCurrency(e.target.value.toUpperCase())}
            />
            <Field
              label="Sales Tax Percentage (%)"
              type="number"
              step="0.01"
              value={taxPercentage}
              onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
            />
            <Field
              label="Transaction Processing Fee (%)"
              type="number"
              step="0.01"
              value={transactionFeePercentage}
              onChange={(e) => setTransactionFeePercentage(parseFloat(e.target.value) || 0)}
            />
            <Field
              label="Minimum Checkout Amount ($)"
              type="number"
              value={minPaymentAmount}
              onChange={(e) => setMinPaymentAmount(parseFloat(e.target.value) || 1)}
            />
            <Field
              label="Maximum Checkout Amount ($)"
              type="number"
              value={maxPaymentAmount}
              onChange={(e) => setMaxPaymentAmount(parseFloat(e.target.value) || 10000)}
            />
          </div>

          <div className="divide-y divide-[var(--admin-border)]/40 pt-2">
            <Toggle
              label="Allow Multiple Payment Gateways at Checkout"
              description="Displays all active processors so customers can choose between cards, UPI, or PayPal."
              checked={allowMultipleGateways}
              onChange={setAllowMultipleGateways}
            />
            <Toggle
              label="Enable Customer Refunds"
              description="Allows administrators to process full order refunds directly from the admin portal."
              checked={enableRefunds}
              onChange={setEnableRefunds}
            />
            <Toggle
              label="Enable Partial Refunds"
              description="Permits issuing partial credits without cancelling the entire booking or order."
              checked={enablePartialRefunds}
              onChange={setEnablePartialRefunds}
            />
          </div>
        </div>
      </Card>

      {/* CONFIRMATION MODAL: ACTIVATE LIVE PAYMENTS */}
      <ConfirmationModal
        open={liveConfirmOpen}
        onClose={() => {
          setLiveConfirmOpen(false);
          setPendingLiveProvider(null);
        }}
        title={`Activate Live Production Payments: ${pendingLiveProvider?.toUpperCase() || ""}`}
        description="WARNING: You are switching to LIVE production mode. Real financial charges and transactions will immediately be processed from customer bank accounts and credit cards."
        confirmText="Activate Live Payments"
        confirmVariant="danger"
        requiredPhrase="I understand that this will activate live payments."
        requirePassword={true}
        onConfirm={(_adminPassword) => {
          if (pendingLiveProvider === "stripe") setStripeMode("live");
          if (pendingLiveProvider === "razorpay") setRazorpayMode("live");
          if (pendingLiveProvider === "paypal") setPaypalMode("live");
          setLiveConfirmOpen(false);
          setPendingLiveProvider(null);
        }}
      />

      {/* CONFIRMATION MODAL: DISABLE PAYMENT GATEWAY */}
      <ConfirmationModal
        open={disableConfirmOpen}
        onClose={() => {
          setDisableConfirmOpen(false);
          setPendingDisableProvider(null);
        }}
        title={`Disable Payment Gateway: ${pendingDisableProvider?.toUpperCase() || ""}`}
        description="Are you sure you want to disable this payment processor? Customers will no longer be able to check out with this method."
        confirmText="Disable Gateway"
        confirmVariant="danger"
        onConfirm={() => {
          if (pendingDisableProvider === "stripe") setStripeActive(false);
          if (pendingDisableProvider === "razorpay") setRazorpayActive(false);
          if (pendingDisableProvider === "paypal") setPaypalActive(false);
          setDisableConfirmOpen(false);
          setPendingDisableProvider(null);
        }}
      />
    </div>
  );
}
