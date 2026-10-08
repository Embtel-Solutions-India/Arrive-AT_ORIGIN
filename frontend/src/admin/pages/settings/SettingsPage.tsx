import { useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/ui";
import { AccountTab } from "./tabs/AccountTab";
import { UsersTab } from "./tabs/UsersTab";
import { SecurityTab } from "./tabs/SecurityTab";
import { SessionsTab } from "./tabs/SessionsTab";
import { PaymentsTab } from "./tabs/PaymentsTab";
import { EmailTab } from "./tabs/EmailTab";
import { NotificationsTab } from "./tabs/NotificationsTab";
import { BookingTab } from "./tabs/BookingTab";
import { StoreTab } from "./tabs/StoreTab";
import { SystemTab } from "./tabs/SystemTab";
import { BackupsTab } from "./tabs/BackupsTab";
import { AuditLogsTab } from "./tabs/AuditLogsTab";
import { IntegrationsTab } from "./tabs/IntegrationsTab";
import { CouponsTab } from "./tabs/CouponsTab";

export type SettingsTabId =
  | "account"
  | "users"
  | "security"
  | "sessions"
  | "payments"
  | "coupons"
  | "email"
  | "notifications"
  | "booking"
  | "store"
  | "system"
  | "backups"
  | "audit-logs"
  | "integrations";

interface NavItem {
  id: SettingsTabId;
  label: string;
  icon: string;
  badge?: string;
  description: string;
}

const SETTINGS_NAV: NavItem[] = [
  {
    id: "account",
    label: "Account",
    icon: "👤",
    description: "Manage your administrator profile, credentials, and personal security.",
  },
  {
    id: "users",
    label: "Users & Roles",
    icon: "👥",
    description: "Manage admin users, assign roles, and configure granular module permissions.",
  },
  {
    id: "security",
    label: "Security",
    icon: "🛡️",
    description: "Set password policies, brute-force defenses, and two-factor authentication.",
  },
  {
    id: "sessions",
    label: "Sessions",
    icon: "💻",
    description: "Configure session timeouts, monitor active devices, and terminate logins.",
  },
  {
    id: "payments",
    label: "Payments",
    icon: "💳",
    description: "Configure Stripe, Razorpay, PayPal, multi-currency processing, and fees.",
  },
  {
    id: "coupons",
    label: "Coupons & Discounts",
    icon: "🎟️",
    badge: "Promo",
    description: "Configure discount codes for store checkouts and consultation session bookings.",
  },
  {
    id: "email",
    label: "Email",
    icon: "✉️",
    description: "Configure transactional email delivery, SMTP credentials, and Resend API.",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: "🔔",
    description: "Customize real-time alerts across Email, Dashboard, SMS, and WhatsApp.",
  },
  {
    id: "booking",
    label: "Booking",
    icon: "📅",
    description: "Configure appointment durations, buffer windows, notice rules, and reminders.",
  },
  {
    id: "store",
    label: "Store & Orders",
    icon: "🛍️",
    description: "Control e-commerce storefront switches, order numbering, and fulfillment rules.",
  },
  {
    id: "system",
    label: "System",
    icon: "⚙️",
    description: "Monitor real-time system metrics, maintenance mode, and portal availability.",
  },
  {
    id: "backups",
    label: "Backups",
    icon: "💾",
    description: "Generate database snapshots, configure retention, and execute restorations.",
  },
  {
    id: "audit-logs",
    label: "Audit Logs",
    icon: "📜",
    description: "Review immutable security audit logs of all administrative actions and logins.",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: "🔌",
    description: "Connect third-party analytics, CRM workflows, live-chat, and API keys.",
  },
];

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get("tab") as SettingsTabId) || "account";

  const activeNavItem = SETTINGS_NAV.find((item) => item.id === currentTab) || SETTINGS_NAV[0];

  const handleSelectTab = (id: SettingsTabId) => {
    setSearchParams({ tab: id });
  };

  const renderActiveTab = () => {
    switch (currentTab) {
      case "account":
        return <AccountTab />;
      case "users":
        return <UsersTab />;
      case "security":
        return <SecurityTab />;
      case "sessions":
        return <SessionsTab />;
      case "payments":
        return <PaymentsTab />;
      case "coupons":
        return <CouponsTab />;
      case "email":
        return <EmailTab />;
      case "notifications":
        return <NotificationsTab />;
      case "booking":
        return <BookingTab />;
      case "store":
        return <StoreTab />;
      case "system":
        return <SystemTab />;
      case "backups":
        return <BackupsTab />;
      case "audit-logs":
        return <AuditLogsTab />;
      case "integrations":
        return <IntegrationsTab />;
      default:
        return <AccountTab />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Admin Settings & Operations Control Center"
        description="Comprehensive operational, security, financial, and system configuration for Arrive at Origin."
      />

      {/* Mobile/Tablet Horizontal Scrolling Navigation */}
      <div className="lg:hidden -mx-4 px-4 overflow-x-auto no-scrollbar pb-2">
        <div className="flex items-center gap-1.5 min-w-max p-1 rounded-2xl bg-[var(--admin-surface)] border border-[var(--admin-border)]">
          {SETTINGS_NAV.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-[var(--admin-accent)] text-[#0B0D13] font-semibold shadow-sm"
                    : "text-[var(--admin-text-secondary)] hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Layout: Left Sidebar + Right Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sticky Settings Navigation */}
        <aside className="hidden lg:block lg:col-span-3 xl:col-span-3 sticky top-24">
          <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2 shadow-sm">
            <div className="px-3 py-2.5 border-b border-[var(--admin-border)]/50 mb-1">
              <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--admin-text-muted)]">
                Settings Menu
              </span>
            </div>

            <nav className="space-y-1">
              {SETTINGS_NAV.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left group ${
                      isActive
                        ? "bg-[var(--admin-accent)] text-[#0B0D13] font-semibold shadow-sm"
                        : "text-[var(--admin-text-secondary)] hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm flex-shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[0.65rem] px-1.5 py-0.5 rounded-full font-mono ${
                          isActive
                            ? "bg-[#0B0D13]/20 text-[#0B0D13]"
                            : "bg-white/10 text-[var(--admin-accent)]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 p-3 rounded-xl border border-[var(--admin-border)]/50 bg-[var(--admin-background)]/60 text-[0.7rem] text-[var(--admin-text-muted)] space-y-1">
              <div className="font-medium text-[var(--admin-text-primary)]">🔒 Encrypted Storage</div>
              <p className="leading-relaxed">
                All credentials, API keys, and sensitive tokens are encrypted using AES-256-GCM.
              </p>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="lg:col-span-9 xl:col-span-9 min-w-0 space-y-6">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
}
