import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SqlPlayground } from "@/components/SqlPlayground";
import {
  getLesson,
  getExercise,
  LESSON_ORDER,
  exerciseDataset,
  type LessonBlock,
} from "@/lib/curriculum";
import { schoolTables, kantinTables } from "@/lib/data/datasets";
import { cn } from "@/lib/utils";

export default function LessonPage() {
  const { lessonId = "" } = useParams();
  const entry = getLesson(lessonId);
  const data = useQuery(api.game.dashboard);
  const completeLesson = useMutation(api.game.completeLesson);

  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [completing, setCompleting] = useState(false);
  const [lessonDoneTick, setLessonDoneTick] = useState(false);

  const tablesInfo = useMemo(() => {
    if (!entry) return schoolTables;
    const firstEx = entry.lesson.exerciseIds[0];
    if (!firstEx) return schoolTables;
    return getExercise(firstEx)?.dataset === "kantin" ? kantinTables : schoolTables;
  }, [entry]);

  if (!entry) {
    return (
      <div className="clay p-8 text-center">
        <p className="text-lg font-extrabold">Lesson nggak ditemukan. 🤔</p>
        <Button asChild className="clay-btn mt-4 rounded-2xl bg-primary font-bold">
          <Link to="/learn">Kembali ke Peta</Link>
        </Button>
      </div>
    );
  }

  const { lesson, world } = entry;
  const completed = new Set(data?.completedLessons ?? []);
  const alreadyDone = completed.has(lesson.id) || lessonDoneTick;

  const gIdx = LESSON_ORDER.findIndex((r) => r.lessonId === lesson.id);
  const nextRef = LESSON_ORDER[gIdx + 1];
  // unlock rule konsisten dengan halaman Learn: boleh lanjut kalau lesson ini tamat
  const canGoNext = alreadyDone;

  const exercises = lesson.exerciseIds
    .map((id) => getExercise(id))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await completeLesson({ lessonId: lesson.id });
      if (!res.alreadyCompleted) {
        toast.success(`Lesson selesai! +${res.xpAwarded} XP 🎉`, {
          description:
            (res.levelAfter ?? 0) > (res.levelBefore ?? 1)
              ? "LEVEL UP! Terus jaga momentumnya 🔥"
              : undefined,
        });
      }
      setLessonDoneTick(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan progres.");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <article className="flex flex-col gap-5">
      {/* header */}
      <header className="clay-flat p-6">
        <Link to="/learn" className="inline-flex items-center gap-1 text-xs font-extrabold text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-3.5" /> World {String(world.num).padStart(2, "0")} · {world.title}
        </Link>
        <h1 className="mt-2 text-2xl font-black tracking-tight">{lesson.title}</h1>
        <p className="mt-1 flex items-center gap-1 text-xs font-bold text-muted-foreground">
          <Clock className="size-3.5" /> ±{lesson.minutes} menit baca ·{" "}
          {exercises.length > 0 ? `${exercises.length} latihan SQL` : "konsep murni"}
        </p>
      </header>

      {/* content blocks */}
      <div className="flex flex-col gap-4">
        {lesson.blocks.map((b, i) => (
          <BlockView key={i} block={b} answer={quizAnswers[i]} onAnswer={(oi) => setQuizAnswers((s) => ({ ...s, [i]: oi }))} />
        ))}
      </div>

      {/* exercises */}
      {exercises.map((ex) => (
        <section key={ex.id} className="flex flex-col gap-3">
          <h2 className="px-1 text-lg font-black tracking-tight">
            🎯 Latihan: {ex.title}
          </h2>
          <SqlPlayground exercise={ex} db={exerciseDataset(ex.id)} />
        </section>
      ))}

      {/* completion */}
      <footer className="clay mt-2 flex flex-col items-center gap-4 p-6 text-center">
        {alreadyDone ? (
          <>
            <p className="flex items-center gap-2 font-extrabold text-green-600">
              <CheckCircle2 className="size-5" /> Lesson ini sudah kamu tamatkan!
            </p>
            {nextRef && (
              <Button asChild className="clay-btn rounded-2xl bg-primary font-extrabold">
                <Link to={`/lesson/${nextRef.lessonId}`}>
                  Lanjut ke: {getLesson(nextRef.lessonId)?.lesson.title ?? "Lesson berikutnya"}{" "}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
            {!nextRef && (
              <Button asChild className="clay-btn rounded-2xl bg-accent font-extrabold">
                <Link to="/battle">Coba Battle Arena ⚔️</Link>
              </Button>
            )}
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-muted-foreground">
              Sudah paham & selesai mencoba latihannya? Tandai lesson ini selesai buat dapat{" "}
              <span className="font-black text-primary">+20 XP</span> dan membuka lesson berikutnya.
            </p>
            <Button
              onClick={handleComplete}
              disabled={completing}
              className="clay-btn h-12 rounded-2xl bg-primary px-8 text-base font-extrabold"
            >
              {completing ? "Menyimpan..." : <>Tandai Selesai <ArrowRight className="size-4" /></>}
            </Button>
            {!canGoNext && nextRef && (
              <p className="text-xs text-muted-foreground">
                (Lesson berikutnya terbuka setelah ini ditandai selesai)
              </p>
            )}
          </>
        )}
      </footer>
    </article>
  );
}

function BlockView({
  block,
  answer,
  onAnswer,
}: {
  block: LessonBlock;
  answer?: number;
  onAnswer: (optionIndex: number) => void;
}) {
  switch (block.type) {
    case "heading":
      return <h2 className="px-1 pt-2 text-xl font-black tracking-tight">{block.text}</h2>;
    case "text":
      return (
        <p className="clay-sm px-4 py-3.5 text-sm leading-relaxed text-foreground/90">{block.text}</p>
      );
    case "code":
      return (
        <figure className="overflow-hidden rounded-[calc(var(--radius)+0.5rem)] bg-foreground/90 shadow-lg">
          <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-background">
            {block.code}
          </pre>
          {block.caption && (
            <figcaption className="border-t border-white/10 px-4 py-2 text-[11px] font-semibold text-background/70">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case "callout":
      return (
        <aside
          className={cn(
            "rounded-[calc(var(--radius)+0.25rem)] p-4 text-sm font-medium leading-relaxed",
            block.tone === "warn"
              ? "bg-orange-100/80 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200"
              : block.tone === "fun"
                ? "bg-pink-100/80 text-pink-900 dark:bg-pink-950/40 dark:text-pink-200"
                : "bg-sky-100/80 text-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
          )}
        >
          {block.text}
        </aside>
      );
    case "analogy":
      return (
        <motion.aside initial={{ scale: 0.98 }} whileInView={{ scale: 1 }} viewport={{ once: true }} className="clay-sm border-l-4 border-primary p-4">
          <p className="text-sm font-extrabold text-primary">{block.title}</p>
          <p className="mt-1 text-sm leading-relaxed">{block.text}</p>
        </motion.aside>
      );
    case "quiz": {
      const answered = answer !== undefined;
      return (
        <div className="clay-sm p-4">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Kuis Kilat</p>
          <p className="mt-1 text-sm font-bold leading-snug">{block.question}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {block.options.map((opt, oi) => {
              const isPicked = answer === oi;
              const isRight = oi === block.answer;
              return (
                <button
                  key={oi}
                  onClick={() => !answered && onAnswer(oi)}
                  disabled={answered}
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 text-left text-sm font-semibold transition-all",
                    !answered && "bg-secondary/70 hover:-translate-y-0.5 hover:bg-secondary",
                    answered && isRight && "bg-green-200 text-green-900 dark:bg-green-900/50 dark:text-green-100",
                    answered && isPicked && !isRight && "bg-destructive/15 text-destructive",
                    answered && !isPicked && !isRight && "bg-muted/50 text-muted-foreground",
                  )}
                >
                  {String.fromCharCode(65 + oi)}. {opt}
                  {answered && isRight && " ✓"}
                </button>
              );
            })}
          </div>
          {answered && (
            <p className="mt-3 rounded-2xl bg-accent/30 px-3 py-2 text-xs font-semibold leading-relaxed">
              💡 {block.explain}
            </p>
          )}
        </div>
      );
    }
  }
}