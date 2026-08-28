import { Link } from "react-router";
import {
  ArrowRight,
  Bot,
  Crown,
  Flame,
  Map as MapIcon,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  LESSON_ORDER,
  LESSON_MAP,
  getExercise,
} from "@/lib/curriculum";
import {
  WORLD_SKILL,
  levelProgress,
  rankFromLevel,
  RANKS,
  tierFromWins,
  BADGES,
} from "@/lib/game";
import { cn } from "@/lib/utils";
import { Coins } from "lucide-react";
import DailyQuests from "@/components/DailyQuests";
import { Link as LinkIcon } from "lucide-react";
import { StreakFireAnimation, XpGainAnimation, CoinAnimation, SparkleAnimation } from "@/components/ui/lottie-animation";

/** Sapaan sesuai jam — kecil, tapi bikin dashboard terasa hidup. */
function greeting(): string {
  const h = new Date().getHours();
  if (h < 4) return "Masih melek? Arena tidak tidur.";
  if (h < 11) return "Selamat pagi, saatnya grinding.";
  if (h < 15) return "Selamat siang, jangan lupa latihan.";
  if (h < 19) return "Selamat sore, masih ada misi yang menunggu.";
  return "Selamat malam, sesi malam terbaik untuk SQL.";
}

/* ------------------------------ quick actions ---------------------------- */

const QUICK_ACTIONS = [
  { to: "/learn", label: "Lanjut Misi", desc: "PETA DUNIA + LESSON", icon: MapIcon, tone: "text-primary" },
  { to: "/battle", label: "VS Bot", desc: "SPARRING 6 LEVEL BOT", icon: Bot, tone: "text-battle" },
  { to: "/battle", label: "Duel 1v1", desc: "KODE ROOM + TEMAN", icon: Users, tone: "text-info" },
  { to: "/battle", label: "SQL Cup", desc: "BRACKET TURNAMEN", icon: Trophy, tone: "text-warning" },
  { to: "/leaderboard", label: "Leaderboard", desc: "PERINGKAT XP SEKOLAH", icon: Crown, tone: "text-success" },
] as const;

/* --------------------------------- page ---------------------------------- */

