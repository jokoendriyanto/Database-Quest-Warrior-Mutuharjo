import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Home,
  Map as MapIcon,
  Swords,
  Trophy,
  User,
  Flame,
  GraduationCap,
  ClipboardCheck,
  ShieldCheck,
  LogOut,
  PanelLeft,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { levelProgress, rankFromLevel } from "@/lib/game";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
}

const NAV_GROUPS: { group: string; items: NavItem[] }[] = [
  {
    group: "LEARN",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: Home },
      { to: "/learn", label: "Learn", icon: MapIcon },
      { to: "/assignments", label: "Tugas", icon: ClipboardCheck },
    ],
  },
  {
    group: "COMPETE",
    items: [
      { to: "/battle", label: "Battle", icon: Swords },
      { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    ],
  },
  {
    group: "YOU",
    items: [{ to: "/profile", label: "Profil", icon: User }],
  },
];

/** Tab cepat di topbar — urutan akses paling sering. */
const QUICK_TABS: NavItem[] = [
  NAV_GROUPS[0].items[0], // Dashboard
  NAV_GROUPS[0].items[1], // Learn
  NAV_GROUPS[0].items[2], // Tugas
  NAV_GROUPS[1].items[0], // Battle
  NAV_GROUPS[1].items[1], // Leaderboard
  NAV_GROUPS[2].items[0], // Profil
];

const TAB_SHORT: Record<string, string> = {
  Dashboard: "Home",
  Leaderboard: "Rank",
};

