import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Map as MapIcon,
  Swords,
  Trophy,
  Lock,
  Target,
} from "lucide-react";
import { BADGES, WORLD_SKILL, RANKS, levelProgress, tierFromWins } from "@/lib/game";
import { cn } from "@/lib/utils";
import { AvatarUpload } from "@/components/AvatarUpload";
import {
  LottieAnimation,
  StreakFireAnimation,
  SparkleAnimation,
} from "@/components/ui/lottie-animation";

const DAY_LABELS = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];

function dayLabel(date: string) {
  // date = "YYYY-MM-DD" (UTC) — parse sebagai UTC agar nama hari konsisten
  const d = new Date(`${date}T00:00:00Z`);
  return DAY_LABELS[d.getUTCDay()];
}

export default function ProfilePage() {
  const data = useQuery(api.game.dashboard);
  const duels = useQuery(api.battle.myDuelHistory);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  // Sinkronkan avatarUrl dari data server saat pertama load
  const serverAvatarUrl = data?.user.avatarUrl ?? null;
  // Reset local override saat data berubah (reactive)
  const resolvedAvatarUrl = avatarUrl ?? serverAvatarUrl;

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl space-y-4" aria-busy>
        <div className="panel flex items-center justify-center h-40">
          <LottieAnimation animation="database-loading" size="lg" />
        </div>
        <div className="panel h-24 animate-pulse" />
      </div>
    );
  }

  const { user, stats, level, rank, activity7d, today } = data;
  const lp = levelProgress(stats.xp);
  const nextRank = RANKS.find((r) => r.minLevel > level);
  const tier = tierFromWins(stats.botWins);
  const accuracy =
    stats.exercisesDone > 0
      ? Math.round((stats.exercisesCorrect / stats.exercisesDone) * 100)
      : 0;

  const earned = new Set(stats.badges);
  const duelTotal = stats.duelWins + stats.duelLosses + stats.duelDraws;
  const duelWinRate = duelTotal > 0 ? Math.round((stats.duelWins / duelTotal) * 100) : 0;

  // ringkasan minggu ini dari aktivitas 7 hari (data nyata)
  const weekExercises = activity7d.reduce((n, d) => n + d.exercises, 0);
  const weekBattles = activity7d.reduce((n, d) => n + d.battlesWon, 0);
  const weekLessons = activity7d.reduce((n, d) => n + d.lessons, 0);
  const bestDay = activity7d.reduce(
    (best, d) =>
      d.exercises + d.battlesWon + d.lessons > best.exercises + best.battlesWon + best.lessons
        ? d
        : best,
    activity7d[0],
  );

  // tren 24 attempt terakhir
  const trend = data.recentAttempts;
  const trendCorrect = trend.filter((a) => a.isCorrect).length;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* ================= HERO ================= */}
      <section className="panel p-5 sm:p-6" aria-labelledby="profile-name">
        <div className="flex items-start gap-4 sm:gap-5">
          <AvatarUpload
            avatarUrl={resolvedAvatarUrl}
            emoji={user.avatarEmoji}
            onAvatarChange={setAvatarUrl}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="kicker">@{user.username || "petualang"}</p>
            <h1 id="profile-name" className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {user.name}
            </h1>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {user.className ? `${user.className} · ` : ""}PPLG Mutuharjo
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="relative rounded border border-warning/40 bg-warning/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-warning">
                {rank.emoji} {rank.name.toUpperCase()}
                <SparkleAnimation className="absolute -right-1 -top-1 size-4" />
              </span>
              <span className="rounded border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-primary">
                LEVEL {level}
              </span>
              <span
                className="rounded border px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider"
                style={{ borderColor: `${tier.color}55`, color: tier.color }}
              >
                {tier.name.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-4 font-mono text-[11px] tracking-wide text-muted-foreground">
          RANK BERIKUTNYA:{" "}
          {nextRank ? (
            <span className="font-semibold text-foreground">
              {nextRank.emoji} {nextRank.name.toUpperCase()} @ LV {nextRank.minLevel}
            </span>
          ) : (
            <span className="font-semibold text-foreground">RANK MAKSIMAL TERCAPAI</span>
          )}
        </p>
        <div className="inset-track mt-1.5">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.round((lp.current / lp.needed) * 100)}%` }}
          />
        </div>
        <p className="mt-1 font-mono text-[10px] text-muted-foreground">
          {lp.current.toLocaleString()} / {lp.needed.toLocaleString()} XP → LV {level + 1}
          {nextRank ? ` · ${nextRank.name} terbuka di LV ${nextRank.minLevel}` : ""}
        </p>
      </section>

      {/* ================= STATISTIK ================= */}
      <section aria-labelledby="stats-h">
        <h2 id="stats-h" className="kicker mb-3">STATISTIK</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { v: String(level), l: "LEVEL", c: "text-primary" },
            { v: stats.xp.toLocaleString(), l: "TOTAL XP", c: "text-info" },
            { v: `${accuracy}%`, l: "AKURASI", c: "text-success" },
            { v: String(stats.exercisesDone), l: "LATIHAN", c: "text-foreground" },
            { v: `${stats.streak}d`, l: "STREAK", c: "text-warning" },
            { v: `${duelWinRate}%`, l: "WIN RATE DUEL", c: "text-battle" },
          ].map(({ v, l, c }) => (
            <div key={l} className="panel px-3 py-3 text-center">
              <div className={cn("font-mono text-2xl font-bold tabular-nums", c, "flex items-center justify-center gap-1")}>
                {l === "STREAK" && stats.streak > 0 && <LottieAnimation animation="fire-streak" size="sm" loop />}
                <span>{v}</span>
              </div>
              <p className="mt-1 font-mono text-[9px] tracking-wider text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= RINGKASAN 7 HARI ================= */}
      <section aria-labelledby="week-h">
        <h2 id="week-h" className="kicker mb-3">RINGKASAN 7 HARI TERAKHIR</h2>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {[
            {
              l: "LATIHAN",
              v: weekExercises,
              sub: `HARI INI: ${stats.todayExercises}`,
            },
            {
              l: "BATTLE DIMENANGKAN",
              v: weekBattles,
              sub: `HARI INI: ${data.battlesWonToday}`,
            },
            {
              l: "LESSON TAMAT",
              v: weekLessons,
              sub: `TOTAL: ${stats.lessonsCompleted}`,
            },
            {
              l: "HARI TERAKTIF",
              v: dayLabel(bestDay?.date ?? today),
              sub: bestDay ? `${bestDay.exercises + bestDay.battlesWon + bestDay.lessons} AKSI` : "—",
            },
          ].map(({ l, v, sub }) => (
            <div key={l} className="panel px-4 py-3.5">
              <p className="font-mono text-[10px] tracking-wider text-muted-foreground">{l}</p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-primary">{v}</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= AKTIVITAS 7 HARI ================= */}
      <section className="panel p-4 sm:p-5" aria-labelledby="act-h">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="act-h" className="kicker">AKTIVITAS 7 HARI TERAKHIR</h2>
          <p className="font-mono text-[10px] text-muted-foreground flex items-center gap-1">
            STREAK: {stats.streak > 0 ? <StreakFireAnimation days={stats.streak} /> : `${stats.streak} HARI`} · BEST: {stats.longestStreak}
          </p>
        </div>
        <ul className="mt-3 grid grid-cols-7 gap-1.5 sm:gap-2">
          {activity7d.map((d) => {
            const total = d.exercises + d.battlesWon + d.lessons;
            const isToday = d.date === today;
            return (
              <li
                key={d.date}
                className={cn(
                  "flex flex-col items-center gap-1 border px-1 py-2.5 text-center",
                  isToday ? "border-primary/60 bg-primary/5" : "border-border bg-secondary/40",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-[9px] tracking-wider",
                    isToday ? "font-bold text-primary" : "text-muted-foreground",
                  )}
                >
                  {dayLabel(d.date)}
                </span>
                {total > 0 ? (
                  <>
                    {isToday ? (
                      <LottieAnimation animation="fire-streak" size="xs" loop />
                    ) : (
                      <span className="text-base leading-none" aria-hidden>🔥</span>
                    )}
                    <span className="font-mono text-[10px] font-bold tabular-nums">
                      {total} aksi
                    </span>
                  </>
                ) : (
                  <span className="font-mono text-sm leading-none text-muted-foreground/50">–</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ================= TREN LATIHAN ================= */}
      <section aria-labelledby="trend-h">
        <h2 id="trend-h" className="kicker mb-3">TREN LATIHAN · 24 PERCOBAAN TERAKHIR</h2>
        <div className="panel px-4 py-5">
          {trend.length === 0 ? (
            <p className="text-center font-mono text-xs text-muted-foreground">
              belum ada latihan — mulai dari jalur misi di Learn
            </p>
          ) : (
            <>
              <ul className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Hasil 24 percobaan terakhir">
                {trend.map((a, i) => (
                  <li
                    key={i}
                    title={a.isCorrect ? "Benar" : "Belum benar"}
                    className={cn(
                      "size-4 border sm:size-5",
                      a.isCorrect
                        ? "border-success/50 bg-success/70"
                        : "border-warning/50 bg-warning/50",
                    )}
                  />
                ))}
              </ul>
              <p className="mt-4 text-center font-mono text-[10px] tracking-wider text-muted-foreground">
                <span className="text-success">HIJAU</span> = BENAR ·{" "}
                <span className="text-warning">KUNING</span> = SALAH ·{" "}
                {trendCorrect}/{trend.length} BENAR
              </p>
            </>
          )}
        </div>
      </section>

      {/* ================= SKILL PER DUNIA ================= */}
      <section aria-labelledby="skills-h">
        <h2 id="skills-h" className="kicker mb-3">SKILL PER DUNIA</h2>          {data.skillStats.length === 0 ? (
            <div className="panel flex flex-col items-center gap-3 px-4 py-8 text-center">
              <LottieAnimation animation="empty-box" size="md" />
              <p className="font-mono text-xs text-muted-foreground">
                belum ada data — skill terpetakan otomatis dari latihan yang kamu kerjakan
              </p>
            </div>
        ) : (
          <ul className="panel space-y-3 px-4 py-4">
            {data.skillStats.map((s) => (
              <li key={s.worldNum} className="flex items-center gap-3">
                <span className="w-24 shrink-0 truncate font-mono text-[11px] font-semibold">
                  {WORLD_SKILL[s.worldNum] ?? `W${s.worldNum}`}
                </span>
                <div className="inset-track flex-1">
                  <div
                    className={cn(
                      "h-full",
                      s.accuracy >= 85 ? "bg-success" : s.accuracy >= 50 ? "bg-primary" : "bg-warning",
                    )}
                    style={{ width: `${Math.max(4, s.accuracy)}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right font-mono text-xs font-bold tabular-nums">
                  {s.accuracy}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ================= BADGES ================= */}
      <section aria-labelledby="badges-h">
        <div className="flex items-center gap-3 mb-3">
          <h2 id="badges-h" className="kicker">
            WARRIOR BADGES · {earned.size}/{BADGES.length}
          </h2>
          <div className="flex-1">
            <div className="inset-track h-1.5">
              <div
                className="h-full bg-warning transition-all"
                style={{ width: `${Math.round((earned.size / BADGES.length) * 100)}%` }}
              />
            </div>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {Math.round((earned.size / BADGES.length) * 100)}%
          </span>
        </div>
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {BADGES.map((b) => {
            const has = earned.has(b.id);
            return (
              <li
                key={b.id}
                className={cn(
                  "relative overflow-hidden px-4 py-3.5 transition-all",
                  has
                    ? "panel hover:shadow-lg hover:shadow-warning/10"
                    : "border border-dashed border-border opacity-60",
                )}
              >
                {has && (
                  <div className="pointer-events-none absolute right-1 top-1">
                    <SparkleAnimation className="size-5" />
                  </div>
                )}
                <div className="relative">
                  <p className="text-xl leading-none" aria-hidden>
                    {has ? (
                      <span className="relative inline-block">
                        {b.icon}
                        <span className="absolute -bottom-0.5 -right-0.5">
                          <LottieAnimation animation="check-mark" size="sm" loop={false} />
                        </span>
                      </span>
                    ) : (
                      <span className="relative inline-block">
                        <Lock className="size-4 text-muted-foreground" aria-label="Terkunci" />
                      </span>
                    )}
                  </p>
                  <p
                    className={cn(
                      "mt-2 text-[13px] font-bold uppercase tracking-wide",
                      !has && "text-muted-foreground",
                    )}
                  >
                    {b.label}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] leading-snug text-muted-foreground">
                    {b.desc}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ================= BATTLE HISTORY ================= */}
      <section aria-labelledby="duels-h">
        <h2 id="duels-h" className="kicker mb-3">
          BATTLE HISTORY · DUEL 1V1 ({duelTotal})
        </h2>
        {!duels ? (
          <div className="panel h-16 animate-pulse" />
        ) : duels.length === 0 ? (
          <div className="panel px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              Belum pernah duel. Bagikan kode 4 huruf di Battle Arena dan aduin skill dengan teman.
            </p>
          </div>
        ) : (
          <ul className="panel divide-y divide-border">
            {duels.map((d, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={cn(
                    "w-16 shrink-0 rounded border px-1.5 py-0.5 text-center font-mono text-[10px] font-bold tracking-wider",
                    d.draw
                      ? "border-border bg-secondary text-muted-foreground"
                      : d.won
                        ? "border-success/40 bg-success/10 text-success"
                        : "border-destructive/40 bg-destructive/10 text-destructive",
                  )}
                >
                  {d.draw ? "DRAW" : d.won ? "WIN" : "LOSE"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    vs {d.opponentEmoji} {d.opponent}
                  </span>
                  <span className="block truncate font-mono text-[10px] text-muted-foreground">
                    {d.exerciseTitle} ·{" "}
                    {new Date(d.at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-mono text-sm font-bold tabular-nums">
                    {d.mySeconds != null ? `${d.mySeconds}s` : "—"}
                  </span>
                  <span className="block font-mono text-[9px] text-muted-foreground">WAKTUMU</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ================= CTA BAWAH ================= */}
      <nav
        aria-label="Aksi cepat"
        className="grid grid-cols-1 gap-2.5 pb-4 sm:grid-cols-3"
      >
        <Link
          to="/learn"
          className="flex items-center justify-center gap-2 border border-primary bg-primary px-4 py-3 font-mono text-xs font-bold tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <MapIcon className="size-4" aria-hidden /> LANJUT MISI
        </Link>
        <Link
          to="/battle"
          className="flex items-center justify-center gap-2 border border-battle bg-battle px-4 py-3 font-mono text-xs font-bold tracking-wider text-white transition-colors hover:brightness-110"
        >
          <Swords className="size-4" aria-hidden /> MASUK ARENA
        </Link>
        <Link
          to="/leaderboard"
          className="flex items-center justify-center gap-2 border border-border bg-card px-4 py-3 font-mono text-xs font-bold tracking-wider text-foreground transition-colors hover:bg-secondary"
        >
          <Trophy className="size-4" aria-hidden /> LEADERBOARD
        </Link>
      </nav>

      {/* catatan kecil: target berikutnya */}
      <p className="flex items-center justify-center gap-1.5 pb-2 text-center font-mono text-[10px] text-muted-foreground">
        <Target className="size-3" aria-hidden />
        Global rank #{data.leaderboardPosition} · {stats.queriesRun.toLocaleString()} query dijalankan
      </p>
    </div>
  );
}
