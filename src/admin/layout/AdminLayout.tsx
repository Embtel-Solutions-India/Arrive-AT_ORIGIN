import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { adminNav } from "./nav";

export function AdminLayout() {
  const { user, can, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const link = ({ isActive }: { isActive: boolean }) =>
    `block rounded-lg px-3 py-2 text-[0.9rem] no-underline transition-colors ${
      isActive
        ? "bg-[rgba(232,206,140,0.14)] text-[var(--admin-accent)]"
        : "text-[var(--admin-text-secondary)] hover:bg-[rgba(237,231,218,0.06)] hover:text-[var(--admin-text-primary)]"
    }`;

  return (
    <div className="admin-root min-h-svh md:grid md:grid-cols-[264px_1fr]">
      <aside
        className={`${open ? "block" : "hidden"} border-r border-[var(--admin-border)] bg-[var(--admin-surface)] md:sticky md:top-0 md:block md:h-svh md:overflow-y-auto`}
      >
        <Link to="/admin/dashboard" className="flex flex-col px-5 py-6 no-underline">
          <span className="font-display text-[1.15rem] text-[var(--admin-text-primary)]">Soul Body Healing</span>
          <span className="text-[0.7rem] tracking-[0.14em] text-[var(--admin-text-muted)] uppercase">Admin</span>
        </Link>
        <nav aria-label="Admin" className="px-3 pb-8">
          {adminNav.map((group, i) => {
            const items = group.items.filter((it) => !it.permission || can(it.permission));
            if (!items.length) return null;
            return (
              <div key={i} className="mb-4">
                {group.label && (
                  <div className="px-3 pb-1 text-[0.7rem] tracking-[0.12em] text-[var(--admin-text-muted)] uppercase">
                    {group.label}
                  </div>
                )}
                {items.map((it) => (
                  <NavLink key={it.to} to={it.to} end={it.to === "/admin/dashboard"} className={link} onClick={() => setOpen(false)}>
                    {it.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-10 flex min-h-[64px] items-center gap-4 border-b border-[var(--admin-border)] bg-[color-mix(in_srgb,var(--admin-background)_85%,transparent)] px-[clamp(16px,3vw,32px)] backdrop-blur">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-[0.85rem] md:hidden"
          >
            Menu
          </button>
          <div className="ml-auto flex items-center gap-4 text-[0.85rem]">
            <a href="/" target="_blank" rel="noopener noreferrer" className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]">
              View site
            </a>
            <span className="text-right leading-tight">
              <span className="block text-[var(--admin-text-primary)]">{user?.name}</span>
              <span className="block text-[0.72rem] text-[var(--admin-text-muted)]">{user?.role.replace(/_/g, " ")}</span>
            </span>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("/admin/login", { replace: true });
              }}
              className="rounded-full border border-[var(--admin-border)] px-4 py-2 hover:border-[var(--admin-accent)]"
            >
              Log out
            </button>
          </div>
        </header>
        <main className="px-[clamp(16px,3vw,32px)] py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
