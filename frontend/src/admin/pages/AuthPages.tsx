import { useState, useRef, useEffect, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, ApiError } from "../lib/api";
import { useAuth, type Setup2FAResponse } from "../auth/AuthContext";
import cosmicMeditationImg from "../../assets/images/admin-login-cosmic.jpg";

// ==========================================
// SVG Icons
// ==========================================
function QrCodeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.008v.008H6.75V6.75ZM6.75 16.5h.008v.008H6.75v-.008ZM16.5 6.75h.008v.008H16.5V6.75ZM13.5 13.5h.008v.008H13.5V13.5ZM13.5 19.5h.008v.008H13.5V19.5ZM19.5 13.5h.008v.008H19.5V13.5ZM16.5 16.5h.008v.008H16.5V16.5ZM19.5 19.5h.008v.008H19.5V19.5Z" />
    </svg>
  );
}

function ClipboardDocumentCheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 14.25 2.25 2.25L15 12" />
    </svg>
  );
}

function DocumentArrowDownIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function DevicePhoneMobileIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  );
}

function MailIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>

      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function LockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function EyeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function EyeOffIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function ShieldCheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function SparklesIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

function AlertCircleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function CheckCircleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function ArrowLeftIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}
function KeyIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
    </svg>
  );
}


function SacredLotusIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c1.5 3 3.5 6 3.5 9 0 3-1.5 5.5-3.5 7-2-1.5-3.5-4-3.5-7 0-3 2-6 3.5-9Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.5-2 5.5-3.5 8-2 1.5 1 2 3.5.5 5.5-2 2.5-5 3.5-8.5 3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c-2.5-2-5.5-3.5-8-2-1.5 1-2 3.5-.5 5.5 2 2.5 5 3.5 8.5 3.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

