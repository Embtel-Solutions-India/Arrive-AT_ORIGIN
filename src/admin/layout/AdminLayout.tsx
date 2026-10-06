import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { adminNav } from "./nav";

export function AdminLayout() {
  const { user, can, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-[0.88rem] no-underline transition-all duration-150 ${
      isActive
        ? "bg-[rgba(232,206,140,0.14)] text-[var(--admin-accent)] font-semibold shadow-sm"
        : "text-[var(--admin-text-secondary)] hover:bg-[rgba(237,231,218,0.06)] hover:text-[var(--admin-text-primary)]"
    }`;

  return (
    <div className="admin-root min-h-svh lg:grid lg:grid-cols-[260px_minmax(0,1fr)] bg-[var(--admin-background)]">
      {/* Mobile & Tablet Drawer Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar Navigation - Always sticky on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:w-auto lg:max-w-none lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[var(--admin-border)]/50 px-5">
          <Link to="/admin/dashboard" onClick={() => setOpen(false)} className="flex flex-col no-underline">
            <span className="font-display text-[1.15rem] font-light text-[var(--admin-text-primary)] tracking-tight">
              Arrive at Origin
            </span>
            <span className="text-[0.66rem] tracking-[0.16em] text-[var(--admin-accent)] uppercase font-semibold">
              Admin Portal
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-white/10 hover:text-white lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* Clean, Single-Scroll Nav */}
        <nav aria-label="Admin Navigation" className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
          {adminNav.map((group, i) => {
            const items = group.items.filter((it) => !it.permission || can(it.permission));
            if (!items.length) return null;
            return (
              <div key={i} className="space-y-1">
                {group.label && (
                  <div className="px-3 pb-1 text-[0.68rem] font-bold tracking-[0.14em] text-[var(--admin-text-muted)] uppercase">
                    {group.label}
                  </div>
                )}
                {items.map((it) => (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end={it.to === "/admin/dashboard"}
                    className={link}
                    onClick={() => setOpen(false)}
                  >
                    {it.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar Header */}
        <header className="sticky top-0 z-30 flex h-16 w-full flex-shrink-0 items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/90 px-4 sm:px-6 md:px-8 backdrop-blur-md">
          {/* Mobile Menu Hamburger */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-1.5 text-[0.85rem] text-[var(--admin-text-primary)] hover:border-[var(--admin-accent)] lg:hidden cursor-pointer"
            >
              <svg className="w-5 h-5 text-[var(--admin-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-xs font-semibold">Menu</span>
            </button>
          </div>

          {/* User Profile & Actions Group */}
          <div className="flex items-center gap-2.5 sm:gap-4 flex-shrink-0 ml-auto">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition-colors no-underline text-xs"
            >
              <span>View live site</span>
              <span className="text-[0.75rem]">↗</span>
            </a>

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-[var(--admin-accent)]/15 border border-[var(--admin-accent)]/30 text-[var(--admin-accent)] font-bold text-xs flex-shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "AD"}
              </div>
              <span className="hidden sm:block text-right leading-tight max-w-[140px] truncate">
                <span className="block font-medium text-[var(--admin-text-primary)] text-xs sm:text-sm truncate">
                  {user?.name}
                </span>
                <span className="block text-[0.66rem] text-[var(--admin-text-muted)] uppercase tracking-wider truncate">
                  {user?.role?.replace(/_/g, " ")}
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("/admin/login", { replace: true });
              }}
              className="whitespace-nowrap flex-shrink-0 rounded-full border border-[var(--admin-border)] bg-white/5 px-3.5 sm:px-4 py-1.5 text-xs font-medium text-[var(--admin-text-secondary)] hover:border-[var(--admin-accent)] hover:text-white transition-colors cursor-pointer"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="min-w-0 flex-1 w-full max-w-full px-4 sm:px-6 md:px-8 py-6 sm:py-8 overflow-x-clip">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
