import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

export function Card({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-display text-[1.25rem] text-[var(--admin-text-primary)]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-[clamp(1.8rem,3vw,2.4rem)] leading-tight font-light">{title}</h1>
      {description && <p className="mt-1 max-w-[60ch] text-[var(--admin-text-secondary)]">{description}</p>}
    </div>
  );
}

export function Button({ variant = "primary", className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const styles =
    variant === "primary"
      ? "border-[var(--admin-accent)] bg-[var(--admin-accent)] text-[var(--color-void)] hover:bg-white"
      : "border-[var(--admin-border)] text-[var(--admin-text-primary)] hover:border-[var(--admin-accent)]";
  return (
    <button
      {...props}
      className={`inline-flex min-h-[44px] items-center justify-center rounded-full border px-6 text-[0.9rem] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
    />
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, error, id, ...props }, ref) {
  const fieldId = id ?? props.name;
  return (
    <div className="mb-4">
      <label htmlFor={fieldId} className="mb-1.5 block text-[0.85rem] text-[var(--admin-text-secondary)]">
        {label}
      </label>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        {...props}
        className="min-h-[46px] w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-background)] px-4 text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-muted)] focus:border-[var(--admin-accent)] focus:outline-none aria-[invalid=true]:border-[var(--admin-danger)]"
      />
      {error && <p className="mt-1 text-[0.8rem] text-[var(--admin-danger)]">{error}</p>}
    </div>
  );
});

const badgeTone: Record<string, string> = {
  good: "bg-[rgba(78,124,116,0.25)] text-[#8fc7bb]",
  warn: "bg-[rgba(232,150,60,0.18)] text-[#f0b070]",
  bad: "bg-[rgba(216,102,90,0.18)] text-[#ec9a90]",
  info: "bg-[rgba(232,206,140,0.16)] text-[var(--admin-accent)]",
  neutral: "bg-[rgba(237,231,218,0.1)] text-[var(--admin-text-secondary)]",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof badgeTone; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium whitespace-nowrap ${badgeTone[tone]}`}>{children}</span>;
}
