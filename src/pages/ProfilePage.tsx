import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BADGES, WORLD_SKILL, RANKS, levelProgress, tierFromWins } from "@/lib/game";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const data = useQuery(api.game.dashboard);
  const duels = useQuery(api.battle.myDuelHistory);

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4" aria-busy>
        <div className="h-24 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const { user, stats, level, rank } = data;
  const lp = levelProgress(stats.xp);
  const nextRank = RANKS.find((r) => r.minLevel > level);
  const tier = tierFromWins(stats.botWins);
  const accuracy =
    stats.exercisesDone > 0
      ? Math.round((stats.exercisesCorrect / stats.exercisesDone) * 100)
      : null;

  const earned = new Set(stats.badges);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      {/* ---------- IDENTITY ---------- */}
      <header>
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className="grid size-14 shrink-0 place-items-center border border-border bg-card text-2xl"
          >
            {user.avatarEmoji}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight">{user.name}</h1>
            <p className="font-mono text-xs text-muted-foreground">
              @{user.username || "—"}
              {user.className ? ` · ${user.className}` : ""}
            </p>
            <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px]">
              <span className="font-semibold">
                {rank.emoji} {rank.name}
              </span>
              <span className="text-muted-foreground">LV {level}</span>
              <span style={{ color: tier.color }}>BATTLE: {tier.name.toUpperCase()}</span>
            </p>
          </div>
        </div>

        {/* ringkasan inline — bukan KPI cards */}          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-y border-border py-3 font-mono text-xs">
          {[
            ["TOTAL XP", stats.xp.toLocaleString()],
            ["QUERIES", stats.queriesRun.toLocaleString()],
            ["LESSON TAMAT", String(stats.lessonsCompleted)],
            ["ACCURACY", accuracy != null ? `${accuracy}%` : "—"],
            ["STREAK", `${stats.streak} hari (best ${stats.longestStreak})`],
            ["BATTLE", `${stats.botWins}W / ${stats.botLosses}L`],
            ["DUEL RATING", `${stats.duelRating} (${stats.duelWins}W/${stats.duelLosses}L${stats.duelDraws ? `/${stats.duelDraws}D` : ""})`],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 text-sm font-bold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          {lp.current.toLocaleString()} / {lp.needed.toLocaleString()} XP menuju LV{" "}
          {level + 1}
          {nextRank ? ` · ${nextRank.name} di LV ${nextRank.minLevel}` : " · rank maksimal"}
        </p>
        <div className="inset-track mt-1.5 max-w-md">
          <div className="h-full bg-primary" style={{ width: `${Math.round((lp.current / lp.needed) * 100)}%` }} />
        </div>
      </header>

      {/* ---------- SKILLS ---------- */}
      <section aria-labelledby="skills-h">
        <h2 id="skills-h" className="kicker mb-3">SKILLS</h2>
        {data.skillStats.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada data. Skill-mu terpetakan otomatis dari latihan yang kamu kerjakan.
          </p>
        ) : (
          <ul className="space-y-2.5 max-w-md">
            {data.skillStats.map((s) => (
              <li key={s.worldNum} className="flex items-center gap-3">
                <span className="w-20 shrink-0 font-mono text-xs font-semibold">
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
                <span className="w-12 shrink-0 text-right font-mono text-xs font-bold">
                  {s.accuracy}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- DUEL HISTORY ---------- */}
      <section aria-labelledby="duels-h">
        <h2 id="duels-h" className="kicker mb-3">RIWAYAT DUEL 1V1</h2>
        {!duels ? (
          <div className="h-20 animate-pulse rounded bg-muted" />
        ) : duels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum pernah duel. Buka Battle Arena, bagikan kode 4 huruf, dan aduin skill dengan teman.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {duels.map((d, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-2.5">
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider",
                    d.draw
                      ? "bg-secondary text-muted-foreground"
                      : d.won
                        ? "bg-success/15 text-success"
                        : "bg-destructive/10 text-destructive",
                  )}
                >
                  {d.draw ? "DRAW" : d.won ? "WIN" : "LOSE"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">
                    vs <span className="font-semibold">{d.opponentEmoji} {d.opponent}</span>
                  </span>
                  <span className="block truncate font-mono text-[10px] text-muted-foreground">
                    {d.exerciseTitle}
                    {d.mySeconds != null ? ` · ${d.mySeconds}s` : ""}
                    {` · ${new Date(d.at).toLocaleDateString("id-ID")}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- ACHIEVEMENTS ---------- */}
      <section aria-labelledby="badges-h">
        <h2 id="badges-h" className="kicker mb-3">
          ACHIEVEMENTS · {earned.size}/{BADGES.length}
        </h2>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
          {BADGES.map((b) => {
            const has = earned.has(b.id);
            return (
              <li key={b.id} className={cn(!has && "opacity-45")}>
                <p className="text-xl leading-none" aria-hidden>{b.icon}</p>
                <p className={cn("mt-1.5 text-[13px] font-semibold", !has && "text-muted-foreground")}>
                  {has ? b.label : "???"}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{b.desc}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- PORTFOLIO ---------- */}
      <section aria-labelledby="portfolio-h">
        <h2 id="portfolio-h" className="kicker mb-3">PORTFOLIO</h2>
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Belum ada project yang disimpan di sini.
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground/80">
            Nanti, database yang kamu rancang di world Database Architect bisa dipajang
            di bagian ini — lengkap dengan skema dan query andalanmu.
          </p>
        </div>
      </section>
    </div>
  );
}
