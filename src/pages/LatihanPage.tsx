import { Link } from "react-router";
import { ArrowRight, TerminalSquare, Swords, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicPageShell } from "@/components/PublicPageShell";

const DESCRIPTION =
  "Latihan SQL online gratis: tulis query di playground beneran, kerjakan latihan database bertingkat, dan uji skill lewat battle melawan bot atau teman sekelas.";

const FEATURES = [
  {
    icon: TerminalSquare,
    title: "SQL Playground Online",
    desc: "Editor query dengan shortcut ⌘↵, schema explorer, dan riwayat eksekusi. Hasil tampil seperti database client sungguhan — tabel, baris, dan pesan error yang jujur.",
    sample: "SELECT * FROM students LIMIT 5;",
  },
  {
    icon: ListChecks,
    title: "Latihan Database Bertingkat",
    desc: "30+ latihan dari Easy sampai Boss, memakai database sekolah dan kantin. Setiap jawaban divalidasi server — bukan cuma dicek mirip.",
    sample: "WHERE nilai >= 75 AND kelas = 'XI PPLG 1'",
  },
  {
    icon: Swords,
    title: "Battle & Turnamen SQL",
    desc: "Lawan bot dari ByteBot sampai Grandmaster, duel privat sama teman, atau turnamen eliminasi tiap musim. Yang query-nya benar lebih dulu, menang.",
    sample: "rating 1284 → GOLD II",
  },
] as const;

const LEVELS = [
  { tier: "Pemula", what: "SELECT, WHERE, ORDER BY — ambil dan saring data" },
  { tier: "Menengah", what: "INSERT, UPDATE, DELETE, JOIN antar tabel" },
  { tier: "Mahir", what: "GROUP BY, HAVING, subquery, agregasi laporan" },
  { tier: "Boss", what: "Studi kasus multi-tabel dengan batas waktu" },
] as const;

export default function LatihanPage() {
  return (
    <PublicPageShell
      title="Latihan SQL Online Gratis — Playground & Latihan Query"
      description={DESCRIPTION}
      path="/latihan"
      breadcrumbs={[
        { name: "Beranda", path: "/" },
        { name: "Latihan", path: "/latihan" },
      ]}
    >
      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6">
          <p className="kicker">Latihan &amp; battle</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
            Latihan Query SQL Online, Langsung Jalan
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Nggak perlu install XAMPP atau setup database dulu. Buka browser, tulis query,
            lihat hasilnya. Semua latihan dijalankan di SQL engine yang sama dengan yang
            memvalidasi jawaban siswa di kelas.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="px-6 font-bold">
              <Link to="/auth?mode=register">
                Mulai Latihan <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="px-6 font-bold">
              <Link to="/materi">Pelajari Materi SQL Dulu</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FITUR */}
      <section aria-labelledby="fitur-latihan" className="border-b border-border bg-secondary/50">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6">
          <h2 id="fitur-latihan" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Tiga cara latihan database online di sini
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className="panel p-6">
                <f.icon className="size-6 text-primary" aria-hidden />
                <h3 className="mt-3 text-base font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                <pre className="mt-3 rounded-md border border-border bg-muted/60 px-3 py-2 font-mono text-[11px] text-muted-foreground">
                  {f.sample}
                </pre>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* TINGKAT */}
      <section aria-labelledby="tingkat-latihan" className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6">
          <h2 id="tingkat-latihan" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Dari SQL untuk pemula sampai tantangan boss
          </h2>
          <ol className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
            {LEVELS.map((l, i) => (
              <li key={l.tier} className="bg-card p-6">
                <p className="font-mono text-xs text-primary">0{i + 1}</p>
                <h3 className="mt-1 font-mono text-sm font-bold tracking-widest">{l.tier.toUpperCase()}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{l.what}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <Button asChild className="font-bold">
              <Link to="/auth?mode=register">
                Coba latihan pertama <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