// ==========================================
// Cosmic Auth Shell
// ==========================================
function AuthShell({
  title,
  subtitle,
  portalBadge = "Administrative Portal",
  children,
}: {
  title: string;
  subtitle?: string;
  portalBadge?: string;
  children: ReactNode;
}) {
  return (
    <div className="admin-root cosmic-portal-wrapper flex min-h-svh flex-col justify-between p-3 sm:p-6 lg:p-8">
      {/* Background ambient orbs */}
      <div className="cosmic-glow-orb -top-24 -left-24 h-96 w-96 bg-indigo-600/25" />
      <div className="cosmic-glow-orb -bottom-24 -right-24 h-96 w-96 bg-amber-500/15" />
      <div className="cosmic-glow-orb top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-purple-700/10" />

      {/* Top Portal Navigation Bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between py-2 sm:py-3">
        <Link
          to="/"
          className="group inline-flex items-center gap-2.5 rounded-full border border-[rgba(232,206,140,0.2)] bg-[rgba(14,22,48,0.6)] px-3.5 py-1.5 backdrop-blur-md transition-all hover:border-[var(--admin-accent)] hover:bg-[rgba(14,22,48,0.85)]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(232,206,140,0.12)] text-[var(--admin-accent)]">
            <SacredLotusIcon className="h-4 w-4" />
          </span>
          <div className="flex flex-col">
            <span className="font-display text-[0.82rem] font-medium tracking-wide text-[var(--admin-text-primary)]">
              Soul Body Healing Center
            </span>
            <span className="text-[0.62rem] tracking-[0.16em] text-[var(--admin-text-muted)] uppercase">
              Arrive at Origin
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[0.72rem] font-medium text-emerald-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            TLS 1.3 Encrypted Portal
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[0.8rem] text-[var(--admin-text-secondary)] transition-colors hover:text-[var(--admin-accent)]"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Return to</span> Public Site
          </Link>
        </div>
      </header>

      {/* Main Dual-Pane Cosmic Portal Card */}
      <main className="relative z-10 mx-auto my-auto w-full max-w-5xl py-6">
        <div className="cosmic-portal-card grid grid-cols-1 overflow-hidden rounded-2xl md:rounded-3xl lg:grid-cols-12">
          {/* Left Column: Cosmic Meditation Art & Brand Experience */}
          <div className="cosmic-image-frame relative flex min-h-[300px] flex-col justify-between p-6 sm:p-8 lg:col-span-7 lg:min-h-[620px] lg:p-10">
            {/* Background Meditation Image */}
            <img
              src={cosmicMeditationImg}
              alt="Soul Body Cosmic Meditation Sanctuary"
              className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-1000 ease-out hover:scale-105"
            />

            {/* Glowing cosmic energy gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#070b18] via-[#070b18]/40 to-transparent opacity-95" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#070b18]/60 via-transparent to-[#070b18]/70" />

            {/* Top Badge on Art */}
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-[#070b18]/75 px-3 py-1 text-[0.72rem] font-medium tracking-wider text-amber-200 uppercase backdrop-blur-md shadow-lg">
                <SparklesIcon className="h-3.5 w-3.5 text-amber-300" />
                {portalBadge}
              </span>
            </div>

            {/* Bottom Overlay Card over Art */}
            <div className="relative z-10 mt-auto rounded-2xl border border-[rgba(232,206,140,0.18)] bg-[#070b18]/85 p-5 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-2 text-[0.72rem] tracking-[0.14em] text-[var(--admin-accent)] uppercase font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--admin-accent)]" />
                Inner Alignment & Sanctuary Operations
              </div>
              <h2 className="mt-2 font-display text-[1.25rem] sm:text-[1.4rem] font-light leading-snug text-white">
                "Where spiritual harmony meets administrative clarity."
              </h2>
              <p className="mt-1 text-[0.8rem] text-[var(--admin-text-secondary)]">
                Central console for blog, books, author management, orders & holistic care.
              </p>

              {/* Status Chips */}
              <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-[rgba(237,231,218,0.1)]">
                <span className="inline-flex items-center gap-1 rounded-md bg-[rgba(232,206,140,0.08)] px-2.5 py-1 text-[0.7rem] text-[var(--admin-accent)]">
                  ✦ Soul Body CMS
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-[rgba(99,102,241,0.12)] px-2.5 py-1 text-[0.7rem] text-indigo-300">
                  ✦ Orders & Inventory
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-[rgba(78,124,116,0.15)] px-2.5 py-1 text-[0.7rem] text-emerald-300">
                  ✦ High Security Access
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Portal Gateway Console */}
          <div className="relative flex flex-col justify-center border-t border-[rgba(232,206,140,0.14)] bg-[rgba(14,22,48,0.92)] p-6 sm:p-9 lg:col-span-5 lg:border-t-0 lg:border-l lg:p-10 backdrop-blur-2xl">
            {/* Header / Crest */}
            <div className="mb-6">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(232,206,140,0.28)] bg-[rgba(232,206,140,0.1)] text-[var(--admin-accent)] shadow-[0_0_20px_rgba(232,206,140,0.2)]">
                <SacredLotusIcon className="h-6 w-6" />
              </div>
              <div className="text-[0.68rem] font-semibold tracking-[0.18em] text-[var(--admin-accent)] uppercase">
                Staff Authentication Gateway
              </div>
              <h1 className="mt-1 font-display text-[1.85rem] font-light leading-tight text-white tracking-tight">
                {title}
              </h1>
              {subtitle && <p className="mt-1.5 text-[0.86rem] leading-relaxed text-[var(--admin-text-secondary)]">{subtitle}</p>}
            </div>

            {/* Interactive Form Body */}
            {children}

            {/* Footer Trust & Security Note */}
            <div className="mt-8 flex items-center justify-between border-t border-[rgba(237,231,218,0.1)] pt-4 text-[0.72rem] text-[var(--admin-text-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                256-bit SSL Protected
              </span>
              <span>Argon2id Encrypted</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Global Footer */}
      <footer className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between py-2 text-[0.72rem] text-[var(--admin-text-muted)]">
        <div>
          © {new Date().getFullYear()} Soul Body Healing Center • Dr. Alka Chopra Madan
        </div>
        <div className="hidden sm:block">
          Authorized administrative access only.
        </div>
      </footer>
    </div>
  );
}

const formError = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong. Please try again.");

