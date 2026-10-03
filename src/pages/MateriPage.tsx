import { Link } from "react-router";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicPageShell } from "@/components/PublicPageShell";

const DESCRIPTION =
  "Materi SQL dan database untuk siswa SMK: dari SELECT, WHERE, JOIN, sampai GROUP BY — dijelaskan dengan analogi mudah dipahami dan langsung dipraktikkan.";

/** Topik inti kurikulum — diambil dari 15 world Database Quest Warrior. */
const TOPICS = [
  {
    name: "Pengenalan Database",
    slug: "pengenalan-database",
    desc: "Apa itu database, DBMS, dan kenapa MySQL jadi standar industri. Database itu ada di mana-mana: absensi sekolah, kantin, sampai aplikasi chat.",
    cmd: "SHOW DATABASES;",
  },
  {
    name: "SELECT — Query Pertama",
    slug: "select",
    desc: "Mengambil data dari tabel: SELECT * untuk semua kolom, atau pilih kolom tertentu. Query pertama yang wajib dikuasai setiap siswa.",
    cmd: "SELECT name, class FROM students;",
  },
  {
    name: "WHERE — Filter Data",
    slug: "where",
    desc: "Menyaring baris dengan kondisi: =, LIKE, IN, BETWEEN, IS NULL. Cari siswa dari kelas tertentu atau nilai di atas rata-rata.",
    cmd: "SELECT * FROM scores WHERE value > 80;",
  },
  {
    name: "ORDER BY & LIMIT",
    slug: "order-by",
    desc: "Mengurutkan hasil (ASC/DESC) dan membatasi jumlah baris. Dasar dari leaderboard: siapa nilainya tertinggi?",
    cmd: "SELECT * FROM scores ORDER BY value DESC LIMIT 5;",
  },
  {
    name: "INSERT, UPDATE, DELETE",
    slug: "crud",
    desc: "Menambah, mengubah, dan menghapus data. CRUD adalah pekerjaan harian developer backend — bukan sekadar teori.",
    cmd: "INSERT INTO students (name) VALUES ('Andi');",
  },
  {
    name: "JOIN — Gabung Tabel",
    slug: "join",
    desc: "Menggabungkan data dari beberapa tabel dengan INNER JOIN dan LEFT JOIN. Skill yang paling sering ditanyakan saat praktik kerja.",
    cmd: "SELECT s.name, c.name FROM students s INNER JOIN classes c ON s.class_id = c.id;",
  },
  {
    name: "GROUP BY & HAVING",
    slug: "group-by",
    desc: "Agregasi: COUNT, SUM, AVG, MIN, MAX. Laporan omzet kantin per hari atau rata-rata nilai per kelas dibuat dengan ini.",
    cmd: "SELECT class, AVG(value) FROM scores GROUP BY class;",
  },
  {
    name: "Subquery & Normalisasi",
    slug: "subquery",
    desc: "Query di dalam query, desain skema yang benar, 1NF–3NF, index, sampai keamanan dari SQL injection.",
    cmd: "SELECT name FROM students WHERE class_id IN (SELECT id FROM classes);",
  },
] as const;

export default function MateriPage() {
  return (
    <PublicPageShell
      title="Materi SQL & Database untuk SMK — dari SELECT sampai JOIN"
      description={DESCRIPTION}
      path="/materi"
      breadcrumbs={[
        { name: "Beranda", path: "/" },
        { name: "Materi", path: "/materi" },
      ]}
    >
      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6">
          <p className="kicker">Materi pembelajaran</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
            Materi SQL &amp; Database untuk Siswa SMK
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Kurikulum Database Quest Warrior disusun mengikuti alur belajar SQL dari nol:
            mulai dari mengenal apa itu database, menulis query pertama, sampai merancang
            skema yang benar. Setiap topik di bawah ini dipelajari lewat lesson singkat,
            langsung dipraktikkan di playground, lalu diuji lewat studi kasus nyata.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="px-6 font-bold">
              <Link to="/auth?mode=register">
                Mulai Belajar SQL <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="px-6 font-bold">
              <Link to="/latihan">Latihan Query SQL</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* DAFTAR MATERI */}
      <section aria-labelledby="daftar-materi" className="border-b border-border bg-secondary/50">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6">
          <h2 id="daftar-materi" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Belajar SQL dasar sampai lanjutan, urut dari sini
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Delapan kelompok materi ini mencakup seluruh kurikulum basis data SMK PPLG —
            dari SQL untuk pemula sampai optimasi dan keamanan.
          </p>
          <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
            {TOPICS.map((t) => (
              <article key={t.slug} className="bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-bold">
                    <BookOpen className="mr-2 inline size-4 text-primary" aria-hidden />
                    {t.name}
                  </h3>
                  <pre className="hidden rounded-md border border-border bg-muted/60 px-2.5 py-1 font-mono text-[10px] text-muted-foreground sm:block">
                    {t.cmd}
                  </pre>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CARA BELAJAR */}
      <section aria-labelledby="cara-belajar" className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6">
          <h2 id="cara-belajar" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Materi database interaktif, bukan PDF untuk dibaca doang
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <article className="panel p-5">
              <h3 className="font-mono text-sm font-bold tracking-widest text-primary">PAHAMI</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Setiap konsep dijelaskan dengan analogi sekolah: Primary Key itu seperti NIS
                yang tidak boleh kembar, Foreign Key seperti nomor kelas di kartu pelajar.
              </p>
            </article>
            <article className="panel p-5">
              <h3 className="font-mono text-sm font-bold tracking-widest text-primary">PRAKTIK</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Langsung tulis query di SQL playground sungguhan — query dijalankan beneran,
                error tampil dengan petunjuk perbaikan, bukan cuma pesan merah.
              </p>
            </article>
            <article className="panel p-5">
              <h3 className="font-mono text-sm font-bold tracking-widest text-primary">PECAHKAN</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Tutup tiap topik dengan studi kasus: laporan omzet kantin, rekap absensi,
                peringkat kelas — data yang memang dipakai di sekolah.
              </p>
            </article>
          </div>
          <div className="mt-8">
            <Button asChild className="font-bold">
              <Link to="/latihan">
                Lanjut ke latihan query SQL <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