/** Strip XP inline — bukan card. Level • rank • progress tipis. */
function SidebarXp() {
  const data = useQuery(api.game.dashboard);
  if (!data) return null;
  const { level, current, needed } = levelProgress(data.stats.xp);
  const rank = rankFromLevel(level);
  const pct = Math.min(100, Math.round((current / needed) * 100));
  return (
    <div className="border-t border-border px-3 py-3">
      <div className="flex items-center gap-2">
        {data.user.avatarUrl ? (
          <img src={data.user.avatarUrl} alt="" className="size-6 shrink-0 object-cover" />
        ) : (
          <span aria-hidden className="text-base leading-none">
            {data.user.avatarEmoji}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{data.user.name}</p>
          <p className="font-mono text-[10px] text-muted-foreground">
            LV {level} · {rank.name}
          </p>
        </div>
      </div>
      <div className="inset-track mt-2">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 font-mono text-[10px] text-muted-foreground">
        {current.toLocaleString()} / {needed.toLocaleString()} XP → LV {level + 1}
      </p>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      className="border border-border p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}

function SidebarThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex w-full items-center gap-2 px-1 py-1.5 text-left font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
    >
      {theme === "dark" ? <Sun className="size-3" /> : <Moon className="size-3" />}
      {theme === "dark" ? "Mode Terang" : "Mode Gelap"}
    </button>
  );
}

function SignOutButton({ onDone }: { onDone: () => void }) {
  return (
    <button
      onClick={onDone}
      className="flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-[11px] text-muted-foreground transition-colors hover:text-destructive"
    >
      <LogOut className="size-3" /> exit
    </button>
  );
}

export function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  // Sidebar disembunyikan secara default — dibuka lewat tombol menu di topbar.
  const [navOpen, setNavOpen] = useState(false);

  // Tutup drawer dengan Escape
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors",
      isActive
        ? "bg-accent/60 font-semibold text-accent-foreground"
        : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
    );
  // indikator kiri untuk item aktif
  const ActiveDot = () => (
    <span
      aria-hidden
      className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 bg-primary"
    />
  );

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative flex shrink-0 items-center gap-1.5 px-3 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors",
      isActive
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="flex min-h-screen bg-background">
      {/* ============ DRAWER NAVIGASI — tersembunyi secara default ============ */}
      {navOpen && (
        <div
          aria-hidden
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-40 bg-foreground/25"
        />
      )}
      <aside
        aria-label="Menu navigasi"
        aria-hidden={!navOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-200",
          navOpen ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 pb-3 pt-4">
          <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setNavOpen(false)}>
            <span aria-hidden className="font-mono text-lg font-bold text-primary">
              ▸_
            </span>
            <div className="leading-tight">
              <p className="text-[13px] font-bold tracking-tight">Database Quest Warrior</p>
              <p className="kicker">Mutuharjo</p>
            </div>
          </Link>
          <button
            onClick={() => setNavOpen(false)}
            aria-label="Tutup menu"
            className="p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-3 pb-3" aria-label="Navigasi utama">
          {NAV_GROUPS.map(({ group, items }) => (
            <div key={group} className="mb-4">
              <p className="kicker mb-1 px-3">{group}</p>
              <ul className="space-y-0.5">
                {items.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink to={to} className={navLinkClass} onClick={() => setNavOpen(false)}>
                      {({ isActive }) => (
                        <>
                          {isActive && <ActiveDot />}
                          <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                          {label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {isTeacher && (
            <div className="mb-4">
              <p className="kicker mb-1 px-3">GURU</p>
              <ul className="space-y-0.5">
                <li>
                  <NavLink to="/teacher" className={navLinkClass} onClick={() => setNavOpen(false)}>
                    {({ isActive }) => (
                      <>
                        {isActive && <ActiveDot />}
                        <GraduationCap className="size-4 shrink-0" strokeWidth={1.75} />
                        Panel Kelas
                      </>
                    )}
                  </NavLink>
                </li>
              </ul>
            </div>
          )}
          {user?.role === "admin" && (
            <div className="mb-4">
              <p className="kicker mb-1 px-3">ADMIN</p>
              <ul className="space-y-0.5">
                <li>
                  <NavLink to="/admin" className={navLinkClass} onClick={() => setNavOpen(false)}>
                    {({ isActive }) => (
                      <>
                        {isActive && <ActiveDot />}
                        <ShieldCheck className="size-4 shrink-0" strokeWidth={1.75} />
                        Admin Console
                      </>
                    )}
                  </NavLink>
                </li>
              </ul>
            </div>
          )}
        </nav>

        <SidebarXp />
        <div className="border-t border-border px-3 py-2">
          <SidebarThemeToggle />
        </div>
        <div className="border-t border-border px-2 py-1">
          <SignOutButton onDone={handleSignOut} />
        </div>
      </aside>

      {/* ============ KONTEN ============ */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Topbar: tombol menu + tab navigasi cepat */}
        <header className="sticky top-0 z-30 border-b border-border bg-background">
          <div className="flex items-center justify-between gap-2 px-3 sm:px-4">
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => setNavOpen((v) => !v)}
                aria-label={navOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
                aria-expanded={navOpen}
                className={cn(
                  "border p-1.5 transition-colors",
                  navOpen
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <PanelLeft className="size-4" />
              </button>
              <Link to="/dashboard" className="flex items-center gap-1.5 py-2">
                <span aria-hidden className="font-mono text-base font-bold text-primary">
                  ▸_
                </span>
                <span className="hidden text-sm font-bold tracking-tight md:block">
                  Database Quest Warrior
                </span>
              </Link>
            </div>

            {/* Tab menu cepat — scroll horizontal di layar kecil */}
            <nav
              className="flex min-w-0 flex-1 items-center justify-start overflow-x-auto sm:justify-center"
              aria-label="Menu cepat"
            >
              <ul className="flex items-center">
                {QUICK_TABS.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink to={to} className={tabClass}>
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span
                              aria-hidden
                              className="absolute inset-x-2 top-0 h-0.5 bg-primary"
                            />
                          )}
                          <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
                          <span className="hidden sm:inline">
                            {TAB_SHORT[label] ?? label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
                {isTeacher && (
                  <li>
                    <NavLink to="/teacher" className={tabClass}>
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span aria-hidden className="absolute inset-x-2 top-0 h-0.5 bg-primary" />
                          )}
                          <GraduationCap className="size-3.5 shrink-0" strokeWidth={1.75} />
                          <span className="hidden sm:inline">Guru</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                )}
                {user?.role === "admin" && (
                  <li>
                    <NavLink to="/admin" className={tabClass}>
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span aria-hidden className="absolute inset-x-2 top-0 h-0.5 bg-primary" />
                          )}
                          <ShieldCheck className="size-3.5 shrink-0" strokeWidth={1.75} />
                          <span className="hidden sm:inline">Admin</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                )}
              </ul>
            </nav>

            <div className="flex shrink-0 items-center gap-1.5">
              <TopbarStreak />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <AppShellFooter />
      </div>
    </div>
  );
}

/** Footer wajib Database Quest — flat, border-top, tiga kolom di desktop. */
function AppShellFooter() {
  return (
    <footer className="border-t border-border px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1200px] gap-4 sm:grid-cols-[1fr_auto_auto] sm:gap-12">
        <div>
          <p className="text-sm font-bold">Database Quest Warrior</p>
          <p className="mt-0.5 max-w-xs text-xs text-muted-foreground">
            Belajar database dengan cara pecahin kasus beneran — lalu aduin skill di arena.
          </p>
        </div>
        <nav className="flex gap-8 text-xs" aria-label="Tautan footer">
          <ul className="space-y-1.5">
            <li><Link className="text-muted-foreground hover:text-foreground" to="/learn">Learn</Link></li>
            <li><Link className="text-muted-foreground hover:text-foreground" to="/assignments">Tugas</Link></li>
            <li><Link className="text-muted-foreground hover:text-foreground" to="/battle">Battle</Link></li>
            <li><Link className="text-muted-foreground hover:text-foreground" to="/leaderboard">Leaderboard</Link></li>
          </ul>
        </nav>
        <div className="text-xs">
          <p className="text-muted-foreground">
            Made With{" "}
            <span aria-hidden className="text-battle">♥</span> By MrStepen
          </p>
          <p className="text-muted-foreground">( Joko Endriyanto )</p>
          <p className="mt-1.5 font-mono text-[10px] text-muted-foreground/70">
            © 2026 Database Quest Warrior: Mutuharjo
          </p>
        </div>
      </div>
    </footer>
  );
}

function TopbarStreak() {
  const data = useQuery(api.game.dashboard);
  if (!data || data.stats.streak <= 0) return null;
  return (
    <span className="flex items-center gap-1 font-mono text-xs font-semibold text-warning">
      <Flame className="size-3.5" aria-hidden /> {data.stats.streak}d
    </span>
  );
}
