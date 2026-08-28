import { useState } from "react";
import { Link } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LESSON_MAP } from "@/lib/curriculum";
import { schoolDb, kantinDb } from "@/lib/data/datasets";
import { runSql, type RunResult, type Database as SqlDatabase } from "@/lib/sql/engine";
import { Button } from "@/components/ui/button";
import { DatabaseLoadingAnimation } from "@/components/ui/lottie-animation";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  CheckCircle2,
  Circle,
  Loader2,
  Swords,
} from "lucide-react";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = {
  exercise: "LATIHAN",
  lesson: "MATERI",
  challenge: "CHALLENGE",
};

function lessonOfExercise(exId: string): string | null {
  for (const [lessonId, v] of LESSON_MAP) {
    if ((v.lesson.exerciseIds ?? []).includes(exId)) return lessonId;
  }
  return null;
}

export default function AssignmentsPage() {
  const data = useQuery(api.assignments.listForStudent);
  const challenges = useQuery(api.challenges.listForStudent);
  const markFn = useMutation(api.assignments.markComplete);

  const [claimError, setClaimError] = useState<string | null>(null);

  if (!data || !challenges) {
    return (
      <DatabaseLoadingAnimation text="Memuat tugas..." />
    );
  }

  if (data.denied) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-lg font-bold">Masuk dulu ya.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman tugas hanya untuk yang sudah punya akun.
        </p>
        <Link to="/auth" className="mt-4 inline-block text-sm text-primary hover:underline">
          Ke halaman masuk →
        </Link>
      </div>
    );
  }

  const assignments = data.assignments;
  const openCount = assignments.filter((a) => !a.done).length;

  const claim = async (id: string) => {
    setClaimError(null);
    try {
      const res = await markFn({ assignmentId: id as any });
      if (!res.eligible) {
        setClaimError("Server belum menemukan bukti pengerjaan — selesaikan dulu misinya, lalu klaim di sini.");
      }
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Gagal menandai tugas.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header>
        <p className="kicker">TUGAS & STUDI KASUS</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Misi dari Gurumu</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {openCount > 0
            ? `${openCount} tugas menunggu dikerjakan. Selesaikan misinya, lalu klaim di sini.`
            : "Semua tugas sudah selesai. Mantap. 🎉"}
        </p>
      </header>

      {claimError && (
        <p role="alert" className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          {claimError}
        </p>
      )}

      {/* ------------------------------ TUGAS ------------------------------ */}
      <section aria-labelledby="tugas-h">
        <h2 id="tugas-h" className="kicker mb-3">
          TUGAS GURU {assignments.length > 0 && `(${assignments.length})`}
        </h2>
        {assignments.length === 0 ? (
          <p className="border-y border-border py-8 text-center text-sm text-muted-foreground">
            Belum ada tugas. Semua yang guru tugaskan muncul di sini.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {assignments.map((a) => {
              const overdue = a.dueAt != null && !a.done && a.dueAt < Date.now();
              const href =
                a.kind === "lesson"
                  ? `/lesson/${a.refId}`
                  : a.kind === "exercise"
                    ? lessonOfExercise(a.refId)
                    : null;
              return (
                <li key={a.id} className="px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span aria-hidden className="shrink-0">
                      {a.done ? (
                        <CheckCircle2 className="size-5 text-success" />
                      ) : (
                        <Circle className="size-5 text-muted-foreground/50" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-sm font-semibold", a.done && "text-muted-foreground line-through decoration-border")}>
                        {a.title}
                      </span>
                      <span className="block truncate font-mono text-[10px] text-muted-foreground">
                        {KIND_LABEL[a.kind]} · {a.refTitle}
                        {a.className ? ` · ${a.className}` : ""}
                        {a.dueAt
                          ? ` · deadline ${new Date(a.dueAt).toLocaleDateString("id-ID")}`
                          : ""}
                      </span>
                      {a.description && (
                        <span className="mt-1 block text-xs text-muted-foreground">{a.description}</span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {a.done ? (
                        <span className="font-mono text-[10px] font-bold tracking-wider text-success">SELESAI</span>
                      ) : overdue ? (
                        <span className="font-mono text-[10px] font-bold tracking-wider text-destructive">LEWAT DEADLINE</span>
                      ) : a.workCompleted ? (
                        <Button size="sm" onClick={() => claim(a.id)}>
                          <ClipboardCheck className="size-3.5" /> Klaim Selesai
                        </Button>
                      ) : href ? (
                        <Button size="sm" variant="secondary" asChild>
                          <Link to={href}>Kerjakan</Link>
                        </Button>
                      ) : (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          kerjakan di halaman Tugas
                        </span>
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* --------------------------- CHALLENGE ----------------------------- */}
      <section aria-labelledby="ch-h">
        <h2 id="ch-h" className="kicker mb-3">
          STUDI KASUS BUATAN GURU {challenges.length > 0 && `(${challenges.length})`}
        </h2>
        {challenges.length === 0 ? (
          <p className="border-y border-border py-8 text-center text-sm text-muted-foreground">
            Belum ada studi kasus. Kasus nyata dari guru muncul di sini — kerjakan pakai SQL beneran.
          </p>
        ) : (
          <ul className="space-y-3">
            {challenges.map((c) => (
              <ChallengeCard key={c.id} challenge={c} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ---------------------------- challenge card ------------------------------ */

type Challenge = {
  id: string;
  title: string;
  prompt: string;
  datasetKey: string;
  xp: number;
  solved: boolean;
  attempts: number;
};

function ChallengeCard({ challenge: c }: { challenge: Challenge }) {
  const [open, setOpen] = useState(false);
  const [sql, setSql] = useState("");
  const [preview, setPreview] = useState<RunResult | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct: boolean; message: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submitFn = useMutation(api.challenges.submit);

  const db: SqlDatabase = c.datasetKey === "kantin" ? kantinDb : schoolDb;

  const runPreview = () => {
    setLocalError(null);
    setPreview(null);
    try {
      setPreview(runSql(sql, JSON.parse(JSON.stringify(db))));
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Query error");
    }
  };

  const submitAnswer = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await submitFn({ challengeId: c.id as any, sqlText: sql });
      if (res.correct) {
        setResult({ correct: true, message: `Benar! +${res.xpAwarded} XP. 🎉` });
      } else {
        setResult({ correct: false, message: res.error ?? "Belum tepat." });
      }
    } catch (err) {
      setResult({ correct: false, message: err instanceof Error ? err.message : "Gagal mengirim." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        {open ? <ChevronDown className="size-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{c.title}</span>
            {c.solved && <CheckCircle2 className="size-4 shrink-0 text-success" aria-label="selesai" />}
          </span>
          <span className="block truncate font-mono text-[10px] text-muted-foreground">
            {c.datasetKey.toUpperCase()} DB · +{c.xp} XP
            {c.attempts > 0 && !c.solved ? ` · ${c.attempts}× dicoba` : ""}
          </span>
        </span>
        {!open && (
          <Swords className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
      </button>

      {open && (
        <div className="space-y-3 border-t border-border px-4 py-4">
          <p className="whitespace-pre-line text-sm leading-relaxed">{c.prompt}</p>

          <Textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="Tulis query-mu di sini…"
            rows={5}
            className="font-mono text-[13px]"
          />

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={runPreview} disabled={!sql.trim()}>
              Jalankan (preview)
            </Button>
            <Button size="sm" onClick={submitAnswer} disabled={busy || !sql.trim()}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <>Kirim Jawaban</>}
            </Button>
          </div>

          {localError && (
            <pre className="overflow-x-auto rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">
              {localError}
            </pre>
          )}

          {result && (
            <p
              className={cn(
                "rounded-md border px-3 py-2 text-sm",
                result.correct
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-warning/40 bg-warning/10 text-warning",
              )}
            >
              {result.message}
            </p>
          )}

          {preview && (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-sidebar font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {preview.columns.map((col) => (
                      <th key={col} className="px-2.5 py-1.5 font-medium">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0">
                      {preview.columns.map((col) => (
                        <td key={col} className="whitespace-nowrap px-2.5 py-1.5 font-mono">
                          {row[col] == null ? "NULL" : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.rows.length > 20 && (
                <p className="border-t border-border/40 px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
                  +{preview.rows.length - 20} baris lagi…
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
