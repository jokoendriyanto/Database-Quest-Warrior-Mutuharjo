import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Flame,
  Play,
  Trophy,
  Target,
  Sparkles,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { levelProgress, rankFromLevel, badgeById } from "@/lib/game";
import {
  WORLDS,
  LESSON_ORDER,
  LESSON_MAP,
} from "@/lib/curriculum";
import { motion } from "framer-motion";

export default function Dashboard() {
  const data = useQuery(api.game.dashboard);
  const leaderboard = useQuery(api.game.leaderboard);

  if (!data) {
    return (
      <div className="grid gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="clay-sm h-28 animate-pulse bg-muted/60" />
        ))}
      </div>
    );
  }

  const { level, current, needed } = levelProgress(data.stats.xp);
  const rank = rankFromLevel(level);
  const pct = Math.min(100, Math.round((current / needed) * 100));
  const completed = new Set(data.completedLessons);

  // rekomendasi: lesson pertama yang belum selesai dalam urutan global
  const nextRef = LESSON_ORDER.find((r) => !completed.has(r.lessonId));
  const nextLesson = nextRef ? LESSON_MAP.get(nextRef.lessonId) : undefined;

  const accuracy =
    data.stats.exercisesDone > 0
      ? Math.round((data.stats.exercisesCorrect / data.stats.exercisesDone) * 100)
      : null;

  const activeToday = data.stats.lastActiveDate === new Date().toISOString().slice(0, 10);
  const missions = [
    {
      label: "Selesaikan 3 latihan SQL",
      progress: Math.min(data.stats.todayExercises, 3),
      target: 3,
      xp: "+30 XP bonus hati 😄",
      done: data.stats.todayExercises >= 3,
    },
    {
      label: "Tetap konsisten — main hari ini",
      progress: activeToday ? 1 : 0,
      target: 1,
      xp: "Streak aman 🔥",
      done: activeToday,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="clay-flat p-6"
      >
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-16 place-items-center rounded-3xl bg-background/70 text-4xl shadow-inner" aria-hidden>
            {data.user.avatarEmoji}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              Welcome back, {data.user.name.split(" ")[0]} 👋
            </h1>
            <p className="mt-0.5 text-sm font-bold text-muted-foreground">
              {rank.emoji} {rank.name} · Level {level}
              {data.user.className && ` · ${data.user.className}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold ${activeToday ? "bg-orange-400/90 text-white" : "bg-muted text-muted-foreground"}`}>
              <Flame className="size-3.5" /> {data.stats.streak} hari
            </span>
            <Link
              to="/leaderboard"
              className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-extrabold text-primary"
            >
              <Trophy className="size-3.5" /> #{data.leaderboardPosition || "-"}
            </Link>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-xs font-bold text-muted-foreground">
            <span>{current.toLocaleString()} / {needed.toLocaleString()} XP</span>
            <span>Menuju Level {level + 1}</span>
          </div>
          <div className="clay-inset mt-1.5 h-4 overflow-hidden rounded-full p-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-pink-400"
            />
          </div>
        </div>
      </motion.section>

      {/* CONTINUE LEARNING */}
      <section className="grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="clay p-6">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Lanjutkan Petualangan
          </p>
          {nextLesson && nextRef ? (
            <>
              <h2 className="mt-2 flex items-center gap-2 text-lg font-extrabold leading-snug">
                <BookOpen className="size-5 shrink-0 text-primary" />
                {nextLesson.lesson.title}
              </h2>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">
                World {String(nextRef.worldNum).padStart(2, "0")} ·{" "}
                {WORLDS.find((w) => w.num === nextRef.worldNum)?.title} · ±{nextLesson.lesson.minutes} menit
              </p>
              <Button asChild className="clay-btn mt-4 rounded-2xl bg-primary font-extrabold">
                <Link to={`/lesson/${nextRef.lessonId}`}>
                  <Play className="size-4" /> Lanjut Belajar
                </Link>
              </Button>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-lg font-extrabold">Kamu sudah tamat semua world yang tersedia! 🎉</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ulangi latihan favoritmu atau coba battle lawan bot buat jaga skill.
              </p>
              <Button asChild className="clay-btn mt-4 rounded-2xl bg-primary font-extrabold">
                <Link to="/battle"><Play className="size-4" /> Ke Battle Arena</Link>
              </Button>
            </>
          )}
        </div>

        {/* MISSIONS */}
        <div className="clay p-5">
          <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground">
            <Target className="size-4" /> Misi Harian
          </p>
          <ul className="mt-3 space-y-3">
            {missions.map((m) => (
              <li key={m.label}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-xs font-bold leading-snug">{m.label}</p>
                  <span className="shrink-0 text-[10px] font-black text-primary">{m.xp}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="clay-inset h-2.5 flex-1 overflow-hidden rounded-full p-0.5">
                    <div
                      className={`h-full rounded-full ${m.done ? "bg-accent" : "bg-primary/70"}`}
                      style={{ width: `${(m.progress / m.target) * 100}%` }}
                    />
                  </div>
                  <span className="w-7 text-right text-[10px] font-black text-muted-foreground">
                    {m.done ? "✓" : `${m.progress}/${m.target}`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* WORLD PROGRESS */}
      <section className="clay p-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Progres World</p>
          <Link to="/learn" className="flex items-center gap-1 text-xs font-extrabold text-primary hover:underline">
            Lihat Peta <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WORLDS.filter((w) => w.lessons.length > 0).map((w) => {
            const total = w.lessons.length;
            const done = w.lessons.filter((l) => completed.has(l.id)).length;
            return (
              <div key={w.num} className="rounded-2xl bg-muted/50 p-3.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="truncate">{w.emoji} {w.title}</span>
                  <span className="ml-2 shrink-0 text-muted-foreground">{done}/{total}</span>
                </div>
                <div className="clay-inset mt-2 h-2.5 overflow-hidden rounded-full p-0.5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${total ? (done / total) * 100 : 0}%`,
                      backgroundColor: w.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM GRID */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Leaderboard peek */}
        <div className="clay p-5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground">
              <Trophy className="size-4" /> Papan Peringkat
            </p>
            <Link to="/leaderboard" className="text-xs font-extrabold text-primary hover:underline">
              Semua →
            </Link>
          </div>
          <ol className="mt-3 space-y-2">
            {(leaderboard ?? []).slice(0, 3).map((e, i) => (
              <li key={e.username} className="flex items-center gap-3 rounded-2xl bg-muted/50 px-3 py-2">
                <span className="w-5 text-center text-sm font-black text-primary">{["🥇", "🥈", "🥉"][i]}</span>
                <span className="text-lg" aria-hidden>{e.avatarEmoji}</span>
                <span className="min-w-0 flex-1 truncate text-xs font-bold">{e.name}</span>
                <span className="text-[11px] font-black text-muted-foreground">{e.xp.toLocaleString()} XP</span>
              </li>
            ))}
            {leaderboard && leaderboard.length === 0 && (
              <li className="rounded-2xl bg-muted/50 px-3 py-4 text-center text-xs text-muted-foreground">
                Belum ada ranking nih. Saatnya jadi nama pertama di sini 👀
              </li>
            )}
          </ol>
        </div>

        {/* Stats + badges */}
        <div className="clay p-5">
          <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground">
            <Sparkles className="size-4" /> Statistik Kilat
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { v: data.stats.queriesRun, l: "Query dijalankan" },
              { v: accuracy == null ? "-" : `${accuracy}%`, l: "Akurasi SQL" },
              { v: `${data.stats.botWins}/${data.stats.botWins + data.stats.botLosses}`, l: "Battle menang" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-muted/50 p-3">
                <p className="text-lg font-black text-primary">{s.v}</p>
                <p className="text-[10px] font-bold leading-tight text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.stats.badges.length === 0 && (
              <p className="text-xs text-muted-foreground">Badge pertamamu menunggu — jalankan query pertama! 🚀</p>
            )}
            {data.stats.badges.map((b) => {
              const meta = badgeById(b);
              return (
                <span key={b} title={meta?.desc} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-extrabold text-secondary-foreground">
                  {meta?.icon} {meta?.label ?? b}
                </span>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
