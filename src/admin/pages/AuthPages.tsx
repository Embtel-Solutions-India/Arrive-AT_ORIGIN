import { useState, type ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../auth/AuthContext";
import { Button, Field } from "../components/ui";

function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="admin-root grid min-h-svh place-items-center px-5 py-12">
      <div className="w-full max-w-[420px] rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8">
        <div className="mb-6">
          <div className="text-[0.7rem] tracking-[0.14em] text-[var(--admin-text-muted)] uppercase">Soul Body Healing Center</div>
          <h1 className="mt-2 font-display text-[1.9rem] leading-tight font-light">{title}</h1>
          {subtitle && <p className="mt-1 text-[var(--admin-text-secondary)]">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

const formError = (e: unknown) => (e instanceof ApiError ? e.message : "Something went wrong. Please try again.");

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean(),
});

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema), defaultValues: { remember: false } });

  const from = (location.state as { from?: string } | null)?.from ?? "/admin/dashboard";
  if (user) return <Navigate to={from} replace />;

  return (
    <AuthShell title="Sign in" subtitle="Admin access for authorised staff.">
      <form
        noValidate
        onSubmit={handleSubmit(async (values) => {
          setError("");
          try {
            await login(values);
            navigate(from, { replace: true });
          } catch (e) {
            setError(formError(e));
          }
        })}
      >
        <Field label="Email" type="email" autoComplete="username" error={errors.email?.message} {...register("email")} />
        <Field label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
        <label className="mb-5 flex items-center gap-2 text-[0.88rem] text-[var(--admin-text-secondary)]">
          <input type="checkbox" {...register("remember")} className="accent-[var(--admin-accent)]" /> Remember this session
        </label>
        {error && <p role="alert" className="mb-4 text-[0.88rem] text-[var(--admin-danger)]">{error}</p>}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
        <p className="mt-5 text-center text-[0.88rem]">
          <Link to="/admin/forgot-password" className="text-[var(--admin-accent)]">Forgot password?</Link>
        </p>
      </form>
    </AuthShell>
  );
}

const forgotSchema = z.object({ email: z.string().email("Enter a valid email") });

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof forgotSchema>>({ resolver: zodResolver(forgotSchema) });

  return (
    <AuthShell title="Forgot password" subtitle="We will email you a reset link.">
      {sent ? (
        <p className="text-[var(--admin-text-secondary)]">If that email is registered, a reset link is on its way. It is valid for one hour.</p>
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
        >
          <Field label="Email" type="email" error={errors.email?.message} {...register("email")} />
          {error && <p role="alert" className="mb-4 text-[0.88rem] text-[var(--admin-danger)]">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full">Send reset link</Button>
        </form>
      )}
      <p className="mt-5 text-center text-[0.88rem]">
        <Link to="/admin/login" className="text-[var(--admin-accent)]">Back to sign in</Link>
      </p>
    </AuthShell>
  );
}

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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });

  return (
    <AuthShell title="Set a new password">
      {!token ? (
        <p className="text-[var(--admin-danger)]">This reset link is missing its token. Request a new one.</p>
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
        >
          <Field label="New password" type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
          <Field label="Confirm password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register("confirm")} />
          {error && <p role="alert" className="mb-4 text-[0.88rem] text-[var(--admin-danger)]">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="w-full">Update password</Button>
        </form>
      )}
    </AuthShell>
  );
}
