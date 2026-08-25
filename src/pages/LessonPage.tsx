import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowLeft, ArrowRight, Check, CircleHelp } from "lucide-react";
import {
  LESSON_ORDER,
  exerciseDataset,
  getExercise,
  getLesson,
  type LessonBlock,
} from "@/lib/curriculum";
import type { Database as SqlDatabase } from "@/lib/sql/engine";
import { Button } from "@/components/ui/button";
import { SqlPlayground } from "@/components/SqlPlayground";
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
      return <QuizBlock key={index} {...block} />;
  }
}

function QuizBlock({
  question,
  options,
  answer,
  explain,
}: {
  question: string;
  options: string[];
  answer: number;
  explain: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === answer;
  return (
    <fieldset className="rounded-md border border-border p-4">
      <legend className="flex items-center gap-1.5 px-1 font-mono text-[11px] font-bold uppercase tracking-wider text-primary">
        <CircleHelp className="size-3.5" /> CEK PEMAHAMAN
      </legend>
      <p className="text-sm font-semibold">{question}</p>
      <div className="mt-2.5 space-y-1.5">
        {options.map((opt, i) => {
          const isPicked = picked === i;
          const showRight = picked != null && i === answer;
          return (
            <button
              key={i}
              onClick={() => setPicked(i)}
              disabled={correct}
              aria-pressed={isPicked}
              className={cn(
                "block w-full rounded-md border px-3 py-1.5 text-left font-mono text-[13px] transition-colors",
                showRight
                  ? "border-success bg-success/10"
                  : isPicked && !correct
                    ? "border-warning bg-warning/10"
                    : "border-border hover:border-foreground/30 hover:bg-secondary/60",
                correct && "opacity-70",
              )}
            >
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          );
        })}
      </div>
      {picked != null && (
        <p
          className={cn(
            "mt-2.5 text-sm",
            correct ? "text-success" : "text-warning",
          )}
        >
          {correct ? "✓ Tepat. " : "! Belum tepat. "}
          <span className="font-normal text-secondary-foreground">{explain}</span>
        </p>
      )}
    </fieldset>
  );
}

/* ------------------------------- main page ------------------------------- */

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const entry = lessonId ? getLesson(lessonId) : undefined;
  const data = useQuery(api.game.dashboard);
  const [phase, setPhase] = useState<"learn" | "practice">("learn");
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [lessonMarked, setLessonMarked] = useState(false);

  const completeLesson = useMutation(api.game.completeLesson);
  const doneLessons = new Set(data?.completedLessons ?? []);

  const globalIdx = useMemo(
    () => LESSON_ORDER.findIndex((l) => l.lessonId === lessonId),
    [lessonId],
  );
  const prev = globalIdx > 0 ? LESSON_ORDER[globalIdx - 1] : null;
  const next =
    globalIdx >= 0 && globalIdx < LESSON_ORDER.length - 1
      ? LESSON_ORDER[globalIdx + 1]
      : null;

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

  const markComplete = async () => {
    if (lessonMarked || doneLessons.has(lesson.id)) return;
    setLessonMarked(true);
    try {
      await completeLesson({ lessonId: lesson.id });
    } catch {
      /* progress tetap tersimpan lokal untuk sesi ini */
    }
  };

  if (allSolved && !lessonMarked && !doneLessons.has(lesson.id)) void markComplete();

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
              {lesson.blocks.map((b, i) => (
                <BlockRenderer key={i} block={b} index={i} />
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
              <Button
                size="lg"
                onClick={() => setPhase("practice")}
                disabled={lesson.exerciseIds.length === 0}
              >
                Lanjut ke latihan <ArrowRight className="size-4" />
              </Button>
              {next && (
                <Link
                  to={`/lesson/${next.lessonId}`}
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setPhase("learn");
                    setSolved(new Set());
                    setLessonMarked(false);
                  }}
                >
                  skip ke lesson berikutnya →
                </Link>
              )}
              {lesson.exerciseIds.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  World ini segera hadir — konten lengkap menyusul.
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
                      <p className="text-sm font-bold text-success">✓ WORLD MISSION COMPLETE</p>
                      <p className="mt-1 text-sm text-secondary-foreground">
                        Semua latihan di lesson ini beres.
                        {next ? " Lanjut ke lesson berikutnya!" : " World ini tamat — mantap!"}
                      </p>
                      {next && (
                        <Link
                          to={`/lesson/${next.lessonId}`}
                          onClick={() => {
                            setPhase("learn");
                            setSolved(new Set());
                            setLessonMarked(false);
                          }}
                          className="mt-3 inline-flex items-center gap-2 rounded-md bg-success px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                        >
                          Lesson berikutnya <ArrowRight className="size-4" />
                        </Link>
                      )}
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

        {/* navigasi bawah — mobile friendly */}
        <nav className="mt-10 flex items-center justify-between border-t border-border pt-4 text-sm" aria-label="Navigasi lesson">
          {prev ? (
            <Link to={`/lesson/${prev.lessonId}`} className="group flex min-w-0 items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
              <span className="truncate">{LESSON_MAP_TITLE(prev.lessonId)}</span>
            </Link>
          ) : <span />}
          {next ? (
            <Link to={`/lesson/${next.lessonId}`} className="group flex min-w-0 items-center gap-1.5 text-right text-muted-foreground hover:text-foreground">
              <span className="truncate">{LESSON_MAP_TITLE(next.lessonId)}</span>
              <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : <span />}
        </nav>
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

/** judul pendek untuk nav bawah tanpa import ekstra */
function LESSON_MAP_TITLE(id: string): string {
  const e = getLesson(id);
  return e ? e.lesson.title : id;
}
