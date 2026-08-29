import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, useParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, ArrowRight, Check, CircleHelp, ShieldAlert, Timer } from "lucide-react";
import { playQuizPassed, playWrong } from "@/lib/sounds";
import { LottieAnimation, XpGainAnimation } from "@/components/ui/lottie-animation";
import {
  exerciseDataset,
  getExercise,
  getLesson,
  type LessonBlock,
} from "@/lib/curriculum";
import type { Database as SqlDatabase } from "@/lib/sql/engine";
import { Button } from "@/components/ui/button";
import { SqlPlayground } from "@/components/SqlPlayground";
import { SqlSandboxInline } from "@/components/SqlSandboxInline";
import { schoolDb, kantinDb } from "@/lib/data/datasets";
import { cn } from "@/lib/utils";

/* --------------------------- block renderer ----------------------------- */

function BlockRenderer({
  block,
  index,
}: {
  block: LessonBlock;
  index: number;
}) {
  switch (block.type) {
    case "heading":
      return (
        <h2 className="pt-4 text-lg font-bold tracking-tight">{block.text}</h2>
      );
    case "text":
      return (
        <p className="max-w-prose text-[15px] leading-relaxed text-secondary-foreground">
          {block.text}
        </p>
      );
    case "code":
      return (
        <figure>
          <pre className="overflow-x-auto rounded-md border border-border bg-card p-3 font-mono text-[13px] leading-relaxed">
            {block.code}
          </pre>
          {block.caption && (
            <figcaption className="mt-1 font-mono text-[11px] text-muted-foreground">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case "sqlSandbox":
      return (
        <SqlSandboxInline
          initialCode={block.code}
          db={block.dataset === "school" ? schoolDb : kantinDb}
          caption={block.caption}
          hint={block.hint}
        />
      );
    case "callout": {
      const tone =
        block.tone === "warn"
          ? "border-warning bg-warning/10"
          : block.tone === "fun"
            ? "border-info bg-info/10"
            : "border-primary bg-accent/40";
      return (
        <div className={cn("rounded-r-md border-l-2 px-3 py-2 text-sm", tone)}>
          {block.text}
        </div>
      );
    }
    case "analogy":
      // identitas pembelajaran: label kecil + border kiri + latar tipis
      return (
        <aside className="rounded-md border border-border bg-muted/50 p-4">
          <p className="kicker">GAMPANGNYA GINI</p>
          <p className="mt-1.5 text-sm font-semibold">{block.title}</p>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-secondary-foreground">
            {block.text}
          </p>
        </aside>
      );
    case "buatApa":
      return (
        <aside className="rounded-md border border-border bg-muted/50 p-4">
          <p className="kicker">BUAT APA SIH?</p>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed">{block.text}</p>
        </aside>
      );
    case "note":
      return (
        <aside className="border-l-2 border-info pl-3 font-mono text-xs leading-relaxed text-muted-foreground">
          <span className="font-bold uppercase tracking-wider text-info">
            PROGRAMMER NOTE{" "}
          </span>
          {"// "}
          {block.text}
        </aside>
      );
    case "quiz":
      // CEK PEMAHAMAN lama diganti sistem kuis acak server-side (QuizSection)
      return null;
  }
}

/* ---------------------- CEK PEMAHAMAN — kuis aman ----------------------- */

interface QuizQ {
  id: string;
  question: string;
  options: string[];
}
interface QuizResult {
  question: string;
  options: string[];
  pick: number;
  correctIndex: number;
  correct: boolean;
  explain: string;
}

const QUIZ_RULES = [
  "3-5 soal acak dari materi lesson ini — tiap siswa & tiap percobaan berbeda",
  "Lulus dengan benar ≥ 75% untuk membuka latihan",
  "Anti-cheat aktif: copy/paste, klik kanan & pindah tab tercatat — 3× = kuis direset dengan soal baru",
];

function QuizSection({
  lessonId,
  alreadyDone,
  passed,
}: {
  lessonId: string;
  alreadyDone: boolean;
  passed: boolean;
}) {
  const start = useMutation(api.quiz.startQuizSession);
  const submit = useMutation(api.quiz.submitQuiz);
  const report = useMutation(api.quiz.reportViolation);

  const [session, setSession] = useState<{
    id: Id<"quizSessions">;
    questions: QuizQ[];
    expiresAt: number;
  } | null>(null);
  const [picks, setPicks] = useState<number[]>([]);
  const [result, setResult] = useState<{
    passed: boolean;
    score: number;
    total: number;
    results: QuizResult[];
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [violations, setViolations] = useState(0);
  const [left, setLeft] = useState(0);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  // hitung mundur waktu kuis
  useEffect(() => {
    if (!session) return;
    const tick = () => {
      const rem = Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 1000));
      setLeft(rem);
      if (rem === 0) {
        setSession(null);
        setError("Waktu kuis habis (20 menit). Mulai ulang untuk mendapat soal baru.");
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [session]);

  // anti-cheat: deteksi pindah tab / minimize
  useEffect(() => {
    if (!session) return;
    const onHide = () => {
      if (document.hidden) {
        void violation("blur", "Kamu meninggalkan tab saat kuis! Pelanggaran tercatat.");
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const violation = async (kind: string, msg: string) => {
    const s = sessionRef.current;
    if (!s) return;
    setWarning(msg);
    try {
      const r = await report({ sessionId: s.id, kind });
      setViolations(r.violations);
      if (r.voided) {
        setSession(null);
        setPicks([]);
        setWarning(null);
        setError(
          "Sesi dibatalkan: 3× pelanggaran terdeteksi (copy/paste/klik kanan/pindah tab). Mulai ulang — soal diacak ulang.",
        );
      }
    } catch {
      /* sesi mungkin sudah selesai */
    }
  };

  const handleStart = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    setWarning(null);
    setViolations(0);
    try {
      const r = await start({ lessonId });
      setSession({
        id: r.sessionId,
        questions: r.questions as QuizQ[],
        expiresAt: r.expiresAt,
      });
      setPicks(new Array(r.questions.length).fill(-1));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memulai kuis.");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    const s = sessionRef.current;
    if (!s) return;
    setBusy(true);
    try {
      const r = await submit({ sessionId: s.id, picks });
      if (r.passed) playQuizPassed();
      else playWrong();
      setResult(r);
      setSession(null);
      setWarning(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengirim jawaban.");
      setSession(null);
    } finally {
      setBusy(false);
    }
  };

  const antiCheatProps = {
    onCopy: (e: React.ClipboardEvent) => {
      e.preventDefault();
      void violation("copy", "Copy terdeteksi & dicatat!");
    },
    onCut: (e: React.ClipboardEvent) => {
      e.preventDefault();
      void violation("cut", "Cut terdeteksi & dicatat!");
    },
    onPaste: (e: React.ClipboardEvent) => {
      e.preventDefault();
      void violation("paste", "Paste terdeteksi & dicatat!");
    },
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      void violation("contextmenu", "Klik kanan dimatikan saat kuis.");
    },
    onDragStart: (e: React.DragEvent) => e.preventDefault(),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "x", "p", "s", "u"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        void violation("copy", "Shortcut copy/print diblokir saat kuis.");
      }
    },
  };

  // ---------- sudah lulus (riwayat) ----------
  if (passed && !session && !result) {
    return (
      <fieldset className="rounded-md border border-success/40 bg-success/5 p-4">
        <legend className="flex items-center gap-1.5 px-1 font-mono text-[11px] font-bold uppercase tracking-wider text-success">
          <CircleHelp className="size-3.5" /> CEK PEMAHAMAN · LULUS ✓
        </legend>
        <p className="text-sm text-secondary-foreground">
          Kamu sudah lulus kuis lesson ini{alreadyDone ? " dan lessonnya tamat" : ""}.
          Latihan bebas kamu kerjakan kapan saja.
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={handleStart} disabled={busy}>
          Ulangi kuis (soal acak baru)
        </Button>
      </fieldset>
    );
  }

  // ---------- hasil ----------
  if (result) {
    return (
      <fieldset
        className={cn(
          "rounded-md border p-4",
          result.passed ? "border-success/50 bg-success/5" : "border-warning/50 bg-warning/5",
        )}
      >
        <legend
          className={cn(
            "flex items-center gap-1.5 px-1 font-mono text-[11px] font-bold uppercase tracking-wider",
            result.passed ? "text-success" : "text-warning",
          )}
        >
          <CircleHelp className="size-3.5" />{" "}
          {result.passed ? "LULUS ✓" : "BELUM LULUS"} · SKOR {result.score}/{result.total}
        </legend>
        <div className="flex items-center gap-3">
          {result.passed && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}><LottieAnimation animation="quiz-correct" size="md" loop={false} /></motion.div>}
          {!result.passed && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}><LottieAnimation animation="quiz-wrong" size="md" loop={false} /></motion.div>}
          <p className="text-sm text-secondary-foreground">
            {result.passed
              ? "Mantap — latihan lesson ini terbuka. "
              : `Butuh benar ≥ ${Math.ceil(result.total * 0.75)} dari ${result.total}. Bedah jawabanmu di bawah, lalu coba lagi dengan soal baru. `}
          </p>
        </div>
        {result.passed && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><XpGainAnimation amount={result.total * 20} /></motion.div>}
        <ul className="mt-3 space-y-3">
          {result.results.map((r, i) => (
            <li key={i} className="rounded-md border border-border bg-background p-3">
              <p className="text-sm font-semibold">
                {i + 1}. {r.question}
              </p>
              <ul className="mt-1.5 space-y-1">
                {r.options.map((opt, oi) => (
                  <li
                    key={oi}
                    className={cn(
                      "rounded border px-2 py-1 font-mono text-xs",
                      oi === r.correctIndex
                        ? "border-success/50 bg-success/10 text-success"
                        : oi === r.pick
                          ? "border-destructive/50 bg-destructive/10 text-destructive"
                          : "border-border text-muted-foreground",
                    )}
                  >
                    {String.fromCharCode(65 + oi)}. {opt}
                    {oi === r.correctIndex && " ✓"}
                    {oi === r.pick && oi !== r.correctIndex && " ✗ pilihanmu"}
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-xs italic text-muted-foreground">{r.explain}</p>
            </li>
          ))}
        </ul>
        {!result.passed && (
          <Button className="mt-3" onClick={handleStart} disabled={busy}>
            Coba lagi — soal baru
          </Button>
        )}
      </fieldset>
    );
  }

  // ---------- kuis aktif ----------
  if (session) {
    const answered = picks.filter((p) => p >= 0).length;
    const allPicked = answered === picks.length;
    const mm = String(Math.floor(left / 60)).padStart(2, "0");
    const ss = String(left % 60).padStart(2, "0");
    return (
      <fieldset
        {...antiCheatProps}
        className="relative select-none rounded-md border border-primary/50 p-4"
      >
        <legend className="flex items-center gap-1.5 px-1 font-mono text-[11px] font-bold uppercase tracking-wider text-primary">
          <CircleHelp className="size-3.5" /> CEK PEMAHAMAN · {session.questions.length} SOAL
        </legend>
        {warning && (
          <p className="mb-2 flex items-center gap-1.5 rounded border border-destructive/50 bg-destructive/10 px-2 py-1 font-mono text-[11px] font-bold text-destructive">
            <ShieldAlert className="size-3.5 shrink-0" /> {warning}
          </p>
        )}
        <p className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
          <span className={cn(violations > 0 && "font-bold text-destructive")}>
            PELANGGARAN: {violations}/3
          </span>
          <span className="flex items-center gap-1">
            <Timer className="size-3" aria-hidden /> SISA WAKTU:{" "}
            <span className="font-bold tabular-nums text-foreground">
              {mm}:{ss}
            </span>
          </span>
        </p>
        <ol className="mt-3 space-y-4">
          {session.questions.map((qq, qi) => (
            <li key={qq.id}>
              <p className="text-sm font-semibold">
                {qi + 1}. {qq.question}
              </p>
              <div className="mt-1.5 space-y-1">
                {qq.options.map((opt, oi) => {
                  const isPicked = picks[qi] === oi;
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => setPicks((p) => p.map((v, i) => (i === qi ? oi : v)))}
                      aria-pressed={isPicked}
                      className={cn(
                        "block w-full rounded-md border px-3 py-1.5 text-left font-mono text-[13px] transition-colors",
                        isPicked
                          ? "border-primary bg-primary/10 font-semibold"
                          : "border-border hover:border-foreground/30 hover:bg-secondary/60",
                      )}
                    >
                      {String.fromCharCode(65 + oi)}. {opt}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={handleSubmit} disabled={busy || !allPicked}>
            {allPicked ? "Kunci Jawaban" : `Jawab semua (${answered}/${picks.length})`}
          </Button>
          {!allPicked && (
            <p className="font-mono text-[11px] text-muted-foreground">
              jawab semua soal dulu — satu kali kunci, sesi selesai
            </p>
          )}
        </div>
      </fieldset>
    );
  }

  // ---------- belum mulai ----------
  return (
    <fieldset className="rounded-md border border-primary/40 bg-accent/30 p-4">
      <legend className="flex items-center gap-1.5 px-1 font-mono text-[11px] font-bold uppercase tracking-wider text-primary">
        <CircleHelp className="size-3.5" /> CEK PEMAHAMAN
      </legend>
      <p className="text-sm font-semibold">
        Buktikan kamu paham materi ini sebelum latihan dibuka.
      </p>
      <ul className="mt-2 space-y-1 font-mono text-[11px] leading-relaxed text-muted-foreground">
        {QUIZ_RULES.map((r) => (
          <li key={r}>▸ {r}</li>
        ))}
      </ul>
      {error && (
        <p className="mt-2 rounded border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive">
          {error}
        </p>
      )}
      <Button className="mt-3" onClick={handleStart} disabled={busy}>
        {busy ? "Menyiapkan soal..." : passed ? "Ulangi kuis (soal acak baru)" : "Mulai Kuis"}
      </Button>
    </fieldset>
  );
}

/* ------------------------------- main page ------------------------------- */

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const entry = lessonId ? getLesson(lessonId) : undefined;
  const data = useQuery(api.game.dashboard);
  // status kuis lesson ini — reaktif: begitu lulus, gate latihan terbuka
  const quizPassed = useQuery(api.quiz.hasPassedQuiz, { lessonId: lessonId ?? "" });
  const [phase, setPhase] = useState<"learn" | "practice">("learn");
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [lessonMarked, setLessonMarked] = useState(false);

  const completeLesson = useMutation(api.game.completeLesson);
  const doneLessons = new Set(data?.completedLessons ?? []);

  if (!entry) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="text-xl font-bold">Lesson tidak ditemukan.</h1>
        <Link to="/learn" className="mt-3 inline-block text-sm text-primary hover:underline">
          ← Kembali ke peta belajar
        </Link>
      </div>
    );
  }

  const { lesson, world } = entry;
  const totalXp = lesson.exerciseIds.reduce((sum, id) => sum + (getExercise(id)?.xp ?? 0), 0);
  const allSolved =
    lesson.exerciseIds.length > 0 && lesson.exerciseIds.every((id) => solved.has(id));
  // latihan terkunci sampai kuis lulus (lesson yang sudah tamat langsung terbuka)
  const quizUnlocked = quizPassed === true || doneLessons.has(lesson.id);
  // apakah ini lesson terakhir di world ini?
  const isLastLessonInWorld = world.lessons[world.lessons.length - 1]?.id === lesson.id;

  const markComplete = async () => {
    if (lessonMarked || quizPassed !== true || doneLessons.has(lesson.id)) return;
    setLessonMarked(true);
    try {
      await completeLesson({ lessonId: lesson.id });
    } catch {
      /* progress tetap tersimpan lokal untuk sesi ini */
    }
  };

  // Auto-complete: latihan semua selesai ATAU lesson tanpa latihan & kuis lulus
  const shouldComplete =
    quizPassed === true &&
    !lessonMarked &&
    !doneLessons.has(lesson.id) &&
    (allSolved || lesson.exerciseIds.length === 0);
  if (shouldComplete) void markComplete();

  return (
    <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[200px_minmax(0,1fr)_240px]">
      {/* ---------- NAVIGATOR KIRI ---------- */}
      <nav className="order-2 hidden lg:order-1 lg:block" aria-label="Daftar lesson world ini">
        <p className="kicker mb-2">WORLD {String(world.num).padStart(2, "0")}</p>
        <ul className="space-y-0.5">
          {world.lessons.map((l, i) => {
            const active = l.id === lesson.id;
            const done = doneLessons.has(l.id);
            return (
              <li key={l.id}>
                <Link
                  to={`/lesson/${l.id}`}
                  onClick={() => {
                    setPhase("learn");
                    setSolved(new Set());
                    setLessonMarked(false);
                  }}
                  className={cn(
                    "flex items-baseline gap-2 rounded-md px-2 py-1 text-sm transition-colors",
                    active
                      ? "bg-accent/60 font-semibold text-accent-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <span className="w-4 shrink-0 font-mono text-[10px] opacity-70">
                    {done ? <Check className="size-3 text-success" /> : `${i + 1}.`}
                  </span>
                  <span className="truncate">{l.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          to="/learn"
          className="mt-4 flex items-center gap-1.5 px-2 font-mono text-[11px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> semua world
        </Link>
      </nav>

      {/* ---------- KONTEN ---------- */}
      <article className="order-1 min-w-0 lg:order-2">
        <header className="mb-6">
          <p className="kicker">
            WORLD {String(world.num).padStart(2, "0")} · {world.title.toUpperCase()}
          </p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-[28px]">
            {lesson.title}
          </h1>
          <p className="mt-2 border-l-2 border-border pl-3 text-sm italic text-muted-foreground">
            “{world.subtitle}”
          </p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            {lesson.minutes} min baca · +{totalXp} XP dari latihan
          </p>
        </header>

        {phase === "learn" ? (
          <>
            <div className="max-w-[720px] space-y-4">
              {lesson.blocks
                .filter((b) => b.type !== "quiz")
                .map((b, i) => (
                  <BlockRenderer key={i} block={b} index={i} />
                ))}
              <QuizSection
                key={lesson.id}
                lessonId={lesson.id}
                alreadyDone={doneLessons.has(lesson.id)}
                passed={quizPassed === true}
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
              {lesson.exerciseIds.length > 0 ? (
                <Button
                  size="lg"
                  onClick={() => setPhase("practice")}
                  disabled={!quizUnlocked}
                >
                  {quizUnlocked ? (
                    <>
                      Lanjut ke latihan <ArrowRight className="size-4" />
                    </>
                  ) : (
                    "Latihan terkunci 🔒"
                  )}
                </Button>
              ) : null}
              {!quizUnlocked && lesson.exerciseIds.length > 0 && (
                <p className="font-mono text-xs text-warning">
                  Lulusi CEK PEMAHAMAN dulu untuk membuka latihan.
                </p>
              )}
              {lesson.exerciseIds.length === 0 && !quizUnlocked && (
                <p className="font-mono text-xs text-warning">
                  Lulusi CEK PEMAHAMAN dulu.
                </p>
              )}


            </div>
          </>
        ) : (
          <div className="max-w-full space-y-4">
            {(() => {
              const exId = lesson.exerciseIds.find((id) => !solved.has(id)) ?? lesson.exerciseIds[0];
              const ex = getExercise(exId)!;
              return (
                <>
                  <SqlPlayground
                    key={ex.id}
                    exercise={ex}
                    db={exerciseDataset(ex.id) as unknown as SqlDatabase}
                    onSolved={() => setSolved((prevSet) => new Set(prevSet).add(ex.id))}
                  />
                  {allSolved && (
                    <div className="rounded-md border border-success/40 bg-success/10 p-4">
                      <p className="text-sm font-bold text-success">✓ LESSON COMPLETE</p>
                      <p className="mt-1 text-sm text-secondary-foreground">
                        Semua latihan di lesson ini beres.
                        {isLastLessonInWorld
                          ? " World ini tamat — mantap!"
                          : " Selesaikan semua lesson di world ini untuk melanjutkan."}
                      </p>
                      <Link
                        to="/learn"
                        className="mt-3 inline-flex items-center gap-2 rounded-md bg-success px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        <ArrowLeft className="size-4" /> Kembali ke Peta Dunia
                      </Link>
                    </div>
                  )}
                </>
              );
            })()}
            <Button variant="ghost" size="sm" onClick={() => setPhase("learn")}>
              <ArrowLeft className="size-3.5" /> baca ulang materi
            </Button>
          </div>
        )}

      </article>

      {/* ---------- PANEL KANAN / CONTEXT ---------- */}
      <aside className="order-3 space-y-6 lg:sticky lg:top-6 lg:h-fit">
        <section aria-label="Misi lesson ini">
          <p className="kicker mb-2">MISSION TRACKER</p>
          <ol className="space-y-1.5">
            {lesson.exerciseIds.map((id, i) => {
              const ex = getExercise(id);
              const ok = solved.has(id);
              return (
                <li key={id} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={cn("min-w-0 flex-1", ok && "text-muted-foreground line-through")}>
                    {ex?.title ?? id}
                  </span>
                  {ok && <Check className="mt-0.5 size-3.5 shrink-0 text-success" />}
                </li>
              );
            })}
            {lesson.exerciseIds.length === 0 && (
              <li className="text-sm text-muted-foreground">Belum ada misi.</li>
            )}
          </ol>
        </section>

        {phase === "practice" && (() => {
          const exId = lesson.exerciseIds.find((id) => !solved.has(id));
          const ex = exId ? getExercise(exId) : undefined;
          if (!ex) return null;
          return (
            <section aria-label="Dataset">
              <p className="kicker mb-2">DATASET</p>
              <p className="font-mono text-xs">
                <span className="font-bold text-primary">{ex.dataset === "school" ? "school_db" : "kantin_db"}</span>
                <span className="text-muted-foreground">
                  {ex.dataset === "school" ? " · database sekolah" : " · database kantin"}
                </span>
              </p>
            </section>
          );
        })()}
      </aside>
    </div>
  );
}


