import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { Button, Card, Field, Select, Badge, Modal } from "../../../components/ui";

const PROVIDER_OPTIONS = [
  { label: "Resend (Official API / Recommended)", value: "resend" },
  { label: "Standard SMTP", value: "smtp" },
  { label: "Google / Gmail Workspace", value: "gmail" },
  { label: "SendGrid", value: "sendgrid" },
  { label: "Mailgun", value: "mailgun" },
  { label: "Amazon SES", value: "ses" },
];

const ENCRYPTION_OPTIONS = [
  { label: "SSL / TLS (Port 465)", value: "ssl" },
  { label: "STARTTLS (Port 587)", value: "tls" },
  { label: "None (Unencrypted / Local)", value: "none" },
];

export function EmailTab() {
  const queryClient = useQueryClient();

  // State
  const [provider, setProvider] = useState("resend");
  const [fromName, setFromName] = useState("Arrive at Origin");
  const [fromEmail, setFromEmail] = useState("info@arriveatorigin.com");
  const [replyToEmail, setReplyToEmail] = useState("info@arriveatorigin.com");
  const [smtpHost, setSmtpHost] = useState("smtp.resend.com");
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpUser, setSmtpUser] = useState("resend");
  const [smtpPass, setSmtpPass] = useState("");
  const [encryption, setEncryption] = useState("ssl");

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Test Email Modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState("shiv@embtelsolutions.com");
  const [testSuccess, setTestSuccess] = useState(false);
  const [testError, setTestError] = useState("");

  // Query Settings
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<{ settings: any }>("/admin/settings"),
  });

  const emailSettings = data?.settings?.email;

  useEffect(() => {
    if (emailSettings) {
      setProvider(emailSettings.provider || "resend");
      setFromName(emailSettings.fromName || "Arrive at Origin");
      setFromEmail(emailSettings.fromEmail || "info@arriveatorigin.com");
      setReplyToEmail(emailSettings.replyToEmail || "info@arriveatorigin.com");
      setSmtpHost(emailSettings.smtpHost || "smtp.resend.com");
      setSmtpPort(emailSettings.smtpPort ?? 465);
      setSmtpUser(emailSettings.smtpUser || "resend");
      setSmtpPass(emailSettings.smtpPass || "");
      setEncryption(emailSettings.encryption || "ssl");
    }
  }, [emailSettings]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (body: any) => api.put("/admin/settings/email", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      setSavedSuccess(true);
      setErrorMessage("");
      setTimeout(() => setSavedSuccess(false), 3500);
    },
    onError: (err: any) => setErrorMessage(err?.message || "Failed to save email configuration"),
  });

  const testEmailMutation = useMutation({
    mutationFn: (recipient: string) =>
      api.post("/admin/settings/email/test", { to: recipient }),
    onSuccess: () => {
      setTestSuccess(true);
      setTestError("");
      setTimeout(() => {
        setTestSuccess(false);
        setTestModalOpen(false);
      }, 2500);
    },
    onError: (err: any) => {
      setTestError(err?.message || "Failed to send test email. Check server credentials.");
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      provider,
      fromName,
      fromEmail,
      replyToEmail,
      smtpHost,
      smtpPort: Number(smtpPort),
      smtpUser,
      smtpPass,
      encryption,
    });
  };

  const handleReset = () => {
    if (emailSettings) {
      setProvider(emailSettings.provider || "resend");
      setFromName(emailSettings.fromName || "Arrive at Origin");
      setFromEmail(emailSettings.fromEmail || "info@arriveatorigin.com");
      setReplyToEmail(emailSettings.replyToEmail || "info@arriveatorigin.com");
      setSmtpHost(emailSettings.smtpHost || "smtp.resend.com");
      setSmtpPort(emailSettings.smtpPort ?? 465);
      setSmtpUser(emailSettings.smtpUser || "resend");
      setSmtpPass(emailSettings.smtpPass || "");
      setEncryption(emailSettings.encryption || "ssl");
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-[var(--admin-text-muted)]">Loading email configuration…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--admin-border)]/60 pb-5">
        <div>
          <h2 className="text-xl font-display font-medium text-[var(--admin-text-primary)]">
            Email Delivery & SMTP Configuration
          </h2>
          <p className="text-xs text-[var(--admin-text-secondary)] mt-0.5">
            Configure transactional email gateways for booking receipts, user verifications, and automated notifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTestError("");
              setTestSuccess(false);
              setTestModalOpen(true);
            }}
            className="text-xs"
          >
            ✉️ Send Test Email
          </Button>
          <Button variant="secondary" size="sm" onClick={handleReset} className="text-xs">
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="text-xs"
          >
            {saveMutation.isPending ? "Saving…" : savedSuccess ? "✓ Saved!" : "Save Configuration"}
          </Button>
        </div>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
          ✓ Email server settings saved successfully.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Settings Form (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          <Card title="Provider & Sender Information">
            <div className="space-y-4">
              <Select
                label="Email Service Provider"
                value={provider}
                onChange={(e) => {
                  const p = e.target.value;
                  setProvider(p);
                  if (p === "resend") {
                    setSmtpHost("smtp.resend.com");
                    setSmtpPort(465);
                    setSmtpUser("resend");
                  } else if (p === "gmail") {
                    setSmtpHost("smtp.gmail.com");
                    setSmtpPort(465);
                  } else if (p === "sendgrid") {
                    setSmtpHost("smtp.sendgrid.net");
                    setSmtpPort(587);
                    setSmtpUser("apikey");
                  } else if (p === "mailgun") {
                    setSmtpHost("smtp.mailgun.org");
                    setSmtpPort(587);
                  }
                }}
                options={PROVIDER_OPTIONS}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field
                  label="From Name"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder="Arrive at Origin"
                  helperText="Displayed in customer inbox"
                />
                <Field
                  label="From Email"
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  placeholder="info@arriveatorigin.com"
                />
                <Field
                  label="Reply-To Email"
                  type="email"
                  value={replyToEmail}
                  onChange={(e) => setReplyToEmail(e.target.value)}
                  placeholder="support@arriveatorigin.com"
                />
              </div>
            </div>
          </Card>

          <Card title="SMTP Connection Credentials">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Field
                    label="SMTP Host / Server"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div>
                  <Field
                    label="SMTP Port"
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(parseInt(e.target.value) || 465)}
                    placeholder="465 or 587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field
                  label="SMTP Username / API Key"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  placeholder="Username or API Key"
                />
                <Field
                  label="SMTP Password / Secret (Masked)"
                  type="text"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  placeholder="••••••••••••1234"
                  helperText="Credentials stored with AES-256 encryption"
                />
              </div>

              <Select
                label="Security Encryption Protocol"
                value={encryption}
                onChange={(e) => setEncryption(e.target.value)}
                options={ENCRYPTION_OPTIONS}
              />
            </div>
          </Card>
        </div>

        {/* Sidebar Info & Connection Status */}
        <div className="space-y-6">
          <Card title="Email Gateway Status">
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-border)]/50">
                <span className="text-[var(--admin-text-secondary)]">Connection Status</span>
                <Badge tone="good">Operational</Badge>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-border)]/50">
                <span className="text-[var(--admin-text-secondary)]">Active Provider</span>
                <span className="font-mono text-[var(--admin-accent)] uppercase font-semibold">
                  {provider}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-border)]/50">
                <span className="text-[var(--admin-text-secondary)]">Default Sender</span>
                <span className="font-mono text-[var(--admin-text-primary)] truncate max-w-[150px]">
                  {fromEmail}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[var(--admin-text-secondary)]">Encryption</span>
                <span className="font-mono text-[var(--admin-text-primary)] uppercase">
                  {encryption}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Deliverability Best Practices">
            <div className="space-y-3 text-xs text-[var(--admin-text-secondary)] leading-relaxed">
              <p>
                ✓ Ensure DNS <strong>SPF</strong>, <strong>DKIM</strong>, and <strong>DMARC</strong> records are configured on <code className="text-amber-300">arriveatorigin.com</code> to guarantee 99%+ deliverability.
              </p>
              <p>
                ✓ For Resend API delivery, verification tokens are validated automatically against your registered sender domain.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Test Email Modal */}
      <Modal
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title="Send Test Email"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            testEmailMutation.mutate(testRecipient);
          }}
          className="space-y-4"
        >
          {testSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              ✓ Test email successfully dispatched to <strong>{testRecipient}</strong>!
            </div>
          )}

          {testError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {testError}
            </div>
          )}

          <p className="text-xs text-[var(--admin-text-secondary)]">
            Dispatch a test verification message through the configured gateway to verify credentials and SMTP connectivity.
          </p>

          <Field
            label="Recipient Email Address *"
            type="email"
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            placeholder="admin@example.com"
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--admin-border)]/50">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setTestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={testEmailMutation.isPending}
            >
              {testEmailMutation.isPending ? "Sending…" : "Send Test Email"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
