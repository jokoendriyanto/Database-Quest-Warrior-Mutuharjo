import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Timer, Play, RefreshCw, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOTS, type BotDef, botByKey } from "@/lib/game";
import { battlePool, type Exercise } from "@/lib/curriculum";
import { exerciseDataset } from "@/lib/data/datasets";
import { runSql, SqlError } from "@/lib/sql/engine";
import { cn } from "@/lib/utils";

type Phase = "lobby" | "countdown" | "active" | "result";

interface MatchOutcome {
  won: boolean;
  correct: boolean;
  copy: string;
  xpAwarded: number;
  playerSeconds: number;
  botFinishSec: number;
}

export default function BattlePage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight">⚔️ Battle Arena</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Lawan bot dulu buat panas. Realtime duel lawan siswa & turnamen? Segera hadir.
        </p>
      </header>
      <BattleArena />
    </div>
  );
}

function BattleArena() {
  const [phase, setPhase] = useState<Phase>("lobby");
  const [bot, setBot] = useState<BotDef | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [outcome, setOutcome] = useState<MatchOutcome | null>(null);
  const pool = useMemo(() => battlePool(), []);

  const startMatch = (b: BotDef) => {
    const ex = pool[Math.floor(Math.random() * pool.length)];
    setBot(b);
    setExercise(ex);
    setOutcome(null);
    setPhase("countdown");
  };

  if (phase === "lobby" || !bot || !exercise) {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BOTS.map((b) => (
            <motion.button
              key={b.key}
              whileHover={{ y: -3 }}
              onClick={() => startMatch(b)}
              className="clay p-5 text-left"
            >
              <div className="flex items-center justify-between">
                <span
                  className="grid size-12 place-items-center rounded-2xl text-2xl"
                  style={{ backgroundColor: b.color }}
                  aria-hidden
                >
                  {b.emoji}
                </span>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-secondary-foreground">
                  {b.difficulty}
                </span>
              </div>
              <h3 className="mt-3 font-extrabold">{b.name}</h3>
              <p className="mt-1 text-xs italic leading-relaxed text-muted-foreground">"{b.taunt}"</p>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-primary">
                <Swords className="size-3.5" /> Menang pertama: +100 XP · rematch +10 XP
              </p>
            </motion.button>
          ))}
        </div>

        <div className="clay flex flex-col items-center gap-2 p-6 text-center opacity-80 sm:flex-row sm:text-left">
          <Users className="size-8 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-extrabold">Realtime 1v1 & Turnamen — Segera Hadir 🏗️</p>
            <p className="text-xs text-muted-foreground">
              Duel langsung antar siswa dengan matchmaking peringkat sedang disiapkan. Latihan dulu sama bot ya!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const db = exerciseDataset(exercise.id);

  return (
    <AnimatePresence mode="wait">
      {phase === "countdown" ? (
        <Countdown key="cd" onDone={() => setPhase("active")} />
      ) : (
        <MatchScreen
          key={`m-${exercise.id}`}
          bot={bot}
          exercise={exercise}
          db={db as never}
          outcome={outcome}
          onSubmit={async (sqlText, elapsedSeconds) => {
            const res = await playBotMatchFn({ botKey: bot.key, exerciseId: exercise.id, sqlText, elapsedSeconds });
            setPhase("result");
            setOutcome(res.outcome);
            return res.correctNow;
          }}
          onRematch={() => startMatch(bot)}
          onExit={() => setPhase("lobby")}
        />
      )}
    </AnimatePresence>
  );
}

let playBotMatchFn: (a: { botKey: string; exerciseId: string; sqlText: string; elapsedSeconds: number }) => Promise<{ correctNow: boolean; outcome: MatchOutcome }> = async () => ({ correctNow: false, outcome: null as unknown as MatchOutcome });

