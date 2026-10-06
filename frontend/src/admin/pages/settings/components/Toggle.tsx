interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  badge?: string;
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  badge,
}: ToggleProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--admin-text-primary)]">{label}</span>
          {badge && (
            <span className="rounded-full bg-[rgba(232,206,140,0.14)] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--admin-accent)] border border-[rgba(232,206,140,0.3)]">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-[var(--admin-text-muted)] mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? "bg-[var(--admin-accent)]" : "bg-white/10"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[#070B18] shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
