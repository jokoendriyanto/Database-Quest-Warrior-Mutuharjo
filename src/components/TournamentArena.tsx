import { useEffect, useMemo, useRef, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { exerciseDataset } from "@/lib/curriculum";
import type { Database as SqlDatabase, RunResult } from "@/lib/sql/engine";
import { runSql, SqlError } from "@/lib/sql/engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LottieAnimation } from "@/components/ui/lottie-animation";

interface BracketMatchView {
  round: number;
  slot: number;
  playerA: { id: string; name: string; emoji: string } | null;
  playerB: { id: string; name: string; emoji: string } | null;
  subA: { correct: boolean; seconds: number } | null;
  subB: { correct: boolean; seconds: number } | null;
  winner: string | null;
  isMine: boolean;
  exercise: { id: string; title: string; instruction: string; starter: string; dataset: string } | null;
}

const ROUND_NAMES = ["Final", "Semifinal", "Perempat Final", "Babak 16"];
const roundLabel = (round: number, rounds: number) =>
  ROUND_NAMES[rounds - round] ?? `Babak ${round}`;

export default function TournamentArena({ role }: { role: string }) {
  const tournaments = useQuery(api.battle.listTournaments) ?? [];
  const joinTournament = useMutation(api.battle.joinTournament);
  const createTournament = useMutation(api.battle.createTournament);
  const startTournament = useMutation(api.battle.startTournament);
  const submitMatch = useMutation(api.battle.submitTournamentMatch);

  const [openId, setOpenId] = useState<Id<"tournaments"> | null>(null);
  const [name, setName] = useState("SQL Cup #1");
  const [size, setSize] = useState("16");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detail = useQuery(
    api.battle.getTournament,
    openId === null ? "skip" : { id: openId },
  );

  const canHost = role === "teacher" || role === "admin";

  const onCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await createTournament({ name, maxSize: Number(size) });
      setOpenId(r.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat turnamen.");
    } finally {
      setBusy(false);
    }
  };

  const onJoin = async (id: Id<"tournaments">) => {
    setBusy(true);
    setError(null);
    try {
      await joinTournament({ id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal gabung turnamen.");
    } finally {
      setBusy(false);
    }
  };

  const onStart = async (id: Id<"tournaments">) => {
    setBusy(true);
    setError(null);
    try {
      await startTournament({ id });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memulai turnamen.");
    } finally {
      setBusy(false);
    }
  };

  /* ------------------------------- list view ------------------------------ */
  if (!openId || !detail) {
    return (
      <section className="mt-8" aria-labelledby="tournament">
        <div className="flex items-baseline justify-between border-b border-border pb-2">
          <h2 id="tournament" className="text-sm font-bold uppercase tracking-wide">
            Tournament
          </h2>
          <span className="font-mono text-[11px] text-muted-foreground">SQL Cup · bracket knockout</span>
        </div>

        <ul className="divide-y divide-border">
          {tournaments.length === 0 && (
            <li className="py-4 text-sm text-muted-foreground">
              Belum ada turnamen. {canHost ? "Buat SQL Cup pertama di bawah." : "Minta gurumu membuat SQL Cup."}
            </li>
          )}
          {tournaments.map((t: any) => (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <LottieAnimation animation="trophy-shine" size="sm" className="opacity-80" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{t.name}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {t.status.toUpperCase()} · {t.playerCount}/{t.maxSize} pemain · host {t.hostName}
                  {t.championName ? ` · 🏆 ${t.championName}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {t.status === "open" && !t.joined && (
                  <Button size="sm" variant="secondary" onClick={() => onJoin(t.id)} disabled={busy}>
                    Gabung
                  </Button>
                )}
                {(t.joined || t.amHost) && (
                  <Button size="sm" variant="ghost" onClick={() => setOpenId(t.id)}>
                    Bracket →
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {canHost && (
          <div className="mt-4 rounded-md border border-dashed border-border p-4">
            <p className="text-sm font-semibold">Buat Turnamen (guru)</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="Nama turnamen"
                className="w-48"
              />
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="w-28" aria-label="Ukuran bracket">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 pemain</SelectItem>
                  <SelectItem value="8">8 pemain</SelectItem>
                  <SelectItem value="16">16 pemain</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={onCreate} disabled={busy}>
                Buat
              </Button>
            </div>
          </div>
        )}
        {error && <p className="mt-2 font-mono text-xs text-destructive">{error}</p>}
      </section>
    );
  }

  return <Bracket detail={detail} busy={busy} error={error} onStart={onStart} onBack={() => { setOpenId(null); setError(null); }} submitMatch={submitMatch} />;
}

/* ================================ bracket ================================ */

function Bracket({
  detail,
  busy,
  error,
  onStart,
  onBack,
  submitMatch,
}: {
  detail: NonNullable<ReturnType<typeof useQuery<typeof api.battle.getTournament>>>;
  busy: boolean;
  error: string | null;
  onStart: (id: Id<"tournaments">) => void;
  onBack: () => void;
  submitMatch: ReturnType<typeof useMutation<typeof api.battle.submitTournamentMatch>>;
}) {
  const rounds = useMemo(() => {
    const byRound = new Map<number, BracketMatchView[]>();
    for (const m of detail.matches) {
      const list = byRound.get(m.round) ?? [];
      list.push(m);
      byRound.set(m.round, list);
    }
    return [...byRound.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([round, matches]) => ({ round, matches: matches.sort((a, b) => a.slot - b.slot) }));
  }, [detail.matches]);

  const myMatch = detail.matches.find(
    (m: any) => m.isMine && !m.winner && m.exercise,
  );

  return (
    <section className="mt-8" aria-label="Detail turnamen">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide">🏆 {detail.name}</h2>
          <p className="font-mono text-[11px] text-muted-foreground">
            {detail.status.toUpperCase()} · {detail.players.length}/{detail.maxSize} pemain
            {detail.champion ? ` · CHAMPION: ${detail.champion.emoji} ${detail.champion.name}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {detail.amHost && detail.status === "open" && (
            <Button size="sm" onClick={() => onStart(detail.id)} disabled={busy}>
              Mulai Turnamen
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onBack}>
            ← Semua turnamen
          </Button>
        </div>
      </div>

      {/* pemain */}
      {detail.status === "open" && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {detail.players.map((p: any) => (
            <span key={p.name} className="rounded border border-border px-2 py-0.5 font-mono text-[11px]">
              {p.emoji} {p.name}
            </span>
          ))}
        </div>
      )}

      {detail.status === "open" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Menunggu pemain. Host memulai turnamen saat slot terisi — pasangan babak pertama diacak.
        </p>
      )}

      {/* bracket */}
      {detail.status !== "open" && (
        <div className="mt-4 space-y-5">
          {rounds.map(({ round, matches }) => (
            <div key={round}>
              <p className="kicker mb-1.5">{roundLabel(round, detail.rounds)}</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {matches.map((m) => (
                  <MatchCard key={`${m.round}-${m.slot}`} m={m} rounds={detail.rounds} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* fight editor untuk match-ku yang belum selesai */}
      {detail.status === "running" && myMatch && (
        <MyMatch
          key={`${myMatch.round}-${myMatch.slot}`}
          tournamentId={detail.id}
          match={myMatch}
          submitMatch={submitMatch}
        />
      )}

      {error && <p className="mt-2 font-mono text-xs text-destructive">{error}</p>}
    </section>
  );
}

function MatchCard({ m, rounds }: { m: BracketMatchView; rounds: number }) {
  const side = (
    p: BracketMatchView["playerA"],
    sub: BracketMatchView["subA"],
    isWinner: boolean,
  ) => (
    <div className={cn("flex min-w-0 items-center gap-1.5", isWinner && "text-success")}>
      <span aria-hidden className="text-sm">{p?.emoji ?? "·"}</span>
      <span className={cn("truncate text-xs", !p && "text-muted-foreground", isWinner && "font-bold")}>
        {p?.name ?? "menunggu"}
      </span>
      {sub && (
        <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
          {sub.correct ? "✓" : "✗"} {sub.seconds.toFixed(1)}s
        </span>
      )}
    </div>
  );

  return (
    <li
      className={cn(
        "rounded-md border border-border px-3 py-2",
        m.isMine && !m.winner && "border-primary",
      )}
    >
      {side(m.playerA, m.subA, m.winner === m.playerA?.id)}
      <div className="my-1 border-t border-border/60" />
      {side(m.playerB, m.subB, m.winner === m.playerB?.id)}
      {m.exercise && !m.winner && (
        <p className="mt-1.5 truncate font-mono text-[10px] text-muted-foreground">
          {m.round === rounds ? "FINAL · " : ""}{m.exercise.title}
        </p>
      )}
    </li>
  );
}

/* =============================== my match ================================ */

function MyMatch({
  tournamentId,
  match,
  submitMatch,
}: {
  tournamentId: Id<"tournaments">;
  match: BracketMatchView;
  submitMatch: ReturnType<typeof useMutation<typeof api.battle.submitTournamentMatch>>;
}) {
  const [sql, setSql] = useState(match.exercise?.starter ?? "");
  const [preview, setPreview] = useState<{ res: RunResult | null; err: string | null }>({
    res: null,
    err: null,
  });
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<{ won: boolean; champion: boolean; xpAwarded: number } | null>(null);
  const startRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    startRef.current = performance.now();
    const iv = setInterval(() => setElapsed((performance.now() - startRef.current) / 1000), 100);
    return () => clearInterval(iv);
  }, []);

  const runLocal = () => {
    if (!match.exercise) return;
    try {
      const res = runSql(
        sql,
        JSON.parse(JSON.stringify(exerciseDataset(match.exercise.id))) as SqlDatabase,
      );
      setPreview({ res, err: null });
    } catch (err) {
      setPreview({ res: null, err: err instanceof SqlError ? err.message : String(err) });
    }
  };

  const lock = async () => {
    if (!match.exercise) return;
    setLocking(true);
    setError(null);
    try {
      const r = await submitMatch({
        id: tournamentId,
        matchRound: match.round,
        matchSlot: match.slot,
        sqlText: sql,
        elapsedSeconds: (performance.now() - startRef.current) / 1000,
      });
      if (r.resolved) setOutcome({ won: r.won, champion: r.champion, xpAwarded: r.xpAwarded });
      else setError("Menunggu lawan mengunci jawaban…");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengirim jawaban.");
    } finally {
      setLocking(false);
    }
  };

  const opponent = match.playerA && match.playerB
    ? (match.subA ? match.playerB : match.playerA)
    : null;

  return (
    <div className="mt-5 rounded-lg border border-primary bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <p className="kicker text-primary">
          {outcome?.champion ? "FINAL SELESAI" : "MATCH KAMU"} · {match.exercise?.title}
        </p>
        <span className="font-mono text-xs font-bold tabular-nums">{elapsed.toFixed(1)}s</span>
      </div>

      {outcome ? (
        <div className="p-4">
          <p className={cn("kicker", outcome.won ? "text-success" : "text-destructive")}>
            {outcome.won ? (outcome.champion ? "🏆 CHAMPION!" : "VICTORY — LOLOS KE BABAK BERIKUTNYA") : "DEFEAT"}
          </p>
          {outcome.xpAwarded > 0 && (
            <p className="mt-2 font-mono text-sm font-bold text-primary">+{outcome.xpAwarded} XP</p>
          )}
        </div>
      ) : (
        <>
          <p className="border-b border-border px-4 py-2 text-sm leading-relaxed">
            {match.exercise?.instruction}
          </p>
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
            rows={6}
            aria-label="Editor SQL turnamen"
            className="block w-full resize-y bg-card p-3 font-mono text-sm outline-none"
          />
          {preview.err && (
            <p className="border-t border-border px-3 py-1.5 font-mono text-xs text-destructive">
              {preview.err}
            </p>
          )}
          {preview.res && !preview.err && (
            <p className="border-t border-border px-3 py-1.5 font-mono text-xs text-success">
              ✓ jalan · {preview.res.kind === "select" ? `${preview.res.rows.length} rows` : preview.res.message}
            </p>
          )}
          <div className="flex items-center justify-between border-t border-border bg-sidebar px-3 py-2">
            <span className="font-mono text-[10px] text-muted-foreground">
              {opponent ? `vs ${opponent.name} · benar + lebih cepat menang` : "menunggu data lawan…"}
            </span>
            <Button size="sm" onClick={lock} disabled={locking}>
              {locking ? "Mengunci…" : "Kunci Jawaban"}
            </Button>
          </div>
        </>
      )}
      {error && <p className="border-t border-border px-3 py-1.5 font-mono text-xs text-warning">{error}</p>}
    </div>
  );
}
