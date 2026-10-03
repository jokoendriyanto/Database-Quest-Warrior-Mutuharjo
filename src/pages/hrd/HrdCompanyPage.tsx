import { useState } from "react";
import { Link } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

/**
 * Halaman Company Profile milik akun HRD.
 * Mendaftarkan perusahaan sekali, lalu bisa diedit ringan.
 */
export default function HrdCompanyPage() {
  const company = useQuery(api.hrd.myCompany);
  const registerCompany = useMutation(api.hrd.registerCompany);

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [about, setAbout] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (company === undefined) {
    return (
      <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Memuat perusahaan…
      </div>
    );
  }

  const existing = company !== null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (!name.trim()) {
      setError("Nama perusahaan wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      await registerCompany({
        companyName: name.trim(),
        industry: industry.trim() || undefined,
        website: website.trim() || undefined,
        about: about.trim() || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="kicker">PERUSAHAAN</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Company Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Identitas perusahaan yang ditampilkan pada aktivitas rekrutmen Anda.
        </p>
      </header>

      {existing && company ? (
        <section className="panel p-6" aria-label="Perusahaan terdaftar">
          <p className="kicker mb-1">TERDAFTAR</p>
          <h2 className="text-lg font-bold">{company.name}</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">Industri</dt>
              <dd>{company.industry ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">Website</dt>
              <dd className="truncate">
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {company.website}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted-foreground">Tentang</dt>
              <dd className="whitespace-pre-line">{company.about ?? "—"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Butuh perubahan nama perusahaan? Hubungi admin sekolah.
          </p>
        </section>
      ) : (
        <form onSubmit={submit} className="panel space-y-4 p-6" aria-label="Daftarkan perusahaan">
          <p className="kicker">REGISTRASI PERUSAHAAN</p>
          <p className="text-sm text-muted-foreground">
            Satu akun HRD terhubung ke satu perusahaan.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="company-name">Nama Perusahaan *</Label>
            <Input
              id="company-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="PT Teknologi Nusantara"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="company-industry">Industri</Label>
              <Input
                id="company-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Software House"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-website">Website</Label>
              <Input
                id="company-website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://…"
                type="url"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="company-about">Tentang Perusahaan</Label>
            <Textarea
              id="company-about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Deskripsi singkat perusahaan…"
              rows={4}
            />
          </div>
          {error && (
            <p role="alert" className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {done && (
            <p role="status" className="rounded border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
              Perusahaan terdaftar. Selamat mencari talenta!
            </p>
          )}
          <Button type="submit" disabled={saving} className="font-bold">
            {saving ? <Loader2 className="size-4 animate-spin" /> : "Daftarkan Perusahaan"}
          </Button>
        </form>
      )}

      <p className="text-sm text-muted-foreground">
        Sudah punya perusahaan? Lanjut ke{" "}
        <Link to="/hrd/candidates" className="text-primary hover:underline">
          Candidate Pool
        </Link>
        .
      </p>
    </div>
  );
}
