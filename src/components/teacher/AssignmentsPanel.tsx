import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EXERCISES, LESSON_MAP } from "@/lib/curriculum";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = {
  exercise: "LATIHAN",
  lesson: "MATERI",
  challenge: "CHALLENGE",
};

export default function AssignmentsPanel() {
  const assignments = useQuery(api.assignments.listForTeacher);
  const classes = useQuery(api.classes.list);
  const challenges = useQuery(api.challenges.listForTeacher);
  const createFn = useMutation(api.assignments.create);
  const removeFn = useMutation(api.assignments.remove);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<"exercise" | "lesson" | "challenge">("exercise");
  const [refId, setRefId] = useState("");
  const [className, setClassName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (assignments?.denied) return null;

  const refOptions =
    kind === "exercise"
      ? EXERCISES.map((e) => ({ id: e.id, label: `W${worldOf(e.id)} · ${e.title}` }))
      : kind === "lesson"
        ? [...LESSON_MAP.entries()].map(([id, v]) => ({
            id,
            label: `W${v.world.num} · ${v.lesson.title}`,
          }))
        : (challenges?.challenges ?? []).map((c) => ({ id: c.id, label: c.title }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !refId) return;
    setBusy(true);
    try {
      await createFn({
        title: title.trim(),
        description: description.trim() || undefined,
        kind,
        refId,
        className,
        dueAt: dueDate ? new Date(`${dueDate}T23:59:00`).getTime() : undefined,
      });
      setTitle("");
      setDescription("");
      setRefId("");
      setDueDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat tugas.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ---------- buat tugas ---------- */}
      <section aria-labelledby="assign-create" className="rounded-lg border border-border p-5">
        <h2 id="assign-create" className="kicker mb-4">BUAT TUGAS BARU</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Judul tugas</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Misal: JOIN Week 1 — Wajib selesai"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Jenis</Label>
              <Select
                value={kind}
                onValueChange={(v) => {
                  setKind(v as typeof kind);
                  setRefId("");
                }}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="exercise">Latihan kurikulum</SelectItem>
                  <SelectItem value="lesson">Materi (lesson)</SelectItem>
                  <SelectItem value="challenge">Challenge buatanmu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs font-semibold">
                {kind === "exercise" ? "Pilih latihan" : kind === "lesson" ? "Pilih materi" : "Pilih challenge"}
              </Label>
              <Select value={refId} onValueChange={setRefId} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={refOptions.length ? "Pilih…" : "Belum ada pilihan"} />
                </SelectTrigger>
                <SelectContent>
                  {refOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Kelas target</Label>
              <Select value={className || "__all"} onValueChange={(v) => setClassName(v === "__all" ? "" : v)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">Semua kelas</SelectItem>
                  {(classes ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Deadline (opsional)</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Catatan (opsional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instruksi tambahan untuk siswa"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy || !refId} size="sm">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <><Plus className="size-4" /> Terbitkan Tugas</>}
          </Button>
        </form>
      </section>

      {/* ---------- daftar tugas ---------- */}
      <section aria-labelledby="assign-list">
        <h2 id="assign-list" className="kicker mb-3">
          TUGAS AKTIF {assignments && assignments.assignments.length > 0 && `(${assignments.assignments.length})`}
        </h2>
        {!assignments || assignments.assignments.length === 0 ? (
          <p className="border-y border-border py-8 text-center text-sm text-muted-foreground">
            Belum ada tugas. Buat di atas — siswa melihatnya di halaman Tugas.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {assignments.assignments.map((a) => (
              <li key={a.id}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    {expanded === a.id
                      ? <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{a.title}</span>
                      <span className="block truncate font-mono text-[10px] text-muted-foreground">
                        {KIND_LABEL[a.kind]} · {a.refTitle} · {a.className || "semua kelas"}
                        {a.dueAt ? ` · deadline ${new Date(a.dueAt).toLocaleDateString("id-ID")}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                      {a.doneCount}/{a.targetCount} selesai
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Hapus tugas"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={async () => {
                      if (confirm(`Hapus tugas "${a.title}"?`)) await removeFn({ id: a.id });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                {expanded === a.id && (
                  <SubmissionList assignmentId={a.id} />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function worldOf(exerciseId: string): number {
  const m = exerciseId.match(/^w(\d+)-/);
  return m ? Number(m[1]) : 0;
}

function SubmissionList({ assignmentId }: { assignmentId: string }) {
  const subs = useQuery(api.assignments.submissions, { id: assignmentId as any });
  if (!subs) {
    return <div className="px-4 pb-4"><div className="h-16 animate-pulse rounded bg-muted" /></div>;
  }
  const done = subs.filter((s) => s.done);
  return (
    <div className="border-t border-border bg-secondary/30 px-4 py-3">
      <p className="kicker mb-2">PENGERJAAN · {done.length}/{subs.length}</p>
      <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {subs.map((s) => (
          <li key={s.userId} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "inline-block size-1.5 rounded-full",
                s.done ? "bg-success" : "bg-muted-foreground/40",
              )}
              aria-hidden
            />
            <span aria-hidden className="text-xs">{s.avatarEmoji}</span>
            <span className={cn("min-w-0 flex-1 truncate", s.done ? "" : "text-muted-foreground")}>
              {s.name}
            </span>
            {s.done && s.completedAt && (
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                {new Date(s.completedAt).toLocaleDateString("id-ID")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
