import { Heart } from "lucide-react";

/**
 * Footer wajib di semua halaman publik & dashboard
 * Database Quest Warrior: Mutuharjo.
 */
export function AppFooter() {
  return (
    <footer className="mt-auto pt-10 pb-6">
      <div className="clay mx-auto max-w-5xl px-6 py-8 text-center">
        <p className="text-lg font-extrabold tracking-tight text-foreground">
          Database Quest Warrior: Mutuharjo
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Learn • Practice • Compete • Master
        </p>

        <div className="mx-auto mt-4 h-px w-40 bg-border" />

        <p className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-secondary-foreground">
          Made With{" "}
          <Heart className="size-4 fill-pink-400 text-pink-400" aria-hidden />
          By MrStepen ( Joko Endriyanto )
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          © 2026 Database Quest Warrior: Mutuharjo
        </p>
      </div>
    </footer>
  );
}
