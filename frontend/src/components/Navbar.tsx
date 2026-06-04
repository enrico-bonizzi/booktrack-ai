import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-foreground/80 hover:bg-muted hover:text-foreground"
    }`;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="bg-card/80 backdrop-blur-md border-b border-border sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <Link
          to="/"
          className="flex items-center gap-2 shrink-0 group"
          onClick={() => setOpen(false)}
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">📚</span>
          <span className="font-bold text-foreground tracking-tight">
            BookTrack <span className="text-primary">AI</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/books" end className={linkClass}>Biblioteca</NavLink>
          <NavLink to="/books/new" end className={linkClass}>+ Novo</NavLink>
        </nav>

        <div className="hidden md:flex items-center gap-1">
          <button
            type="button"
            onClick={toggle}
            aria-label="Alternar tema"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-foreground/70 hover:bg-muted hover:text-foreground transition"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenu((m) => !m)}
                className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-muted transition"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name || user.email}
                    className="w-8 h-8 rounded-full ring-2 ring-card"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-foreground/80 max-w-[140px] truncate">
                  {user.name || user.email}
                </span>
              </button>
              {menu && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-popover border border-border rounded-xl shadow-lg py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-2 border-b border-border">
                    <div className="text-sm font-medium text-popover-foreground truncate">
                      {user.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex md:hidden items-center gap-1">
          <button
            type="button"
            onClick={toggle}
            aria-label="Alternar tema"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-foreground/70 hover:bg-muted"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button
            type="button"
            className="w-10 h-10 rounded-lg hover:bg-muted flex items-center justify-center text-foreground"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            <span className="text-xl">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>
              Dashboard
            </NavLink>
            <NavLink to="/books" end className={linkClass} onClick={() => setOpen(false)}>
              Biblioteca
            </NavLink>
            <NavLink to="/books/new" end className={linkClass} onClick={() => setOpen(false)}>
              + Novo livro
            </NavLink>
            {user && (
              <>
                <div className="border-t border-border mt-2 pt-3 flex items-center gap-3">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {(user.name || user.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{user.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md"
                >
                  Sair
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
