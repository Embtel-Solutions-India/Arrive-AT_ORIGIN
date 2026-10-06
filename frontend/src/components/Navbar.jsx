import { Link, NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `text-sm transition-colors hover:text-white ${isActive ? "text-white" : "text-slate-400"}`;

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070B18]/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link to="/" className="text-lg font-semibold tracking-wide text-[#E8CE8C]">
          Soul Body Healing Center
        </Link>
        <nav className="flex items-center gap-6">
          <NavLink to="/" className={linkClass} end>Home</NavLink>
          <NavLink to="/about" className={linkClass}>About</NavLink>
          <a
            href="/dr-alka-chopra-madan-meta-human.html"
            className="rounded-full bg-[#E8CE8C] px-4 py-2 text-sm font-semibold text-[#070B18] transition hover:bg-white"
          >
            Dr. Alka Chopra Madan
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
