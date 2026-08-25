import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Swords,
  Bot,
  Trophy,
  Map as MapIcon,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppFooter } from "@/components/AppFooter";
import { WORLDS } from "@/lib/curriculum";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5 },
};

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      {/* dekorasi blob */}
      <div className="clay-blob -top-20 left-[-80px] size-72 bg-primary/30" />
      <div className="clay-blob right-[-60px] top-40 size-64 bg-accent/40" />
      <div className="clay-blob bottom-[40%] left-[10%] size-56 bg-secondary" />

      {/* NAVBAR */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="clay-sm grid size-11 place-items-center text-xl" aria-hidden>
            🗄️
          </span>
          <div className="leading-tight">
            <p className="text-sm font-extrabold tracking-tight">Database Quest</p>
            <p className="text-[11px] font-extrabold tracking-widest text-primary">WARRIOR</p>
          </div>
        </div>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Button asChild variant="ghost" className="rounded-2xl font-bold">
            <Link to="/auth?mode=login">Masuk</Link>
          </Button>
          <Button
            asChild
            className="clay-btn rounded-2xl bg-primary font-bold text-primary-foreground"
          >
            <Link to="/auth?mode=register">Daftar Gratis</Link>
          </Button>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-2 lg:pt-14">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-extrabold text-accent-foreground">
            <Sparkles className="size-3.5" /> Lanjutan petualangan Keyboard Warrior
          </span>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
            Belajar Database{" "}
            <span className="bg-gradient-to-r from-primary to-pink-400 bg-clip-text text-transparent">
              Nggak Harus Membosankan.
            </span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Di <strong>Database Quest Warrior: Mutuharjo</strong>, kamu menulis SQL beneran,
            memecahkan kasus nyata sekolah dan kantin, melawan bot, duel dengan teman,
            naik rank — dari SQL Rookie sampai Database Grandmaster.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="clay-btn rounded-2xl bg-primary px-6 text-base font-extrabold"
            >
              <Link to="/auth?mode=register">
                Mulai Belajar <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="rounded-2xl px-6 text-base font-extrabold">
              <a href="#cara-main">Lihat Cara Main</a>
            </Button>
          </div>
          <p className="mt-5 text-xs font-semibold text-muted-foreground">
            Untuk siswa PPLG/RPL usia 14–17 • Gratis • Cukup email & username
          </p>
        </motion.div>

        {/* Mock SQL playground */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="clay p-5"
        >
          <div className="flex gap-1.5 pb-3">
            <span className="size-3 rounded-full bg-red-300" />
            <span className="size-3 rounded-full bg-yellow-300" />
            <span className="size-3 rounded-full bg-green-300" />
          </div>
          <pre className="clay-inset overflow-x-auto rounded-2xl p-4 font-mono text-[13px] leading-relaxed text-foreground">
{`SELECT students.name, classes.name AS class_name
FROM students
INNER JOIN classes
  ON students.class_id = classes.id;`}
          </pre>
          <div className="mt-3 flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>✔ 12 baris ditemukan</span>
            <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">+100 XP 🔥</span>
          </div>
          <div className="clay-sm mt-4 flex items-center justify-around p-3 text-center">
            <div>
              <p className="text-xl font-black">⚔️</p>
              <p className="text-[11px] font-bold text-muted-foreground">SQL Warrior</p>
            </div>
            <div>
              <p className="text-xl font-black text-primary">Lv 12</p>
              <p className="text-[11px] font-bold text-muted-foreground">7.350 XP</p>
            </div>
            <div>
              <p className="text-xl font-black">🔥</p>
              <p className="text-[11px] font-bold text-muted-foreground">7 hari streak</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section id="cara-main" className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionTitle kicker="Cara Main" title="Belajar itu loop, bukan linear" />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: MapIcon,
              title: "1 • Jelajahi World",
              text: "15 world petualangan: dari 'Database Is Everywhere' sampai 'Database Developer'. Teori singkat 3–5 menit, langsung praktik.",
            },
            {
              icon: Bot,
              title: "2 • Praktik di Sandbox",
              text: "Tulis SQL beneran di sandbox aman dengan database kasus nyata: data sekolah, kantin, turnamen ML. Salah ketik? Error-nya malah mengajari.",
            },
            {
              icon: Swords,
              title: "3 • Battle & Rank Up",
              text: "Lawan bot, duel cepat, kejar XP dan rank. Kumpulin badge, jaga streak, buktiin kamu layak jadi Grandmaster.",
            },
          ].map((s) => (
            <motion.div key={s.title} {...fadeUp} className="clay p-6">
              <span className="clay-btn mb-4 inline-grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <s.icon className="size-6" />
              </span>
              <h3 className="text-lg font-extrabold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* WORLDS */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionTitle kicker="Peta Petualangan" title="15 World, satu tujuan: Developer Mindset" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {WORLDS.map((w) => (
            <motion.div key={w.num} {...fadeUp} className="clay-sm group p-4 transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="text-2xl" aria-hidden>{w.emoji}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  World {String(w.num).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-2 text-sm font-extrabold leading-snug">{w.title}</p>
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{w.subtitle}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* BATTLE */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionTitle kicker="Battle Arena" title="Belajar sendiri oke. Adu skill lebih seru." />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Bot,
              title: "VS Bot",
              desc: "Enam bot dari ByteBot si pemula sampai Grandmaster Bot mode nightmare. Latihan tanpa takut malu.",
              tag: "Tersedia sekarang",
              accent: true,
            },
            {
              icon: Swords,
              title: "Realtime 1v1",
              desc: "Duel SQL lawan teman sekelas dalam waktu nyata — sama-sama dapat soal setara, yang benar duluan menang.",
              tag: "Segera hadir",
            },
            {
              icon: Trophy,
              title: "SQL Tournament",
              desc: "Single elimination per kelas. Bracket live, check-in 5 menit sebelum match, gelar champion menantimu.",
              tag: "Segera hadir",
            },
          ].map((c) => (
            <motion.div key={c.title} {...fadeUp} className={`p-6 ${c.accent ? "clay-flat" : "clay"}`}>
              <div className="flex items-center justify-between">
                <c.icon className="size-8 text-primary" />
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                    c.accent ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {c.tag}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-extrabold">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CASE STUDIES */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionTitle kicker="Case Universe" title="Setiap database punya cerita" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { emoji: "🏫", title: "Sekolah", story: "Data TU berantakan, ada email salah & duplikat. Bantu beresin!" },
            { emoji: "🍜", title: "Kantin", story: "\"Seblak beneran paling laku, atau cuma perasaan saya?\" — Bu Kantin" },
            { emoji: "🎮", title: "Turnamen ML", story: "Top team, win rate, most used hero — semua ada di datanya." },
            { emoji: "🛒", title: "Online Shop", story: "Best seller, best customer, revenue bulanan. Analisis semua!" },
          ].map((c) => (
            <motion.div key={c.title} {...fadeUp} className="clay-sm p-5 text-center">
              <p className="text-4xl" aria-hidden>{c.emoji}</p>
              <h3 className="mt-2 font-extrabold">{c.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.story}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* TEACHER */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <motion.div {...fadeUp} className="clay flex flex-col items-start gap-5 p-8 md:flex-row md:items-center">
          <span className="clay-btn inline-grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <GraduationCap className="size-7" />
          </span>
          <div className="flex-1">
            <h3 className="text-xl font-extrabold">Panel Guru: data yang bikin ngajar lebih tepat sasaran</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Pantau progres & akurasi SQL tiap siswa, lihat skill matrix kelas, deteksi siswa at-risk,
              sampai tahu topik mana yang bikin kelas kamu keteteran — semuanya terhitung otomatis dari latihan sungguhan.
            </p>
          </div>
          <Button asChild variant="secondary" className="shrink-0 rounded-2xl font-bold">
            <Link to="/auth?mode=register">Masuk sebagai Guru</Link>
          </Button>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-20 pt-8 text-center sm:px-6">
        <motion.div {...fadeUp} className="clay-flat px-6 py-12">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Dari SQL Rookie ke Database Grandmaster.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            Perjalananmu dimulai dari satu query sederhana. Tenang, kita nggak bakal mulai
            dari query 20 baris. 😭
          </p>
          <Button
            asChild
            size="lg"
            className="clay-btn mt-7 rounded-2xl bg-primary px-8 text-base font-extrabold"
          >
            <Link to="/auth?mode=register">
              Mulai Sekarang — Gratis <ArrowRight className="size-4" />
            </Link>
          </Button>
        </motion.div>
      </section>

      <AppFooter />
    </div>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <motion.div {...fadeUp} className="mb-8 text-center">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{kicker}</p>
      <h2 className="mt-1.5 text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
    </motion.div>
  );
}
