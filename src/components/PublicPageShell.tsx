import type { ReactNode } from "react";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppFooter } from "@/components/AppFooter";
import { useSeo, usePageJsonLd } from "@/lib/seo";

export type Crumb = { name: string; path: string };

type PublicPageShellProps = {
  /** SEO title tanpa suffix situs. */
  title: string;
  /** Meta description 140–160 karakter. */
  description: string;
  /** Path canonical, mis. "/materi". */
  path: string;
  /** Breadcrumb JSON-LD + navigasi. */
  breadcrumbs: Crumb[];
  children: ReactNode;
};

/**
 * Shell untuk halaman publik (dapat diindeks): metadata SEO, breadcrumb
 * visual + JSON-LD, header, dan footer. Halaman privat TIDAK memakai shell ini.
 */
export function PublicPageShell({
  title,
  description,
  path,
  breadcrumbs,
  children,
}: PublicPageShellProps) {
  useSeo({ title, description, path });
  usePageJsonLd(title, description, path, breadcrumbs);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-baseline gap-2" aria-label="Database Quest Warrior: Mutuharjo — beranda">
            <span className="font-mono text-base font-bold text-primary">dq:</span>
            <span className="text-sm font-extrabold tracking-tight">
              Database Quest Warrior<span className="text-muted-foreground">: Mutuharjo</span>
            </span>
          </Link>
          <nav aria-label="Navigasi utama" className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex">
            <Link to="/materi" className="hover:text-foreground">Materi</Link>
            <Link to="/latihan" className="hover:text-foreground">Latihan</Link>
            <Link to="/studi-kasus" className="hover:text-foreground">Studi Kasus</Link>
            <Link to="/tentang" className="hover:text-foreground">Tentang</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="font-bold">
              <Link to="/auth?mode=login">Masuk</Link>
            </Button>
            <Button asChild size="sm" className="font-bold">
              <Link to="/auth?mode=register">Daftar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Breadcrumb visual (JSON-LD dipasang oleh usePageJsonLd) */}
        <nav aria-label="Breadcrumb" className="border-b border-border bg-secondary/40">
          <ol className="mx-auto flex max-w-[1440px] items-center gap-1.5 px-4 py-2.5 text-xs text-muted-foreground sm:px-6">
            {breadcrumbs.map((crumb, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <li key={crumb.path} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="size-3" aria-hidden />}
                  {last ? (
                    <span aria-current="page" className="font-semibold text-foreground">{crumb.name}</span>
                  ) : (
                    <Link to={crumb.path} className="hover:text-foreground">{crumb.name}</Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        {children}
      </main>

      <AppFooter />
    </div>
  );
}
