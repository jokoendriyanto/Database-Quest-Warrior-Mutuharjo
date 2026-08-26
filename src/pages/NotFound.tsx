import { Link, useLocation } from "react-router";
import { ArrowLeft } from "lucide-react";
import { AppFooter } from "@/components/AppFooter";

/**
 * 404 ala error database — identitas produk dipakai sebagai UI,
 * bukan dekorasi. Path yang diketik user ditampilkan sebagai query gagal.
 */
export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* navbar minimal — sama seperti landing */}
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

      {/* konten: query gagal */}
      <main className="mx-auto grid w-full max-w-[1440px] flex-1 content-center px-4 py-16 sm:px-6">
        <div className="max-w-xl">
          <p className="kicker">Error 404 · halaman tidak ditemukan</p>

          <pre className="caret-blink mt-4 overflow-x-auto rounded-lg border border-border bg-card p-5 font-mono text-[13px] leading-7">
{`mysql> SELECT * FROM pages WHERE url = '${pathname}';
ERROR 404 (23000): Halaman tidak ditemukan
Empty set (0.00 sec)`}
          </pre>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
            Query-mu valid, tapi tabelnya kosong — alamat ini tidak ada di Database
            Quest. Cek lagi penulisannya atau lanjut dari tempat yang benar:
          </p>

          <ul className="mt-5 divide-y divide-border border-y border-border">
            {[
              { to: "/", label: "Beranda", desc: "Kembali ke halaman utama" },
              { to: "/learn", label: "Peta Belajar", desc: "Lanjutkan world terbukamu" },
              { to: "/dashboard", label: "Dashboard", desc: "Kalau kamu sudah login" },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="group flex items-center gap-3 py-2.5 transition-colors hover:bg-secondary/50"
                >
                  <span className="font-mono text-xs font-bold text-primary">
                    {"→"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{l.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {l.desc}
                    </span>
                  </span>
                  <ArrowLeft className="size-3.5 shrink-0 rotate-180 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
