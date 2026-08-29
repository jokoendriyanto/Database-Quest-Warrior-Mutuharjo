import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { exerciseDataset } from "@/lib/curriculum";
import { runSql, SqlError } from "@/lib/sql/engine";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Trophy, Clock, Users, Zap } from "lucide-react";
import {
  LottieAnimation,
  DatabaseLoadingAnimation,
  XpGainAnimation,
} from "@/components/ui/lottie-animation";

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-success border-success/40 bg-success/10",
  medium: "text-warning border-warning/40 bg-warning/10",
  hard: "text-destructive border-destructive/40 bg-destructive/10",
};

export default function WeeklyBossArena() {
  const boss = useQuery(api.weeklyBoss.getCurrentBoss);
  const submitAnswer = useMutation(api.weeklyBoss.submitBossAnswer);
  const [sql, setSql] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; elapsedMs: number; xpEarned: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any>(null);

  const handlePreview = () => {
    if (!boss || !sql.trim()) return;
    try {
      const db = exerciseDataset(boss.datasetKey);
      const res = runSql(sql, db);
      setPreview(res);
      setError(null);
    } catch (e) {
      setPreview(null);
      setError(e instanceof SqlError ? e.message : "Error");
    }
  };

  const handleSubmit = async () => {
    if (!sql.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await submitAnswer({ sqlText: sql.trim() });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal submit.");
    } finally {
      setSubmitting(false);
    }
  };

  if (boss === undefined) {
    return (
      <section className="panel p-5">
        <DatabaseLoadingAnimation text="Memuat weekly boss..." />
      </section>
    );
  }

  if (!boss) {
    return (
      <section className="panel p-5">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-warning" strokeWidth={1.75} />
          <h3 className="text-sm font-bold uppercase tracking-wide">Weekly Boss</h3>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Belum ada boss challenge minggu ini. Guru bisa membuatnya dari Panel Kelas.
        </p>
      </section>
    );
  }

  return (
    <section className="panel p-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LottieAnimation animation="trophy-shine" size="sm" className="opacity-80" />
          <h3 className="text-sm font-bold uppercase tracking-wide">Weekly Boss</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase", DIFFICULTY_COLORS[boss.difficulty])}>
            {boss.difficulty}
          </span>
          <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
            <Users className="size-3" /> {boss.participants}
          </span>
        </div>
      </div>

      <h4 className="mt-3 text-lg font-bold">{boss.title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{boss.description}</p>

      {/* Top scores */}
      {boss.topScores.length > 0 && (
        <div className="mt-4 rounded-lg border border-border bg-secondary/40 p-3">
          <p className="kicker mb-2">TOP 5 TERCEPAT</p>
          <ol className="space-y-1.5">
            {boss.topScores.map((t, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-center font-mono text-xs font-bold text-warning">{i + 1}.</span>
                <span className="text-base">{t.avatarEmoji}</span>
                <span className="flex-1 truncate font-semibold">{t.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{(t.elapsedMs / 1000).toFixed(1)}s</span>
                <span className="font-mono text-xs font-bold text-primary">+{t.xpEarned} XP</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* My submission status */}
      {boss.mySubmission && (
        <div className={cn("mt-4 rounded-md border p-3", boss.mySubmission.correct ? "border-success/40 bg-success/10" : "border-border bg-secondary/40")}>
          {boss.mySubmission.correct ? (
            <div className="flex items-center gap-3">
              <LottieAnimation animation="battle-victory" size="sm" loop={false} />
              <div>
                <p className="text-sm font-bold text-success">Sudah diselesaikan — {(boss.mySubmission.elapsedMs / 1000).toFixed(1)}s</p>
                <XpGainAnimation amount={boss.mySubmission.xpEarned} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum berhasil — coba lagi!</p>
          )}
        </div>
      )}

      {/* SQL Editor */}
      {!boss.mySubmission?.correct && (
        <div className="mt-4 space-y-3">
          <textarea
            value={sql}
            onChange={(e) => { setSql(e.target.value); setPreview(null); setResult(null); }}
            placeholder="Tulis query SQL-mu di sini..."
            className="w-full rounded-lg border border-border bg-card p-3 font-mono text-sm focus:border-primary focus:outline-none"
            rows={4}
          />
          {error && (
            <p className="rounded border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive">{error}</p>
          )}
          {result && (
            <div className={cn("rounded-md border p-3", result.correct ? "border-success/40 bg-success/10" : "border-warning/40 bg-warning/10")}>
              {result.correct ? (
                <p className="text-sm font-bold text-success">✓ Benar! {(result.elapsedMs / 1000).toFixed(1)}s · +{result.xpEarned} XP</p>
              ) : (
                <p className="text-sm text-warning">✗ Jawaban belum sesuai — coba lagi!</p>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePreview} disabled={!sql.trim()}>
              Test Run
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={submitting || !sql.trim()}>
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <><Zap className="size-3.5" /> Submit Jawaban</>}
            </Button>
          </div>
          {preview && (
            <div className="overflow-x-auto rounded-lg border border-border bg-card p-3">
              <p className="kicker mb-2">HASIL TEST RUN</p>
              {preview.columns.length === 0 ? (
                <p className="text-xs text-muted-foreground">Query tidak menghasilkan data.</p>
              ) : (
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      {preview.columns.map((c: string) => (
                        <th key={c} className="px-2 py-1 font-bold text-muted-foreground">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.slice(0, 10).map((r: any[], i: number) => (
                      <tr key={i} className="border-b border-border/50">
                        {r.map((cell, ci) => (
                          <td key={ci} className="px-2 py-1">{cell === null ? <span className="text-muted-foreground">NULL</span> : String(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {preview.rows.length > 10 && (
                <p className="mt-1 text-[10px] text-muted-foreground">...dan {preview.rows.length - 10} baris lagi</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
