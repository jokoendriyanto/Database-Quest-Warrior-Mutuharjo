import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type Tab = "global" | "class" | "ranked";

const TABS: { key: Tab; label: string }[] = [
  { key: "global", label: "Global XP" },
  { key: "class", label: "Kelasku" },
  { key: "ranked", label: "Ranked Duel" },
];

interface Entry {
  username: string;
  name: string;
  className: string;
  avatarEmoji: string;
  xp: number;
  rating: number;
  duelWins: number;
  duelLosses: number;
  level: number;
  rank: string;
  rankEmoji: string;
}

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>("global");
  const dash = useQuery(api.game.dashboard);
  const myClass = dash?.user.className ?? "";

  const board = useQuery(
    api.game.leaderboard,
    tab === "class" ? { className: myClass, mode: "xp" } : tab === "ranked" ? { mode: "rating" } : {},
  ) as Entry[] | undefined;

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

  const ranked = tab === "ranked";
  const myUsername = dash.user.username;
  const myPos = board.findIndex((e) => e.username === myUsername);
  const inTop = myPos >= 0;
  const subtitle =
    tab === "global"
      ? "Peringkat berdasarkan total XP. Naik lewat lesson, latihan, dan menang battle."
      : tab === "class"
        ? myClass
          ? `Peringkat XP khusus ${myClass}. Kalahkan teman sekelasmu.`
          : "Kamu belum punya kelas — lengkapi profil untuk ikut papan kelas."
        : "Peringkat rating duel (ELO). Menang duel & match turnamen untuk menaikkan rating.";

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-5">
        <p className="kicker">{ranked ? "PVP LADDER" : tab === "class" ? "CLASS BOARD" : "SEASON 01"}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {ranked ? "Leaderboard Ranked" : "Leaderboard XP"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </header>

      {/* tab switcher */}
      <div className="mb-5 inline-flex rounded-md border border-border bg-card p-0.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors ${
              tab === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {board.length === 0 ? (
        <div className="border-y border-border py-12">
          <p className="text-sm font-semibold">
            {tab === "class" && !myClass
              ? "Kamu belum tergabung di kelas."
              : ranked
                ? "Belum ada duel tercatat."
                : "Belum ada ranking."}
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {ranked
              ? "Menang duel 1v1 atau match turnamen untuk masuk ladder ranked."
              : "Selesaikan challenge pertama dan jadilah nama pertama di papan ini."}
          </p>
          <Link
            to={ranked ? "/battle" : "/learn"}
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {ranked ? "Masuk Arena" : "Mulai Challenge"}
          </Link>
        </div>
      ) : (
        <>
          {/* header tabel */}
          <div className="grid grid-cols-[2.5rem_1fr_8rem_5.5rem] items-baseline border-b border-border pb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>#</span>
            <span>Student</span>
            <span>Rank</span>
            <span className="text-right">{ranked ? "Rating" : "XP"}</span>
          </div>

          <ul>
            {board.map((e, i) => {
              const pos = i + 1;
              const isMe = myUsername && e.username === myUsername;
              const top3 = pos <= 3;
              return (
                <li
                  key={e.username}
                  className={`grid grid-cols-[2.5rem_1fr_8rem_5.5rem] items-center gap-x-2 border-b border-border/60 py-2.5 ${
                    isMe ? "-mx-3 rounded-md bg-accent/40 px-3" : ""
                  }`}
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
                        {ranked ? ` · ${e.duelWins}W/${e.duelLosses}L` : ""}
                      </span>
                    </span>
                  </span>
                  <span className="truncate font-mono text-[11px] text-muted-foreground">
                    {ranked ? `LV ${e.level}` : `${e.rankEmoji} ${e.rank}`}
                  </span>
                  <span className="text-right font-mono text-sm font-semibold tabular-nums">
                    {(ranked ? e.rating : e.xp).toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* posisiku kalau di luar daftar (hanya global XP yang punya posisi server) */}
          {!inTop && tab === "global" && dash.leaderboardPosition > 0 && (
            <div className="sticky bottom-20 mt-4 lg:bottom-4">
              <div className="grid grid-cols-[2.5rem_1fr_8rem_5.5rem] items-center gap-x-2 rounded-md border border-primary bg-card px-3 py-2 shadow-md lg:px-0">
                <span className="font-mono text-sm font-bold tabular-nums">{dash.leaderboardPosition}</span>
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
          {ranked && !inTop && (
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              Rating-mu: {dash.stats.duelRating} · {dash.stats.duelWins}W/{dash.stats.duelLosses}L
              {dash.stats.duelDraws ? `/${dash.stats.duelDraws}D` : ""} — menang satu duel untuk masuk ladder.
            </p>
          )}
        </>
      )}
    </div>
  );
}
