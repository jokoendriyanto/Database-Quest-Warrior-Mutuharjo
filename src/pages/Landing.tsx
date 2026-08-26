import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Swords,
  Bot,
  Trophy,
  Check,
  TerminalSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppFooter } from "@/components/AppFooter";
import { WORLDS } from "@/lib/curriculum";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.35 },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* ------------------------------- NAVBAR ------------------------------ */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="font-mono text-base font-bold text-primary">dq:</span>
            <span className="text-sm font-extrabold tracking-tight">
              Database Quest<span className="text-muted-foreground">: Mutuharjo</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground md:flex">
            <a href="#belajar" className="hover:text-foreground">Belajar</a>
            <a href="#playground" className="hover:text-foreground">Playground</a>
            <a href="#arena" className="hover:text-foreground">Arena</a>
            <a href="#guru" className="hover:text-foreground">Guru</a>
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

      {/* -------------------------------- HERO ------------------------------- */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-motif absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-[1440px] gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[5fr_6fr] lg:items-center lg:py-20">
          {/* kiri */}
          <div>
            <p className="kicker">Platform belajar database · SMK PPLG</p>
            <h1 className="mt-4 text-4xl font-black uppercase leading-[1.05] tracking-tight sm:text-5xl">
              Database Quest<span className="text-muted-foreground">:</span>{" "}
              <span className="text-primary">Mutuharjo</span>
            </h1>
            <p className="mt-5 text-lg font-bold leading-snug">
              Belajar SQL.
              <br />
              Pecahkan kasus.
              <br />
              Adu skill.
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Bukan nonton video lalu lulus. Kamu menulis query beneran di playground,
              memecahkan kasus nyata sekolah dan kantin, lalu menguji skill di battle
              dan turnamen — dari SQL Rookie sampai Grandmaster.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="px-6 font-bold">
                <Link to="/auth?mode=register">
                  Mulai Belajar <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="px-6 font-bold">
                <Link to="/auth?returnTo=/battle">Lihat Arena</Link>
              </Button>
            </div>
            <p className="mt-5 font-mono text-xs text-muted-foreground">
              gratis · cukup email &amp; username · untuk usia 14–17
            </p>
          </div>

          {/* kanan: product UI beneran, bukan ilustrasi abstrak */}
          <motion.div {...fadeUp} className="panel-raised overflow-hidden">
            {/* editor bar */}
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="font-mono text-xs text-muted-foreground">challenge.sql</span>
              <span className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                ⌘↵ run
              </span>
            </div>
            <div className="grid sm:grid-cols-[150px_1fr]">
              {/* schema explorer */}
              <div className="hidden border-r border-border p-3 sm:block">
                <p className="kicker mb-2">Database</p>
                <ul className="space-y-1.5 font-mono text-xs">
                  {["students", "classes", "scores"].map((t) => (
                    <li key={t} className="text-foreground">
                      ▾ {t}
                      <ul className="ml-3 mt-0.5 space-y-0.5 text-muted-foreground">
                        <li># id</li>
                        <li>A name</li>
                        {t === "students" && <li>↗ class_id</li>}
                        {t === "scores" && <li>123 value</li>}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
              {/* editor + result */}
              <div>
                <pre className="caret-blink p-4 font-mono text-[13px] leading-6">
{`SELECT s.name, c.name AS class_name
FROM students s
INNER JOIN classes c
  ON s.class_id = c.id;`}
                </pre>
                <div className="border-t border-border">
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-success">
                      <Check className="size-3.5" /> SUCCESS
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">12 rows · 32 ms</span>
                  </div>
                  <table className="w-full border-t border-border font-mono text-xs">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="w-8 px-4 py-1.5 font-medium">#</th>
                        <th className="px-2 py-1.5 font-medium">name</th>
                        <th className="px-2 py-1.5 font-medium">class_name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[["Andi", "XI PPLG 1"], ["Siti", "XI PPLG 2"], ["Budi", "X PPLG 1"]].map(([n, k], i) => (
                        <tr key={n} className="border-b border-border/60 last:border-0">
                          <td className="px-4 py-1.5 text-muted-foreground">{i + 1}</td>
                          <td className="px-2 py-1.5">{n}</td>
                          <td className="px-2 py-1.5 text-muted-foreground">{k}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* XP toast — microinteraction identitas */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.25 }}
          className="absolute bottom-6 right-6 hidden rounded-md border border-border bg-card px-3 py-2 shadow-sm lg:block"
        >
          <p className="font-mono text-sm font-bold text-success">+100 XP</p>
          <p className="text-[11px] text-muted-foreground">INNER JOIN complete</p>
        </motion.div>
      </section>

      {/* ------------------------- LEARNING SYSTEM 01–04 --------------------- */}
      <section id="belajar" className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6">
          <motion.div {...fadeUp}>
            <p className="kicker">Sistem belajar</p>
            <h2 className="mt-2 max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
              Satu loop. Diulang sampai jadi kebiasaan.
            </h2>
          </motion.div>

          <ol className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
            {[
              {
                num: "01",
                title: "PAHAMI",
                body: "Primary Key itu kayak NIS — nggak boleh kembar. Teori singkat, analogi yang masuk akal, 3–8 menit.",
                sample: "SELECT * FROM students;",
              },
              {
                num: "02",
                title: "COBA",
                body: "Langsung praktik di playground. Query dijalankan sungguhan — error pun jadi bahan belajar.",
                sample: "CREATE TABLE scores (...);",
              },
              {
                num: "03",
                title: "PECAHKAN",
                body: "Kasus nyata: data TU berantakan, kantin butuh laporan omzet. Bereskan pakai SQL.",
                sample: "GROUP BY product_id;",
              },
              {
                num: "04",
                title: "BATTLE",
                body: "Uji skill lawan bot atau teman sekelas. Yang benar lebih dulu, menang.",
                sample: "rating 1284 → GOLD II",
              },
            ].map((s) => (
              <motion.li key={s.num} {...fadeUp} className="relative bg-card p-6">
                <span className="font-mono text-xs text-primary">{s.num}</span>
                <h3 className="mt-2 font-mono text-sm font-bold tracking-widest">{s.title}</h3>
                <p className="mt-2 min-h-16 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                <pre className="mt-3 rounded-md border border-border bg-muted/60 px-3 py-2 font-mono text-[11px] text-muted-foreground">
                  {s.sample}
                </pre>
              </motion.li>
            ))}
          </ol>

          {/* world rail — world numbering system sebagai identitas */}
          <div className="mt-12">
            <p className="kicker">15 world · dari nol sampai developer mindset</p>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {WORLDS.map((w) => (
                <div
                  key={w.num}
                  className="panel w-44 shrink-0 p-3 transition-colors hover:border-muted-foreground/40"
                >
                  <p className="font-mono text-[10px] text-muted-foreground">
                    WORLD {String(w.num).padStart(2, "0")}
                  </p>
                  <p className="mt-1 text-sm font-bold leading-snug">{w.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                    {w.subtitle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------- CASE STUDY ----------------------------- */}
      <section className="border-b border-border bg-secondary/50">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[5fr_6fr] lg:items-start">
          <motion.div {...fadeUp}>
            <p className="kicker">Case study</p>
            <div className="mt-3 flex items-baseline gap-3">
              <h2 className="font-mono text-sm font-bold tracking-widest text-muted-foreground">CASE 04</h2>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">KANTIN SEKOLAH</h2>
              <span className="rounded border border-warning/40 bg-warning/10 px-2 py-0.5 font-mono text-[10px] font-bold text-warning">
                NORMAL
              </span>
            </div>
            <p className="mt-2 font-mono text-xs text-muted-foreground">
              Skill: WHERE · SUM · GROUP BY
            </p>

            <blockquote className="mt-6 border-l-2 border-primary pl-4 text-sm leading-relaxed">
              Bu Kantin punya feeling kalau seblak paling laku.
              <br />
              Tapi feeling bukan data.
              <br />
              <strong>Tugasmu: buktikan pakai SQL.</strong>
            </blockquote>

            <p className="mt-6 kicker">Buat apa sih?</p>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
              JOIN dipakai saat data yang kita butuhkan tersebar di beberapa tabel.
              Setiap lesson di Database Quest selalu jawab pertanyaan ini duluan.
            </p>
          </motion.div>

          {/* mission tracker */}
          <motion.div {...fadeUp} className="panel-raised overflow-hidden">
            <div className="border-b border-border px-4 py-2.5">
              <p className="kicker">Objectives · 2 / 4 selesai</p>
            </div>
            <ul className="divide-y divide-border">
              {[
                { n: "01", t: "Cari total transaksi", done: true },
                { n: "02", t: "Hitung omzet per hari", done: true },
                { n: "03", t: "Temukan produk paling laku", done: false },
                { n: "04", t: "Bandingkan antar kategori", done: false },
              ].map((o) => (
                <li key={o.n} className="flex items-center gap-3 px-4 py-3">
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full border ${o.done ? "border-success bg-success/10 text-success" : "border-border text-muted-foreground"}`}>
                    {o.done ? <Check className="size-3.5" /> : <span className="font-mono text-[9px]">{o.n.slice(1)}</span>}
                  </span>
                  <span className={`text-sm ${o.done ? "text-muted-foreground line-through" : "font-medium"}`}>
                    {o.t}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2.5">
              <span className="font-mono text-xs text-muted-foreground">reward</span>
              <span className="font-mono text-sm font-bold text-success">+450 XP</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --------------------------- SQL PLAYGROUND -------------------------- */}
      <section id="playground" className="border-b border-border">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[6fr_5fr] lg:items-center">
          <motion.div {...fadeUp} className="order-2 panel-raised overflow-hidden lg:order-1">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="font-mono text-xs text-muted-foreground">latihan-05.sql</span>
              <TerminalSquare className="size-4 text-muted-foreground" />
            </div>
            <pre className="p-4 font-mono text-[13px] leading-6">
{`SELECT nam, class_id
FROM students
LIMIT 5;`}
            </pre>
            <div className="border-t border-border px-4 py-3">
              <p className="font-mono text-xs font-bold text-destructive">QUERY BELUM TEPAT</p>
              <p className="mt-1.5 text-sm text-foreground">
                Kolom <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">nam</code> tidak ditemukan.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Mungkin maksudmu{" "}
                <code className="rounded bg-success/10 px-1.5 py-0.5 font-mono text-xs font-bold text-success">name</code>?
              </p>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">ERROR 1054 · Line 1</p>
            </div>
          </motion.div>

          <motion.div {...fadeUp} className="order-1 lg:order-2">
            <p className="kicker">SQL Playground</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Error itu bukan hukuman. Itu petunjuk.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Editor dengan shortcut ⌘↵, schema explorer, riwayat query, dan hasil
              bergaya database client. Salah ketik kolom? Playground bilang mungkin
              maksudmu apa — bukan cuma merah-merah.
            </p>
            <ul className="mt-5 space-y-1.5 font-mono text-xs text-muted-foreground">
              <li><span className="mr-2 text-primary">⌘↵</span>Jalankan query</li>
              <li><span className="mr-2 text-primary">#↗A</span>Indikator PK / FK / teks di explorer</li>
              <li><span className="mr-2 text-primary">21:14</span>Riwayat query tiap eksekusi</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------- BATTLE ------------------------------ */}
      <section id="arena" className="border-b border-border bg-secondary/50">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[5fr_6fr] lg:items-center">
          <motion.div {...fadeUp}>
            <p className="kicker">Battle arena</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Latihan bikin jago. Arena bikin terbukti.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Quick match ranked melawan pemain setara rating, latihan VS Bot tanpa
              takut turun rating, duel privat sama teman, dan turnamen eliminasi tiap
              musim.
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="panel-raised overflow-hidden">
            <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr]">
              <div>
                <p className="kicker">Battle rating</p>
                <p className="mt-1 font-mono text-3xl font-bold tracking-tight">1,284</p>
                <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs font-bold text-battle">
                  <Trophy className="size-3.5" /> GOLD II
                </p>
                <Button size="lg" className="mt-4 w-full font-bold">
                  <Swords className="size-4" /> Quick Match
                </Button>
              </div>
              <div className="divide-y divide-border border-t border-border sm:border-l sm:border-t-0">
                {[
                  { icon: Bot, t: "VS BOT", d: "Practice before ranked" },
                  { icon: Swords, t: "PRIVATE DUEL", d: "Challenge a friend" },
                  { icon: Trophy, t: "TOURNAMENT", d: "Next: SQL Cup #3" },
                ].map((r) => (
                  <div key={r.t} className="flex items-center gap-3 px-4 py-3.5 first:border-t-0 sm:first:border-l-0">
                    <r.icon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-mono text-xs font-bold tracking-widest">{r.t}</p>
                      <p className="text-xs text-muted-foreground">{r.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* scoreboard strip */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-border bg-muted/40 px-6 py-3">
              <div>
                <p className="font-mono text-xs text-muted-foreground">ANDI · 1284</p>
                <div className="inset-track mt-1"><div className="h-full w-2/3 rounded-full bg-primary" /></div>
              </div>
              <p className="font-mono text-xs font-bold text-muted-foreground">2 : 1</p>
              <div className="text-right">
                <p className="font-mono text-xs text-muted-foreground">BUDI · 1301</p>
                <div className="inset-track mt-1"><div className="ml-auto h-full w-1/3 rounded-full bg-battle" /></div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ----------------------------- TOURNAMENT ---------------------------- */}
      <section id="turnamen" className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <motion.div {...fadeUp}>
              <p className="kicker">Turnamen</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                SQL Championship #01
              </h2>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                16 players · single elimination · JOIN · GROUP BY · SUBQUERY · Sabtu 09:00
              </p>
            </motion.div>
            <Button asChild variant="secondary" className="font-bold">
              <Link to="/auth?returnTo=/battle">Lihat Arena</Link>
            </Button>
          </div>

          {/* bracket mini */}
          <motion.div {...fadeUp} className="mt-8 overflow-x-auto pb-2">
            <div className="flex min-w-[720px] gap-8">
              {[
                {
                  round: "ROUND OF 16",
                  matches: [
                    ["Andi", "Rina"], ["Budi", "Tono"],
                    ["Citra", "Dewi"], ["Eka", "Fajar"],
                  ],
                },
                {
                  round: "QUARTER",
                  matches: [["Andi", "Budi"], ["Citra", "—"]],
                },
                { round: "SEMI", matches: [["Andi", "—"]] },
              ].map((col) => (
                <div key={col.round} className="flex-1">
                  <p className="mb-3 font-mono text-[10px] font-bold tracking-widest text-muted-foreground">
                    {col.round}
                  </p>
                  <div className="space-y-3">
                    {col.matches.map(([a, b], i) => (
                      <div key={i} className="panel divide-y divide-border">
                        {[a, b].map((p, j) => (
                          <div key={j} className="flex items-center justify-between px-3 py-2">
                            <span className={`font-mono text-xs ${p === "—" ? "text-muted-foreground" : "font-semibold"}`}>{p}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {p === "—" ? "" : j === 0 ? "W" : "L"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex-1">
                <p className="mb-3 font-mono text-[10px] font-bold tracking-widest text-muted-foreground">FINAL</p>
                <div className="panel grid place-items-center border-dashed py-8">
                  <Trophy className="size-5 text-muted-foreground" />
                  <p className="mt-2 font-mono text-xs text-muted-foreground">champion?</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* -------------------------------- GURU ------------------------------- */}
      <section id="guru" className="border-b border-border bg-secondary/50">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[5fr_6fr] lg:items-center">
          <motion.div {...fadeUp}>
            <p className="kicker">Untuk guru</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Data yang bikin ngajar tepat sasaran.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Progres tiap siswa, skill matrix kelas, dan insight otomatis dari
              latihan sungguhan — bukan dari feeling. Tahu siapa yang tertinggal
              sebelum ujian, bukan sesudahnya.
            </p>
            <div className="mt-5 rounded-md border border-warning/30 bg-warning/10 p-3">
              <p className="font-mono text-[10px] font-bold tracking-widest text-warning">PERLU PERHATIAN</p>
              <p className="mt-1 text-sm">14 siswa masih memiliki mastery JOIN &lt; 60%.</p>
            </div>
            <Button asChild className="mt-5 font-bold">
              <Link to="/auth?mode=register">Masuk sebagai Guru</Link>
            </Button>
          </motion.div>

          <motion.div {...fadeUp} className="panel-raised overflow-hidden">
            <div className="border-b border-border px-4 py-2.5">
              <p className="kicker">XI PPLG 1 · Skill matrix · rata-rata kelas 72%</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Student</th>
                    <th className="px-3 py-2 text-right font-medium">SELECT</th>
                    <th className="px-3 py-2 text-right font-medium">CRUD</th>
                    <th className="px-3 py-2 text-right font-medium">JOIN</th>
                    <th className="px-4 py-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-mono text-xs">
                  {[
                    ["Andi", 92, 87, 78, "Excellent", true],
                    ["Siti", 88, 82, 65, "On Track", true],
                    ["Budi", 75, 66, 42, "Needs Review", false],
                  ].map(([n, a, b, c, st, ok]) => (
                    <tr key={n as string}>
                      <td className="px-4 py-2.5 font-sans font-semibold">{n}</td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground">{a}%</td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground">{b}%</td>
                      <td className={`px-3 py-2.5 text-right ${(c as number) < 60 ? "font-bold text-destructive" : "text-muted-foreground"}`}>
                        {c}%
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className={ok ? "text-success" : "text-warning"}>{st}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------ FINAL CTA ---------------------------- */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6">
          <motion.div {...fadeUp} className="max-w-2xl">
            <pre className="caret-blink font-mono text-sm text-muted-foreground">
{`-- satu query sederhana cukup untuk mulai`}
            </pre>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Dari SQL Rookie ke Database Grandmaster.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Gratis, cukup email &amp; username. Lesson pertama cuma 5 menit.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="px-6 font-bold">
                <Link to="/auth?mode=register">
                  Mulai Belajar <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="px-6 font-bold">
                <Link to="/auth?mode=login">Aku sudah punya akun</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
