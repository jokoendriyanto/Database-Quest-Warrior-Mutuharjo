import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import {
  Briefcase,
  Building2,
  Compass,
  FileBadge,
  LayoutDashboard,
  LogOut,
  Search,
  ScrollText,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSeo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { MobileBottomNav } from "@/components/MobileBottomNav";

/** Halaman privat (butuh login): selalu noindex. */
function HrdNoindex() {
  useSeo({
    title: "Dashboard HRD",
    description: "Talent dashboard industri Database Quest Warrior.",
    path: "/hrd",
    robots: "noindex, nofollow",
  });
  return null;
}

const NAV = [
  { to: "/hrd", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/hrd/candidates", label: "Candidate Pool", icon: Search },
  { to: "/hrd/explorer", label: "Skill Explorer", icon: Compass },
  { to: "/hrd/shortlist", label: "Shortlist", icon: ScrollText },
  { to: "/hrd/verify", label: "Verifikasi Sertifikat", icon: FileBadge },
  { to: "/hrd/company", label: "Company Profile", icon: Building2 },
  { to: "/hrd/activity", label: "Aktivitas", icon: ScrollText },
];

const SHORT_TABS = [
  { to: "/hrd", label: "Home" },
  { to: "/hrd/candidates", label: "Kandidat" },
  { to: "/hrd/shortlist", label: "Shortlist" },
  { to: "/hrd/verify", label: "Sertifikat" },
];

/** Guard khusus HRD — role lain diarahkan keluar tanpa mengubah alur lama. */
function HrdShellInner() {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && user && user.role !== "hrd") {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Memuat…</p>
      </div>
    );
  }
  if (!user) return null; // RequireAuth sudah menangani redirect ke /auth
  // Role lain: jangan render UI/query HRD sama sekali (useEffect di atas
  // yang memindahkan ke /dashboard).
  if (user.role !== "hrd") return null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors",
      isActive
        ? "bg-accent/60 font-semibold text-accent-foreground"
        : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
    );

  return (
    <div className="flex min-h-screen bg-background">
      <HrdNoindex />
      {navOpen && (
        <div
          aria-hidden
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-foreground/25"
        />
      )}
      <aside
        aria-label="Menu navigasi HRD"
        aria-hidden={!navOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-200",
          navOpen ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 pb-3 pt-4">
          <Link to="/hrd" className="flex items-center gap-2">
            <span aria-hidden className="font-mono text-lg font-bold text-primary">▸_</span>
            <div className="leading-tight">
              <p className="text-[13px] font-bold tracking-tight">Talent Dashboard</p>
              <p className="kicker">HRD · Database Quest</p>
            </div>
          </Link>
          <button
            onClick={() => setNavOpen(false)}
            aria-label="Tutup menu"
            className="p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-3 pb-3" aria-label="Navigasi HRD">
          <p className="kicker mb-1 px-3">TALENT</p>
          <ul className="space-y-0.5">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={linkClass} onClick={() => setNavOpen(false)}>
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-border px-2 py-1">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-[11px] text-muted-foreground hover:text-destructive"
          >
            <LogOut className="size-3" /> exit
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background">
          <div className="flex items-center justify-between gap-2 px-3 sm:px-4">
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => setNavOpen((v) => !v)}
                aria-label={navOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
                aria-expanded={navOpen}
                className="border border-border p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Briefcase className="size-4" />
              </button>
              <Link to="/hrd" className="flex items-center gap-1.5 py-2">
                <span aria-hidden className="font-mono text-base font-bold text-primary">▸_</span>
                <span className="hidden text-sm font-bold tracking-tight md:block">
                  Talent Dashboard
                </span>
              </Link>
            </div>
            <nav className="flex min-w-0 flex-1 items-center justify-start overflow-x-auto sm:justify-center" aria-label="Menu cepat HRD">
              <ul className="flex items-center">
                {SHORT_TABS.map(({ to, label }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === "/hrd"}
                      className={({ isActive }) =>
                        cn(
                          "relative flex shrink-0 items-center px-3 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors",
                          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                        )
                      }
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="hidden shrink-0 items-center gap-2 text-xs text-muted-foreground sm:flex">
              {user.name ?? "HRD"}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 pb-24 sm:px-6 sm:pb-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-border px-4 py-6 sm:px-6 lg:px-8">
          <p className="mx-auto max-w-[1200px] text-xs text-muted-foreground">
            Talent Dashboard · Database Quest Warrior: Mutuharjo — profil kandidat
            ditampilkan berdasarkan izin siswa.
          </p>
        </footer>
        <MobileBottomNav />
      </div>
    </div>
  );
}

export function HrdShell() {
  return (
    <HrdShellInner />
  );
}

export default HrdShell;
