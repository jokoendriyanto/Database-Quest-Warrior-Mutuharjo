import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import { Loader2, Plus, Trash2 } from "lucide-react";

export default function ChallengesPanel() {
  const challenges = useQuery(api.challenges.listForTeacher);
  const createFn = useMutation(api.challenges.create);
  const removeFn = useMutation(api.challenges.remove);

  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [datasetKey, setDatasetKey] = useState("school");
  const [solutionSql, setSolutionSql] = useState("");
  const [xp, setXp] = useState("60");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  if (challenges?.denied) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    setBusy(true);
    try {
      await createFn({
        title: title.trim(),
        prompt: prompt.trim(),
        datasetKey,
        solutionSql,
        xp: Number(xp) || 60,
      });
      setOkMsg("Challenge terbit — siswa melihatnya di halaman Tugas.");
      setTitle("");
      setPrompt("");
      setSolutionSql("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat challenge.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ---------- buat challenge ---------- */}
      <section aria-labelledby="ch-create" className="rounded-lg border border-border p-5">
        <h2 id="ch-create" className="kicker mb-1">BUAT STUDI KASUS</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Tulis kasus + query jawaban. Server memvalidasi query-mu di dataset — siswa hanya melihat prompt-nya.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_10rem_6rem]">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Judul kasus</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Misal: Laporan ketidakhadiran semester ini"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Dataset</Label>
              <Select value={datasetKey} onValueChange={setDatasetKey}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">Sekolah</SelectItem>
                  <SelectItem value="kantin">Kantin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">XP</Label>
              <Input type="number" min={10} max={200} value={xp} onChange={(e) => setXp(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Instruksi untuk siswa</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Kepala sekolah butuh daftar siswa yang tidak pernah absen… Tampilkan nama dan jumlah kehadirannya, urut dari yang terbanyak."
              rows={3}
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Query jawaban (rahasia)</Label>
            <Textarea
              value={solutionSql}
              onChange={(e) => setSolutionSql(e.target.value)}
              placeholder={"SELECT s.name, COUNT(*) AS total\nFROM students s\nJOIN attendance a ON a.student_id = s.id\nGROUP BY s.name\nORDER BY total DESC;"}
              rows={4}
              className="font-mono text-[13px]"
              required
            />
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {okMsg && (
            <p className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
              {okMsg}
            </p>
          )}

          <Button type="submit" disabled={busy} size="sm">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <><Plus className="size-4" /> Terbitkan Challenge</>}
          </Button>
        </form>
      </section>

      {/* ---------- daftar ---------- */}
      <section aria-labelledby="ch-list">
        <h2 id="ch-list" className="kicker mb-3">
          CHALLENGE AKTIF {challenges && challenges.challenges.length > 0 && `(${challenges.challenges.length})`}
        </h2>
        {!challenges || challenges.challenges.length === 0 ? (
          <p className="border-y border-border py-8 text-center text-sm text-muted-foreground">
            Belum ada studi kasus. Yang kamu buat muncul di halaman Tugas siswa.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {challenges.challenges.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{c.title}</span>
                  <span className="block truncate font-mono text-[10px] text-muted-foreground">
                    {c.datasetKey.toUpperCase()} · +{c.xp} XP · {c.solvedBy} siswa selesai / {c.attempts} percobaan
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Hapus challenge"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    if (confirm(`Hapus challenge "${c.title}"?`)) await removeFn({ id: c.id });
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
