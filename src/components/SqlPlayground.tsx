import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Exercise } from "@/lib/curriculum";
import type { Database as SqlDatabase, RunResult } from "@/lib/sql/engine";
import { runSql, SqlError } from "@/lib/sql/engine";
import { Button } from "@/components/ui/button";
import {
  Table2,
  Play,
  Send,
  Lightbulb,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TableInfo {
  name: string;
  columns: string[];
  rowCount: number;
}

const HINT_XP = ["100% XP", "90% XP", "75% XP", "50% XP"];

export function SqlPlayground({
  exercise,
  db,
  onSolved,
}: {
  exercise: Exercise;
  db: SqlDatabase;
  onSolved?: () => void;
}) {
  const [sql, setSql] = useState(exercise.starter);
  const [localResult, setLocalResult] = useState<RunResult | null>(null);
  const [localError, setLocalError] = useState<{ message: string; suggestion?: string } | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const [hintsShown, setHintsShown] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    text: string;
    xpAwarded?: number;
    levelUp?: boolean;
  } | null>(null);

  const submitExercise = useMutation(api.game.submitExercise);

  const tableInfos: TableInfo[] = useMemo(
    () =>
      Object.values(db).map((t) => ({
        name: t.name,
        columns: t.columns,
        rowCount: t.rows.length,
      })),
    [db],
  );

  const handleRun = () => {
    const t0 = performance.now();
    try {
      const res = runSql(sql, JSON.parse(JSON.stringify(db)));
      setLocalResult(res);
      setLocalError(null);
    } catch (err) {
      setLocalResult(null);
      if (err instanceof SqlError) {
        setLocalError({ message: err.message, suggestion: err.suggestion });
      } else {
        setLocalError({ message: String(err) });
      }
    }
    setElapsedMs(Math.round(performance.now() - t0));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await submitExercise({
        exerciseId: exercise.id,
        sqlText: sql,
        hintsUsed: showSolution ? 4 : hintsShown,
      });
      if (res.correct) {
        setSolved(true);
        setFeedback({
          correct: true,
          text: res.feedback,
          xpAwarded: res.xpAwarded,
          levelUp: res.levelAfter > res.levelBefore,
        });
        onSolved?.();
      } else if ("error" in res && res.error) {
        setFeedback({
          correct: false,
          text:
            res.error.code === "ER_BAD_COLUMN"
              ? `${res.error.message}${res.error.suggestion ? `\n\n${res.error.suggestion}` : ""}`
              : res.error.message ?? res.feedback,
        });
      } else {
        setFeedback({ correct: false, text: res.feedback });
      }
    } catch (err) {
      setFeedback({
        correct: false,
        text: err instanceof Error ? err.message : "Gagal mengirim jawaban.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      {/* DATABASE EXPLORER */}
      <div className="clay-sm order-2 h-fit p-4 lg:order-1">
        <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          <Table2 className="size-4" /> Database Explorer
        </p>
        <ul className="mt-3 space-y-2.5">
          {tableInfos.map((t) => (
            <li key={t.name} className="rounded-2xl bg-muted/60 p-2.5">
              <p className="text-sm font-bold text-primary">{t.name}</p>
              <p className="text-[11px] text-muted-foreground">{t.rowCount} baris</p>
              <p className="mt-1 font-mono text-[10px] leading-relaxed text-muted-foreground">
                {t.columns.join(", ")}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="order-1 flex flex-col gap-4 lg:order-2">
        {/* MISSION */}
        <div className="clay-sm p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Misi</p>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-secondary-foreground">
              {exercise.difficulty === "boss" ? "👑 BOSS" : exercise.difficulty.toUpperCase()} •{" "}
              {exercise.xp} XP dasar
            </span>
          </div>
          <p className="mt-1.5 text-sm font-semibold leading-relaxed">{exercise.instruction}</p>
        </div>

        {/* EDITOR */}
        <div className="clay-sm overflow-hidden">
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            spellCheck={false}
            rows={5}
            aria-label="SQL editor"
            className="w-full resize-none bg-transparent p-4 font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="SELECT * FROM ...;"
          />
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5">
            <span className="text-[11px] text-muted-foreground">
              Sandbox aman — salah bebas, data asli nggak akan rusak 😄
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={handleRun} className="clay-btn rounded-xl">
                <Play className="size-4" /> Run
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting || solved}
                className="clay-btn rounded-xl bg-primary"
              >
                <Send className="size-4" />
                {solved ? "Selesai ✓" : submitting ? "Memeriksa..." : "Kumpulkan"}
              </Button>
            </div>
          </div>
        </div>

        {/* RESULT */}
        {localError && (
          <div className="rounded-3xl bg-destructive/10 p-4">
            <p className="flex items-start gap-2 text-sm font-semibold text-destructive">
              <XCircle className="mt-0.5 size-4 shrink-0" /> {localError.message}
            </p>
            {localError.suggestion && (
              <p className="mt-2 pl-6 text-xs text-muted-foreground">{localError.suggestion}</p>
            )}
            <p className="mt-2 pl-6 text-[11px] text-muted-foreground">
              Technical detail tersimpan di log — fokus pahami pesannya dulu ya.
            </p>
          </div>
        )}

        {localResult && !localError && (
          <ResultTable
            title="Hasil"
            meta={`${localResult.rows.length} baris • ${elapsedMs} ms${localResult.kind === "mutation" ? ` • ${localResult.message}` : ""}`}
            columns={localResult.kind === "select" ? localResult.columns : ["status"]}
            rows={
              localResult.kind === "select"
                ? localResult.rows.slice(0, 20).map((r) => Object.values(r))
                : [[localResult.message]]
            }
          />
        )}

        {/* FEEDBACK SERVER */}
        {feedback && (
          <div
            className={cn(
              "rounded-3xl p-4",
              feedback.correct ? "bg-accent/40" : "bg-orange-100/70 dark:bg-orange-950/30",
            )}
          >
            <p className="whitespace-pre-line text-sm font-semibold leading-relaxed">
              {feedback.correct && <CheckCircle2 className="mr-1.5 inline size-4 text-green-600" />}
              {!feedback.correct && <XCircle className="mr-1.5 inline size-4 text-orange-500" />}
              {feedback.text}
            </p>
            {feedback.xpAwarded != null && feedback.xpAwarded > 0 && (
              <p className="mt-2 flex items-center gap-1 text-sm font-extrabold text-primary">
                <Sparkles className="size-4" /> +{feedback.xpAwarded} XP
                {feedback.levelUp && " — LEVEL UP! 🎉"}
              </p>
            )}
          </div>
        )}

        {/* HINTS */}
        {!solved && (
          <div className="clay-sm p-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                <Lightbulb className="size-4" /> Progressive Hint
              </p>
              <span className="text-[11px] font-bold text-muted-foreground">
                {showSolution ? "10% XP" : HINT_XP[Math.min(hintsShown, 3)]}
              </span>
            </div>
            <ul className="mt-2 space-y-2">
              {exercise.hints.slice(0, hintsShown).map((h, i) => (
                <li key={i} className="rounded-2xl bg-muted/60 px-3 py-2 text-sm">
                  <span className="mr-1.5 font-extrabold text-primary">Hint {i + 1}:</span> {h}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              {hintsShown < 4 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setHintsShown((n) => Math.min(4, n + 1))}
                  className="rounded-xl"
                >
                  <Lightbulb className="size-4" /> Buka hint berikutnya
                </Button>
              )}
              {!showSolution && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSolution(true)}
                  className="rounded-xl text-muted-foreground"
                >
                  <Eye className="size-4" /> Lihat jawaban (XP tinggal 10%)
                </Button>
              )}
            </div>
            {showSolution && (
              <pre className="mt-3 overflow-x-auto rounded-2xl bg-foreground/90 p-3 font-mono text-xs leading-relaxed text-background">
                {exercise.solution.replace(/;/g, ";\n")}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultTable({
  title,
  meta,
  columns,
  rows,
}: {
  title: string;
  meta: string;
  columns: string[];
  rows: unknown[][];
}) {
  return (
    <div className="clay-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
        <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className="text-[11px] font-semibold text-muted-foreground">{meta}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
          Nol baris — hasilnya kosong.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-muted/50">
                {columns.map((c) => (
                  <th key={c} className="whitespace-nowrap px-4 py-2 font-mono text-xs font-bold text-primary">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={cn(i % 2 === 1 && "bg-muted/30")}>
                  {r.map((cell, j) => (
                    <td key={j} className="max-w-56 truncate whitespace-nowrap px-4 py-1.5 font-mono text-xs">
                      {String(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
