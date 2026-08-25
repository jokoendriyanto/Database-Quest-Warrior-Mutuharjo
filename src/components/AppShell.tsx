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
  LogOut,
} from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
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

const MOBILE_NAV = [
  NAV_GROUPS[0].items[0],
  NAV_GROUPS[0].items[1],
  NAV_GROUPS[1].items[0],
  NAV_GROUPS[1].items[1],
  NAV_GROUPS[2].items[0],
];

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
        <span aria-hidden className="text-base leading-none">
          {data.user.avatarEmoji}
        </span>
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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <Link to="/dashboard" className="flex items-center gap-2 px-4 pb-4 pt-5">
          <span aria-hidden className="font-mono text-lg font-bold text-primary">
            ▸_
          </span>
          <div className="leading-tight">
            <p className="text-[13px] font-bold tracking-tight">Database Quest</p>
            <p className="kicker">Mutuharjo</p>
          </div>
        </Link>

        <nav className="flex flex-1 flex-col overflow-y-auto px-3" aria-label="Navigasi utama">
          {NAV_GROUPS.map(({ group, items }) => (
            <div key={group} className="mb-4">
              <p className="kicker mb-1 px-3">{group}</p>
              <ul className="space-y-0.5">
                {items.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink to={to} className={navLinkClass}>
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
                  <NavLink to="/teacher" className={navLinkClass}>
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
        </nav>

        <SidebarXp />
        <div className="border-t border-border px-2 py-1">
          <SignOutButton onDone={handleSignOut} />
        </div>
      </aside>

      {/* Konten */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background px-4 py-2.5 lg:hidden">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span aria-hidden className="font-mono text-base font-bold text-primary">
              ▸_
            </span>
            <span className="text-sm font-bold tracking-tight">Database Quest</span>
          </Link>
          <TopbarStreak />
        </header>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <AppShellFooter />
      </div>

      {/* Bottom nav mobile — flat, bukan floating */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card lg:hidden"
        aria-label="Navigasi bawah"
      >
        {MOBILE_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span aria-hidden className="absolute inset-x-4 top-0 h-0.5 bg-primary" />
                )}
                <Icon className="size-[18px]" strokeWidth={1.75} />
                {label === "Dashboard" ? "Home" : label === "Leaderboard" ? "Rank" : label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

/** Footer wajib Database Quest — flat, border-top, tiga kolom di desktop. */
function AppShellFooter() {
  return (
    <footer className="border-t border-border px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-6">
      <div className="mx-auto grid max-w-[1200px] gap-4 sm:grid-cols-[1fr_auto_auto] sm:gap-12">
        <div>
          <p className="text-sm font-bold">Database Quest</p>
          <p className="mt-0.5 max-w-xs text-xs text-muted-foreground">
            Belajar database dengan cara pecahin kasus beneran — lalu aduin skill di arena.
          </p>
        </div>
        <nav className="flex gap-8 text-xs" aria-label="Tautan footer">
          <ul className="space-y-1.5">
            <li><Link className="text-muted-foreground hover:text-foreground" to="/learn">Learn</Link></li>
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
            © 2026 Database Quest: Mutuharjo
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
