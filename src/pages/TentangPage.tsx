import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicPageShell } from "@/components/PublicPageShell";
import { WORLDS } from "@/lib/curriculum";

const DESCRIPTION =
  "Database Quest Warrior adalah platform belajar SQL dan database gratis untuk siswa SMK — dibuat oleh guru PPLG SMK Muhammadiyah 1 Sukoharjo.";

export default function TentangPage() {
  return (
    <PublicPageShell
      title="Tentang Database Quest Warrior — Platform Belajar SQL untuk SMK"
      description={DESCRIPTION}
      path="/tentang"
      breadcrumbs={[
        { name: "Beranda", path: "/" },
        { name: "Tentang", path: "/tentang" },
      ]}
    >
      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6">
          <p className="kicker">Tentang platform</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black uppercase leading-tight tracking-tight sm:text-4xl">
            Belajar Database dengan Cara yang Lebih Seru
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Database Quest Warrior: Mutuharjo adalah platform pembelajaran database dan SQL
            gratis untuk siswa SMK, dibuat oleh MrStepen (Joko Endriyanto), guru PPLG di
            SMK Muhammadiyah 1 Sukoharjo. Misi kami sederhana: belajar SQL itu bukan
            menghafal sintaks — tapi memecahkan masalah data sungguhan.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg" className="px-6 font-bold">
              <Link to="/auth?mode=register">
                Mulai Belajar <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="px-6 font-bold">
              <Link to="/materi">Lihat Materi SQL</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* APA YANG DIPELAJARI */}
      <section aria-labelledby="yang-dipelajari" className="border-b border-border bg-secondary/50">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6">
          <h2 id="yang-dipelajari" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Apa yang dipelajari siswa di sini
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Siswa menulis query SQL beneran di playground, memecahkan kasus nyata sekolah
            dan kantin, lalu menguji skill di battle dan turnamen. 15 world mencakup:
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {WORLDS.map((w) => (
              <li
                key={w.num}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold"
              >
                {w.title}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Semua materi dapat diakses setelah mendaftar gratis dengan email dan username —
            tanpa biaya, tanpa syarat tersembunyi. Platform ini dipakai di kelas PPLG untuk
            latihan harian, tugas, hingga turnamen antar kelas.
          </p>
        </div>
      </section>

      {/* UNTUK SIAPA */}
      <section aria-labelledby="untuk-siapa" className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 py-14 sm:px-6">
          <h2 id="untuk-siapa" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Untuk siapa platform ini
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <article className="panel p-6">
              <h3 className="text-base font-bold">Siswa SMK (14–17 tahun)</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pelajar PPLG/RPL/Teknik Informatika yang ingin belajar SQL dari nol atau
                mengasah skill lewat latihan query dan battle kompetitif. Cocok juga untuk
                persiapan praktik kerja lapangan.
              </p>
            </article>
            <article className="panel p-6">
              <h3 className="text-base font-bold">Guru produktif</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Guru yang butuh data latihan sungguhan: progres tiap siswa, skill matrix
                kelas, tugas otomatis, dan turnamen — tanpa mengoreksi manual.
              </p>
            </article>
          </div>
          <div className="mt-8">
            <Button asChild className="font-bold">
              <Link to="/latihan">
                Coba latihan SQL-nya <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
