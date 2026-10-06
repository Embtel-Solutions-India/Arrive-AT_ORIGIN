import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 sm:p-6 shadow-sm min-w-0 max-w-full ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-border)]/50 pb-4">
          {title && <h2 className="font-display text-[1.15rem] sm:text-[1.2rem] font-medium text-[var(--admin-text-primary)]">{title}</h2>}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 sm:mb-8 flex flex-wrap items-start justify-between gap-4 min-w-0">
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-[clamp(1.6rem,2.8vw,2.2rem)] leading-tight font-light text-[var(--admin-text-primary)]">{title}</h1>
        {description && <p className="mt-1.5 max-w-[65ch] text-[0.88rem] sm:text-[0.95rem] text-[var(--admin-text-secondary)]">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">{action}</div>}
    </div>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}) {
  const sizeStyles = {
    sm: "min-h-[36px] px-3.5 text-[0.8rem]",
    md: "min-h-[42px] px-5 text-[0.875rem]",
    lg: "min-h-[48px] px-6 text-[0.95rem]",
  }[size];

  const variantStyles = {
    primary: "border-[var(--admin-accent)] bg-[var(--admin-accent)] text-[#0B0D13] font-semibold hover:bg-white hover:border-white shadow-sm",
    secondary: "border-[var(--admin-border)] bg-[rgba(237,231,218,0.08)] text-[var(--admin-text-primary)] hover:bg-[rgba(237,231,218,0.14)]",
    outline: "border-[var(--admin-border)] text-[var(--admin-text-primary)] hover:border-[var(--admin-accent)] hover:text-[var(--admin-accent)]",
    ghost: "border-transparent text-[var(--admin-text-secondary)] hover:bg-[rgba(237,231,218,0.06)] hover:text-[var(--admin-text-primary)]",
    danger: "border-[var(--admin-danger)] bg-[var(--admin-danger)]/20 text-[#ff8e82] hover:bg-[var(--admin-danger)] hover:text-white",
  }[variant];

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none ${sizeStyles} ${variantStyles} ${className}`}
    >
      {children}
    </button>
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, error, helperText, id, className = "", ...props },
  ref
) {
  const fieldId = id ?? props.name;
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={fieldId} className="mb-1.5 block text-[0.85rem] font-medium text-[var(--admin-text-secondary)]">
        {label}
      </label>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        {...props}
        className="min-h-[44px] w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3.5 text-[0.9rem] text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)] focus:border-[var(--admin-accent)] focus:ring-1 focus:ring-[var(--admin-accent)] focus:outline-none aria-[invalid=true]:border-[var(--admin-danger)] transition-colors"
      />
      {helperText && !error && <p className="mt-1 text-[0.78rem] text-[var(--admin-text-muted)]">{helperText}</p>}
      {error && <p className="mt-1 text-[0.8rem] text-[var(--admin-danger)]">{error}</p>}
    </div>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options?: Array<{ label: string; value: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, id, options, children, className = "", ...props },
  ref
) {
  const selectId = id ?? props.name;
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={selectId} className="mb-1.5 block text-[0.85rem] font-medium text-[var(--admin-text-secondary)]">
        {label}
      </label>
      <select
        ref={ref}
        id={selectId}
        {...props}
        className="min-h-[44px] w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-3.5 text-[0.9rem] text-[var(--admin-text-primary)] focus:border-[var(--admin-accent)] focus:outline-none transition-colors"
      >
        {options ? options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#14161f] text-white">
            {o.label}
          </option>
        )) : children}
      </select>
      {error && <p className="mt-1 text-[0.8rem] text-[var(--admin-danger)]">{error}</p>}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, helperText, id, rows = 4, className = "", ...props },
  ref
) {
  const areaId = id ?? props.name;
  return (
    <div className={`mb-4 ${className}`}>
      <label htmlFor={areaId} className="mb-1.5 block text-[0.85rem] font-medium text-[var(--admin-text-secondary)]">
        {label}
      </label>
      <textarea
        ref={ref}
        id={areaId}
        rows={rows}
        {...props}
        className="w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] p-3 text-[0.9rem] text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)] focus:border-[var(--admin-accent)] focus:outline-none aria-[invalid=true]:border-[var(--admin-danger)] transition-colors"
      />
      {helperText && !error && <p className="mt-1 text-[0.78rem] text-[var(--admin-text-muted)]">{helperText}</p>}
      {error && <p className="mt-1 text-[0.8rem] text-[var(--admin-danger)]">{error}</p>}
    </div>
  );
});

const badgeTone: Record<string, string> = {
  good: "bg-[rgba(78,124,116,0.25)] text-[#8fc7bb] border border-[rgba(78,124,116,0.4)]",
  warn: "bg-[rgba(232,150,60,0.18)] text-[#f0b070] border border-[rgba(232,150,60,0.35)]",
  bad: "bg-[rgba(216,102,90,0.18)] text-[#ec9a90] border border-[rgba(216,102,90,0.35)]",
  info: "bg-[rgba(232,206,140,0.16)] text-[var(--admin-accent)] border border-[rgba(232,206,140,0.3)]",
  neutral: "bg-[rgba(237,231,218,0.08)] text-[var(--admin-text-secondary)] border border-[rgba(237,231,218,0.15)]",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: keyof typeof badgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium whitespace-nowrap ${badgeTone[tone] ?? badgeTone.neutral} ${className}`}>
      {children}
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full ${maxWidth} rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 sm:p-6 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col`}>
        <div className="mb-4 flex items-center justify-between border-b border-[var(--admin-border)]/50 pb-3">
          <h2 className="font-display text-[1.25rem] text-[var(--admin-text-primary)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--admin-text-muted)] hover:bg-[rgba(237,231,218,0.1)] hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-between border-t border-[var(--admin-border)] pt-4 text-[0.85rem] text-[var(--admin-text-secondary)]">
      <span>
        Page <strong className="text-[var(--admin-text-primary)]">{page}</strong> of{" "}
        <strong className="text-[var(--admin-text-primary)]">{totalPages}</strong>
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
