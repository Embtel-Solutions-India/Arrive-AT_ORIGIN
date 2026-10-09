import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useAdminTheme } from "./AdminThemeContext";
import { AdminThemeToggle } from "../components/AdminThemeToggle";
import { adminNav } from "./nav";

export function AdminLayout() {
  const { user, can, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { theme } = useAdminTheme();

  // Collapsible section state for sidebar
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    blog: true,
    books: true,
    orders: true,
    system: true,
  });

  // Automatically expand group containing active route
  useEffect(() => {
    const path = location.pathname;
    setExpandedSections((prev) => {
      const next = { ...prev };
      if (path.includes("/admin/blog")) next.blog = true;
      if (path.includes("/admin/books") || path.includes("/admin/authors")) next.books = true;
      if (
        path.includes("/admin/orders") ||
        path.includes("/admin/customers") ||
        path.includes("/admin/payments") ||
        path.includes("/admin/coupons")
      ) {
        next.orders = true;
      }
      if (
        path.includes("/admin/media") ||
        path.includes("/admin/seo") ||
        path.includes("/admin/settings") ||
        path.includes("/admin/users")
      ) {
        next.system = true;
      }
      return next;
    });

    // Close mobile drawer on route change
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll on mobile when sidebar drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-[0.85rem] sm:text-[0.88rem] no-underline transition-all duration-150 ${
      isActive
        ? "bg-[rgba(232,206,140,0.14)] text-[var(--admin-accent)] font-semibold shadow-sm"
        : "text-[var(--admin-text-secondary)] hover:bg-[rgba(237,231,218,0.06)] hover:text-[var(--admin-text-primary)]"
    }`;

  return (
    <div
      className={`admin-root admin-theme-${theme} min-h-svh lg:grid lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)] bg-[var(--admin-background)]`}
      data-theme={theme}
    >
      {/* Mobile & Tablet Drawer Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden transition-opacity duration-200"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Admin Sidebar Navigation - Drawer on mobile/tablet, Sticky on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-76 max-w-[85vw] flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:w-auto lg:max-w-none lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        aria-label="Admin Navigation Sidebar"
      >
        {/* Brand Header */}
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-[var(--admin-border)]/50 px-5 bg-[var(--admin-surface)]">
          <Link
            to="/admin/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 no-underline group"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--admin-accent)]/15 border border-[var(--admin-accent)]/30 text-[var(--admin-accent)] font-display text-sm font-bold">
              ✦
            </span>
            <div className="flex flex-col">
              <span className="font-display text-[1.12rem] font-light text-[var(--admin-text-primary)] tracking-tight group-hover:text-[var(--admin-accent)] transition-colors">
                Arrive at Origin
              </span>
              <span className="text-[0.64rem] tracking-[0.16em] text-[var(--admin-accent)] uppercase font-semibold">
                Control Panel
              </span>
            </div>
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

        {/* Collapsible Accordion Navigation Menu */}
        <nav aria-label="Admin Navigation" className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3">
          {adminNav.map((group) => {
            const items = group.items.filter((it) => !it.permission || can(it.permission));
            if (!items.length) return null;

            // Single item group (e.g., Dashboard)
            if (!group.label) {
              return (
                <div key={group.id} className="space-y-1">
                  {items.map((it) => (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      end={it.to === "/admin/dashboard"}
                      className={link}
                      onClick={() => setOpen(false)}
                    >
                      <span className="text-base">📊</span>
                      <span>{it.label}</span>
                    </NavLink>
                  ))}
                </div>
              );
            }

            const isExpanded = expandedSections[group.id] !== false;

            return (
              <div key={group.id} className="rounded-xl border border-transparent hover:border-white/5 transition-colors">
                {/* Expandable Group Trigger */}
                <button
                  type="button"
                  onClick={() => toggleSection(group.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-[0.7rem] font-bold tracking-[0.12em] text-[var(--admin-text-muted)] uppercase hover:text-[var(--admin-text-primary)] cursor-pointer select-none transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {group.icon && <span className="text-xs normal-case">{group.icon}</span>}
                    <span>{group.label}</span>
                  </div>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 opacity-60 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Submenu Links */}
                {isExpanded && (
                  <div className="space-y-0.5 pt-0.5 pb-1 pl-1">
                    {items.map((it) => (
                      <NavLink
                        key={it.to}
                        to={it.to}
                        end={it.to === "/admin/dashboard"}
                        className={link}
                        onClick={() => setOpen(false)}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--admin-accent)]/40 flex-shrink-0" />
                        <span className="truncate">{it.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer: Theme Toggle & Live Site Link */}
        <div className="flex-shrink-0 border-t border-[var(--admin-border)]/60 p-3 bg-[var(--admin-background)]/50 space-y-2">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--admin-border)]/50 bg-[var(--admin-surface)] px-3 py-2">
            <div className="flex flex-col">
              <span className="text-[0.72rem] font-medium text-[var(--admin-text-secondary)]">Theme</span>
              <span className="text-[0.62rem] text-[var(--admin-text-muted)] capitalize">
                {theme === "dark" ? "Cosmic Night" : "Warm Vellum"}
              </span>
            </div>
            <AdminThemeToggle variant="switch" />
          </div>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs text-[var(--admin-text-secondary)] hover:text-white hover:border-[var(--admin-accent)] transition-colors no-underline"
          >
            <span>View Public Storefront</span>
            <span className="text-xs">↗</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar Header */}
        <header className="sticky top-0 z-30 flex h-16 w-full flex-shrink-0 items-center justify-between gap-2 sm:gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/90 px-3 sm:px-6 md:px-8 backdrop-blur-md">
          {/* Mobile Menu Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              aria-expanded={open}
              aria-label="Toggle navigation drawer"
              onClick={() => setOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2.5 sm:px-3 py-1.5 text-[0.85rem] text-[var(--admin-text-primary)] hover:border-[var(--admin-accent)] lg:hidden cursor-pointer flex-shrink-0"
            >
              <svg className="w-5 h-5 text-[var(--admin-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-xs font-semibold hidden xs:inline">Menu</span>
            </button>
            <span className="font-display text-sm font-medium text-[var(--admin-text-primary)] truncate lg:hidden">
              Control Panel
            </span>
          </div>

          {/* User Profile & Actions Group */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-auto">
            {/* Dark/Light Mode Theme Toggle */}
            <div className="hidden xs:block">
              <AdminThemeToggle variant="pill" />
            </div>

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
              <span className="hidden sm:block text-right leading-tight max-w-[120px] truncate">
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
              className="whitespace-nowrap flex-shrink-0 rounded-full border border-[var(--admin-border)] bg-white/5 px-3 sm:px-4 py-1.5 text-xs font-medium text-[var(--admin-text-secondary)] hover:border-[var(--admin-accent)] hover:text-white transition-colors cursor-pointer"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="min-w-0 flex-1 w-full max-w-full px-3.5 sm:px-6 md:px-8 py-5 sm:py-8 overflow-x-clip">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
