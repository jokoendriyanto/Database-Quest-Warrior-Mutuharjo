import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, Sparkles } from "lucide-react";

export default function ClassesPanel() {
  const classes = useQuery(api.classes.list);
  const createFn = useMutation(api.classes.create);
  const removeFn = useMutation(api.classes.remove);
  const seedFn = useMutation(api.classes.seedDefaults);

  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await createFn({ name });
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah kelas.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section className="rounded-lg border border-border p-5">
        <h2 className="kicker mb-1">KELOLA KELAS</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Kelas di sini muncul otomatis di form pendaftaran siswa dan filter tugas.
        </p>

        <form onSubmit={handleAdd} className="mb-5 flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Misal: XI PPLG 3"
            required
          />
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <><Plus className="size-4" /> Tambah</>}
          </Button>
        </form>

        {error && (
          <p role="alert" className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {!classes ? (
          <div className="space-y-2" aria-busy>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="border-y border-border py-6 text-center">
            <p className="text-sm text-muted-foreground">Belum ada kelas.</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => seedFn()}>
              <Sparkles className="size-4" /> Isi 6 kelas default PPLG
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {classes.map((c: any) => (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1 truncate font-mono text-sm">{c.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Hapus ${c.name}`}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    if (confirm(`Hapus kelas "${c.name}"? Siswa di kelas itu tetap punya nama kelas lama di profilnya.`)) {
                      await removeFn({ id: c.id as any });
                    }
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
