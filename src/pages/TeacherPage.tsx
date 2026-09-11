import { useMemo, useState, useCallback } from "react";
import { Link } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Download, Pencil, Trash2, CheckSquare, Square, X, ArrowRight, Award } from "lucide-react";
import { getExercise } from "@/lib/curriculum";
import { WORLD_SKILL } from "@/lib/game";
import { DatabaseLoadingAnimation } from "@/components/ui/lottie-animation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AssignmentsPanel from "@/components/teacher/AssignmentsPanel";
import ChallengesPanel from "@/components/teacher/ChallengesPanel";
import PasswordResetPanel from "@/components/teacher/PasswordResetPanel";
import ClassesPanel from "@/components/teacher/ClassesPanel";
import WeeklyBossPanel from "@/components/teacher/WeeklyBossPanel";

type Tab = "siswa" | "tugas" | "tantangan" | "boss" | "password" | "kelas";

const TABS: { key: Tab; label: string }[] = [
  { key: "siswa", label: "Siswa" },
  { key: "tugas", label: "Tugas" },
  { key: "tantangan", label: "Tantangan" },
  { key: "boss", label: "Weekly Boss" },
  { key: "password", label: "Reset Password" },
  { key: "kelas", label: "Kelas" },
];

type Student = {
  userId: string;
  name: string;
  username: string;
  className: string;
  avatarEmoji: string;
  xp: number;
  level: number;
  lessonsCompleted: number;
  exercisesDone: number;
  exercisesCorrect: number;
  accuracy: number;
  streak: number;
  daysInactive: number;
  atRisk: boolean;
  riskFlags: string[];
  worldSkills?: { worldNum: number; accuracy: number }[];
};

function statusOf(s: Student): { label: string; cls: string } {
  if (s.daysInactive > 7) return { label: "INACTIVE", cls: "text-muted-foreground" };
  if (s.atRisk) return { label: "NEEDS REVIEW", cls: "text-warning font-bold" };
  if (s.exercisesDone >= 5 && s.accuracy >= 85) return { label: "EXCELLENT", cls: "text-success font-semibold" };
  return { label: "ON TRACK", cls: "text-muted-foreground" };
}

function cellCls(v: number): string {
  if (v >= 85) return "text-success font-semibold";
  if (v >= 60) return "";
  return "text-warning font-semibold";
}

/* ======================== EDIT MODAL ======================== */

function EditStudentModal({
  student,
  classOptions,
  onClose,
  onSave,
}: {
  student: Student;
  classOptions: string[];
  onClose: () => void;
  onSave: (data: { userId: string; name?: string; className?: string }) => void;
}) {
  const [name, setName] = useState(student.name);
  const [className, setClassName] = useState(student.className);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ userId: student.userId, name, className });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="text-2xl">{student.avatarEmoji}</span>
            Edit Siswa
          </h3>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
              Username
            </label>
            <input
              disabled
              value={student.username}
              className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm font-mono text-muted-foreground cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
              Nama Lengkap *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Nama siswa"
            />
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
              Kelas
            </label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">— Tanpa Kelas —</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Level</p>
              <p className="text-lg font-bold">{student.level}</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">XP</p>
              <p className="text-lg font-bold">{student.xp.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Accuracy</p>
              <p className={cn("text-lg font-bold", cellCls(student.accuracy))}>{student.accuracy}%</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()} className="flex-1">
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ======================== MASS EDIT BAR ======================== */