function Countdown({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    if (n === 0) {
      const t = setTimeout(onDone, 450);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((x) => x - 1), 800);
    return () => clearTimeout(t);
  }, [n, onDone]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="clay grid min-h-72 place-items-center p-10"
    >
      <motion.p
        key={n}
        initial={{ scale: 2.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-7xl font-black text-primary"
      >
        {n === 0 ? "QUERY! ⚔️" : n}
      </motion.p>
    </motion.div>
  );
}

function MatchScreen({
  bot,
  exercise,
  db,
  outcome,
  onSubmit,
  onRematch,
  onExit,
}: {
  bot: BotDef;
  exercise: Exercise;
  db: Record<string, { name: string; columns: string[]; rows: Record<string, unknown>[] }>;
  outcome: MatchOutcome | null;
  onSubmit: (sql: string, elapsedSeconds: number) => Promise<boolean>;
  onRematch: () => void;
  onExit: () => void;
}) {
  const [sql, setSql] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const startedAt = useRef(Date.now());
  const finished = outcome !== null;

  // simulasi visual progres bot — hasil akhir tetap divalidasi server
  const botFinish = useMemo(() => bot.timeRange[0] + Math.random() * (bot.timeRange[1] - bot.timeRange[0]), [bot]);

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setElapsed((Date.now() - startedAt.current) / 1000), 100);
    return () => clearInterval(t);
  }, [finished]);

  const handleSubmit = async () => {
    if (!sql.trim()) {
      toast.error("Query-nya masih kosong nih.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(sql, elapsed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim jawaban.");
    } finally {
      setSubmitting(false);
    }
  };

  const botPct = Math.min(100, (elapsed / botFinish) * 100);

  if (outcome) {
    return (
      <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="clay-flat p-8 text-center">
        <p className="text-6xl" aria-hidden>{outcome.won ? "🏆" : "😤"}</p>
        <h2 className={cn("mt-3 text-3xl font-black", outcome.won ? "text-green-600 dark:text-green-400" : "text-orange-500")}>
          {outcome.won ? "VICTORY!" : "BELUM KALI INI"}
        </h2>
        <p className="mx-auto mt-2 max-w-md whitespace-pre-line text-sm font-semibold leading-relaxed text-muted-foreground">
          {outcome.copy}
        </p>
        <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-2 text-center">
          <Stat label="Waktumu" value={`${outcome.playerSeconds}s`} />
          <Stat label={`${bot.name} selesai`} value={`${outcome.botFinishSec}s`} />
          <Stat label="XP" value={outcome.xpAwarded > 0 ? `+${outcome.xpAwarded}` : "+0"} />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <Button onClick={onRematch} className="clay-btn rounded-2xl bg-primary font-extrabold">
            <RefreshCw className="size-4" /> Rematch
          </Button>
          <Button variant="secondary" onClick={onExit} className="rounded-2xl font-extrabold">
            Back to Arena
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* scoreboard */}
      <div className="clay p-4 sm:p-5">
        <div className="flex items-end justify-between gap-4">
          <PlayerSide name="Kamu" sub="SQL Challenger" progress={Math.min(100, (elapsed / Math.max(botFinish, 20)) * 60)} emoji="🧑‍💻" />
          <div className="pb-1 text-center">
            <p className="flex items-center justify-center gap-1 font-mono text-xl font-black tabular-nums text-primary">
              <Timer className="size-4" />
              {elapsed.toFixed(1)}s
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Best of 1</p>
          </div>
          <PlayerSide name={bot.name} sub={bot.difficulty} progress={botPct} emoji={bot.emoji} alignRight />
        </div>
      </div>

      {/* mission */}
      <div className="clay-sm p-4">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Misi Battle</p>
        <p className="mt-1 text-sm font-bold leading-relaxed">{exercise.instruction}</p>
      </div>

      {/* editor */}
      <div className="clay-sm overflow-visible">
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          spellCheck={false}
          rows={4}
          aria-label="Editor battle"
          placeholder="-- Tulis query-mu di sini, cepat! ⏱️"
          className="w-full resize-none bg-transparent p-4 font-mono text-sm outline-none"
        />
        <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5">
          <p className="hidden text-[11px] text-muted-foreground sm:block">
            Tabel: {Object.keys(db).join(", ")}
          </p>
          <Button onClick={handleSubmit} disabled={submitting} className="clay-btn ml-auto rounded-xl bg-primary font-extrabold">
            <Play className="size-4" /> {submitting ? "Memeriksa..." : "SUBMIT!"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-background/60 p-2.5 shadow-inner">
      <p className="font-mono text-base font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function PlayerSide({
  name,
  sub,
  progress,
  emoji,
  alignRight,
}: {
  name: string;
  sub: string;
  progress: number;
  emoji: string;
  alignRight?: boolean;
}) {
  return (
    <div className={cn("min-w-0 flex-1", alignRight && "text-right")}>
      <p className="flex items-center gap-1.5 truncate text-sm font-extrabold">
        {!alignRight && <span aria-hidden>{emoji}</span>}
        {name}
        {alignRight && <span aria-hidden>{emoji}</span>}
      </p>
      <p className="truncate text-[11px] font-bold text-muted-foreground">{sub}</p>
      <div className="clay-inset mt-2 h-3 overflow-hidden rounded-full p-0.5">
        <div
          className={cn("h-full rounded-full transition-all duration-200", alignRight ? "bg-red-400/80 ml-auto" : "bg-green-400/90")}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
}

/** Wire the mutation into the module-level hook used by BattleArena. */
export function BattleArenaWithMutation() {
  const playBotMatch = useMutation(api.game.playBotMatch);
  playBotMatchFn = async ({ botKey, exerciseId, sqlText, elapsedSeconds }) => {
    try {
      // validasi lokal dulu biar feedback error instan
      const db = exerciseDataset(exerciseId);
      let localOk = true;
      try {
        runSql(sqlText, JSON.parse(JSON.stringify(db)));
      } catch (e) {
        if (e instanceof SqlError) {
          localOk = false;
          toast.error(e.message, { description: e.suggestion });
        }
      }
      const res = await playBotMatch({ botKey, exerciseId, sqlText, elapsedSeconds });
      return {
        correctNow: res.correct,
        outcome: {
          won: res.won,
          correct: res.correct,
          copy:
            !localOk && !res.correct
              ? "Query-nya belum jalan sempurna. Cek pesan errornya lalu rematch ya!"
              : res.victoryCopy,
          xpAwarded: res.xpAwarded,
          playerSeconds: res.playerSeconds,
          botFinishSec: res.botFinishSec,
        },
      };
    } catch (err) {
      throw err instanceof Error ? err : new Error("Battle gagal diproses.");
    }
  };
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-black tracking-tight">⚔️ Battle Arena</h1>
        <p className="mt-1 text-sm text-muted-foreground">Lawan bot dulu buat panas.</p>
      </header>
      <BattleArena />
    </div>
  );
}

void botByKey;
void Trophy;
