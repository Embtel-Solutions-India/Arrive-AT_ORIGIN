import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/** Gate for every /admin/* route except the auth pages. Server still enforces all permissions. */
export function ProtectedRoute({ permission }: { permission?: string }) {
  const { user, loading, can } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="grid min-h-svh place-items-center bg-void text-dim">Loading…</div>;
  }
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (permission && !can(permission)) {
    return (
      <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 text-[var(--admin-text-secondary)]">
        You do not have access to this section.
      </div>
    );
  }
  return <Outlet />;
}