// ==========================================
// Login Page
// ==========================================
const loginSchema = z.object({
  email: z.string().email("Enter a valid administrative email"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean(),
});

export function LoginPage() {
  const { user, login, verify2FA, start2FASetup, confirm2FASetup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Phase: "CREDENTIALS" | "OTP" | "RECOVERY" | "SETUP"
  const [phase, setPhase] = useState<"CREDENTIALS" | "OTP" | "RECOVERY" | "SETUP">("CREDENTIALS");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 2FA state
  const [ticket, setTicket] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [rememberSession, setRememberSession] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  // Setup state
  const [setupData, setSetupData] = useState<Setup2FAResponse | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [setupConfirmedSaved, setSetupConfirmedSaved] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isActivatingSetup, setIsActivatingSetup] = useState(false);
  const [isLoadingSetup, setIsLoadingSetup] = useState(false);

  // 30-second TOTP countdown timer
  const [timerSeconds, setTimerSeconds] = useState(30);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: false },
  });

  const from = (location.state as { from?: string } | null)?.from ?? "/admin/dashboard";
  if (user) return <Navigate to={from} replace />;

  // Dynamic 30-second rotation ticker for standard TOTP
  useEffect(() => {
    if (phase !== "OTP") return;
    const updateTicker = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = 30 - (now % 30);
      setTimerSeconds(remaining);
    };
    updateTicker();
    const interval = setInterval(updateTicker, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Focus the first OTP box when entering OTP phase
  useEffect(() => {
    if (phase === "OTP") {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 50);
    }
  }, [phase]);

  // Step 1: Submit Credentials
  const onCredentialsSubmit = async (values: z.infer<typeof loginSchema>) => {
    setError("");
    try {
      const res = await login(values);
      if (res.requires2FA) {
        setTicket(res.twoFactorTicket || "");
        setTargetEmail(values.email);
        setRememberSession(values.remember);

        if (res.requiresSetup) {
          setPhase("SETUP");
          loadSetupWizard(res.twoFactorTicket);
        } else {
          setPhase("OTP");
          setOtpDigits(["", "", "", "", "", ""]);
        }
        return;
      }
      navigate(from, { replace: true });
    } catch (e) {
      setError(formError(e));
    }
  };

  // Load Setup Data
  const loadSetupWizard = async (t?: string) => {
    setIsLoadingSetup(true);
    setError("");
    try {
      const data = await start2FASetup(t || ticket);
      setSetupData(data);
    } catch (e) {
      setError(formError(e));
    } finally {
      setIsLoadingSetup(false);
    }
  };

  // Step 2A: Verify 6-digit OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || otpDigits.join("");
    if (fullCode.length !== 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    setError("");
    setIsVerifyingCode(true);
    try {
      await verify2FA({
        twoFactorTicket: ticket,
        code: fullCode,
      });
      navigate(from, { replace: true });
    } catch (e) {
      setError(formError(e));
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 50);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Step 2B: Verify Emergency Recovery Code
  const handleVerifyRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = recoveryCodeInput.trim().toUpperCase();
    if (!cleanCode || cleanCode.replace(/[^A-Z0-9]/g, "").length < 8) {
      setError("Please enter a valid emergency recovery code");
      return;
    }

    setError("");
    setIsVerifyingCode(true);
    try {
      await verify2FA({
        twoFactorTicket: ticket,
        code: cleanCode,
        isRecoveryCode: true,
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(formError(err));
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Step 2C: Confirm & Activate Setup
  const handleConfirmSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData) return;

    if (!setupConfirmedSaved) {
      setError("Please acknowledge that you have safely stored your recovery codes");
      return;
    }

    const cleanCode = setupCode.trim().replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      setError("Please enter the 6-digit verification code shown in your authenticator app");
      return;
    }

    setError("");
    setIsActivatingSetup(true);
    try {
      await confirm2FASetup({
        twoFactorTicket: ticket,
        secret: setupData.secret,
        code: cleanCode,
        backupCodes: setupData.backupCodes,
      });
      navigate(from, { replace: true });
    } catch (err) {
      setError(formError(err));
    } finally {
      setIsActivatingSetup(false);
    }
  };

  // OTP Box Key Handling
  const handleOtpBoxChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const updated = [...otpDigits];
    updated[index] = digit;
    setOtpDigits(updated);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-verify if all 6 digits entered
    if (digit && index === 5 && updated.every((d) => d !== "")) {
      handleVerifyOtp(updated.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const updated = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setOtpDigits(updated);

    if (pasted.length === 6) {
      handleVerifyOtp(pasted);
    } else {
      const nextIdx = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
    }
  };

  // Copy Recovery Codes to Clipboard
  const handleCopyCodes = () => {
    if (!setupData?.backupCodes) return;
    const text = `Soul Body Healing Center - Admin Emergency Backup Codes\nGenerated: ${new Date().toISOString()}\n\n` +
      setupData.backupCodes.map((c, i) => `${i + 1}. ${c}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 3000);
  };

  // Download Recovery Codes File
  const handleDownloadCodes = () => {
    if (!setupData?.backupCodes) return;
    const text =
      `=======================================================\n` +
      `SOUL BODY HEALING CENTER - ADMIN PORTAL RECOVERY CODES\n` +
      `=======================================================\n` +
      `Admin Account: ${targetEmail}\n` +
      `Generated At : ${new Date().toLocaleString()}\n\n` +
      `KEEP THESE EMERGENCY CODES IN A SAFE & ENCRYPTED PLACE.\n` +
      `Each recovery code can only be used ONCE if you lose\n` +
      `access to Google Authenticator or Microsoft Authenticator.\n\n` +
      setupData.backupCodes.map((c, i) => `[${(i + 1).toString().padStart(2, "0")}] ${c}`).join("\n") +
      `\n\n=======================================================\n`;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `arrive-at-origin-2fa-recovery-codes.txt`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  // ==========================================
  // RENDER: Phase 2A - 6-Digit OTP Verification
  // ==========================================
  if (phase === "OTP") {
    return (
      <AuthShell
        title="Two-Factor Security"
        subtitle={`Enter the 6-digit code from Google Authenticator or Microsoft Authenticator for ${targetEmail}.`}
        portalBadge="2FA Verification Required"
      >
        <div className="space-y-5">
          {/* Authenticator App Badge */}
          <div className="flex items-center justify-between rounded-xl border border-[rgba(232,206,140,0.18)] bg-[rgba(232,206,140,0.06)] px-3.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(232,206,140,0.15)] text-[var(--admin-accent)]">
                <DevicePhoneMobileIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[0.78rem] font-medium text-white">Authenticator App</p>
                <p className="text-[0.68rem] text-[var(--admin-text-muted)]">Google Authenticator • Microsoft Auth</p>
              </div>
            </div>

            {/* Rotating TOTP cycle indicator */}
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[0.72rem] text-[var(--admin-accent)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--admin-accent)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--admin-accent)]" />
              </span>
              <span>Rotates in {timerSeconds}s</span>
            </div>
          </div>

          {/* Form wrapping 6 digits */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyOtp();
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-2 block text-center text-[0.8rem] font-medium tracking-wide text-[var(--admin-text-secondary)] uppercase">
                6-Digit Security Code
              </label>

              {/* 6 Individual Numeric Boxes with Auto-Advance & Paste */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    autoComplete={idx === 0 ? "one-time-code" : "off"}
                    value={digit}
                    onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    aria-label={`Digit ${idx + 1} of verification code`}
                    className="h-12 w-10 sm:h-14 sm:w-12 rounded-xl border border-[var(--admin-border)] bg-[rgba(237,231,218,0.06)] text-center font-mono text-xl sm:text-2xl font-bold text-white shadow-inner transition-all focus:border-[var(--admin-accent)] focus:bg-[rgba(237,231,218,0.12)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/30"
                  />
                ))}
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-[var(--admin-danger)]/40 bg-[var(--admin-danger)]/15 p-3 text-[0.84rem] text-[#ff948a]"
              >
                <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isVerifyingCode || otpDigits.join("").length !== 6}
              className="btn-cosmic-primary w-full min-h-[44px] rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none text-[0.92rem] tracking-wide"
            >
              {isVerifyingCode ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-[#070b18]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifying Code…</span>
                </>
              ) : (
                <>
                  <span>Verify & Enter Dashboard</span>
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Fallback & Switch Options */}
          <div className="space-y-2 pt-2 text-center text-[0.8rem]">
            <button
              type="button"
              onClick={() => {
                setError("");
                setPhase("RECOVERY");
              }}
              className="text-[var(--admin-accent)] hover:underline transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <KeyIcon className="h-3.5 w-3.5" />
              <span>Use an Emergency Recovery Code</span>
            </button>
            <div>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setPhase("CREDENTIALS");
                }}
                className="text-[var(--admin-text-muted)] hover:text-white transition-colors cursor-pointer"
              >
                ← Back to email sign in
              </button>
            </div>
          </div>
        </div>
      </AuthShell>
    );
  }

  // ==========================================
  // RENDER: Phase 2B - Emergency Recovery Code
  // ==========================================
  if (phase === "RECOVERY") {
    return (
      <AuthShell
        title="Emergency Recovery"
        subtitle="Use one of your 10 emergency backup recovery codes to access the portal."
        portalBadge="One-Time Emergency Access"
      >
        <form onSubmit={handleVerifyRecovery} className="space-y-4">
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-[0.78rem] text-amber-200/90 leading-relaxed">
            <span className="font-semibold text-amber-300">Single-use emergency codes: </span>
            Once verified, the recovery code used will be permanently retired from your list.
          </div>

          <div>
            <label htmlFor="recovery-code" className="mb-1.5 block text-[0.82rem] font-medium text-[var(--admin-text-secondary)]">
              12-Character Recovery Code
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--admin-text-muted)]">
                <KeyIcon className="h-4 w-4" />
              </span>
              <input
                id="recovery-code"
                type="text"
                autoComplete="off"
                placeholder="XXXX-XXXX-XXXX"
                value={recoveryCodeInput}
                onChange={(e) => setRecoveryCodeInput(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-[var(--admin-border)] bg-[rgba(237,231,218,0.05)] pl-10 pr-3.5 py-2.5 font-mono text-[0.95rem] tracking-wider text-white placeholder-[var(--admin-text-muted)]/50 transition-all focus:border-[var(--admin-accent)] focus:bg-[rgba(237,231,218,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20"
              />
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-[var(--admin-danger)]/40 bg-[var(--admin-danger)]/15 p-3 text-[0.84rem] text-[#ff948a]"
            >
              <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isVerifyingCode || !recoveryCodeInput.trim()}
            className="btn-cosmic-primary w-full min-h-[44px] rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none text-[0.92rem] tracking-wide"
          >
            {isVerifyingCode ? (
              <span>Verifying Recovery Code…</span>
            ) : (
              <>
                <span>Submit Recovery Code</span>
                <ArrowRightIcon className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="space-y-2 pt-2 text-center text-[0.8rem]">
            <button
              type="button"
              onClick={() => {
                setError("");
                setPhase("OTP");
              }}
              className="text-[var(--admin-accent)] hover:underline transition-colors cursor-pointer"
            >
              ← Return to 6-digit authenticator code
            </button>
          </div>
        </form>
      </AuthShell>
    );
  }

  // ==========================================
  // RENDER: Phase 2C - 2FA Enrollment / Setup Wizard
  // ==========================================
  if (phase === "SETUP") {
    return (
      <AuthShell
        title="Setup Two-Factor Auth"
        subtitle="Two-factor authentication is mandatory to protect your administrator privileges."
        portalBadge="First-Time 2FA Setup"
      >
        {isLoadingSetup ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <svg className="h-8 w-8 animate-spin text-[var(--admin-accent)]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-[0.84rem] text-[var(--admin-text-secondary)]">Generating secure TOTP key & QR code…</p>
          </div>
        ) : setupData ? (
          <form onSubmit={handleConfirmSetup} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {/* Step 1: QR Code Card */}
            <div className="rounded-2xl border border-[var(--admin-border)]/80 bg-[rgba(237,231,218,0.03)] p-4 space-y-3">
              <div className="flex items-center gap-2 text-[0.76rem] font-semibold tracking-wider text-[var(--admin-accent)] uppercase">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--admin-accent)]/20 text-[0.7rem]">
                  1
                </span>
                Scan QR in Authenticator App
              </div>
              <p className="text-[0.78rem] text-[var(--admin-text-muted)]">
                Scan with Google Authenticator, Microsoft Authenticator, Authy, or 1Password.
              </p>

              {/* Crisp High-Contrast QR Code Display */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="rounded-2xl bg-white p-3 shadow-xl border border-white/20">
                  <img
                    src={setupData.qrCode}
                    alt="Authenticator Setup QR Code"
                    className="h-40 w-40 sm:h-44 sm:w-44 object-contain"
                  />
                </div>
              </div>

              {/* Manual Entry Key */}
              <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                <div className="flex items-center justify-between text-[0.68rem] text-[var(--admin-text-muted)] mb-1">
                  <span>Manual Secret Key</span>
                  {copiedKey && <span className="text-emerald-400 font-semibold">Key copied!</span>}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <code className="font-mono text-[0.8rem] text-[var(--admin-accent)] tracking-wider select-all truncate">
                    {setupData.secret}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopyKey(setupData.secret)}
                    className="shrink-0 rounded-lg border border-[var(--admin-border)] bg-white/5 px-2.5 py-1 text-[0.72rem] text-white hover:border-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/10 transition-colors cursor-pointer"
                  >
                    Copy Key
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2: Emergency Recovery Codes */}
            <div className="rounded-2xl border border-[var(--admin-border)]/80 bg-[rgba(237,231,218,0.03)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[0.76rem] font-semibold tracking-wider text-[var(--admin-accent)] uppercase">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--admin-accent)]/20 text-[0.7rem]">
                    2
                  </span>
                  Emergency Recovery Codes
                </div>
                <span className="text-[0.7rem] text-amber-300 font-medium">10 Codes</span>
              </div>
              <p className="text-[0.76rem] text-[var(--admin-text-muted)] leading-relaxed">
                Save these one-time codes in a safe place. If you ever lose your phone, they are the only way to recover access.
              </p>

              {/* 10 Codes Grid */}
              <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/5 bg-black/40 p-2.5 font-mono text-[0.74rem]">
                {setupData.backupCodes.map((c, i) => (
                  <div key={i} className="text-zinc-300 font-semibold select-all py-0.5">
                    <span className="text-zinc-500 mr-1.5">{i + 1}.</span>
                    {c}
                  </div>
                ))}
              </div>

              {/* Recovery Code Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyCodes}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--admin-border)] bg-white/5 py-2 text-[0.75rem] font-medium text-white hover:border-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/10 transition-colors cursor-pointer"
                >
                  <ClipboardDocumentCheckIcon className="h-3.5 w-3.5 text-[var(--admin-accent)]" />
                  <span>{copiedCodes ? "Copied to Clipboard!" : "Copy All Codes"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCodes}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--admin-border)] bg-white/5 py-2 text-[0.75rem] font-medium text-white hover:border-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/10 transition-colors cursor-pointer"
                >
                  <DocumentArrowDownIcon className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Download (.txt)</span>
                </button>
              </div>

              {/* Mandatory Backup Confirmation Checkbox */}
              <label className="flex items-start gap-2 pt-1 text-[0.76rem] text-[var(--admin-text-secondary)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={setupConfirmedSaved}
                  onChange={(e) => setSetupConfirmedSaved(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--admin-border)] bg-white/5 text-[var(--admin-accent)] accent-[var(--admin-accent)] cursor-pointer shrink-0"
                />
                <span>I have securely backed up these 10 emergency recovery codes.</span>
              </label>
            </div>

            {/* Step 3: Verification Code to Activate */}
            <div className="rounded-2xl border border-[var(--admin-border)]/80 bg-[rgba(237,231,218,0.03)] p-4 space-y-3">
              <div className="flex items-center gap-2 text-[0.76rem] font-semibold tracking-wider text-[var(--admin-accent)] uppercase">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--admin-accent)]/20 text-[0.7rem]">
                  3
                </span>
                Verify & Activate
              </div>
              <p className="text-[0.76rem] text-[var(--admin-text-muted)]">
                Enter the 6-digit code currently showing in your authenticator app to confirm setup.
              </p>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="000000"
                value={setupCode}
                onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full text-center tracking-[0.4em] font-mono text-2xl font-bold py-2.5 rounded-xl border border-[var(--admin-border)] bg-black/40 text-white focus:border-[var(--admin-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/25"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-[var(--admin-danger)]/40 bg-[var(--admin-danger)]/15 p-3 text-[0.84rem] text-[#ff948a]"
              >
                <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isActivatingSetup || !setupConfirmedSaved || setupCode.length !== 6}
              className="btn-cosmic-primary w-full min-h-[44px] rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none text-[0.92rem] tracking-wide"
            >
              {isActivatingSetup ? (
                <span>Activating 2FA…</span>
              ) : (
                <>
                  <span>Activate 2FA & Enter Portal</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="text-center pt-1 text-[0.78rem]">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setPhase("CREDENTIALS");
                }}
                className="text-[var(--admin-text-muted)] hover:text-white transition-colors cursor-pointer"
              >
                Cancel and back to sign in
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 space-y-3">
            <p className="text-[0.84rem] text-[var(--admin-danger)]">{error || "Failed to initialize 2FA setup"}</p>
            <button
              type="button"
              onClick={() => loadSetupWizard(ticket)}
              className="btn-cosmic-primary px-4 py-2 text-xs"
            >
              Retry 2FA Setup
            </button>
          </div>
        )}
      </AuthShell>
    );
  }

  // ==========================================
  // RENDER: Phase 1 - Credentials Form (Default)
  // ==========================================
  return (
    <AuthShell
      title="Admin Access"
      subtitle="Sign in with your authorized credentials to access the management portal."
      portalBadge="Administrative Portal"
    >
      <form noValidate onSubmit={handleSubmit(onCredentialsSubmit)} className="space-y-4">
        {/* Email Field */}
        <div>
          <label htmlFor="admin-email" className="mb-1.5 block text-[0.82rem] font-medium text-[var(--admin-text-secondary)]">
            Admin Email
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--admin-text-muted)]">
              <MailIcon className="h-4 w-4" />
            </span>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              placeholder="admin@arriveatorigin.com"
              {...register("email")}
              className={`w-full rounded-xl border bg-[rgba(237,231,218,0.05)] pl-10 pr-3.5 py-2.5 text-[0.92rem] text-white placeholder-[var(--admin-text-muted)]/50 transition-all focus:border-[var(--admin-accent)] focus:bg-[rgba(237,231,218,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 ${
                errors.email ? "border-[var(--admin-danger)] focus:border-[var(--admin-danger)] focus:ring-[var(--admin-danger)]/20" : "border-[var(--admin-border)]"
              }`}
            />
          </div>
          {errors.email && (
            <p role="alert" className="mt-1 text-[0.78rem] text-[var(--admin-danger)] flex items-center gap-1">
              <AlertCircleIcon className="h-3.5 w-3.5 inline" /> {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="admin-password" className="block text-[0.82rem] font-medium text-[var(--admin-text-secondary)]">
              Password
            </label>
            <Link
              to="/admin/forgot-password"
              className="text-[0.78rem] text-[var(--admin-accent)] hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--admin-text-muted)]">
              <LockIcon className="h-4 w-4" />
            </span>
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••••••"
              {...register("password")}
              className={`w-full rounded-xl border bg-[rgba(237,231,218,0.05)] pl-10 pr-10 py-2.5 text-[0.92rem] text-white placeholder-[var(--admin-text-muted)]/50 transition-all focus:border-[var(--admin-accent)] focus:bg-[rgba(237,231,218,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 ${
                errors.password ? "border-[var(--admin-danger)] focus:border-[var(--admin-danger)] focus:ring-[var(--admin-danger)]/20" : "border-[var(--admin-border)]"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--admin-text-muted)] hover:text-[var(--admin-accent)] transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p role="alert" className="mt-1 text-[0.78rem] text-[var(--admin-danger)] flex items-center gap-1">
              <AlertCircleIcon className="h-3.5 w-3.5 inline" /> {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Session Checkbox */}
        <div className="pt-1">
          <label className="flex items-center gap-2.5 text-[0.84rem] text-[var(--admin-text-secondary)] cursor-pointer select-none">
            <input
              type="checkbox"
              {...register("remember")}
              className="h-4 w-4 rounded border-[var(--admin-border)] bg-[rgba(237,231,218,0.08)] text-[var(--admin-accent)] accent-[var(--admin-accent)] cursor-pointer"
            />
            <span>Keep administrative session authenticated</span>
          </label>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-[var(--admin-danger)]/40 bg-[var(--admin-danger)]/15 p-3 text-[0.84rem] text-[#ff948a]"
          >
            <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-cosmic-primary w-full min-h-[44px] rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none text-[0.92rem] tracking-wide"
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin text-[#070b18]" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Authenticating Portal…</span>
              </>
            ) : (
              <>
                <span>Enter Admin Portal</span>
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}


// ==========================================
// Forgot Password Page
// ==========================================
const forgotSchema = z.object({ email: z.string().email("Enter a valid administrative email") });

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema) });

  return (
    <AuthShell
      title="Reset Password"
      subtitle="We will dispatch a secure, single-use password recovery link to your administrative email."
      portalBadge="Credential Recovery"
    >
      {sent ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-[0.88rem] text-emerald-200">
            <CheckCircleIcon className="h-5 w-5 mt-0.5 shrink-0 text-emerald-400" />
            <div>
              <div className="font-semibold text-emerald-300">Recovery link dispatched</div>
              <p className="mt-1 text-[0.82rem] leading-relaxed text-emerald-200/90">
                If the email address exists in the system, a cryptographic reset token has been sent. It remains active for 1 hour.
              </p>
            </div>
          </div>
          <Link
            to="/admin/login"
            className="btn-cosmic-primary w-full min-h-[44px] rounded-xl flex items-center justify-center gap-2 cursor-pointer text-[0.92rem]"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={handleSubmit(async (values) => {
            setError("");
            try {
              await api.post("/auth/forgot-password", values);
              setSent(true);
            } catch (e) {
              setError(formError(e));
            }
          })}
          className="space-y-4"
        >
          <div>
            <label htmlFor="forgot-email" className="mb-1.5 block text-[0.82rem] font-medium text-[var(--admin-text-secondary)]">
              Admin Email
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--admin-text-muted)]">
                <MailIcon className="h-4 w-4" />
              </span>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="admin@arriveatorigin.com"
                {...register("email")}
                className={`w-full rounded-xl border bg-[rgba(237,231,218,0.05)] pl-10 pr-3.5 py-2.5 text-[0.92rem] text-white placeholder-[var(--admin-text-muted)]/50 transition-all focus:border-[var(--admin-accent)] focus:bg-[rgba(237,231,218,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 ${
                  errors.email ? "border-[var(--admin-danger)] focus:border-[var(--admin-danger)]" : "border-[var(--admin-border)]"
                }`}
              />
            </div>
            {errors.email && (
              <p role="alert" className="mt-1 text-[0.78rem] text-[var(--admin-danger)] flex items-center gap-1">
                <AlertCircleIcon className="h-3.5 w-3.5 inline" /> {errors.email.message}
              </p>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-[var(--admin-danger)]/40 bg-[var(--admin-danger)]/15 p-3 text-[0.84rem] text-[#ff948a]"
            >
              <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-cosmic-primary w-full min-h-[44px] rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-[0.92rem]"
            >
              {isSubmitting ? "Dispatching reset token…" : "Send Reset Link"}
            </button>
          </div>

          <div className="pt-2 text-center">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 text-[0.84rem] text-[var(--admin-accent)] hover:underline"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              <span>Back to sign in</span>
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}

// ==========================================
// Reset Password Page
// ==========================================
const resetSchema = z
  .object({
    password: z
      .string()
      .min(12, "At least 12 characters")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/\d/, "Include a number"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });

  const passwordValue = watch("password") || "";
  const hasMinLength = passwordValue.length >= 12;
  const hasLower = /[a-z]/.test(passwordValue);
  const hasUpper = /[A-Z]/.test(passwordValue);
  const hasNumber = /\d/.test(passwordValue);

  return (
    <AuthShell
      title="Create New Password"
      subtitle="Establish a resilient administrative password to safeguard the portal."
      portalBadge="Credential Vault"
    >
      {!token ? (
        <div className="space-y-4">
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-[var(--admin-danger)]/40 bg-[var(--admin-danger)]/15 p-4 text-[0.86rem] text-[#ff948a]"
          >
            <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-semibold">Reset Token Missing or Expired</div>
              <p className="mt-1 text-[0.8rem] text-[#ffb0a8]">
                This password reset link is invalid or incomplete. Please request a new recovery link.
              </p>
            </div>
          </div>
          <Link
            to="/admin/forgot-password"
            className="btn-cosmic-primary w-full min-h-[44px] rounded-xl flex items-center justify-center gap-2 cursor-pointer text-[0.92rem]"
          >
            <span>Request New Reset Link</span>
          </Link>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={handleSubmit(async (values) => {
            setError("");
            try {
              await api.post("/auth/reset-password", { token, password: values.password });
              navigate("/admin/login", { replace: true });
            } catch (e) {
              setError(formError(e));
            }
          })}
          className="space-y-4"
        >
          {/* New Password */}
          <div>
            <label htmlFor="new-password" className="mb-1.5 block text-[0.82rem] font-medium text-[var(--admin-text-secondary)]">
              New Password
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--admin-text-muted)]">
                <LockIcon className="h-4 w-4" />
              </span>
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••••••"
                {...register("password")}
                className={`w-full rounded-xl border bg-[rgba(237,231,218,0.05)] pl-10 pr-10 py-2.5 text-[0.92rem] text-white placeholder-[var(--admin-text-muted)]/50 transition-all focus:border-[var(--admin-accent)] focus:bg-[rgba(237,231,218,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 ${
                  errors.password ? "border-[var(--admin-danger)] focus:border-[var(--admin-danger)]" : "border-[var(--admin-border)]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--admin-text-muted)] hover:text-[var(--admin-accent)] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p role="alert" className="mt-1 text-[0.78rem] text-[var(--admin-danger)] flex items-center gap-1">
                <AlertCircleIcon className="h-3.5 w-3.5 inline" /> {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-[0.82rem] font-medium text-[var(--admin-text-secondary)]">
              Confirm New Password
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--admin-text-muted)]">
                <LockIcon className="h-4 w-4" />
              </span>
              <input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••••••"
                {...register("confirm")}
                className={`w-full rounded-xl border bg-[rgba(237,231,218,0.05)] pl-10 pr-10 py-2.5 text-[0.92rem] text-white placeholder-[var(--admin-text-muted)]/50 transition-all focus:border-[var(--admin-accent)] focus:bg-[rgba(237,231,218,0.08)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-accent)]/20 ${
                  errors.confirm ? "border-[var(--admin-danger)] focus:border-[var(--admin-danger)]" : "border-[var(--admin-border)]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--admin-text-muted)] hover:text-[var(--admin-accent)] transition-colors cursor-pointer"
              >
                {showConfirm ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirm && (
              <p role="alert" className="mt-1 text-[0.78rem] text-[var(--admin-danger)] flex items-center gap-1">
                <AlertCircleIcon className="h-3.5 w-3.5 inline" /> {errors.confirm.message}
              </p>
            )}
          </div>

          {/* Security Criteria Indicators */}
          <div className="rounded-xl border border-[rgba(237,231,218,0.08)] bg-[rgba(237,231,218,0.03)] p-3 text-[0.74rem] space-y-1">
            <div className="font-medium text-[var(--admin-text-secondary)] mb-1">Password Requirements:</div>
            <div className="grid grid-cols-2 gap-1">
              <span className={`inline-flex items-center gap-1 ${hasMinLength ? "text-emerald-300" : "text-[var(--admin-text-muted)]"}`}>
                {hasMinLength ? "✓" : "○"} 12+ Characters
              </span>
              <span className={`inline-flex items-center gap-1 ${hasUpper ? "text-emerald-300" : "text-[var(--admin-text-muted)]"}`}>
                {hasUpper ? "✓" : "○"} Uppercase letter
              </span>
              <span className={`inline-flex items-center gap-1 ${hasLower ? "text-emerald-300" : "text-[var(--admin-text-muted)]"}`}>
                {hasLower ? "✓" : "○"} Lowercase letter
              </span>
              <span className={`inline-flex items-center gap-1 ${hasNumber ? "text-emerald-300" : "text-[var(--admin-text-muted)]"}`}>
                {hasNumber ? "✓" : "○"} Number (0-9)
              </span>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-[var(--admin-danger)]/40 bg-[var(--admin-danger)]/15 p-3 text-[0.84rem] text-[#ff948a]"
            >
              <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-cosmic-primary w-full min-h-[44px] rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-[0.92rem]"
            >
              {isSubmitting ? "Updating Password…" : "Update Password & Sign In"}
            </button>
          </div>

          <div className="pt-2 text-center">
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 text-[0.84rem] text-[var(--admin-accent)] hover:underline"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              <span>Cancel and return to sign in</span>
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
