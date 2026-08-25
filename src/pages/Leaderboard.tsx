import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const entries = useQuery(api.game.leaderboard);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-black tracking-tight">🏆 Leaderboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Peringkat belajar berdasarkan XP — gabungan latihan, lesson, dan battle.
        </p>
      </header>

      {/* tabs (battle & tournament menyusul) */}
      <div className="clay-inset grid w-fit grid-cols-3 gap-1 rounded-2xl p-1 text-xs font-extrabold">
        <span className="clay-btn rounded-xl bg-primary px-4 py-1.5 text-primary-foreground">Learning</span>
        <span className="cursor-not-allowed rounded-xl px-4 py-1.5 text-muted-foreground">Battle 🔒</span>
        <span className="cursor-not-allowed rounded-xl px-4 py-1.5 text-muted-foreground">Turnamen 🔒</span>
      </div>

      {!entries && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-3xl bg-muted/60" />
          ))}
        </div>
      )}

      {entries && entries.length === 0 && (
        <div className="clay p-10 text-center">
          <p className="text-4xl" aria-hidden>👀</p>
          <p className="mt-3 font-extrabold">Belum ada ranking nih.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Saatnya jadi nama pertama di sini — mulai dari lesson pertama!
          </p>
        </div>
      )}

      {entries && entries.length > 0 && (
        <ol className="flex flex-col gap-2.5">
          {entries.map((e, i) => (
            <li
              key={e.username}
              className={cn(
                "flex items-center gap-3 rounded-3xl px-4 py-3",
                i === 0 ? "clay-flat" : i < 20 ? "clay-sm" : "bg-muted/50",
              )}
            >
              <span className="w-8 shrink-0 text-center text-base font-black">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
              </span>
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary text-xl" aria-hidden>
                {e.avatarEmoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold">{e.name}</p>
                <p className="truncate text-[11px] font-bold text-muted-foreground">
                  {e.rankEmoji} {e.rank}
                  {e.className && ` · ${e.className}`}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-sm font-black text-primary">{e.xp.toLocaleString()}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Level {e.level} · XP
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <p className="flex items-start gap-2 rounded-3xl bg-muted/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <Trophy className="mt-0.5 size-4 shrink-0" />
        Papan Battle (Battle Rating) & Turnamen (Championship Points) akan punya leaderboard terpisah
        begitu fitur realtime duel dirilis. XP belajarmu aman — nggak akan turun gara-gara kalah battle.
      </p>
    </div>
  );
}
