import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { exerciseDataset } from "@/lib/curriculum";
import type { Database as SqlDatabase, RunResult } from "@/lib/sql/engine";
import { runSql, SqlError } from "@/lib/sql/engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  LottieAnimation,
  XpGainAnimation,
} from "@/components/ui/lottie-animation";

function fmt(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}

export default function DuelArena() {
  const createDuel = useMutation(api.battle.createDuel);
  const joinDuel = useMutation(api.battle.joinDuel);
  const cancelDuel = useMutation(api.battle.cancelDuel);
  const submitDuel = useMutation(api.battle.submitDuel);

  const [code, setCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<
    { won: boolean; draw: boolean; xpAwarded: number } | null
  >(null);

  const duel = useQuery(
    api.battle.getDuel,
    code === null ? "skip" : { code },
  );

  /* fight state */
  const [sql, setSql] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [preview, setPreview] = useState<{ res: RunResult | null; err: string | null }>({
    res: null,
    err: null,
  });
  const [locking, setLocking] = useState(false);
  const [waitingOpponent, setWaitingOpponent] = useState(false);
  const startRef = useRef(0);
  const fightStartedRef = useRef(false);

  // mulai timer saat duel berubah jadi "fighting"
  useEffect(() => {
    if (duel?.status === "fighting" && !fightStartedRef.current) {
      fightStartedRef.current = true;
      startRef.current = performance.now();
      setElapsed(0);
      setSql(duel.exercise?.starter ?? "");
      setPreview({ res: null, err: null });
      setOutcome(null);
      setWaitingOpponent(false);
    }
    if (duel?.status === "waiting" && fightStartedRef.current) {
      fightStartedRef.current = false;
    }
  }, [duel?.status, duel?.exercise?.starter]);

  // timer jalan saat fighting dan aku belum kunci
  useEffect(() => {
    if (duel?.status !== "fighting" || waitingOpponent) return;
    const iv = setInterval(
      () => setElapsed((performance.now() - startRef.current) / 1000),
      100,
    );
    return () => clearInterval(iv);
  }, [duel?.status, waitingOpponent]);

  const reset = () => {
    setCode(null);
    setOutcome(null);
    setError(null);
    setWaitingOpponent(false);
    fightStartedRef.current = false;
  };

  const onCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await createDuel({});
      setCode(r.code);
      setOutcome(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat duel.");
    } finally {
      setBusy(false);
    }
  };

  const onJoin = async () => {
    if (!joinCode.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await joinDuel({ code: joinCode.trim() });
      setCode(joinCode.trim().toUpperCase());
      setJoinCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal gabung duel.");
    } finally {
      setBusy(false);
    }
  };

  const onCancel = async () => {
    if (!code) return;
    setBusy(true);
    try {
      await cancelDuel({ code });
    } catch {
      /* duel mungkin sudah diambil orang — biarkan subscribe yang update */
    } finally {
      setBusy(false);
      reset();
    }
  };

  const runLocal = () => {
    if (!duel?.exercise) return;
    try {
      const res = runSql(
        sql,
        JSON.parse(JSON.stringify(exerciseDataset(duel.exercise.id))) as SqlDatabase,
      );
      setPreview({ res, err: null });
    } catch (err) {
      setPreview({
        res: null,
        err: err instanceof SqlError ? err.message : String(err),
      });
    }
  };

  const lockAnswer = async () => {
    if (!code || !duel?.exercise) return;
    setLocking(true);
    setError(null);
    try {
      const seconds = (performance.now() - startRef.current) / 1000;
      const r = await submitDuel({
        code,
        sqlText: sql,
        elapsedSeconds: seconds,
      });
      if (r.resolved) {
        setOutcome({ won: r.won, draw: r.draw, xpAwarded: r.xpAwarded });
      } else {
        setWaitingOpponent(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengirim jawaban.");
    } finally {
      setLocking(false);
    }
  };

  /* ------------------------------ no duel yet ----------------------------- */
  if (!code && !duel) {
    return (
      <section className="mt-8" aria-labelledby="private-duel">
        <div className="flex items-baseline justify-between border-b border-border pb-2">
          <h2 id="private-duel" className="text-sm font-bold uppercase tracking-wide">
            Private Duel
          </h2>
          <span className="font-mono text-[11px] text-muted-foreground">1v1 · kode 4 huruf</span>
        </div>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-border p-4">
            <p className="text-sm font-semibold">Buat Duel</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Dapat kode duel, kirim ke temanmu. Dia gabung, duel langsung mulai.
            </p>
            <Button size="sm" className="mt-3 w-full sm:w-auto" onClick={onCreate} disabled={busy}>
              ⚔ Buat Kode Duel
            </Button>
          </div>
          <div className="rounded-md border border-border p-4">
            <p className="text-sm font-semibold">Gabung Duel</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Punya kode dari teman? Masukkan di sini.
            </p>
            <div className="mt-3 flex gap-2">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && onJoin()}
                placeholder="KODE"
                maxLength={4}
                aria-label="Kode duel"
                className="w-28 font-mono uppercase tracking-widest"
              />
              <Button size="sm" variant="secondary" onClick={onJoin} disabled={busy || joinCode.trim().length < 4}>
                Gabung
              </Button>
            </div>
          </div>
        </div>
        {error && <p className="mt-2 font-mono text-xs text-destructive">{error}</p>}
      </section>
    );
  }

  /* -------------------------------- waiting ------------------------------- */
  if (duel?.status === "waiting") {
    return (
      <section className="mt-8" aria-label="Duel menunggu lawan">
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <div className="flex justify-center">
            <LottieAnimation animation="sword-clash" size="md" className="opacity-70" />
          </div>
          <p className="kicker">MENUNGGU LAWAN</p>
          <p className="mt-4 font-mono text-5xl font-bold tracking-[0.3em] text-primary">
            {duel.code}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Bagikan kode ini ke temanmu — begitu dia gabung, duel langsung dimulai.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={onCancel} disabled={busy}>
              Batalkan
            </Button>
            <Button size="sm" variant="ghost" onClick={reset}>
              Tutup
            </Button>
          </div>
        </div>
      </section>
    );
  }

  /* ------------------------------ finished -------------------------------- */
  if (duel?.status === "finished" && outcome) {
    return (
      <section className="mt-8" aria-label="Hasil duel">
        <div
          className={cn(
            "rounded-lg border p-6",
            outcome.draw
              ? "border-warning/50 bg-warning/5"
              : outcome.won
                ? "border-success/50 bg-success/5"
                : "border-destructive/40 bg-destructive/5",
          )}
        >
          <p
            className={cn(
              "kicker",
              outcome.draw ? "text-warning" : outcome.won ? "text-success" : "text-destructive",
            )}
          >
            {outcome.draw ? "SERI" : outcome.won ? "VICTORY" : "DEFEAT"}
          </p>
          <div className="mt-2 flex justify-center">
            <LottieAnimation
              animation={outcome.won ? "battle-victory" : outcome.draw ? "star-burst" : "battle-defeat"}
              size="md"
              loop={false}
            />
          </div>
          <div className="mt-4 flex items-center gap-6">
            <span aria-hidden className="text-3xl">{duel.host.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{duel.host.name}</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {duel.hostSubmitted ? `${duel.hostSubmitted.correct ? "✓" : "✗"} ${duel.hostSubmitted.seconds.toFixed(1)}s` : "—"}
              </p>
            </div>
            <span className="font-mono text-xs text-muted-foreground">VS</span>
            <div className="min-w-0 flex-1 text-right">
              <p className="truncate text-sm font-bold">{duel.guest?.name ?? "—"}</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {duel.guestSubmitted ? `${duel.guestSubmitted.correct ? "✓" : "✗"} ${duel.guestSubmitted.seconds.toFixed(1)}s` : "—"}
              </p>
            </div>
            <span aria-hidden className="text-3xl">{duel.guest?.emoji ?? "🦉"}</span>
          </div>
          {outcome.xpAwarded > 0 && (
            <div className="mt-4">
              <XpGainAnimation amount={outcome.xpAwarded} />
            </div>
          )}
        </div>
        <div className="mt-4">
          <Button size="sm" onClick={reset}>Duel Lagi</Button>
        </div>
      </section>
    );
  }

  /* -------------------------------- fighting ------------------------------ */
  if (duel?.status === "fighting" && duel.exercise) {
    const iSubmitted = duel.amHost ? !!duel.hostSubmitted : !!duel.guestSubmitted;
    return (
      <section className="mt-8" aria-label="Duel berlangsung">
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <span aria-hidden>{duel.host.emoji}</span>
              <span className="truncate text-sm font-semibold">{duel.host.name}</span>
            </div>
            <span className="shrink-0 font-mono text-xs font-bold tabular-nums">
              {waitingOpponent ? "MENUNGGU…" : `${elapsed.toFixed(1)}s`}
            </span>
            <div className="flex min-w-0 items-center justify-end gap-2">
              <span className="truncate text-sm font-semibold">{duel.guest?.name ?? "…"}</span>
              <span aria-hidden>{duel.guest?.emoji ?? "⏳"}</span>
            </div>
          </div>
          <p className="border-b border-border px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            DUEL {duel.code} · {duel.exercise.title}
          </p>
        </div>

        <p className="mt-4 max-w-prose text-sm leading-relaxed">{duel.exercise.instruction}</p>

        <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-sidebar px-3 py-1.5">
            <span className="font-mono text-[11px] font-semibold text-primary">duel.sql</span>
            <button onClick={runLocal} className="cursor-pointer font-mono text-[10px] text-muted-foreground hover:text-foreground">
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
            disabled={iSubmitted}
            aria-label="SQL duel editor"
            className="block w-full resize-y bg-card p-3 font-mono text-sm outline-none disabled:opacity-60"
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
              {iSubmitted
                ? "Jawaban terkunci — menunggu lawan."
                : "Lebih cepat + benar = menang."}
            </span>
            <Button size="sm" onClick={lockAnswer} disabled={locking || iSubmitted}>
              {locking ? "Mengunci…" : iSubmitted ? "Terkunci" : "Kunci Jawaban"}
            </Button>
          </div>
        </div>
        {error && <p className="mt-2 font-mono text-xs text-destructive">{error}</p>}
      </section>
    );
  }

  /* duel finished tapi outcome belum ke-set (halaman di-refresh) */
  if (duel?.status === "finished") {
    return (
      <section className="mt-8" aria-label="Duel selesai">
        <div className="flex items-center justify-between rounded-md border border-border px-4 py-3">
          <p className="text-sm text-muted-foreground">Duel {duel.code} sudah selesai.</p>
          <Button size="sm" variant="secondary" onClick={reset}>
            Duel Baru
          </Button>
        </div>
      </section>
    );
  }

  return null;
}
