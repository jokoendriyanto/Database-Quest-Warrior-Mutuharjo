import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, Users, Copy, Check, Play, Square, AlertCircle } from "lucide-react";
import { QueryRunningAnimation } from "@/components/ui/lottie-animation";
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
  const [joining, setJoining] = useState(false);
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

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const handleCreate = async (className: string, exerciseId: string) => {
    try {
      const r = await createSession({ className, exerciseId });
      setActiveSessionId(r.sessionId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat sesi.");
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      setError("Kode harus 4 karakter.");
      return;
    }
    setJoining(true);
    setError(null);
    try {
      const r = await joinSession({ code });
      setActiveSessionId(r.sessionId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal gabung.";
      // Make error messages more student-friendly
      if (msg.includes("Not authenticated")) {
        setError("Silakan login ulang, lalu coba lagi.");
      } else if (msg.includes("tidak ditemukan")) {
        setError("Kode tidak ditemukan. Pastikan kode sudah benar dan guru sudah membuat sesi.");
      } else if (msg.includes("selesai")) {
        setError("Sesi ini sudah selesai. Tunggu guru buat sesi baru.");
      } else {
        setError(msg);
      }
    } finally {
      setJoining(false);
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
      const msg = e instanceof Error ? e.message : "Gagal submit.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !joining && joinCode.trim().length >= 4) {
      handleJoin();
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
            onChange={(e) => {
              setJoinCode(e.target.value.toUpperCase().slice(0, 4));
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Kode 4 huruf"
            className="font-mono text-center tracking-widest uppercase"
            maxLength={4}
            disabled={joining}
          />
          <Button
            onClick={handleJoin}
            disabled={!joinCode.trim() || joining || joinCode.trim().length < 4}
          >
            {joining ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              "Gabung"
            )}
          </Button>
        </div>
        {error && (
          <div className="mt-2 flex items-start gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground/60">
          Kode diberikan oleh guru saat sesi kelas dimulai.
        </p>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="panel p-5">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-info" strokeWidth={1.75} />
          <h3 className="text-sm font-bold uppercase tracking-wide">Classroom Mode</h3>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <QueryRunningAnimation />
          Memuat sesi kelas...
        </div>
      </section>
    );
  }

  return (
    <section className="panel p-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-info" strokeWidth={1.75} />
          <h3 className="text-sm font-bold uppercase tracking-wide">Classroom Session</h3>
        </div>
        <span className={cn(
          "rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
          session.status === "active" ? "border-success/40 bg-success/10 text-success" :
          session.status === "waiting" ? "border-warning/40 bg-warning/10 text-warning" :
          "border-border bg-secondary text-muted-foreground",
        )}>
          {session.status === "waiting" ? "Menunggu" :
           session.status === "active" ? "Berlangsung" : "Selesai"}
        </span>
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

      {/* Waiting message for students */}
      {session.status === "waiting" && !isTeacher && (
        <div className="mt-4 rounded-md border border-warning/30 bg-warning/5 p-3">
          <p className="text-sm text-warning">⏳ Menunggu guru memulai sesi...</p>
          <p className="mt-1 text-xs text-muted-foreground">Sesi akan aktif setelah guru menekan "Mulai Sesi".</p>
        </div>
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
          {error && (
            <div className="flex items-start gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}
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

      {/* Finished message */}
      {session.status === "finished" && !result?.correct && (
        <div className="mt-3 rounded-md border border-border bg-secondary/40 p-3">
          <p className="text-sm text-muted-foreground">Sesi sudah berakhir.</p>
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
