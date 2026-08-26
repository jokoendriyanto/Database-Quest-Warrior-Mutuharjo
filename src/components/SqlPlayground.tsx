import { useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Exercise } from "@/lib/curriculum";
import type { Database as SqlDatabase, RunResult } from "@/lib/sql/engine";
import { runSql, SqlError } from "@/lib/sql/engine";
import { Button } from "@/components/ui/button";
import { playCorrect, playWrong, playXpGain, playLevelUp } from "@/lib/sounds";
import {
  ChevronDown,
  ChevronRight,
  Play,
  RotateCcw,
  Lightbulb,
  Eye,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------- schema explorer types ------------------------ */

interface ColumnInfo {
  name: string;
  /** "# " PK · "↗ " FK · "A " text · "123 " angka */
  marker: string;
}

function columnMarker(col: string, sampleRow?: Record<string, unknown>): string {
  if (col === "id") return "#";
  if (col.endsWith("_id")) return "↗";
  return typeof sampleRow?.[col] === "number" ? "123" : "A";
}

function SchemaExplorer({ db }: { db: SqlDatabase }) {
  const tables = Object.values(db);
  const [open, setOpen] = useState<string | null>(tables[0]?.name ?? null);

  return (
    <div className="text-sm">
      <p className="kicker px-3 pt-3">DATABASE</p>
      <ul className="p-2 pb-3">
        {tables.map((t) => {
          const isOpen = open === t.name;
          return (
            <li key={t.name}>
              <button
                onClick={() => setOpen(isOpen ? null : t.name)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 font-mono text-xs hover:bg-secondary"
              >
                {isOpen ? (
                  <ChevronDown className="size-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-3 text-muted-foreground" />
                )}
                <span className="font-semibold">{t.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {t.rows.length}
                </span>
              </button>
              {isOpen && (
                <ul className="ml-4 border-l border-border pl-2.5">
                  {t.columns.map((c) => (
                    <li
                      key={c}
                      className="flex items-baseline gap-2 py-0.5 font-mono text-[11px]"
                    >
                      <span
                        aria-hidden
                        className="w-6 shrink-0 text-right text-[9px] text-muted-foreground"
                        title={
                          c === "id"
                            ? "Primary Key"
                            : c.endsWith("_id")
                              ? "Foreign Key"
                              : typeof t.rows[0]?.[c] === "number"
                                ? "Angka"
                                : "Teks"
                        }
                      >
                        {columnMarker(c, t.rows[0])}
                      </span>
                      <span className="truncate">{c}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <div className="border-t border-border px-3 py-2">
        <p className="kicker mb-1">LEGEND</p>
        <p className="font-mono text-[10px] leading-relaxed text-muted-foreground">
          # primary key<br />↗ foreign key<br />A teks &nbsp;123 angka
        </p>
      </div>
    </div>
  );
}

/* ------------------------------ result table ---------------------------- */

function ResultTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: unknown[][];
}) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-8 text-center font-mono text-xs text-muted-foreground">
        0 rows — hasil kosong. Cek lagi syarat WHERE-nya.
      </p>
    );
  }
  return (
    <div className="max-h-72 overflow-auto">
      <table className="w-full border-collapse text-left">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border">
            <th className="w-10 border-r border-border px-2 py-1.5 text-right font-mono text-[10px] font-medium text-muted-foreground">
              #
            </th>
            {columns.map((c) => (
              <th
                key={c}
                className="whitespace-nowrap border-r border-border/60 px-3 py-1.5 font-mono text-[11px] font-bold"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-secondary/50">
              <td className="border-r border-border/40 bg-secondary/30 px-2 py-1 text-right font-mono text-[10px] text-muted-foreground">
                {i + 1}
              </td>
              {r.map((cell, j) => (
                <td
                  key={j}
                  className="max-w-56 truncate whitespace-nowrap px-3 py-1 font-mono text-xs"
                >
                  {String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------ main layout ----------------------------- */

const HINT_XP = ["100% XP", "90% XP", "75% XP", "50% XP"];
type MobileTab = "mission" | "schema" | "editor" | "result";

interface HistoryEntry {
  time: string;
  sql: string;
}

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
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<{ message: string; suggestion?: string } | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  const [hintsShown, setHintsShown] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [mobileTab, setMobileTab] = useState<MobileTab>("editor");

  const [submitting, setSubmitting] = useState(false);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    text: string;
    xpAwarded?: number;
    levelUp?: boolean;
  } | null>(null);

  const submitExercise = useMutation(api.game.submitExercise);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const pushHistory = (query: string) =>
    setHistory((h) =>
      [
        {
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          sql: query.replace(/\s+/g, " ").trim(),
        },
        ...h,
      ].slice(0, 6),
    );

  const handleRun = () => {
    const t0 = performance.now();
    setError(null);
    try {
      const res = runSql(sql, JSON.parse(JSON.stringify(db)));
      setResult(res);
      setMobileTab("result");
    } catch (err) {
      setResult(null);
      if (err instanceof SqlError) {
        setError({ message: err.message, suggestion: err.suggestion });
      } else {
        setError({ message: String(err) });
      }
      setMobileTab("result");
    }
    setElapsedMs(Math.round(performance.now() - t0));
    pushHistory(sql);
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
        playCorrect();
        if (res.xpAwarded > 0) setTimeout(playXpGain, 200);
        if (res.levelAfter > res.levelBefore) setTimeout(playLevelUp, 400);
        setSolved(true);
        setFeedback({
          correct: true,
          text: res.feedback,
          xpAwarded: res.xpAwarded,
          levelUp: res.levelAfter > res.levelBefore,
        });
        onSolved?.();
      } else if ("error" in res && res.error) {
        playWrong();
        setFeedback({
          correct: false,
          text:
            res.error.code === "ER_BAD_COLUMN"
              ? `${res.error.message}${res.error.suggestion ? `\n\n${res.error.suggestion}` : ""}`
              : (res.error.message ?? res.feedback),
        });
      } else {
        playWrong();
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

  // Ctrl/Cmd+Enter = jalankan query
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleRun();
    }
  };

  const difficultyLabel =
    exercise.difficulty === "boss" ? "BOSS" : exercise.difficulty.toUpperCase();

  /* ------------------------------- panels ------------------------------- */

  const missionPanel = (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-mono text-sm font-bold">{exercise.title}</h3>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {difficultyLabel} · {exercise.xp} XP
        </span>
      </div>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-secondary-foreground">
        {exercise.instruction}
      </p>
    </div>
  );

  const editorPanel = (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* tab bar ala editor */}
      <div className="flex items-center justify-between border-b border-border bg-sidebar px-3 py-1.5">
        <span className="font-mono text-[11px] font-semibold text-primary">
          challenge.sql
        </span>
        <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
          sandbox — data asli aman
        </span>
      </div>
      <textarea
        ref={taRef}
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        onKeyDown={onKeyDown}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        rows={6}
        aria-label="SQL editor"
        className="block w-full resize-y bg-card p-3 font-mono text-sm leading-relaxed caret-[--primary] outline-none placeholder:text-muted-foreground"
        placeholder="-- Tulis query-mu di sini"
      />
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-border bg-sidebar px-2 py-1.5">
        <Button size="sm" variant="secondary" onClick={handleRun} title="Jalankan query (Ctrl/Cmd+Enter)">
          <Play className="size-3.5" /> Run <kbd className="ml-0.5 hidden font-mono text-[9px] opacity-60 sm:inline">⌘↵</kbd>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setSql(exercise.starter)}
          disabled={sql === exercise.starter}
        >
          <RotateCcw className="size-3.5" /> Reset
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowHints((v) => !v)}
          aria-expanded={showHints}
        >
          <Lightbulb className="size-3.5" /> Hint
          {hintsShown > 0 && (
            <span className="font-mono text-[9px] text-muted-foreground">{hintsShown}</span>
          )}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {!solved && elapsedMs != null && (
            <span className="hidden font-mono text-[10px] text-muted-foreground md:inline">
              {elapsedMs} ms
            </span>
          )}
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || solved}
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="size-3.5" />
            {solved ? "Selesai ✓" : submitting ? "Memeriksa…" : "Kumpulkan"}
          </Button>
        </div>
      </div>

      {/* hint panel — collapsible */}
      {showHints && !solved && (
        <div className="border-t border-border px-3 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="kicker">PROGRESSIVE HINT</p>
            <span className="font-mono text-[10px] text-muted-foreground">
              {showSolution ? "10% XP" : HINT_XP[Math.min(hintsShown, 3)]}
            </span>
          </div>
          <ul className="space-y-1.5">
            {exercise.hints.slice(0, hintsShown).map((h, i) => (
              <li key={i} className="border-l-2 border-primary/50 pl-2.5 text-sm">
                <span className="mr-1.5 font-mono text-[10px] text-muted-foreground">
                  hint_{i + 1}
                </span>
                {h}
              </li>
            ))}
          </ul>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {hintsShown < 4 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setHintsShown((n) => Math.min(4, n + 1))}
              >
                <Lightbulb className="size-3.5" /> Buka hint berikutnya
              </Button>
            )}
            {!showSolution && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSolution(true)}
                className="text-muted-foreground"
              >
                <Eye className="size-3.5" /> Lihat jawaban (XP −90%)
              </Button>
            )}
          </div>
          {showSolution && (
            <pre className="mt-2.5 overflow-x-auto rounded-md bg-muted p-2.5 font-mono text-xs">
              {exercise.solution.replace(/;/g, ";\n")}
            </pre>
          )}
        </div>
      )}
    </div>
  );

  const resultPanel = (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border bg-sidebar px-3 py-1.5">
        <p className="kicker">RESULT</p>
        {result?.kind === "select" && (
          <span className="font-mono text-[11px] text-muted-foreground">
            {result.rows.length} rows
            {elapsedMs != null && ` · ${elapsedMs} ms`}
          </span>
        )}
        {result && result.kind === "mutation" && (
          <span className="font-mono text-[11px] text-success">✓ {result.message}</span>
        )}
        {!result && !error && (
          <span className="font-mono text-[11px] text-muted-foreground">
            jalankan query untuk melihat hasil
          </span>
        )}
      </div>

      {error && (
        <div className="px-4 py-3">
          <p className="kicker text-destructive">QUERY BELUM TEPAT</p>
          <p className="mt-1.5 text-sm">{error.message}</p>
          {error.suggestion && (
            <div className="mt-2 text-sm">
              <span className="text-muted-foreground">Mungkin maksudmu:</span>
              <pre className="mt-1 inline-block rounded-md bg-destructive/10 px-2 py-0.5 font-mono text-xs text-destructive">
                {error.suggestion.replace(/`/g, "")}
              </pre>
            </div>
          )}
        </div>
      )}

      {!error && result?.kind === "select" && (
        <ResultTable columns={result.columns} rows={result.rows.slice(0, 100).map((r) => Object.values(r))} />
      )}
    </div>
  );

  const feedbackPanel = feedback && (
    <div
      className={cn(
        "rounded-lg border p-3",
        feedback.correct
          ? "border-success/40 bg-success/10"
          : "border-warning/40 bg-warning/10",
      )}
    >
      <p className="whitespace-pre-line text-sm leading-relaxed">
        <span
          className={cn(
            "mr-1.5 font-mono text-[10px] font-bold uppercase tracking-wider",
            feedback.correct ? "text-success" : "text-warning",
          )}
        >
          {feedback.correct ? "✓ ACCEPTED" : "! BELUM SESUAI"}{" "}
        </span>
        {feedback.text}
      </p>
      {feedback.xpAwarded != null && feedback.xpAwarded > 0 && (
        <p className="mt-1.5 font-mono text-sm font-bold text-primary">
          +{feedback.xpAwarded} XP{feedback.levelUp ? " · LEVEL UP!" : ""}
        </p>
      )}
    </div>
  );

  const historyPanel = history.length > 0 && (
    <div>
      <p className="kicker mb-1.5">QUERY HISTORY</p>
      <ul className="space-y-0.5">
        {history.map((h, i) => (
          <li key={i}>
            <button
              onClick={() => {
                setSql(h.sql + ";");
                setMobileTab("editor");
              }}
              title={h.sql}
              className="flex w-full items-baseline gap-2.5 rounded-md px-2 py-1 text-left hover:bg-secondary"
            >
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{h.time}</span>
              <span className="truncate font-mono text-xs">{h.sql}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  /* ------------------------------- layout ------------------------------- */

  return (
    <>
      {/* Desktop: schema | mission/editor/result */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[230px_1fr]">
        <aside className="h-fit overflow-hidden rounded-lg border border-border bg-card">
          <SchemaExplorer db={db} />
        </aside>
        <div className="min-w-0 space-y-4">
          {missionPanel}
          {editorPanel}
          {feedbackPanel}
          {resultPanel}
          {historyPanel}
        </div>
      </div>

      {/* Mobile: tab MISSION / SCHEMA / EDITOR / RESULT */}
      <div className="lg:hidden">
        <div role="tablist" aria-label="Panel SQL" className="flex border-b border-border">
          {(["mission", "schema", "editor", "result"] as MobileTab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={mobileTab === t}
              onClick={() => setMobileTab(t)}
              className={cn(
                "relative flex-1 py-2 font-mono text-[11px] uppercase tracking-wider",
                mobileTab === t ? "font-bold text-foreground" : "text-muted-foreground",
              )}
            >
              {t}
              {mobileTab === t && (
                <span aria-hidden className="absolute inset-x-3 bottom-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
        <div className="space-y-4 pt-4">
          {mobileTab === "mission" && (
            <>
              {missionPanel}
              {feedbackPanel}
              {historyPanel}
            </>
          )}
          {mobileTab === "schema" && (
            <div className="rounded-lg border border-border bg-card">
              <SchemaExplorer db={db} />
            </div>
          )}
          {mobileTab === "editor" && editorPanel}
          {(mobileTab === "result" || mobileTab === "mission") && resultPanel}
          {mobileTab === "result" && feedbackPanel}
        </div>
      </div>
    </>
  );
}
