import { Link } from "react-router";
import { ArrowRight, Swords } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  LESSON_ORDER,
  LESSON_MAP,
  getExercise,
} from "@/lib/curriculum";
import { WORLD_SKILL, levelProgress, rankFromLevel, RANKS, tierFromWins } from "@/lib/game";

/** Sapaan sesuai jam — kecil, tapi bikin dashboard terasa hidup. */
function greeting(): string {
  const h = new Date().getHours();
  if (h < 4) return "Masih melek?";
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

export default function Dashboard() {
  const data = useQuery(api.game.dashboard);
  if (!data) {
    return (
      <div className="space-y-4" aria-busy>
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-48 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  const { user, stats, level, rank } = data;
  const lp = levelProgress(stats.xp);
  const nextRank = RANKS.find((r) => r.minLevel > level);
  const tier = tierFromWins(stats.botWins);

  /* ---- continue learning: lesson pertama yang belum tamat ---- */
  const done = new Set(data.completedLessons);
  const nextRef = LESSON_ORDER.find((l) => !done.has(l.lessonId));
  let worldPct = 0;
  let currentLessonIdx = 0;
  let currentWorldLessons = 0;
  if (nextRef) {
    const entry = LESSON_MAP.get(nextRef.lessonId)!;
    currentWorldLessons = entry.world.lessons.length;
    currentLessonIdx = entry.world.lessons.findIndex((l) => l.id === nextRef.lessonId) + 1;
    const doneInWorld = entry.world.lessons.filter((l) => done.has(l.id)).length;
    worldPct = Math.round((doneInWorld / Math.max(1, currentWorldLessons)) * 100);
  }
  const allDone = !nextRef;

  /* ---- daily mission checklist — semua dari data nyata ---- */
  const missions = [
    { label: "Selesaikan 1 pelajaran", done: data.lessonsToday >= 1 },
    { label: "Kerjakan 3 latihan", done: stats.todayExercises >= 3 },
    { label: "Menang VS Bot", done: data.battlesWonToday >= 1 },
  ];
  const missionsDone = missions.filter((m) => m.done).length;

  /* ---- skill rows dari attempt nyata ---- */
  const skills = data.skillStats.map((s) => ({
    name: WORLD_SKILL[s.worldNum] ?? `WORLD ${s.worldNum}`,
    pct: s.accuracy,
    attempts: s.attempts,
  }));

  const accuracy =
    stats.exercisesDone > 0
      ? Math.round((stats.exercisesCorrect / stats.exercisesDone) * 100)
      : null;

  return (
    <div className="mx-auto max-w-[1200px] space-y-8">
      {/* ---------- HERO: continue learning + level ---------- */}
      <section className="grid items-end gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {greeting()}, {user.name.split(" ")[0]}.
          </p>
          {allDone ? (
            <>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-[28px] sm:leading-tight">
                Semua dunia sudah kamu taklukkan.
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Ulangi latihan favoritmu atau jaga streak di Battle Arena.
              </p>
              <Link
                to="/learn"
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Buka Peta Belajar <ArrowRight className="size-4" />
              </Link>
            </>
          ) : (
            <>
              <p className="kicker mt-3">WORLD {String(nextRef!.worldNum).padStart(2, "0")} · LESSON {currentLessonIdx}</p>
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-[28px]">
                {LESSON_MAP.get(nextRef!.lessonId)!.lesson.title}
              </h1>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {LESSON_MAP.get(nextRef!.lessonId)!.world.title}
              </p>
              {/* progress track */}
              <div className="inset-track mt-3 max-w-md" role="progressbar" aria-valuenow={worldPct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-primary transition-all" style={{ width: `${worldPct}%` }} />
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {worldPct}% world ini beres.
              </p>
              <Link
                to={`/lesson/${nextRef!.lessonId}`}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Lanjutkan Lesson <ArrowRight className="size-4" />
              </Link>
            </>
          )}
        </div>

        {/* Level panel — tipografi, bukan card */}
        <div className="lg:border-l lg:border-border lg:pl-6">
          <p className="font-mono text-4xl font-bold tracking-tight">LV {level}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
            <span aria-hidden>{rank.emoji}</span> {rank.name}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {stats.xp.toLocaleString()} total XP
          </p>
          {nextRank && (
            <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              Next rank:{" "}
              <span className="font-semibold text-foreground">{nextRank.name}</span>{" "}
              di LV {nextRank.minLevel} ·{" "}
              <span className="font-mono">
                {(lp.needed - lp.current).toLocaleString()} XP lagi
              </span>
            </p>
          )}
        </div>
      </section>

      {/* ---------- PROGRESS STRIP ---------- */}
      <section
        aria-label="Ringkasan progres"
        className="flex flex-wrap gap-x-8 gap-y-2 border-y border-border py-3 font-mono text-xs"
      >
        <span><span className="text-muted-foreground">LEVEL</span> <b>{level}</b></span>
        <span><span className="text-muted-foreground">RANK</span> <b>{rank.name}</b></span>
        <span><span className="text-muted-foreground">STREAK</span> <b>{stats.streak} hari</b></span>
        <span><span className="text-muted-foreground">CLASS</span> <b>{user.className || "—"}</b></span>
        <span><span className="text-muted-foreground">ACCURACY</span> <b>{accuracy != null ? `${accuracy}%` : "—"}</b></span>
        <span className="ml-auto"><span className="text-muted-foreground">LEADERBOARD</span> <b>#{data.leaderboardPosition || "—"}</b></span>
      </section>

      {/* ---------- KONTEN UTAMA ---------- */}
      <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="min-w-0 space-y-10">
          {/* Skill progress */}
          <section aria-labelledby="skill-progress">
            <h2 id="skill-progress" className="kicker mb-3">SKILL PROGRESS</h2>
            {skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada data skill — kerjakan latihan pertamamu dan grafik ini terisi otomatis.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {skills.map((s) => (
                  <li key={s.name} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 font-mono text-xs font-semibold">{s.name}</span>
                    <div className="inset-track flex-1">
                      <div
                        className={cnSkill(s.pct)}
                        style={{ width: `${Math.max(4, s.pct)}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right font-mono text-xs">
                      {s.attempts}× try
                    </span>
                    <span className="w-12 shrink-0 text-right font-mono text-xs font-bold">
                      {s.pct}%
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recent activity */}
          <section aria-labelledby="recent-activity">
            <h2 id="recent-activity" className="kicker mb-3">ACTIVITY TERAKHIR</h2>
            {data.recentAttempts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Kosong. Riwayat latihanmu muncul di sini begitu mulai.
              </p>
            ) : (
              <ul className="divide-y divide-border border-y border-border">
                {data.recentAttempts.map((a, i) => {
                  const ex = getExercise(a.exerciseId);
                  return (
                    <li key={i} className="flex items-center gap-3 py-2 text-sm">
                      <span
                        className={`w-14 shrink-0 font-mono text-[10px] font-bold uppercase ${
                          a.isCorrect ? "text-success" : "text-warning"
                        }`}
                      >
                        {a.isCorrect ? "PASS" : "RETRY"}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {ex ? ex.title : a.exerciseId}
                      </span>
                      {a.xpEarned > 0 && (
                        <span className="shrink-0 font-mono text-xs text-primary">+{a.xpEarned}</span>
                      )}
                      <span className="hidden w-16 shrink-0 text-right font-mono text-[10px] text-muted-foreground sm:block">
                        {new Date(a.at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Kolom kanan */}
        <div className="space-y-10">
          {/* Daily mission */}
          <section aria-labelledby="mission-today">
            <h2 id="mission-today" className="kicker mb-3">TODAY</h2>
            <ul className="space-y-2 text-sm">
              {missions.map((m) => (
                <li key={m.label} className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className={`grid size-4 place-items-center border font-mono text-[10px] ${
                      m.done
                        ? "border-success bg-success text-primary-foreground"
                        : "border-border text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className={m.done ? "text-muted-foreground line-through" : ""}>
                    {m.label}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 font-mono text-xs text-muted-foreground">
              {missionsDone} / {missions.length} selesai
            </p>
          </section>

          {/* Competition */}
          <section aria-labelledby="competition">
            <h2 id="competition" className="kicker mb-3">COMPETITION</h2>
            <div className="rounded-lg border border-border p-4">
              <p className="font-mono text-xs uppercase tracking-wider text-battle font-bold">BATTLE</p>
              <p className="mt-1 text-2xl font-bold">
                {tier.name} <span className="font-mono text-sm font-medium text-muted-foreground">· {stats.botWins}W / {stats.botLosses}L</span>
              </p>
              <Link
                to="/battle"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-battle hover:underline"
              >
                <Swords className="size-4" /> Masuk Arena
              </Link>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Peringkatmu minggu ini:{" "}
              <Link to="/leaderboard" className="font-semibold text-foreground hover:underline">
                #{data.leaderboardPosition || "belum masuk"}
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

/* warna bar skill: semantik mastery, bukan dekorasi */
function cnSkill(pct: number): string {
  if (pct >= 85) return "h-full bg-success transition-all";
  if (pct >= 50) return "h-full bg-primary transition-all";
  return "h-full bg-warning transition-all";
}
