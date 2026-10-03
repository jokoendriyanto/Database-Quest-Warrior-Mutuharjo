import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicPageShell } from "@/components/PublicPageShell";

const DESCRIPTION =
  "Studi kasus database untuk siswa SMK: laporan omzet kantin, rekap nilai kelas, dan absensi — pecahkan dengan SQL seperti tugas developer sungguhan.";

const CASES = [
  {
    id: "kantin",
    label: "CASE 01 · NORMAL",
    title: "Laporan Omzet Kantin Sekolah",
    problem:
      "Bu Kantin merasa seblak paling laku, tapi feeling bukan data. Tugasmu membuktikan produk terlaris, omzet per hari, dan perbandingan antar kategori — pakai SQL.",
    skills: "WHERE · SUM · GROUP BY · ORDER BY",
    query: `SELECT product, SUM(total) AS omzet
FROM transactions
WHERE date BETWEEN '2026-09-01' AND '2026-09-30'
GROUP BY product
ORDER BY omzet DESC;`,
  },
  {
    id: "nilai",
    label: "CASE 02 · NORMAL",
    title: "Rekap Nilai per Kelas",
    problem:
      "Guru butuh rata-rata nilai per kelas dan daftar siswa yang harus remedial. Dua tabel berbeda: students dan scores — saatnya pakai JOIN.",
    skills: "INNER JOIN · AVG · HAVING",
    query: `SELECT c.name AS kelas, AVG(s.value) AS rata_rata
FROM students st
INNER JOIN classes c ON st.class_id = c.id
INNER JOIN scores s ON s.student_id = st.id
GROUP BY c.name
HAVING rata_rata < 75;`,
  },
  {
    id: "absensi",
    label: "CASE 03 · HARD",
    title: "Analisis Absensi Bulanan",
    problem:
      "Data absensi berantakan: siswa sama tercatat dua kali dan ada record tanpa kelas. Bersihkan duplikat, isi yang kosong, dan buat rekap ketidakhadiran.",
    skills: "DISTINCT · LEFT JOIN · UPDATE · IS NULL",
    query: `SELECT st.name, COUNT(a.id) AS bolos
FROM attendance a
LEFT JOIN students st ON st.id = a.student_id
WHERE a.status = 'absent'
GROUP BY st.name
ORDER BY bolos DESC;`,
  },
] as const;

export default function StudiKasusPage() {
  return (
    <PublicPageShell
      title="Studi Kasus Database — Praktik SQL dengan Data Sekolah"
      description={DESCRIPTION}
      path="/studi-kasus"
      breadcrumbs={[
        { name: "Beranda", path: "/" },
        { name: "Studi Kasus", path: "/studi-kasus" },
      ]}
    >
      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6">
          <p className="kicker">Studi kasus</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
            Latihan Database dari Kasus Nyata
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Materi belum selesai sampai bisa dipakai. Di sini kamu menyelesaikan masalah
            data yang memang terjadi di sekolah — laporan kantin, rekap nilai, absensi —
            dengan query SQL sungguhan yang divalidasi server.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="px-6 font-bold">
              <Link to="/auth?mode=register">
                Pecahkan Kasus Pertama <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="px-6 font-bold">
              <Link to="/materi">Pelajari Materinya Dulu</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* DAFTAR KASUS */}
      <section aria-labelledby="daftar-kasus" className="border-b border-border bg-secondary/50">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6">
          <h2 id="daftar-kasus" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Contoh studi kasus database di platform ini
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Tiga dari belasan case study yang tersedia. Setiap kasus punya tujuan jelas,
            database contoh, dan validasi otomatis.
          </p>
          <div className="mt-8 space-y-6">
            {CASES.map((c) => (
              <article key={c.id} className="panel-raised overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
                  <h3 className="font-mono text-sm font-bold tracking-widest text-muted-foreground">{c.label}</h3>
                  <h4 className="text-base font-extrabold sm:text-lg">{c.title}</h4>
                </div>
                <div className="grid gap-5 p-5 lg:grid-cols-2">
                  <div>
                    <p className="kicker">Masalahnya</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.problem}</p>
                    <p className="mt-4 kicker">Skill yang dipakai</p>
                    <p className="mt-1 font-mono text-xs text-foreground">{c.skills}</p>
                  </div>
                  <div>
                    <p className="kicker mb-2">Contoh query penyelesaian</p>
                    <pre className="overflow-x-auto rounded-md border border-border bg-muted/60 p-3 font-mono text-[11px] leading-5 text-foreground">
                      {c.query}
                    </pre>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section aria-labelledby="cta-kasus" className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6">
          <h2 id="cta-kasus" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Siap membuktikan dengan data?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Daftar gratis, kerjakan kasus di atas di playground, dan kumpulkan XP untuk
            naik rank — dari SQL Rookie sampai Database Grandmaster.
          </p>
          <div className="mt-6">
            <Button asChild className="font-bold">
              <Link to="/auth?mode=register">
                Mulai sekarang <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
