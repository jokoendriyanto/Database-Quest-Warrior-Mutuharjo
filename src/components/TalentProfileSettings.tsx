import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";



function ConsentRow({
  checked,
  onChange,
  title,
  desc,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  desc: string;
  id: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
      />
      <div>
        <label htmlFor={id} className="text-sm font-semibold">
          {title}
        </label>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

const AVAILABILITY_OPTIONS = [
  { value: "not_available", label: "Tidak tersedia" },
  { value: "looking", label: "Sedang mencari peluang" },
  { value: "open", label: "Terbuka untuk industri" },
] as const;

/**
 * Talent Profile siswa — pengaturan Consent & Visibility (PRD §6.9).
 * Default SEMUA izin false (privat) sampai siswa menyetujuinya.
 */
export function TalentProfileSettings() {
  const profile = useQuery(api.hrd.myTalentProfile, {});
  const save = useMutation(api.hrd.updateMyTalentProfile);

  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [availability, setAvailability] = useState<string>("not_available");
  const [consentProfile, setConsentProfile] = useState(false);
  const [consentPortfolio, setConsentPortfolio] = useState(false);
  const [consentCertificate, setConsentCertificate] = useState(false);
  const [consentContact, setConsentContact] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline ?? "");
      setSummary(profile.summary ?? "");
      setAvailability(profile.availability);
      setConsentProfile(profile.consentProfile);
      setConsentPortfolio(profile.consentPortfolio);
      setConsentCertificate(profile.consentCertificate);
      setConsentContact(profile.consentContact);
    }
  }, [profile]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDone(false);
    if (consentPortfolio && !consentProfile) {
      setError("Portfolio hanya bisa tampil jika Talent Profile diaktifkan.");
      return;
    }
    if (consentCertificate && !consentProfile) {
      setError("Sertifikat hanya bisa tampil jika Talent Profile diaktifkan.");
      return;
    }
    setSaving(true);
    try {
      await save({
        headline: headline.trim() || undefined,
        summary: summary.trim() || undefined,
        availability: availability as "open" | "looking" | "not_available",
        consentProfile,
        consentPortfolio,
        consentCertificate,
        consentContact,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  if (profile === undefined) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Memuat pengaturan…
      </p>
    );
  }

  return (
    <section aria-labelledby="talent-h" className="panel p-6">
      <h2 id="talent-h" className="kicker">TALENT PROFILE · IZIN TAMPIL KE INDUSTRI</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Secara default profil kamu <strong>privat</strong>. Aktifkan hanya jika
        kamu ingin profil kompetensimu dilihat perusahaan mitra sekolah.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="talent-headline">Headline</Label>
          <Input
            id="talent-headline"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="cth: Junior Database Programmer — suka JOIN dan data rapi"
            maxLength={120}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="talent-summary">Ringkasan</Label>
          <Textarea
            id="talent-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Ceritakan singkat skill dan project database-mu…"
            rows={3}
            maxLength={600}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="talent-availability">Status ketersediaan</Label>
          <select
            id="talent-availability"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-card px-3 text-sm"
          >
            {AVAILABILITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="divide-y divide-border rounded-lg border border-border px-4">
          <ConsentRow
            id="consent-profile"
            checked={consentProfile}
            onChange={setConsentProfile}
            title="Profil kompetensi (Skill Matrix)"
            desc="Perusahaan dapat melihat nama, kelas, dan Skill Matrix-mu."
          />
          <ConsentRow
            id="consent-portfolio"
            checked={consentPortfolio}
            onChange={setConsentPortfolio}
            title="Portfolio"
            desc="Project yang kamu publikasikan dapat dilihat perusahaan."
          />
          <ConsentRow
            id="consent-certificate"
            checked={consentCertificate}
            onChange={setConsentCertificate}
            title="Sertifikat"
            desc="Sertifikat kompetensimu yang sudah terbit dapat diverifikasi."
          />
          <ConsentRow
            id="consent-contact"
            checked={consentContact}
            onChange={setConsentContact}
            title="Kontak profesional"
            desc="Perusahaan boleh menghubungimu untuk peluang (jika fitur kontak aktif)."
          />
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {consentProfile ? (
            <>
              <Eye className="size-3.5" aria-hidden /> Profil terlihat oleh HRD
              terdaftar.
            </>
          ) : (
            <>
              <EyeOff className="size-3.5" aria-hidden /> Profil privat — tidak
              terlihat siapa pun.
            </>
          )}
        </p>

        {error && (
          <p role="alert" className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {done && (
          <p role="status" className="rounded border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
            Pengaturan Talent Profile tersimpan.
          </p>
        )}

        <Button type="submit" disabled={saving} className="font-bold">
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Simpan Pengaturan"}
        </Button>
      </form>
    </section>
  );
}
