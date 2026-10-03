import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2, Plus, Users, Sparkles, ScrollText, BarChart3 } from "lucide-react";

/**
 * Overview — ringkasan talent pool dari data aktual:
 * kandidat tersedia, kandidat baru minggu ini, distribusi kompetensi,
 * dan ringkasan shortlist milik HRD ini.
 */
export default function HrdOverviewPage() {
  const overview = useQuery(api.hrd.overview);
  const company = useQuery(api.hrd.myCompany);

  if (overview === undefined) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Memuat ringkasan…
      </div>
    );
  }

  const maxCount = Math.max(1, ...overview.distribution.map((d: any) => d.count));

  return (
    <div className="space-y-8">
      <header>
        <p className="kicker">TALENT DASHBOARD</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Ringkasan Talenta
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {company
            ? `Profil kompetensi siswa SMK Muhammadiyah 1 Sukoharjo untuk ${company.name}.`
            : "Profil kompetensi siswa SMK Muhammadiyah 1 Sukoharjo."}
        </p>
      </header>

      {!company && (
        <div className="panel-raised flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-semibold">Perusahaan belum terdaftar</p>
            <p className="text-xs text-muted-foreground">
              Lengkapi Company Profile untuk mulai memakai shortlist.
            </p>
          </div>
          <Link to="/hrd/company" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            <Plus className="size-4" /> Daftarkan perusahaan
          </Link>
        </div>
      )}

      {/* Angka ringkas */}
      <section aria-labelledby="ov-angka">
        <h2 id="ov-angka" className="sr-only">Statistik ringkas</h2>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="panel p-5">
            <dt className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Users className="size-4" aria-hidden /> Kandidat tersedia
            </dt>
            <dd className="mt-2 text-3xl font-extrabold tracking-tight">
              {overview.availableCandidates}
            </dd>
          </div>
          <div className="panel p-5">
            <dt className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Sparkles className="size-4" aria-hidden /> Baru 7 hari
            </dt>
            <dd className="mt-2 text-3xl font-extrabold tracking-tight">
              {overview.newThisWeek}
            </dd>
          </div>
          <div className="panel p-5">
            <dt className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <ScrollText className="size-4" aria-hidden /> Shortlist saya
            </dt>
            <dd className="mt-2 text-3xl font-extrabold tracking-tight">
              {overview.shortlistTotal}
            </dd>
          </div>
          <div className="panel p-5">
            <dt className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <BarChart3 className="size-4" aria-hidden /> Status shortlist
            </dt>
            <dd className="mt-2 space-y-0.5 font-mono text-xs text-muted-foreground">
              <p>saved · {overview.shortlistByStatus.saved}</p>
              <p>reviewed · {overview.shortlistByStatus.reviewed}</p>
              <p>shortlisted · {overview.shortlistByStatus.shortlisted}</p>
              <p>contacted · {overview.shortlistByStatus.contacted}</p>
            </dd>
          </div>
        </dl>
      </section>

      {/* Distribusi kompetensi */}
      <section aria-labelledby="ov-dist" className="panel p-6">
        <h2 id="ov-dist" className="kicker mb-4">DISTRIBUSI KOMPETENSI</h2>
        {overview.distribution.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Belum ada kandidat dengan unit kompeten. Data muncul otomatis dari
            Skill Matrix siswa yang mengizinkan profilnya tampil.
          </p>
        ) : (
          <ul className="space-y-3">
            {overview.distribution.map((d: any) => (
              <li key={d.title} className="flex items-center gap-3">
                <span className="w-44 shrink-0 truncate text-sm font-medium">
                  {d.title}
                </span>
                <span className="inset-track h-2 flex-1">
                  <span
                    className="block h-full bg-primary transition-all"
                    style={{ width: `${Math.round((d.count / maxCount) * 100)}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {d.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link to="/hrd/candidates" className="text-sm font-semibold text-primary hover:underline">
          Cari kandidat →
        </Link>
        <Link to="/hrd/verify" className="text-sm font-semibold text-primary hover:underline">
          Verifikasi sertifikat →
        </Link>
      </div>
    </div>
  );
}
