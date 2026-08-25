import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Leaderboard() {
  const board = useQuery(api.game.leaderboard);
  const dash = useQuery(api.game.dashboard);

  if (!board || !dash) {
    return (
      <div className="mx-auto max-w-3xl space-y-2" aria-busy>
        <div className="h-8 w-52 animate-pulse rounded bg-muted" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-9 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  const myPos = dash.leaderboardPosition;
  const inTop = myPos >= 1 && myPos <= board.length;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <p className="kicker">SEASON 01</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Leaderboard XP</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Peringkat berdasarkan total XP. Naik lewat lesson, latihan, dan menang battle.
        </p>
      </header>

      {board.length === 0 ? (
        <div className="border-y border-border py-12">
          <p className="text-sm font-semibold">Belum ada ranking.</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Selesaikan challenge pertama dan jadilah nama pertama di papan ini.
          </p>
          <Link
            to="/learn"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Mulai Challenge
          </Link>
        </div>
      ) : (
        <>
          {/* header tabel */}
          <div className="grid grid-cols-[2.5rem_1fr_9rem_5rem] items-baseline border-b border-border pb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>#</span>
            <span>Student</span>
            <span>Rank</span>
            <span className="text-right">XP</span>
          </div>

          <ul>
            {board.map((e, i) => {
              const pos = i + 1;
              const isMe = dash.user.username && e.username === dash.user.username;
              const top3 = pos <= 3;
              return (
                <li
                  key={e.username}
                  className={`grid grid-cols-[2.5rem_1fr_9rem_5rem] items-center gap-x-2 border-b border-border/60 py-2.5 ${
                    top3 ? "" : ""
                  } ${isMe ? "bg-accent/40 -mx-3 px-3 rounded-md" : ""}`}
                >
                  <span
                    className={`font-mono tabular-nums ${
                      top3 ? "text-lg font-bold text-foreground" : "text-xs text-muted-foreground"
                    }`}
                  >
                    {String(pos).padStart(2, "0")}
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <span aria-hidden className="text-base leading-none">{e.avatarEmoji}</span>
                    <span className="min-w-0">
                      <span className={`block truncate text-sm ${top3 ? "font-bold" : "font-medium"}`}>
                        {e.name}
                      </span>
                      <span className="block truncate font-mono text-[10px] text-muted-foreground">
                        @{e.username}
                        {e.className ? ` · ${e.className}` : ""}
                      </span>
                    </span>
                  </span>
                  <span className="truncate font-mono text-[11px] text-muted-foreground">
                    {e.rankEmoji} {e.rank}
                  </span>
                  <span className="text-right font-mono text-sm font-semibold tabular-nums">
                    {e.xp.toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* posisiku kalau di luar daftar */}
          {!inTop && myPos > 0 && (
            <div className="sticky bottom-20 mt-4 lg:bottom-4">
              <div className="grid grid-cols-[2.5rem_1fr_9rem_5rem] items-center gap-x-2 rounded-md border border-primary bg-card px-3 py-2 shadow-md lg:px-0">
                <span className="font-mono text-sm font-bold tabular-nums">{myPos}</span>
                <span className="flex min-w-0 items-center gap-2">
                  <span aria-hidden>{dash.user.avatarEmoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">YOUR POSITION · {dash.user.name}</span>
                  </span>
                </span>
                <span className="hidden font-mono text-[11px] text-muted-foreground sm:block">
                  LV {dash.level}
                </span>
                <span className="text-right font-mono text-sm font-semibold tabular-nums">
                  {dash.stats.xp.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
