import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "react-router";
import { Flame, FolderKanban, Lock } from "lucide-react";
import { levelProgress, rankFromLevel, BADGES } from "@/lib/game";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const data = useQuery(api.game.dashboard);

  if (!data) {
    return <div className="h-64 animate-pulse rounded-[calc(var(--radius)+0.5rem)] bg-muted/60" />;
  }

  const { level } = levelProgress(data.stats.xp);
  const rank = rankFromLevel(level);
  const accuracy =
    data.stats.exercisesDone > 0
      ? Math.round((data.stats.exercisesCorrect / data.stats.exercisesDone) * 100)
      : null;
  const winRate =
    data.stats.botWins + data.stats.botLosses > 0
      ? Math.round((data.stats.botWins / (data.stats.botWins + data.stats.botLosses)) * 100)
      : null;

  const stats: { v: string; l: string }[] = [
    { v: data.stats.xp.toLocaleString(), l: "Total XP" },
    { v: `Lv ${level}`, l: "Level" },
    { v: `${rank.emoji} ${rank.name.split(" ")[0]}`, l: "Rank" },
    { v: String(data.stats.queriesRun), l: "SQL dijalankan" },
    { v: accuracy == null ? "-" : `${accuracy}%`, l: "Akurasi" },
    { v: `${data.stats.lessonsCompleted}`, l: "Lesson tamat" },
    { v: `${data.stats.exercisesCorrect}`, l: "Latihan benar" },
    { v: `${winRate == null ? "-" : `${winRate}%`}`, l: "Win rate battle" },
    { v: `${data.stats.longestStreak}`, l: "Streak terbaik" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* identity */}
      <section className="clay-flat flex flex-wrap items-center gap-5 p-6">
        <span className="grid size-20 place-items-center rounded-3xl bg-background/70 text-5xl shadow-inner" aria-hidden>
          {data.user.avatarEmoji}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-black tracking-tight sm:text-2xl">{data.user.name}</h1>
          <p className="text-sm font-bold text-muted-foreground">
            @{data.user.username || "-"}
            {data.user.className && ` · ${data.user.className}`}
          </p>
          <p className="mt-1.5 flex items-center gap-2 text-xs font-extrabold">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
              {rank.emoji} {rank.name}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-orange-600 dark:bg-orange-950/60 dark:text-orange-300">
              <Flame className="size-3" /> {data.stats.streak} hari
            </span>
          </p>
        </div>
      </section>

      {/* statistics */}
      <section className="clay p-6">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Statistik</p>
        <div className="mt-4 grid grid-cols-3 gap-2.5 text-center sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.l} className="rounded-2xl bg-muted/50 p-3">
              <p className="truncate font-mono text-base font-black text-primary">{s.v}</p>
              <p className="mt-0.5 text-[10px] font-bold leading-tight text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* badges */}
      <section className="clay p-6">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Koleksi Badge</p>
        <p className="mt-1 text-xs font-bold text-muted-foreground">
          {data.stats.badges.length}/{BADGES.length} terkumpul
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {BADGES.map((b) => {
            const owned = data.stats.badges.includes(b.id);
            return (
              <div
                key={b.id}
                title={b.desc}
                className={cn(
                  "rounded-3xl p-4 text-center transition-transform hover:-translate-y-0.5",
                  owned ? "clay-sm" : "bg-muted/40 opacity-60",
                )}
              >
                <p className="text-3xl" aria-hidden>{owned ? b.icon : <Lock className="mx-auto size-6 text-muted-foreground" />}</p>
                <p className="mt-1.5 text-xs font-extrabold leading-tight">{b.label}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* portfolio placeholder */}
      <section className="clay p-6">
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground">
          <FolderKanban className="size-4" /> Portfolio Proyek
        </p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {[
            { t: "Student Database", d: "World 1–3 · selesaikan SELECT Adventure untuk membuka" },
            { t: "Kantin Digital", d: "Tamatkan boss 'Seblak Itu Beneran Laku?'" },
            { t: "ML Tournament DB", d: "Segera hadir — World Relationship & JOIN" },
            { t: "Final Capstone", d: "Menantimu di Final World: Database Developer 🏁" },
          ].map((p) => (
            <div key={p.t} className="rounded-2xl bg-muted/50 p-3.5">
              <p className="text-sm font-extrabold">{p.t}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{p.d}</p>
            </div>
          ))}
        </div>
        <Link to="/learn" className="mt-4 inline-block text-xs font-extrabold text-primary hover:underline">
          → Lanjut belajar buat buka proyek berikutnya
        </Link>
      </section>
    </div>
  );
}
