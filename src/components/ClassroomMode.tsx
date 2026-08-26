import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { exerciseDataset } from "@/lib/curriculum";
import { runSql, SqlError } from "@/lib/sql/engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, Users, Copy, Check, Play, Square } from "lucide-react";
import { playBattleWin, playBattleLose } from "@/lib/sounds";

interface Props {
  role: string;
}

export default function ClassroomMode({ role }: Props) {
  const isTeacher = role === "teacher" || role === "admin";
  const [joinCode, setJoinCode] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<Id<"classroomSessions"> | null>(null);
  const [sql, setSql] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; elapsedMs: number; xpEarned: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createSession = useMutation(api.classroom.createSession);
  const joinSession = useMutation(api.classroom.joinSession);
  const startSession = useMutation(api.classroom.startSession);
  const submitAnswer = useMutation(api.classroom.submitAnswer);
  const endSession = useMutation(api.classroom.endSession);
  const session = useQuery(
    api.classroom.getSession,
    activeSessionId ? { sessionId: activeSessionId } : "skip",
  );

  // Poll for updates
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!activeSessionId) return;
    const iv = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(iv);
  }, [activeSessionId]);

  const handleCreate = async (className: string, exerciseId: string) => {
    try {
      const r = await createSession({ className, exerciseId });
      setActiveSessionId(r.sessionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat sesi.");
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    try {
      const r = await joinSession({ code: joinCode.trim().toUpperCase() });
      setActiveSessionId(r.sessionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal join.");
    }
  };

  const handleSubmit = async () => {
    if (!activeSessionId || !sql.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await submitAnswer({ sessionId: activeSessionId, sqlText: sql.trim() });
      setResult(r);
      if (r.correct) playBattleWin();
      else playBattleLose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal submit.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = () => {
    if (session?.code) {
      navigator.clipboard.writeText(session.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Show join input if no active session
  if (!activeSessionId) {
    return (
      <section className="panel p-5">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-info" strokeWidth={1.75} />
          <h3 className="text-sm font-bold uppercase tracking-wide">Classroom Mode</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Masuk sesi kelas dengan kode dari gurumu.
        </p>
        <div className="mt-3 flex gap-2">
          <Input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Kode 4 huruf"
            className="font-mono text-center tracking-widest uppercase"
            maxLength={4}
          />
          <Button onClick={handleJoin} disabled={!joinCode.trim()}>Gabung</Button>
        </div>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </section>
    );
  }

  if (!session) return <div className="panel h-32 animate-pulse" />;

  const myResult = session.participants.find((p) => p.correct && p.elapsedMs !== null);

  return (
    <section className="panel p-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-info" strokeWidth={1.75} />
          <h3 className="text-sm font-bold uppercase tracking-wide">Classroom Session</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
            session.status === "active" ? "border-success/40 bg-success/10 text-success" :
            session.status === "waiting" ? "border-warning/40 bg-warning/10 text-warning" :
            "border-border bg-secondary text-muted-foreground",
          )}>
            {session.status}
          </span>
        </div>
      </div>

      {/* Session info */}
      <div className="mt-3 flex items-center gap-3">
        {session.code && (
          <button onClick={copyCode} className="flex items-center gap-1.5 rounded border border-border bg-secondary px-3 py-1.5 font-mono text-lg font-bold tracking-widest transition-colors hover:bg-accent">
            {session.code}
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5 text-muted-foreground" />}
          </button>
        )}
        {session.exercise && (
          <span className="text-sm text-muted-foreground">· {session.exercise.title}</span>
        )}
      </div>

      {/* Teacher controls */}
      {isTeacher && session.status === "waiting" && (
        <Button onClick={() => startSession({ sessionId: activeSessionId })} className="mt-3" size="sm">
          <Play className="size-3.5" /> Mulai Sesi
        </Button>
      )}
      {isTeacher && session.status === "active" && (
        <Button onClick={() => endSession({ sessionId: activeSessionId })} className="mt-3" variant="destructive" size="sm">
          <Square className="size-3.5" /> Akhiri Sesi
        </Button>
      )}

      {/* SQL Editor (student, during active) */}
      {session.status === "active" && !isTeacher && !result?.correct && (
        <div className="mt-4 space-y-3">
          <textarea
            value={sql}
            onChange={(e) => { setSql(e.target.value); setResult(null); setError(null); }}
            placeholder="Tulis query SQL-mu..."
            className="w-full rounded-lg border border-border bg-card p-3 font-mono text-sm focus:border-primary focus:outline-none"
            rows={3}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button onClick={handleSubmit} disabled={submitting || !sql.trim()} size="sm">
            {submitting ? <Loader2 className="size-3.5 animate-spin" /> : "Submit Jawaban"}
          </Button>
        </div>
      )}

      {result?.correct && (
        <div className="mt-3 rounded-md border border-success/40 bg-success/10 p-3">
          <p className="text-sm font-bold text-success">✓ Benar! {(result.elapsedMs / 1000).toFixed(1)}s · +{result.xpEarned} XP</p>
        </div>
      )}

      {/* Participants ranking */}
      <div className="mt-4">
        <p className="kicker mb-2">PARTISIPAN ({session.participants.length})</p>
        {session.participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">Menunggu siswa bergabung...</p>
        ) : (
          <ol className="space-y-1.5">
            {session.participants.map((p, i) => (
              <li key={p.userId} className={cn(
                "flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors",
                i === 0 && p.correct ? "bg-success/5 border border-success/20" : "bg-secondary/40",
              )}>
                <span className="w-5 text-center font-mono text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="text-base">{p.avatarEmoji}</span>
                <span className="flex-1 truncate font-semibold">{p.name}</span>
                {p.correct ? (
                  <span className="font-mono text-xs font-bold text-success">
                    ✓ {(p.elapsedMs! / 1000).toFixed(1)}s · +{p.xpEarned} XP
                  </span>
                ) : (
                  <span className="font-mono text-xs text-muted-foreground">belum selesai</span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
