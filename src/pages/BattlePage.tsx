import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Play } from "lucide-react";
import {
  battlePool,
  exerciseDataset,
  getExercise,
} from "@/lib/curriculum";
import type { Exercise } from "@/lib/curriculum";
import type { Database as SqlDatabase, RunResult } from "@/lib/sql/engine";
import { runSql, SqlError } from "@/lib/sql/engine";
import { BOTS, botByKey, tierFromWins, type BotDef } from "@/lib/game";
import { Button } from "@/components/ui/button";
import DuelArena from "@/components/DuelArena";
import TournamentArena from "@/components/TournamentArena";
import WeeklyBossArena from "@/components/WeeklyBossArena";
import ClassroomMode from "@/components/ClassroomMode";
import { cn } from "@/lib/utils";

type Phase = "home" | "countdown" | "fight" | "result";

interface MatchResult {
  correct: boolean;
  won: boolean;
  botName: string;
  botFinishSec: number;
  playerSeconds: number;
  xpAwarded: number;
  victoryCopy: string;
}

function fmt(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}

export default function BattlePage() {
  const data = useQuery(api.game.dashboard);
  const playBotMatch = useMutation(api.game.playBotMatch);
  const pool = useMemo(() => battlePool(), []);

  const [phase, setPhase] = useState<Phase>("home");
  const [bot, setBot] = useState<BotDef | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [sql, setSql] = useState("");
  const [preview, setPreview] = useState<{ res: RunResult | null; err: string | null }>({ res: null, err: null });
  const [result, setResult] = useState<MatchResult | null>(null);
  const [locking, setLocking] = useState(false);
  const startRef = useRef(0);

  /* ------------------------------ match flow ----------------------------- */

  const startMatch = (b: BotDef) => {
    const ex = pool[Math.floor(Math.random() * pool.length)];
    setBot(b);
    setExercise(ex);
    setSql(ex.starter);
    setPreview({ res: null, err: null });
    setResult(null);
    setCountdown(3);
    setPhase("countdown");
  };

  // hitung mundur 3-2-1 lalu mulai
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown === 0) {
      startRef.current = performance.now();
      setElapsed(0);
      setPhase("fight");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 700);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // timer
  useEffect(() => {
    if (phase !== "fight") return;
    const iv = setInterval(
      () => setElapsed((performance.now() - startRef.current) / 1000),
      100,
    );
    return () => clearInterval(iv);
  }, [phase]);

  const lockAnswer = async () => {
    if (!bot || !exercise) return;
    setLocking(true);
    try {
      const seconds = (performance.now() - startRef.current) / 1000;
      const r = await playBotMatch({
        botKey: bot.key,
        exerciseId: exercise.id,
        sqlText: sql,
        elapsedSeconds: seconds,
      });
      setResult({
        correct: r.correct,
        won: r.won,
        botName: r.botName,
        botFinishSec: r.botFinishSec,
        playerSeconds: r.playerSeconds,
        xpAwarded: r.xpAwarded,
        victoryCopy: r.victoryCopy,
      });
      setPhase("result");
    } catch (err) {
      setPreview({ res: null, err: err instanceof Error ? err.message : "Gagal mengirim jawaban." });
    } finally {
      setLocking(false);
    }
  };

  const runLocal = () => {
    if (!exercise) return;
    try {
      const res = runSql(sql, JSON.parse(JSON.stringify(exerciseDataset(exercise.id))));
      setPreview({ res, err: null });
    } catch (err) {
      setPreview({
        res: null,
        err: err instanceof SqlError ? err.message : String(err),
      });
    }
  };

  /* -------------------------------- HOME -------------------------------- */

  if (phase === "home" || !data) {
    const tier = tierFromWins(data?.stats.botWins ?? 0);
    return (
      <div className="mx-auto max-w-3xl">
        <header>
          <p className="kicker text-battle">BATTLE ARENA</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {tier.name}{" "}
            <span className="font-mono text-sm font-medium text-muted-foreground">
              · {data ? `${data.stats.botWins}W / ${data.stats.botLosses}L` : "…"}
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Praktik dulu lawan bot. Nanti giliran teman sekelas.
          </p>
        </header>

        {/* VS BOT — satu-satunya mode aktif */}
        <section className="mt-8" aria-labelledby="vs-bot">
          <div className="flex items-baseline justify-between border-b border-border pb-2">
            <h2 id="vs-bot" className="text-sm font-bold uppercase tracking-wide">VS BOT</h2>
            <span className="font-mono text-[11px] text-muted-foreground">latihan — tanpa rating</span>
          </div>
          <ul className="divide-y divide-border">
            {BOTS.map((b) => (
              <li key={b.key} className="flex items-center gap-4 py-3">
                {/* avatar geometris sederhana */}
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center border font-mono text-sm font-bold"
                  style={{ borderColor: b.color }}
                >
                  {b.name.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{b.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {b.difficulty.toUpperCase()} · respon {b.timeRange[0]}–{b.timeRange[1]}s
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => startMatch(b)}>
                  <Play className="size-3.5" /> Lawan
                </Button>
              </li>
            ))}
          </ul>
        </section>

        {/* CLASSROOM MODE — sesi kelas */}
        {data && <ClassroomMode role={data.user.role} />}

        {/* WEEKLY BOSS — challenge mingguan */}
        <WeeklyBossArena />

        {/* PRIVATE DUEL — live 1v1 via kode */}
        <DuelArena />

        {/* TOURNAMENT — SQL Cup bracket */}
        {data && <TournamentArena role={data.user.role} />}
      </div>
    );
  }

  /* ------------------------------ COUNTDOWN ------------------------------ */

  if (phase === "countdown" && bot && exercise) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <p className="kicker">MATCH FOUND</p>
          <div className="mt-6 flex items-center justify-center gap-8">
            <PlayerBadge name="KAMU" sub={`LV ${data.stats.exercisesDone}`} />
            <span className="font-mono text-lg font-bold text-muted-foreground">VS</span>
            <PlayerBadge name={bot.name.toUpperCase()} sub={bot.difficulty.toUpperCase()} color={bot.color} />
          </div>
          <p className="mt-8 font-mono text-5xl font-bold tabular-nums">
            {countdown > 0 ? countdown : "GO"}
          </p>
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            {exercise.title}
          </p>
        </div>
      </div>
    );
  }

  /* -------------------------------- FIGHT -------------------------------- */

  if (phase === "fight" && bot && exercise) {
    const botBarPct = Math.min(95, (elapsed / bot.timeRange[1]) * 100);
    return (
      <div className="mx-auto max-w-4xl">
        {/* scoreboard */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-stretch justify-between gap-4 px-4 py-3">
            <ScoreSide name="KAMU" value={fmt(elapsed)} />
            <div className="flex flex-col items-center justify-center">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                ROUND 1 · LIVE
              </span>
              <span className="font-mono text-2xl font-bold tabular-nums">{elapsed.toFixed(1)}s</span>
            </div>
            <ScoreSide name={bot.name.toUpperCase()} value={`${bot.timeRange[0]}–${bot.timeRange[1]}s`} align="right" color={bot.color} />
          </div>
          <div className="grid grid-cols-2 gap-x-4 px-4 pb-3">
            <ProgressBar pct={Math.min(100, (elapsed / 120) * 100)} />
            <ProgressBar pct={botBarPct} color={bot.color} />
          </div>
        </div>

        {/* mission */}
        <div className="mt-5">
          <p className="kicker mb-1.5">MISSION</p>
          <p className="max-w-prose text-sm leading-relaxed">{exercise.instruction}</p>
        </div>

        {/* editor — pusat perhatian */}
        <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-sidebar px-3 py-1.5">
            <span className="font-mono text-[11px] font-semibold text-primary">battle.sql</span>
            <button onClick={runLocal} className="font-mono text-[10px] text-muted-foreground hover:text-foreground">
              test run ⌘↵
            </button>
          </div>
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                runLocal();
              }
            }}
            spellCheck={false}
            autoCapitalize="off"
            rows={7}
            aria-label="SQL battle editor"
            className="block w-full resize-y bg-card p-3 font-mono text-sm outline-none"
          />
          {preview.err && (
            <p className="border-t border-border px-3 py-1.5 font-mono text-xs text-destructive">
              {preview.err}
            </p>
          )}
          {preview.res && !preview.err && (
            <p className="border-t border-border px-3 py-1.5 font-mono text-xs text-success">
              ✓ jalan · {preview.res.kind === "select" ? `${preview.res.rows.length} rows` : preview.res.message} — yakin? kunci jawabanmu.
            </p>
          )}
          <div className="flex items-center justify-between border-t border-border bg-sidebar px-3 py-2">
            <span className="font-mono text-[10px] text-muted-foreground">
              jawaban divalidasi server saat dikunci
            </span>
            <Button size="sm" onClick={lockAnswer} disabled={locking}>
              {locking ? "Mengunci…" : "Kunci Jawaban"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------- RESULT ------------------------------- */

  if (phase === "result" && result && bot) {
    return (
      <div className="mx-auto max-w-xl">
        <div className={cn("rounded-lg border p-6", result.won ? "border-success/50 bg-success/5" : "border-warning/50 bg-warning/5")}>
          <p className={cn("kicker", result.won ? "text-success" : "text-warning")}>
            {result.won ? "VICTORY" : "DEFEAT"}
          </p>
          <div className="mt-4 grid grid-cols-3 items-end gap-2 text-center">
            <div>
              <p className="font-mono text-2xl font-bold tabular-nums">{result.playerSeconds.toFixed(1)}s</p>
              <p className="kicker mt-1">KAMU</p>
            </div>
            <span className="pb-4 font-mono text-xs text-muted-foreground">VS</span>
            <div>
              <p className="font-mono text-2xl font-bold tabular-nums" style={{ color: bot.color }}>
                {result.botFinishSec}s
              </p>
              <p className="kicker mt-1">{bot.name.toUpperCase()}</p>
            </div>
          </div>
          {!result.correct && (
            <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
              Query belum sesuai — cek hint di lesson terkait, lalu rematch.
            </p>
          )}
          <p className="mt-3 whitespace-pre-line text-sm text-secondary-foreground">{result.victoryCopy}</p>
          {result.xpAwarded > 0 && (
            <p className="mt-2 font-mono text-sm font-bold text-primary">+{result.xpAwarded} XP</p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <Button onClick={() => startMatch(bot)}>Rematch</Button>
          <Button variant="secondary" onClick={() => startMatch(bot)}>
            Lawan bot lain
          </Button>
          <Link
            to="/dashboard"
            className="ml-auto self-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

/* ------------------------------ small parts ------------------------------ */

function PlayerBadge({ name, sub, color }: { name: string; sub: string; color?: string }) {
  return (
    <div className="min-w-24">
      <span
        aria-hidden
        className="mx-auto block size-10 border"
        style={{ borderColor: color ?? "var(--primary)" }}
      />
      <p className="mt-2 text-center font-mono text-sm font-bold tracking-wide">{name}</p>
      <p className="text-center font-mono text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function ScoreSide({
  name,
  value,
  align = "left",
  color,
}: {
  name: string;
  value: string;
  align?: "left" | "right";
  color?: string;
}) {
  return (
    <div className={align === "right" ? "text-right" : ""}>
      <p className="kicker">{name}</p>
      <p className="mt-0.5 truncate font-mono text-xs" style={color ? { color } : undefined}>
        {value}
      </p>
    </div>
  );
}

function ProgressBar({ pct, color }: { pct: number; color?: string }) {
  return (
    <div className="inset-track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full transition-all duration-200"
        style={{ width: `${Math.max(2, Math.min(100, pct))}%`, background: color ?? "var(--primary)" }}
      />
    </div>
  );
}
