import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { Button, Card, Badge } from "../../../components/ui";
import { Toggle } from "../components/Toggle";

const NOTIFICATION_EVENTS = [
  { key: "newUser", label: "New User Registration", desc: "Triggered whenever a new client or administrator registers on the platform." },
  { key: "newCustomer", label: "New Customer Created", desc: "Alert when a new customer profile is created from checkout or intake." },
  { key: "newLead", label: "New Lead Capture", desc: "Notification when prospective clients submit inquiries or download resources." },
  { key: "newOrder", label: "New Store Order Placed", desc: "Alert when an order is created for books or digital items." },
  { key: "successfulPayment", label: "Successful Payment Received", desc: "Instant alert on verified funds receipt through Stripe/Razorpay/PayPal." },
  { key: "failedPayment", label: "Failed Payment Transaction", desc: "Critical alert when a checkout attempt fails or card is declined." },
  { key: "newBooking", label: "New Consultation Booking", desc: "Immediate notice when an appointment or session is scheduled." },
  { key: "cancelledBooking", label: "Booking Cancellation", desc: "Alert when a client or practitioner cancels a scheduled appointment." },
  { key: "contactFormSubmission", label: "Contact Form Submission", desc: "Triggered when a visitor submits the contact or consultation form." },
  { key: "securityAlert", label: "Security & Threat Alert", desc: "Critical warning on unauthorized access attempts or suspicious activity." },
  { key: "failedLogin", label: "Failed Login Spike", desc: "Alert when multiple consecutive incorrect credentials are entered." },
  { key: "systemError", label: "System & Server Error", desc: "Immediate notification on unhandled API exceptions or 500 status codes." },
];

export function NotificationsTab() {
  const queryClient = useQueryClient();

  // Channels state
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelDashboard, setChannelDashboard] = useState(true);
  const [channelSms, setChannelSms] = useState(false);
  const [channelWhatsApp, setChannelWhatsApp] = useState(false);

  // Events state
  const [events, setEvents] = useState<Record<string, boolean>>({
    newUser: true,
    newCustomer: true,
    newLead: true,
    newOrder: true,
    successfulPayment: true,
    failedPayment: true,
    newBooking: true,
    cancelledBooking: true,
    contactFormSubmission: true,
    securityAlert: true,
    failedLogin: true,
    systemError: true,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Query Settings
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<{ settings: any }>("/admin/settings"),
  });

  const notif = data?.settings?.notifications;

  useEffect(() => {
    if (notif) {
      if (notif.channels) {
        setChannelEmail(notif.channels.email ?? true);
        setChannelDashboard(notif.channels.dashboard ?? true);
        setChannelSms(notif.channels.sms ?? false);
        setChannelWhatsApp(notif.channels.whatsapp ?? false);
      }
      if (notif.events) {
        setEvents((prev) => ({ ...prev, ...notif.events }));
      }
    }
  }, [notif]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (body: any) => api.put("/admin/settings/notifications", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      setSavedSuccess(true);
      setErrorMessage("");
      setTimeout(() => setSavedSuccess(false), 3500);
    },
    onError: (err: any) => setErrorMessage(err?.message || "Failed to update notification settings"),
  });

  const handleSave = () => {
    saveMutation.mutate({
      channels: {
        email: channelEmail,
        dashboard: channelDashboard,
        sms: channelSms,
        whatsapp: channelWhatsApp,
      },
      events,
    });
  };

  const handleToggleEvent = (key: string, value: boolean) => {
    setEvents((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleAllEvents = (enable: boolean) => {
    const updated: Record<string, boolean> = {};
    NOTIFICATION_EVENTS.forEach((e) => {
      updated[e.key] = enable;
    });
    setEvents(updated);
  };

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-[var(--admin-text-muted)]">Loading notification preferences…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--admin-border)]/60 pb-5">
        <div>
          <h2 className="text-xl font-display font-medium text-[var(--admin-text-primary)]">
            Notification Rules & Dispatch Channels
          </h2>
          <p className="text-xs text-[var(--admin-text-secondary)] mt-0.5">
            Select multi-channel dispatch routes and customize real-time alerts for 12 operational lifecycle events.
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
            {saveMutation.isPending ? "Saving…" : savedSuccess ? "✓ Saved!" : "Save Preferences"}
          </Button>
        </div>
      </div>

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
          ✓ Notification preferences saved successfully.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* Multi-Channel Distribution Grid */}
      <Card title="Global Delivery Channels">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-[var(--admin-text-primary)]">📧 Email Alerts</span>
                <Badge tone={channelEmail ? "good" : "neutral"}>{channelEmail ? "ACTIVE" : "OFF"}</Badge>
              </div>
              <p className="text-xs text-[var(--admin-text-muted)]">
                Transactional alerts delivered straight to admin mailboxes.
              </p>
            </div>
            <div className="pt-3 border-t border-[var(--admin-border)]/40 mt-3">
              <Toggle label="Enable Email" checked={channelEmail} onChange={setChannelEmail} />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-[var(--admin-text-primary)]">🔔 In-App Dashboard</span>
                <Badge tone={channelDashboard ? "good" : "neutral"}>{channelDashboard ? "ACTIVE" : "OFF"}</Badge>
              </div>
              <p className="text-xs text-[var(--admin-text-muted)]">
                Real-time notification bell and alert feed in admin header.
              </p>
            </div>
            <div className="pt-3 border-t border-[var(--admin-border)]/40 mt-3">
              <Toggle label="Enable In-App" checked={channelDashboard} onChange={setChannelDashboard} />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-[var(--admin-text-primary)]">📱 SMS Text Messages</span>
                <Badge tone={channelSms ? "good" : "neutral"}>{channelSms ? "ACTIVE" : "OFF"}</Badge>
              </div>
              <p className="text-xs text-[var(--admin-text-muted)]">
                Urgent security and booking pings sent via Twilio SMS.
              </p>
            </div>
            <div className="pt-3 border-t border-[var(--admin-border)]/40 mt-3">
              <Toggle label="Enable SMS" checked={channelSms} onChange={setChannelSms} />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-[var(--admin-text-primary)]">💬 WhatsApp Business</span>
                <Badge tone={channelWhatsApp ? "good" : "neutral"}>{channelWhatsApp ? "ACTIVE" : "OFF"}</Badge>
              </div>
              <p className="text-xs text-[var(--admin-text-muted)]">
                Direct WhatsApp notifications via Cloud API.
              </p>
            </div>
            <div className="pt-3 border-t border-[var(--admin-border)]/40 mt-3">
              <Toggle label="Enable WhatsApp" checked={channelWhatsApp} onChange={setChannelWhatsApp} />
            </div>
          </div>
        </div>
      </Card>

      {/* 12 Admin Notification Events */}
      <Card
        title="Admin Operational Notification Triggers"
        action={
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleToggleAllEvents(true)}
              className="text-[var(--admin-accent)] hover:underline"
            >
              Enable All
            </button>
            <span className="text-[var(--admin-border)]">|</span>
            <button
              type="button"
              onClick={() => handleToggleAllEvents(false)}
              className="text-[var(--admin-text-muted)] hover:underline"
            >
              Disable All
            </button>
          </div>
        }
      >
        <div className="divide-y divide-[var(--admin-border)]/40">
          {NOTIFICATION_EVENTS.map((event) => (
            <Toggle
              key={event.key}
              label={event.label}
              description={event.desc}
              checked={!!events[event.key]}
              onChange={(checked) => handleToggleEvent(event.key, checked)}
              badge={events[event.key] ? "ENABLED" : "MUTED"}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
