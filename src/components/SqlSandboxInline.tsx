import { useState, useRef } from "react";
import type { Database as SqlDatabase, RunResult } from "@/lib/sql/engine";
import { runSql, SqlError } from "@/lib/sql/engine";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Terminal, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { playCorrect, playWrong } from "@/lib/sounds";
import { QueryRunningAnimation, QuerySuccessAnimation } from "@/components/ui/lottie-animation";

/* ------------------------------ result table ---------------------------- */

function MiniResultTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Record<string, unknown>[];
}) {
  if (rows.length === 0) {
    return (
      <p className="px-3 py-4 text-center font-mono text-xs text-muted-foreground">
        0 rows — hasil kosong.
      </p>
    );
  }
  return (
    <div className="max-h-52 overflow-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border">
            <th className="w-8 border-r border-border px-2 py-1 text-right font-mono text-[10px] text-muted-foreground">
              #
            </th>
            {columns.map((c) => (
              <th
                key={c}
                className="whitespace-nowrap border-r border-border/60 px-2.5 py-1 font-mono text-[11px] font-bold"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className="border-b border-border/40 last:border-0 hover:bg-secondary/50"
            >
              <td className="border-r border-border/40 bg-secondary/30 px-2 py-0.5 text-right font-mono text-[10px] text-muted-foreground">
                {i + 1}
              </td>
              {columns.map((col, j) => (
                <td
                  key={j}
                  className="max-w-40 truncate whitespace-nowrap px-2.5 py-0.5 font-mono text-xs"
                >
                  {String(r[col] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------------- inline sandbox ------------------------------ */

interface Props {
  initialCode: string;
  db: SqlDatabase;
  caption?: string;
  hint?: string;
}

export function SqlSandboxInline({ initialCode, db, caption, hint }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const handleRun = () => {
    setError(null);
    setResult(null);
    setElapsedMs(null);
    try {
      const t0 = performance.now();
      const res = runSql(sql, db);
      const t1 = performance.now();
      setElapsedMs(Math.round(t1 - t0));
      setResult(res);
      playCorrect();
    } catch (err) {
      if (err instanceof SqlError) {
        setError(`${err.message}${err.suggestion ? `\n💡 ${err.suggestion}` : ""}`);
      } else {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
      playWrong();
    }
  };

  const handleReset = () => {
    setSql("");
    setResult(null);
    setError(null);
    setElapsedMs(null);
    taRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRun();
      return;
    }
    // Tab for indentation
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = taRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const val = ta.value;
      setSql(val.substring(0, start) + "  " + val.substring(end));
      // restore cursor after state update
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="my-3 rounded-lg border border-border/80 bg-card overflow-hidden">
      {/* Toggle bar — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition-colors",
          expanded
            ? "bg-primary/5 border-b border-border/60"
            : "hover:bg-secondary/50"
        )}
      >
        <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
          <Terminal className="size-3" />
          TRY IT YOURSELF
        </span>
        {caption && (
          <span className="ml-1 text-xs text-muted-foreground hidden sm:inline">
            — {caption}
          </span>
        )}
        <span className="ml-auto text-muted-foreground">
          {expanded ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </span>
      </button>

      {/* Expandable sandbox */}
      {expanded && (
        <div className="animate-fade-in">
          {/* Editor area */}
          <div className="relative">
            <textarea
              ref={taRef}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="w-full resize-none bg-muted/30 px-3 py-2.5 font-mono text-[13px] leading-relaxed outline-none placeholder:text-muted-foreground/50 focus:bg-muted/50 transition-colors"
              rows={Math.max(3, sql.split("\n").length + 1)}
              placeholder="Tulis query SQL di sini..."
            />
            {/* Line numbers visual indicator */}
            <div className="absolute left-0 top-0 flex flex-col items-end py-2.5 pl-1.5 pr-1 pointer-events-none">
              {sql.split("\n").map((_, i) => (
                <span
                  key={i}
                  className="text-[10px] leading-[1.625rem] text-muted-foreground/40 font-mono select-none"
                >
                  {i + 1}
                </span>
              ))}
            </div>
            <style>{`.sql-sandbox-editor textarea { padding-left: 2rem !important; }`}</style>
            <div className="sql-sandbox-editor" />
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-2 border-t border-border/60 px-3 py-2 bg-secondary/20">
            <Button
              size="sm"
              onClick={handleRun}
              className="h-7 gap-1.5 font-mono text-xs font-bold"
            >
              <Play className="size-3" />
              Run SQL
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              className="h-7 gap-1 font-mono text-xs"
            >
              <RotateCcw className="size-3" />
              Reset
            </Button>
            <span className="ml-auto text-[10px] text-muted-foreground font-mono">
              Ctrl+Enter to run
            </span>
          </div>

          {/* Result / Error area */}
          {(result || error) && (
            <div className="border-t border-border/60 animate-fade-in">
              {error && (
                <div className="px-3 py-2.5 bg-destructive/5">
                  <p className="font-mono text-xs text-destructive font-semibold whitespace-pre-wrap">
                    ✗ {error}
                  </p>
                </div>
              )}
              {result && (
                <div>
                  <div className="flex items-center gap-2 border-b border-border/40 px-3 py-1.5">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-success">
                      ✓ Result
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {result.rows.length} row{result.rows.length !== 1 ? "s" : ""}
                      {elapsedMs !== null && ` · ${elapsedMs}ms`}
                    </span>
                  </div>
                  <MiniResultTable
                    columns={result.columns}
                    rows={result.rows}
                  />
                </div>
              )}
            </div>
          )}

          {/* Schema hint */}
          {hint && !result && !error && (
            <div className="border-t border-border/40 px-3 py-2 bg-muted/20">
              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold">💡 Hint:</span> {hint}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
