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

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/learn", label: "Learn", icon: MapIcon },
  { to: "/battle", label: "Battle", icon: Swords },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/profile", label: "Profil", icon: User },
];

const MOBILE_NAV = NAV.slice(0, 5);

function XpMiniCard() {
  const data = useQuery(api.game.dashboard);
  if (!data) return null;
  const { level, current, needed } = levelProgress(data.stats.xp);
  const rank = rankFromLevel(level);
  const pct = Math.min(100, Math.round((current / needed) * 100));
  return (
    <div className="clay-sm p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-secondary text-2xl" aria-hidden>
          {data.user.avatarEmoji}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{data.user.name}</p>
          <p className="text-xs text-muted-foreground">
            {rank.emoji} {rank.name}
          </p>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
          <span>Level {level}</span>
          <span>
            {current.toLocaleString()} / {needed.toLocaleString()} XP
          </span>
        </div>
        <div className="clay-inset mt-1 h-3 overflow-hidden rounded-full p-0.5">
          <div
            className="h-full rounded-full bg-primary/80 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-4 border-r border-border/60 bg-sidebar p-4 lg:flex">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3">
          <span className="grid size-10 place-items-center rounded-2xl bg-primary text-xl shadow-md" aria-hidden>
            🗄️
          </span>
          <div className="leading-tight">
            <p className="text-sm font-extrabold tracking-tight">Database Quest</p>
            <p className="text-[11px] font-bold text-primary">WARRIOR</p>
          </div>
        </Link>

        <nav className="flex flex-col gap-1.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  isActive
                    ? "clay-btn bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
          {isTeacher && (
            <NavLink
              to="/teacher"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors",
                  isActive
                    ? "clay-btn bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                )
              }
            >
              <GraduationCap className="size-4" />
              Panel Guru
            </NavLink>
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <XpMiniCard />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-3.5" /> Keluar
          </button>
        </div>
      </aside>

      {/* Konten */}
      <div className="flex min-h-screen flex-1 flex-col pb-24 lg:pb-0">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/50 bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-2xl bg-primary text-lg" aria-hidden>
              🗄️
            </span>
            <span className="text-sm font-extrabold tracking-tight">DQ Warrior</span>
          </Link>
          <TopbarStreak />
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>

        {/* Footer branding wajib */}
        <footer className="px-4 pb-28 lg:pb-6 lg:px-6">
          <p className="text-center text-xs text-muted-foreground">
            Made With <span className="text-pink-400">♥</span> By MrStepen
            ( Joko Endriyanto ) — © 2026 Database Quest Warrior: Mutuharjo
          </p>
        </footer>
      </div>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-3xl bg-card/95 px-2 py-2 shadow-[0_10px_30px_rgba(80,60,140,0.25)] backdrop-blur lg:hidden">
        {MOBILE_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex min-w-16 flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 text-[10px] font-bold transition-colors",
                isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground",
              )
            }
          >
            <Icon className="size-5" />
            {label === "Dashboard" ? "Home" : label === "Leaderboard" ? "Rank" : label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function TopbarStreak() {
  const data = useQuery(api.game.dashboard);
  if (!data) return null;
  return (
    <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-600 dark:bg-orange-950/60 dark:text-orange-300">
      <Flame className="size-3.5" aria-hidden />
      {data.stats.streak} hari
    </span>
  );
}