export default function Dashboard() {
  const data = useQuery(api.game.dashboard);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24" aria-busy>
        <StreakFireAnimation days={0} />
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">Memuat dashboard...</p>
      </div>
    );
  }

  const { user, stats, level, rank } = data;
  const lp = levelProgress(stats.xp);
  const xpPct = Math.min(100, Math.round((lp.current / Math.max(1, lp.needed)) * 100));
  const nextRank = RANKS.find((r) => r.minLevel > level);
  const tier = tierFromWins(stats.botWins);

  /* ---- continue learning: lesson pertama yang belum tamat ---- */
  const done = new Set(data.completedLessons);
  const nextRef = LESSON_ORDER.find((l) => !done.has(l.lessonId));
  let worldPct = 0;
  let currentLessonIdx = 0;
  if (nextRef) {
    const entry = LESSON_MAP.get(nextRef.lessonId)!;
    currentLessonIdx = entry.world.lessons.findIndex((l) => l.id === nextRef.lessonId) + 1;
    const doneInWorld = entry.world.lessons.filter((l) => done.has(l.id)).length;
    worldPct = Math.round((doneInWorld / Math.max(1, entry.world.lessons.length)) * 100);
  }
  const allDone = !nextRef;

  /* ---- daily mission checklist — semua dari data nyata ---- */
  const missions = [
    { label: "Selesaikan 1 pelajaran", done: data.lessonsToday >= 1 },
    { label: "Kerjakan 3 latihan", done: stats.todayExercises >= 3 },
    { label: "Menang 1 battle", done: data.battlesWonToday >= 1 },
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

  const earnedBadges = BADGES.filter((b) => stats.badges.includes(b.id));

  /* ---- stat tiles: angka besar, warna semantik, nol dekorasi ---- */
  const statTiles = [
    { label: "LEVEL", value: String(level), tone: "text-primary" },
    { label: "RANK", value: `${rank.emoji} ${rank.name.split(" ")[0]}`, tone: "text-foreground" },
    { label: "TOTAL XP", value: stats.xp.toLocaleString("id-ID"), tone: "text-info" },
    { label: "STREAK", value: `${stats.streak}h`, tone: "text-warning" },
    { label: "AKURASI", value: accuracy != null ? `${accuracy}%` : "—", tone: "text-success" },
    { label: "MENANG", value: `${stats.botWins}W`, tone: "text-battle" },
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* ============================== HERO ============================== */}
      <section className="panel-raised animate-fade-in p-6 sm:p-8" style={{ animationDelay: "0ms" }} aria-label="Profil singkat">
        <p className="kicker">WELCOME BACK, WARRIOR</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="size-14 shrink-0 border border-border object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="grid size-14 shrink-0 place-items-center border border-border bg-secondary text-3xl"
            >
              {user.avatarEmoji}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {user.name}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{greeting()}</p>
          </div>
        </div>

        {/* status chips — mono, ber-border, seperti status bar game */}
        <div className="mt-4 flex flex-wrap gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1.5 rounded-md border border-border bg-accent/40 px-2.5 py-1 text-accent-foreground">
            <span aria-hidden>{rank.emoji}</span> {rank.name}
          </span>
          <span className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-primary">
            LV {level}
          </span>
          {stats.streak > 0 && (
            <span className="flex items-center gap-1 rounded-md border border-warning/40 bg-warning/10 px-2.5 py-1 text-warning">
              <StreakFireAnimation days={stats.streak} />
            </span>
          )}
          {user.className && (
            <span className="rounded-md border border-border bg-secondary px-2.5 py-1 text-secondary-foreground">
              {user.className}
            </span>
          )}
          <span className="rounded-md border border-border bg-secondary px-2.5 py-1 text-secondary-foreground">
            RANK #{data.leaderboardPosition || "—"} GLOBAL
          </span>
        </div>
      </section>

      {/* ========================== QUICK ACTIONS ========================= */}
      <nav aria-label="Aksi cepat" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {QUICK_ACTIONS.map(({ to, label, desc, icon: Icon, tone }) => (
          <Link
            key={label}
            to={to}
            className="group panel p-4 transition-colors hover:border-primary/50 hover:bg-accent/30"
          >
            <Icon className={cn("size-5", tone)} strokeWidth={1.75} aria-hidden />
            <p className="mt-3 text-sm font-bold uppercase tracking-wide">{label}</p>
            <p className="mt-1 font-mono text-[10px] tracking-wider text-muted-foreground">
              {desc}
            </p>
          </Link>
        ))}
      </nav>

      {/* ============================ STAT TILES ========================== */}
      <section aria-label="Statistik warrior" className="animate-fade-in" style={{ animationDelay: "100ms" }}>
        <h2 className="kicker mb-3">STATISTIK WARRIOR</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statTiles.map((s) => (
            <div key={s.label} className="panel p-4">
              <p className={cn("font-mono text-2xl font-bold tracking-tight", s.tone)}>
                {s.value}
              </p>
              <p className="kicker mt-1.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================= XP → NEXT LEVEL ======================== */}
      <section className="panel animate-fade-in p-5" style={{ animationDelay: "200ms" }} aria-label="Progres XP">
        <div className="flex items-end justify-between gap-4">
          <p className="font-mono text-sm font-semibold">
            LV {level} <span className="text-muted-foreground">→ LV {level + 1}</span>
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {lp.current.toLocaleString("id-ID")} / {lp.needed.toLocaleString("id-ID")} XP
          </p>
        </div>
        <div
          className="inset-track mt-2.5 h-2.5"
          role="progressbar"
          aria-valuenow={xpPct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full bg-primary transition-all" style={{ width: `${xpPct}%` }} />
        </div>
        {nextRank && (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            {nextRank.emoji} {nextRank.name} terbuka di LV {nextRank.minLevel} ·{" "}
            {(lp.needed - lp.current).toLocaleString("id-ID")} XP lagi
          </p>
        )}
      </section>

      {/* ========================== MISI BERIKUTNYA ======================= */}
      <section className="panel-raised flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="kicker">{allDone ? "MISI SELESAI" : "MISI BERIKUTNYA"}</p>
          {allDone ? (
            <>
              <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                Semua dunia sudah kamu taklukkan. 👑
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ulangi latihan favoritmu, atau jaga peringkat di arena.
              </p>
            </>
          ) : (
            <>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-primary">
                  WORLD {String(nextRef!.worldNum).padStart(2, "0")}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  LESSON {currentLessonIdx} · {LESSON_MAP.get(nextRef!.lessonId)!.world.title}
                </span>
              </div>
              <h2 className="mt-2 truncate text-xl font-bold tracking-tight sm:text-2xl">
                {LESSON_MAP.get(nextRef!.lessonId)!.lesson.title}
              </h2>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="inset-track w-48 max-w-full"
                  role="progressbar"
                  aria-valuenow={worldPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full bg-primary transition-all" style={{ width: `${worldPct}%` }} />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">{worldPct}%</span>
              </div>
            </>
          )}
        </div>
        <Link
          to={allDone ? "/battle" : `/lesson/${nextRef!.lessonId}`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {allDone ? "Masuk Arena" : "Lanjutkan Misi"} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>

      {/* ======================= ARENA + KOLOM KANAN ====================== */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* --- Arena: duel + cup --- */}
        <section aria-label="Arena kompetisi" className="space-y-4">
          <h2 className="kicker">ARENA</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Private duel */}
            <div className="panel flex flex-col p-5">
              <div className="flex items-center gap-2">
                <Swords className="size-4 text-battle" strokeWidth={1.75} aria-hidden />
                <h3 className="text-sm font-bold uppercase tracking-wide">Private Duel</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Tantang temanmu 1v1 secara langsung — buat room, bagikan kode 4 hurufnya.
              </p>
              <ol className="mt-3 space-y-1.5 border-l border-border pl-4 font-mono text-[11px] text-muted-foreground">
                <li>1. Buat duel, dapatkan kode room</li>
                <li>2. Teman gabung lewat kode itu</li>
                <li>3. Query sama — yang benar &amp; cepat menang</li>
              </ol>
              <div className="flex-1" />
              <Link
                to="/battle"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-md border border-battle/50 bg-battle/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-battle transition-colors hover:bg-battle/20"
              >
                <Swords className="size-3.5" aria-hidden /> Buka Duel
              </Link>
            </div>

            {/* SQL Cup */}
            <div className="panel flex flex-col p-5">
              <div className="flex items-center gap-2">
                <Trophy className="size-4 text-warning" strokeWidth={1.75} aria-hidden />
                <h3 className="text-sm font-bold uppercase tracking-wide">SQL Cup</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Turnamen bracket gugur 4/8/16 pemain. Juara membawa pulang title Champion.
              </p>
              <ol className="mt-3 space-y-1.5 border-l border-border pl-4 font-mono text-[11px] text-muted-foreground">
                <li>1. Gabung pakai kode undangan guru</li>
                <li>2. Bracket diacak, menang maju babak</li>
                <li>3. Final: +225 XP &amp; gelar 🏆 Champion</li>
              </ol>
              <div className="flex-1" />
              <Link
                to="/battle"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-md border border-warning/50 bg-warning/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-warning transition-colors hover:bg-warning/20"
              >
                <Trophy className="size-3.5" aria-hidden /> Lihat Turnamen
              </Link>
            </div>
          </div>

          {/* Battle tier */}
          <div className="panel flex items-center justify-between gap-4 p-5">
            <div>
              <p className="kicker">BATTLE TIER</p>
              <p className="mt-1 text-lg font-bold">
                {tier.name}{" "}
                <span className="font-mono text-sm font-medium text-muted-foreground">
                  · {stats.botWins}W / {stats.botLosses}L vs bot
                </span>
              </p>
            </div>
            <Link
              to="/battle"
              className="inline-flex shrink-0 items-center gap-2 rounded-md bg-battle px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Bot className="size-4" aria-hidden /> Sparring Bot
            </Link>
          </div>
        </section>

        {/* --- Kolom kanan: progression + misi harian --- */}
        <div className="space-y-4">
          {/* Daily Quests (server-powered) */}
          <DailyQuests />

          {/* Level card */}
          <section className="panel p-5" aria-label="Level dan badge">
            <p className="kicker">PROGRESSION</p>
            <p className="mt-2 font-mono text-4xl font-bold tracking-tight text-primary">
              LV {level}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
              <span aria-hidden>{rank.emoji}</span> {rank.name}
            </p>
            <div className="inset-track mt-3">
              <div className="h-full bg-primary transition-all" style={{ width: `${xpPct}%` }} />
            </div>
            <p className="mt-3 border-t border-border pt-3">
              <span className="kicker">BADGES</span>
            </p>
            {earnedBadges.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Belum ada badge — query pertamamu menunggu. 🚀
              </p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {earnedBadges.map((b) => (
                  <li
                    key={b.id}
                    title={b.desc}
                    className="flex items-center gap-1 rounded border border-border bg-secondary px-2 py-1 font-mono text-[10px] font-semibold"
                  >
                    <span aria-hidden>{b.icon}</span> {b.label}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Misi harian */}
          <section className="panel p-5" aria-label="Misi harian">
            <div className="flex items-center justify-between">
              <p className="kicker">MISI HARIAN</p>
              <span className="font-mono text-[11px] font-bold text-primary">
                {missionsDone}/{missions.length}
              </span>
            </div>
            <ul className="mt-3 space-y-2.5 text-sm">
              {missions.map((m) => (
                <li key={m.label} className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-4 shrink-0 place-items-center border font-mono text-[10px]",
                      m.done
                        ? "border-success bg-success text-primary-foreground"
                        : "border-border text-transparent",
                    )}
                  >
                    ✓
                  </span>
                  <span className={m.done ? "text-muted-foreground line-through" : ""}>
                    {m.label}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 font-mono text-[10px] text-muted-foreground">
              Reset setiap tengah malam — streakmu dihitung dari aktivitas harian.
            </p>
          </section>
        </div>
      </div>

      {/* ================= SKILL + BATTLE HISTORY ================= */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Skill progress */}
        <section aria-labelledby="skill-progress">
          <h2 id="skill-progress" className="kicker mb-3">SKILL PROGRESS</h2>
          {skills.length === 0 ? (
            <p className="panel p-4 text-sm text-muted-foreground">
              Belum ada data skill — kerjakan latihan pertamamu dan grafik ini terisi otomatis.
            </p>
          ) : (
            <ul className="panel divide-y divide-border">
              {skills.map((s) => (
                <li key={s.name} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-20 shrink-0 font-mono text-xs font-semibold">{s.name}</span>
                  <div className="inset-track flex-1">
                    <div className={cnSkill(s.pct)} style={{ width: `${Math.max(4, s.pct)}%` }} />
                  </div>
                  <span className="w-12 shrink-0 text-right font-mono text-xs font-bold">
                    {s.pct}%
                  </span>
                  <span className="w-14 shrink-0 text-right font-mono text-[10px] text-muted-foreground">
                    {s.attempts}× try
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Battle history */}
        <section aria-labelledby="battle-history">
          <h2 id="battle-history" className="kicker mb-3">BATTLE HISTORY</h2>
          {data.recentAttempts.length === 0 ? (
            <p className="panel p-4 text-sm text-muted-foreground">
              Kosong. Riwayat latihanmu muncul di sini begitu mulai.
            </p>
          ) : (
            <ul className="panel divide-y divide-border">
              {data.recentAttempts.slice(0, 6).map((a, i) => {
                const ex = getExercise(a.exerciseId);
                return (
                  <li key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <span
                      className={cn(
                        "w-16 shrink-0 rounded border px-1.5 py-0.5 text-center font-mono text-[10px] font-bold uppercase",
                        a.isCorrect
                          ? "border-success/40 bg-success/10 text-success"
                          : "border-warning/40 bg-warning/10 text-warning",
                      )}
                    >
                      {a.isCorrect ? "PASS" : "RETRY"}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {ex ? ex.title : a.exerciseId}
                    </span>
                    {a.xpEarned > 0 && (
                      <span className="shrink-0 font-mono text-xs font-bold text-primary">
                        +{a.xpEarned} XP
                      </span>
                    )}
                    <span className="hidden w-14 shrink-0 text-right font-mono text-[10px] text-muted-foreground sm:block">
                      {new Date(a.at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
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
