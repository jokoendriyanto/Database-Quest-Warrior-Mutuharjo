import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus } from "lucide-react";

/**
 * Portfolio manager milik siswa.
 * Item baru default PRIVAT (published=false) — siswa memilih kapan
 * mempublikasikannya. HRD hanya melihat item published.
 */
export function PortfolioManager() {
  const items = useQuery(api.hrd.myPortfolio);
  const addItem = useMutation(api.hrd.addPortfolioItem);
  const setPublished = useMutation(api.hrd.setPortfolioPublished);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problemSolved, setProblemSolved] = useState("");
  const [techStack, setTechStack] = useState("");
  const [skills, setSkills] = useState("");
  const [querySample, setQuerySample] = useState("");
  const [publishNow, setPublishNow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSaving(true);
    try {
      await addItem({
        title: title.trim(),
        description: description.trim(),
        problemSolved: problemSolved.trim() || undefined,
        techStack: techStack.trim()
          ? techStack.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        skills: skills.trim()
          ? skills.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
        querySample: querySample.trim() || undefined,
        published: publishNow,
      });
      setTitle("");
      setDescription("");
      setProblemSolved("");
      setTechStack("");
      setSkills("");
      setQuerySample("");
      setPublishNow(false);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (id: string, published: boolean) => {
    setBusyId(id);
    try {
      await setPublished({ itemId: id as any, published });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section aria-labelledby="portfolio-h" className="panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="portfolio-h" className="kicker">PORTFOLIO KU</h2>
        <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
          <Plus className="size-3.5" /> {open ? "Tutup" : "Tambah Project"}
        </Button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Project yang dipublikasikan hanya tampil di profil industri jika izin
        Portfolio aktif di Talent Profile.
      </p>

      {open && (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border border-border p-4">
          <div className="space-y-1.5">
            <Label htmlFor="pf-title">Nama project *</Label>
            <Input id="pf-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sistem Perpustakaan" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-desc">Deskripsi *</Label>
            <Textarea id="pf-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-problem">Masalah yang diselesaikan</Label>
            <Input id="pf-problem" value={problemSolved} onChange={(e) => setProblemSolved(e.target.value)} placeholder="Pencarian buku & peminjaman manual lambat…" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pf-tech">Teknologi (pisah koma)</Label>
              <Input id="pf-tech" value={techStack} onChange={(e) => setTechStack(e.target.value)} placeholder="MySQL, PHP" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-skills">Skill terkait (pisah koma)</Label>
              <Input id="pf-skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="JOIN, Normalisasi" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-query">Contoh query / catatan schema</Label>
            <Textarea id="pf-query" value={querySample} onChange={(e) => setQuerySample(e.target.value)} rows={2} className="font-mono text-xs" placeholder="SELECT …" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            Publikasikan sekarang
          </label>
          <Button type="submit" size="sm" disabled={saving || !title.trim() || !description.trim()} className="font-bold">
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : "Simpan Project"}
          </Button>
        </form>
      )}

      {items === undefined ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Memuat portfolio…
        </p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Belum ada project.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
          {items.map((it: any) => (
            <li key={it._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{it.title}</p>
                <p className="truncate text-xs text-muted-foreground">{it.description}</p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                  it.published
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {it.published ? "PUBLIK" : "PRIVAT"}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === it._id}
                onClick={() => togglePublish(it._id, !it.published)}
              >
                {busyId === it._id ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : it.published ? (
                  "Privatkan"
                ) : (
                  "Publikasikan"
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
