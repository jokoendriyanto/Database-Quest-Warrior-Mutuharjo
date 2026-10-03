import { useState } from "react";
import { Link } from "react-router";
import { Heart } from "lucide-react";
import { LottieAnimation } from "@/components/ui/lottie-animation";

/**
 * Footer wajib — simple border-top, bukan giant footer.
 * Signature creator (PRD #149) tidak boleh hilang.
 */

/** Strip logo mitra (Powered by) — diletakkan di kanan baris copyright. */
const PARTNERS_LOGO =
  "https://smkmuh1-skh.sch.id/wp-content/uploads/2026/10/logo-all-JHIC.png";

const PARTNERS_TEXT =
  "Powered by: Jagoan Hosting · KOMDIGI · Gauda Spark · Ngalup.co";

export function AppFooter() {
  const [logoMissing, setLogoMissing] = useState(false);
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-8 sm:px-6 md:grid-cols-[2fr_1fr_1fr_1fr]">
        {/* brand */}
        <div>
          <Link
            to="/"
            className="group flex items-center gap-2.5"
            aria-label="Database Quest Warrior: Mutuharjo — beranda"
          >
            <img
              src="/logo.svg"
              alt="Logo Database Quest Warrior"
              width={36}
              height={36}
              className="size-9 shrink-0 rounded-md"
            />
            <span className="flex items-baseline gap-2">
              <span className="font-mono text-sm font-bold text-primary">dq:</span>
              <span className="text-sm font-extrabold tracking-tight">
                Database Quest Warrior<span className="text-muted-foreground">: Mutuharjo</span>
              </span>
              <span className="opacity-30 transition-opacity duration-300 group-hover:opacity-70">
                <LottieAnimation animation="sql-quest" size="sm" className="-mt-0.5" />
              </span>
            </span>
          </Link>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Platform belajar SQL dan database gratis untuk siswa SMK — materi
            interaktif, latihan query, sampai battle kompetitif.
          </p>
        </div>

        {/* links */}
        <nav aria-label="Tautan halaman publik" className="flex flex-col gap-1.5 text-sm">
          <p className="kicker mb-1">Belajar</p>
          <Link to="/materi" className="w-fit text-muted-foreground hover:text-foreground">Materi SQL untuk SMK</Link>
          <Link to="/latihan" className="w-fit text-muted-foreground hover:text-foreground">Latihan query SQL online</Link>
          <Link to="/studi-kasus" className="w-fit text-muted-foreground hover:text-foreground">Studi kasus database</Link>
          <Link to="/tentang" className="w-fit text-muted-foreground hover:text-foreground">Tentang Database Quest Warrior</Link>
        </nav>

        {/* app links (butuh login) */}
        <nav aria-label="Tautan aplikasi" className="flex flex-col gap-1.5 text-sm">
          <p className="kicker mb-1">Aplikasi</p>
          <Link to="/learn" className="w-fit text-muted-foreground hover:text-foreground">Learn</Link>
          <Link to="/battle" className="w-fit text-muted-foreground hover:text-foreground">Battle</Link>
          <Link to="/leaderboard" className="w-fit text-muted-foreground hover:text-foreground">Leaderboard</Link>
          <Link to="/hrd/register" className="w-fit text-muted-foreground hover:text-foreground">Portal HRD (Industri)</Link>
        </nav>

        {/* creator */}
        <div className="text-sm">
          <p className="kicker mb-1">Creator</p>
          <p className="flex items-center gap-1.5 font-semibold">
            Made With Love By
            <Heart className="size-3.5 fill-pink-400 text-pink-400" aria-hidden />
            MutuDev Team
          </p>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-[11px] text-muted-foreground">
            © 2026 Database Quest Warrior: Mutuharjo · SMK Muhammadiyah 1 Sukoharjo · PPLG
          </p>

          {/* Logo mitra di sebelah kanan copyright */}
          <div className="flex shrink-0 items-center gap-2">
            {logoMissing ? (
              <span className="font-mono text-[11px] text-muted-foreground">
                {PARTNERS_TEXT}
              </span>
            ) : (
              <>
                <span className="font-mono text-[11px] text-muted-foreground">
                  Powered by:
                </span>
                <img
                  src={PARTNERS_LOGO}
                  alt="Powered by Jagoan Hosting, KOMDIGI, Gauda Spark, dan Ngalup.co"
                  height={28}
                  className="h-7 w-auto object-contain opacity-90"
                  onError={() => setLogoMissing(true)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
