import { Link } from "react-router";
import { Heart } from "lucide-react";

/**
 * Footer wajib — simple border-top, bukan giant footer.
 * Signature creator (PRD #149) tidak boleh hilang.
 */
export function AppFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-8 sm:px-6 md:grid-cols-[2fr_1fr_1fr]">
        {/* brand */}
        <div>
          <p className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-bold text-primary">dq:</span>
            <span className="text-sm font-extrabold tracking-tight">
              Database Quest<span className="text-muted-foreground">: Mutuharjo</span>
            </span>
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Learn Database. Solve Problems. Compete. Master.
          </p>
        </div>

        {/* links */}
        <nav aria-label="Footer" className="flex flex-col gap-1.5 text-sm">
          <p className="kicker mb-1">Links</p>
          <Link to="/learn" className="w-fit text-muted-foreground hover:text-foreground">Learn</Link>
          <Link to="/battle" className="w-fit text-muted-foreground hover:text-foreground">Battle</Link>
          <Link to="/leaderboard" className="w-fit text-muted-foreground hover:text-foreground">Leaderboard</Link>
        </nav>

        {/* creator */}
        <div className="text-sm">
          <p className="kicker mb-1">Creator</p>
          <p className="flex items-center gap-1.5 font-semibold">
            Made With Love By
            <Heart className="size-3.5 fill-pink-400 text-pink-400" aria-hidden />
            MrStepen ( Joko Endriyanto )
          </p>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto max-w-[1440px] px-4 py-3 sm:px-6">
          <p className="font-mono text-[11px] text-muted-foreground">
            © 2026 Database Quest: Mutuharjo · SMK Muhammadiyah 1 Sukoharjo · PPLG
          </p>
        </div>
      </div>
    </footer>
  );
}
