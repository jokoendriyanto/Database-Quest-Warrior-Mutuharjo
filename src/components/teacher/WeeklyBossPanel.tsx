import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, Trophy, Plus } from "lucide-react";

export default function WeeklyBossPanel() {
  const boss = useQuery(api.weeklyBoss.getCurrentBoss);
  const createBoss = useMutation(api.weeklyBoss.createBoss);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [datasetKey, setDatasetKey] = useState<"school" | "kantin">("school");
  const [solutionSql, setSolutionSql] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await createBoss({ title, description, datasetKey, solutionSql, difficulty });
      setMsg("✓ Boss challenge berhasil disimpan untuk minggu ini!");
      setTitle("");
      setDescription("");
      setSolutionSql("");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="size-4 text-warning" />
        <h2 className="text-lg font-bold">Weekly Boss Challenge</h2>
      </div>

      {/* Current boss status */}
      {boss ? (
        <div className="rounded-lg border border-success/40 bg-success/5 p-4">
          <p className="text-sm font-bold text-success">✓ Boss aktif minggu ini</p>
          <p className="mt-1 text-sm">{boss.title}</p>
          <div className="mt-2 flex gap-3 font-mono text-[11px] text-muted-foreground">
            <span>{boss.participants} peserta</span>
            <span>·</span>
            <span>{boss.difficulty}</span>
            <span>·</span>
            <span>{boss.datasetKey === "school" ? "school_db" : "kantin_db"}</span>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-secondary/40 p-4">
          <p className="text-sm text-muted-foreground">Belum ada boss challenge minggu ini.</p>
        </div>
      )}

      {/* Create / Update form */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border bg-card p-5">
        <p className="kicker">{boss ? "UPDATE BOSS" : "BUAT BOSS BARU"}</p>

        <div className="space-y-1.5">
          <Label>Judul</Label>
          <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Find All Students in Class A" />
        </div>

        <div className="space-y-1.5">
          <Label>Deskripsi / Soal</Label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tulis soal kasus SQL di sini..."
            className="w-full rounded-md border border-border bg-background p-2 text-sm focus:border-primary focus:outline-none"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Dataset</Label>
            <select value={datasetKey} onChange={(e) => setDatasetKey(e.target.value as "school" | "kantin")} className="w-full rounded-md border border-border bg-background p-2 text-sm">
              <option value="school">school_db</option>
              <option value="kantin">kantin_db</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Difficulty</Label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")} className="w-full rounded-md border border-border bg-background p-2 text-sm">
              <option value="easy">Easy (100 XP)</option>
              <option value="medium">Medium (150 XP)</option>
              <option value="hard">Hard (200 XP)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Solution SQL (jawaban server — tidak ditampilkan ke siswa)</Label>
          <textarea
            required
            value={solutionSql}
            onChange={(e) => setSolutionSql(e.target.value)}
            placeholder="SELECT * FROM students WHERE class = 'A'"
            className="w-full rounded-md border border-border bg-background p-2 font-mono text-sm focus:border-primary focus:outline-none"
            rows={3}
          />
        </div>

        {msg && (
          <p className={cn("text-sm font-medium", msg.startsWith("✓") ? "text-success" : "text-destructive")}>{msg}</p>
        )}

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <><Plus className="size-4" /> {boss ? "Update Boss" : "Buat Boss Challenge"}</>}
        </Button>
      </form>
    </div>
  );
}
