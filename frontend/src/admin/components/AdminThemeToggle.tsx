import { useAdminTheme } from "../layout/AdminThemeContext";

interface AdminThemeToggleProps {
  className?: string;
  variant?: "pill" | "switch" | "compact";
  showLabel?: boolean;
}

export function AdminThemeToggle({
  className = "",
  variant = "pill",
  showLabel = true,
}: AdminThemeToggleProps) {
  const { theme, isDark, toggleTheme } = useAdminTheme();

  if (variant === "switch") {
    return (
      <div
        className={`inline-flex items-center gap-1 p-1 rounded-full border border-[var(--admin-border)] bg-[var(--admin-background)] shadow-inner ${className}`}
        role="group"
        aria-label="Theme mode selector"
      >
        {/* Dark Button */}
        <button
          type="button"
          onClick={() => isDark || toggleTheme()}
          aria-pressed={isDark}
          title="Switch to Dark Cosmic mode"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
            isDark
              ? "bg-[rgba(232,206,140,0.18)] text-[var(--admin-accent)] shadow-sm font-semibold border border-[var(--admin-accent)]/30"
              : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]"
          }`}
        >
          <span className="text-sm leading-none" role="img" aria-label="Dark mode">🌙</span>
          <span className="text-[0.72rem]">Dark</span>
        </button>

        {/* Light Button */}
        <button
          type="button"
          onClick={() => !isDark || toggleTheme()}
          aria-pressed={!isDark}
          title="Switch to Light Vellum mode"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
            !isDark
              ? "bg-[rgba(184,134,29,0.14)] text-[var(--admin-accent)] shadow-sm font-semibold border border-[var(--admin-accent)]/40"
              : "text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]"
          }`}
        >
          <span className="text-sm leading-none" role="img" aria-label="Light mode">☀️</span>
          <span className="text-[0.72rem]">Light</span>
        </button>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? "Light" : "Dark"} mode`}
        title={`Currently in ${isDark ? "Dark Cosmic" : "Light Vellum"} mode. Click to toggle.`}
        className={`relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent)] hover:shadow-[0_0_15px_rgba(232,206,140,0.2)] transition-all duration-200 cursor-pointer ${className}`}
      >
        <span className="text-sm sm:text-base select-none leading-none transition-transform duration-300 hover:rotate-12">
          {isDark ? "🌙" : "☀️"}
        </span>
      </button>
    );
  }

  // Default Pill Variant: Elegant button that toggles between Dark Cosmic and Light Vellum
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "Light" : "Dark"} mode`}
      title={`Currently in ${isDark ? "Dark Cosmic" : "Light Vellum"} mode. Click to switch.`}
      className={`relative inline-flex items-center gap-2 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[var(--admin-text-primary)] hover:border-[var(--admin-accent)] hover:shadow-[0_0_15px_rgba(232,206,140,0.18)] transition-all duration-200 cursor-pointer select-none group ${className}`}
    >
      {/* Animated Icon Circle */}
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110 ${
          isDark
            ? "bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]"
            : "bg-amber-500/20 text-amber-600"
        }`}
      >
        {isDark ? (
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        ) : (
          <svg className="h-3.2 w-3.2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <circle cx="12" cy="12" r="4" fill="currentColor" />
            <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        )}
      </div>

      {showLabel && (
        <span className="font-medium text-[0.78rem] tracking-wide hidden xs:inline sm:inline">
          {isDark ? (
            <span className="flex items-center gap-1.5">
              <span>Dark</span>
              <span className="text-[0.68rem] text-[var(--admin-accent)] font-serif opacity-80">✦</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[var(--admin-accent)] font-semibold">
              <span>Light</span>
              <span className="text-[0.68rem] font-serif opacity-80">☼</span>
            </span>
          )}
        </span>
      )}
    </button>
  );
}