function MassEditBar({
  count,
  classOptions,
  onMoveClass,
  onDelete,
  onClearSelection,
}: {
  count: number;
  classOptions: string[];
  onMoveClass: (cls: string) => void;
  onDelete: () => void;
  onClearSelection: () => void;
}) {
  const [targetClass, setTargetClass] = useState("");

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-card px-5 py-3 shadow-2xl">
        <span className="text-sm font-semibold text-primary">{count} dipilih</span>

        <div className="h-5 w-px bg-border" />

        <div className="flex items-center gap-2">
          <select
            value={targetClass}
            onChange={(e) => setTargetClass(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Pindah kelas...</option>
            {classOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={!targetClass}
            onClick={() => { onMoveClass(targetClass); setTargetClass(""); }}
          >
            <ArrowRight className="size-3 mr-1" />
            Pindahkan
          </Button>
        </div>

        <div className="h-5 w-px bg-border" />

        <Button size="sm" variant="destructive" onClick={onDelete}>
          <Trash2 className="size-3 mr-1" />
          Hapus
        </Button>

        <button onClick={onClearSelection} className="ml-1 rounded-md p-1 hover:bg-muted transition-colors">
          <X className="size-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

/* ======================== CONFIRM MODAL ======================== */

function ConfirmModal({
  title,
  message,
  confirmLabel,
  variant = "destructive",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-5">{message}</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel} className="flex-1">Batal</Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ======================== MAIN ======================== */

export default function TeacherPage() {
  const q = useQuery(api.game.teacherOverview);
  const classOpts = useQuery(api.teacher.classOptions);
  const [tab, setTab] = useState<Tab>("siswa");

  const editStudent = useMutation(api.teacher.editStudent);
  const massEditClass = useMutation(api.teacher.massEditClass);
  const massDeleteStudents = useMutation(api.teacher.massDeleteStudents);

  const students = useMemo(
    () => (q && !q.denied ? [...q.students].sort((a, b) => b.xp - a.xp) : []),
    [q],
  );

  // kolom matrix = world yang punya data attempt di kelas ini
  const matrixWorlds = useMemo(() => {
    const set = new Set<number>();
    for (const s of students) for (const w of s.worldSkills ?? []) set.add(w.worldNum);
    return [...set].sort((a, b) => a - b);
  }, [students]);

  const classOptions = useMemo(() => classOpts ?? [], [classOpts]);

  // ---- selection state ----
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggleSelect = useCallback((userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);
  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === students.length) return new Set();
      return new Set(students.map((s) => s.userId));
    });
  }, [students]);
  const clearSelection = useCallback(() => setSelected(new Set()), []);

  // ---- edit modal state ----
  const [editing, setEditing] = useState<Student | null>(null);

  // ---- confirm modal state ----
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmMassDelete, setConfirmMassDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ---- handlers ----
  const handleSaveSingle = async (data: { userId: string; name?: string; className?: string }) => {
    try {
      await editStudent({ ...data, userId: data.userId as Id<"users"> });
      showToast("✅ Data siswa berhasil diupdate!");
    } catch (err: any) {
      showToast(`❌ ${err.message}`);
    }
  };

  const handleMassMoveClass = async (cls: string) => {
    try {
      const ids = [...selected] as Id<"users">[];
      await massEditClass({ userIds: ids, className: cls });
      showToast(`✅ ${ids.length} siswa dipindahkan ke "${cls}"`);
      clearSelection();
    } catch (err: any) {
      showToast(`❌ ${err.message}`);
    }
  };

  const handleMassDelete = async () => {
    try {
      const ids = [...selected] as Id<"users">[];
      await massDeleteStudents({ userIds: ids });
      showToast(`🗑️ ${ids.length} siswa berhasil direset.`);
      clearSelection();
      setConfirmMassDelete(false);
    } catch (err: any) {
      showToast(`❌ ${err.message}`);
    }
  };

  if (!q) {
    return (
      <DatabaseLoadingAnimation text="Memuat data guru..." />
    );
  }

  if (q.denied) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-lg font-bold">Akses khusus guru.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Panel ini hanya untuk akun dengan role Guru/Admin.
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Kembali ke dashboard
        </Link>
      </div>
    );
  }

  const total = students.length;
  const activeToday = students.filter((s) => s.daysInactive <= 1).length;
  const avgAccuracy =
    total > 0
      ? Math.round(students.reduce((sum, s) => sum + s.accuracy, 0) / total)
      : 0;
  const needAttention = students.filter((s) => s.atRisk || s.daysInactive > 7).length;
  const inactiveStudents = students.filter((s) => s.daysInactive > 7);

  const exportCsv = () => {
    const header = ["Nama", "Username", "Kelas", "Level", "XP", "Lesson", "Latihan", "Benar", "Accuracy %", "Hari tidak aktif", "Status"];
    const lines = students.map((s) =>
      [
        s.name,
        s.username,
        s.className,
        s.level,
        s.xp,
        s.lessonsCompleted,
        s.exercisesDone,
        s.exercisesCorrect,
        s.accuracy,
        s.daysInactive > 900 ? "" : s.daysInactive,
        statusOf(s).label,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob(["\uFEFF" + [header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `database-quest-kelas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allSelected = students.length > 0 && selected.size === students.length;
  const someSelected = selected.size > 0 && selected.size < students.length;

  return (
    <div className="mx-auto max-w-[1200px] space-y-10">
      {/* ---------- TOAST ---------- */}
      {toast && (
        <div className="fixed top-4 right-4 z-[70] rounded-lg border border-border bg-card px-4 py-3 shadow-xl text-sm font-medium animate-in fade-in slide-in-from-right-4">
          {toast}
        </div>
      )}

      {/* ---------- HEADER ---------- */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">PANEL GURU</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Kondisi Kelas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} siswa terdaftar di Database Quest.
          </p>
        </div>
        {tab === "siswa" && (
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={total === 0}>
            <Download className="size-3.5" /> Export CSV
          </Button>
        )}
      </header>

      {/* ---------- TABS ---------- */}
      <nav aria-label="Panel guru" className="-mt-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => { setTab(t.key); clearSelection(); }}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors",
              tab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "tugas" && <AssignmentsPanel />}
      {tab === "tantangan" && <ChallengesPanel />}
      {tab === "boss" && <WeeklyBossPanel />}
      {tab === "password" && <PasswordResetPanel />}
      {tab === "kelas" && <ClassesPanel />}

      {/* ---------- SISWA ---------- */}
      {tab === "siswa" && (
      <>
      {/* ---------- SUMMARY INLINE ---------- */}
      <dl className="grid grid-cols-2 gap-x-8 gap-y-3 border-y border-border py-4 sm:grid-cols-4">
        {[
          ["AKTIF HARI INI", `${activeToday} / ${total}`],
          ["RATA-RATA ACCURACY", total > 0 ? `${avgAccuracy}%` : "—"],
          ["PERLU PERHATIAN", String(needAttention)],
          ["BELUM PERNAH MULAI", `${students.filter((s) => s.exercisesDone === 0).length}`],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{k}</dt>
            <dd className="mt-0.5 text-xl font-bold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      {total === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Belum ada siswa yang bergabung. Bagikan link daftar ke kelasmu dulu.
        </p>
      ) : (
        <>
          {/* ---------- INSIGHT ---------- */}
          {(needAttention > 0 || q.insights.length > 0) && (
            <section aria-labelledby="insight-h" className="rounded-lg border border-border p-5">
              <h2 id="insight-h" className="kicker mb-3 text-warning">PERLU PERHATIAN</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {needAttention > 0 && (
                  <div>
                    <p className="text-sm leading-relaxed">
                      <b>{needAttention} siswa</b> butuh dicek:{" "}
                      {inactiveStudents.length > 0 &&
                        `${inactiveStudents.length} tidak aktif >7 hari`}
                      {inactiveStudents.length > 0 && needAttention !== inactiveStudents.length && " · "}
                      {students.filter((s) => s.atRisk).length > 0 &&
                        `${students.filter((s) => s.atRisk).length} accuracy rendah`}.
                    </p>
                    <Link to="/battle" className="mt-2 inline-block text-sm text-battle hover:underline">
                      Tugaskan latihan VS Bot →
                    </Link>
                  </div>
                )}
                {q.insights.length > 0 && (
                  <div>
                    <p className="kicker mb-2">TOPIK PALING SERING GAGAL</p>
                    <ul className="space-y-1.5">
                      {q.insights.slice(0, 3).map((i) => {
                        const ex = getExercise(i.exerciseId);
                        return (
                          <li key={i.exerciseId} className="flex items-center gap-3 text-sm">
                            <span className="min-w-0 flex-1 truncate">{ex?.title ?? i.exerciseId}</span>
                            <span className="w-24 shrink-0 font-mono text-[11px] text-muted-foreground">
                              {i.attempts}× dicoba
                            </span>
                            <span className="w-12 shrink-0 text-right font-mono text-xs font-bold text-warning">
                              {i.failRate}%
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ---------- CLASS TABLE ---------- */}
          <section aria-labelledby="table-h">
            <div className="flex items-center justify-between mb-3">
              <h2 id="table-h" className="kicker">DAFTAR SISWA</h2>
              {selected.size > 0 && (
                <span className="text-xs text-primary font-semibold">
                  {selected.size} dipilih
                </span>
              )}
            </div>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-sidebar font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 font-medium w-10">
                      <button onClick={toggleAll} className="flex items-center justify-center">
                        {allSelected ? (
                          <CheckSquare className="size-4 text-primary" />
                        ) : someSelected ? (
                          <div className="size-4 rounded border-2 border-primary bg-primary/20 flex items-center justify-center">
                            <div className="size-2 rounded-sm bg-primary" />
                          </div>
                        ) : (
                          <Square className="size-4 text-muted-foreground" />
                        )}
                      </button>
                    </th>
                    <th className="px-3 py-2 font-medium">Siswa</th>
                    <th className="px-3 py-2 font-medium">Kelas</th>
                    <th className="px-3 py-2 text-right font-medium">LV</th>
                    <th className="px-3 py-2 text-right font-medium">XP</th>
                    <th className="px-3 py-2 text-right font-medium">Lesson</th>
                    <th className="px-3 py-2 text-right font-medium">Acc</th>
                    <th className="px-3 py-2 text-right font-medium">Last Active</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium w-16">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const st = statusOf(s);
                    const isChecked = selected.has(s.userId);
                    return (
                      <tr
                        key={s.userId}
                        className={cn(
                          "border-b border-border/50 last:border-0 hover:bg-secondary/40 transition-colors",
                          isChecked && "bg-primary/5",
                        )}
                      >
                        <td className="px-3 py-2">
                          <button onClick={() => toggleSelect(s.userId)} className="flex items-center justify-center">
                            {isChecked ? (
                              <CheckSquare className="size-4 text-primary" />
                            ) : (
                              <Square className="size-4 text-muted-foreground hover:text-foreground" />
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <span aria-hidden className="mr-1.5">{s.avatarEmoji}</span>
                          <span className="font-medium">{s.name}</span>
                          <span className="ml-2 text-[10px] text-muted-foreground font-mono">@{s.username}</span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{s.className || "—"}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{s.level}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{s.xp.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-mono tabular-nums">{s.lessonsCompleted}</td>
                        <td className={cn("px-3 py-2 text-right font-mono tabular-nums", s.exercisesDone >= 3 && s.accuracy < 50 && "text-warning font-bold")}>
                          {s.exercisesDone > 0 ? `${s.accuracy}%` : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-xs text-muted-foreground">
                          {s.daysInactive > 900 ? "belum" : s.daysInactive <= 0 ? "hari ini" : `${s.daysInactive}h lalu`}
                        </td>
                        <td className={cn("px-3 py-2 font-mono text-[10px] tracking-wide", st.cls)}>
                          {st.label}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-0.5">
                            <Link
                              to={`/certificate?studentId=${s.userId}`}
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                              title="Cetak Sertifikat Kompetensi"
                            >
                              <Award className="size-3.5" />
                            </Link>
                            <button
                              onClick={() => setEditing(s)}
                              className="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Edit siswa"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ---------- SKILL MATRIX ---------- */}
          {matrixWorlds.length > 0 && (
            <section aria-labelledby="matrix-h">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 id="matrix-h" className="kicker">SKILL MATRIX · ACCURACY PER TOPIK</h2>
                {selected.size > 0 && (
                  <Link
                    to={`/certificate?studentId=${[...selected][0]}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    <Award className="size-3.5" /> Cetak Sertifikat Kompetensi
                  </Link>
                )}
              </div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {matrixWorlds.map((w) => WORLD_SKILL[w] ?? `W${w}`).join(" · ")}
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-sidebar font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-2 font-medium">Siswa</th>
                      {matrixWorlds.map((w) => (
                        <th key={w} className="px-2.5 py-2 text-right font-medium" title={`World ${w}`}>
                          {WORLD_SKILL[w] ?? `W${w}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students
                      .filter((s) => (s.worldSkills?.length ?? 0) > 0)
                      .slice(0, 15)
                      .map((s) => (
                        <tr key={s.userId} className="border-b border-border/50 last:border-0">
                          <td className="whitespace-nowrap px-3 py-1.5 font-medium">{s.name.split(" ")[0]}</td>
                          {matrixWorlds.map((w) => {
                            const cell = (s.worldSkills ?? []).find((x) => x.worldNum === w);
                            return (
                              <td
                                key={w}
                                className={cn("px-2.5 py-1.5 text-right font-mono text-xs tabular-nums", cell ? cellCls(cell.accuracy) : "text-muted-foreground/30")}
                              >
                                {cell ? cell.accuracy : "–"}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
      </>)}

      {/* ---------- EDIT MODAL ---------- */}
      {editing && (
        <EditStudentModal
          student={editing}
          classOptions={classOptions}
          onClose={() => setEditing(null)}
          onSave={handleSaveSingle}
        />
      )}

      {/* ---------- MASS EDIT BAR ---------- */}
      {selected.size > 0 && tab === "siswa" && (
        <MassEditBar
          count={selected.size}
          classOptions={classOptions}
          onMoveClass={handleMassMoveClass}
          onDelete={() => setConfirmMassDelete(true)}
          onClearSelection={clearSelection}
        />
      )}

      {/* ---------- CONFIRM MASS DELETE ---------- */}
      {confirmMassDelete && (
        <ConfirmModal
          title="Reset Siswa?"
          message={`Ini akan menghapus data gamifikasi (${selected.size} siswa) dan mereset profil mereka. Siswa harus daftar ulang. Tindakan ini tidak bisa dibatalkan.`}
          confirmLabel="Ya, Reset"
          variant="destructive"
          onConfirm={handleMassDelete}
          onCancel={() => setConfirmMassDelete(false)}
        />
      )}
    </div>
  );
}
