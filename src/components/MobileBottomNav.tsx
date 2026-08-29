import { NavLink } from "react-router";
import { Home, BookOpen, Swords, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { SparkleAnimation } from "@/components/ui/lottie-animation";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/battle", label: "Battle", icon: Swords },
  { to: "/leaderboard", label: "Rank", icon: Trophy },
  { to: "/profile", label: "Profil", icon: User },
];

export function MobileBottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg sm:hidden"
      aria-label="Navigasi mobile"
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-semibold transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:bg-muted",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icon
                    className={cn(
                      "size-5 transition-all",
                      isActive && "scale-110",
                    )}
                    strokeWidth={isActive ? 2.5 : 1.75}
                  />
                  {isActive && <SparkleAnimation className="absolute -right-2.5 -top-2 size-3.5" />}
                </span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
