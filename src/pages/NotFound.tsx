import { Link, useLocation } from "react-router";
import { ArrowLeft, Home, Map, LayoutDashboard, Search } from "lucide-react";
import { motion } from "framer-motion";
import { AppFooter } from "@/components/AppFooter";
import { LottieAnimation } from "@/components/ui/lottie-animation";

const NAV_LINKS = [
  { to: "/", label: "Beranda", desc: "Kembali ke halaman utama", icon: Home },
  { to: "/learn", label: "Peta Belajar", desc: "Lanjutkan world terbukamu", icon: Map },
  { to: "/dashboard", label: "Dashboard", desc: "Kalau kamu sudah login", icon: LayoutDashboard },
];

/**
 * 404 ala error database — identitas produk dipakai sebagai UI,
 * bukan dekorasi. Path yang diketik user ditampilkan sebagai query gagal.
 */
export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* navbar minimal */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-mono text-base font-bold text-primary">dq:</span>
            <span className="text-sm font-extrabold tracking-tight">
              Database Quest Warrior<span className="text-muted-foreground">: Mutuharjo</span>
            </span>
          </Link>
          <Link
            to="/learn"
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            peta belajar →
          </Link>
        </div>
      </header>

      {/* konten utama */}
      <main className="mx-auto grid w-full max-w-[1440px] flex-1 place-items-center px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-lg text-center"
        >
          {/* mascot */}
          <div className="relative mx-auto mb-8">
            <div className="mx-auto flex size-28 items-center justify-center rounded-2xl border border-border bg-card text-6xl shadow-lg">
              🤖
            </div>
            {/* floating query error tag */}
            <div className="absolute -right-2 -bottom-2 rounded-lg border border-border bg-card px-3 py-1.5 font-mono text-[10px] font-semibold tracking-wider text-destructive shadow-md">
              ERROR 404
            </div>
          </div>

          {/* heading */}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Query Tidak Ditemukan
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sepertinya kamu mengetik alamat yang salah — tapi tenang, kita bisa perbaiki.
          </p>

          {/* SQL query box */}
          <pre className="caret-blink mx-auto mt-6 max-w-md overflow-x-auto rounded-lg border border-border bg-card px-5 py-4 text-left font-mono text-[12px] leading-6 shadow-sm">
{`mysql> SELECT * FROM pages
    -> WHERE url = '${pathname}';
ERROR 404 (23000): Halaman tidak ditemukan
Empty set (0.00 sec)`}
          </pre>

          {/* navigation cards */}
          <div className="mt-8 grid gap-3 text-left">
            {NAV_LINKS.map(({ to, label, desc, icon: Icon }, i) => (
              <motion.div
                key={to}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15 * i }}
              >
                <Link
                  to={to}
                  className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{label}</span>
                    <span className="block text-xs text-muted-foreground">{desc}</span>
                  </div>
                  <ArrowLeft className="size-4 shrink-0 rotate-180 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* search hint */}
          <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Search className="size-3" />
            Mungkin yang kamu cari ada di menu{" "}
            <Link to="/learn" className="font-semibold text-primary hover:underline">
              Peta Belajar
            </Link>
          </p>
        </motion.div>
      </main>

      <AppFooter />
    </div>
  );
}
