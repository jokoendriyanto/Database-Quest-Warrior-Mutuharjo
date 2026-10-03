import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";

/**
 * Certificate Verification — input nomor sertifikat, output status verifikasi.
 * Membaca sistem sertifikat yang sudah ada (tabel certificates), bukan sistem baru.
 */
export default function HrdVerifyPage() {
  const [params] = useSearchParams();
  const [input, setInput] = useState(params.get("no") ?? "");
  const [submitted, setSubmitted] = useState(params.get("no") ?? "");

  const result = useQuery(
    api.hrd.verifyCertificate,
    submitted.trim() ? { certificateNumber: submitted.trim() } : "skip",
  );
  const loading = submitted.trim() !== "" && result === undefined;

  const logActivity = useMutation(api.hrd.logHrdActivity);
  const loggedRef = useRef<string | null>(null);

  // Query tidak boleh menulis ke db — jejak audit dikirim lewat mutasi,
  // satu kali per nomor sertifikat.
  useEffect(() => {
    if (!result) return;
    const key = result.certificateNumber;
    if (loggedRef.current === key) return;
    loggedRef.current = key;
    void logActivity({
      action: "view_certificate",
      studentId: result.studentId,
      detail: result.certificateNumber,
    }).catch(() => {});
  }, [result, logActivity]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(input);
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <p className="kicker">SERTIFIKAT</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Verifikasi Sertifikat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Masukkan nomor sertifikat (contoh: SK/SMK-MUH1-RPL/2026/000001).
        </p>
      </header>

      <form onSubmit={submit} className="panel flex items-end gap-2 p-4" aria-label="Form verifikasi">
        <div className="flex-1 space-y-1">
          <Label htmlFor="cert-no">Certificate ID</Label>
          <Input
            id="cert-no"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="SK/SMK-MUH1-RPL/2026/…"
            className="font-mono"
          />
        </div>
        <Button type="submit" className="font-bold">
          Verifikasi
        </Button>
      </form>

      {loading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Memeriksa…
        </p>
      )}

      {result === null && submitted.trim() !== "" && (
        <div role="alert" className="panel flex items-start gap-3 border-destructive/40 p-5">
          <ShieldX className="size-6 shrink-0 text-destructive" aria-hidden />
          <div>
            <p className="text-sm font-bold text-destructive">Tidak ditemukan</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Nomor <span className="font-mono">{submitted}</span> tidak terdaftar
              di sistem sertifikat Database Quest.
            </p>
          </div>
        </div>
      )}

      {result && (
        <section aria-label="Hasil verifikasi" className="panel border-success/40 p-6">
          <p className="flex items-center gap-2 text-sm font-bold text-success">
            <ShieldCheck className="size-5" aria-hidden />
            {result.status === "revoked" ? "Sertifikat DICABUT" : "✓ Certificate Verified"}
          </p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-40 shrink-0 text-muted-foreground">Nomor</dt>
              <dd className="font-mono font-semibold">{result.certificateNumber}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-40 shrink-0 text-muted-foreground">Nama</dt>
              <dd className="font-semibold">{result.studentName}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-40 shrink-0 text-muted-foreground">Kelas</dt>
              <dd>{result.className ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-40 shrink-0 text-muted-foreground">Skema</dt>
              <dd>{result.schemeName}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-40 shrink-0 text-muted-foreground">Terbit</dt>
              <dd>{new Date(result.issuedAt).toLocaleDateString("id-ID")}</dd>
            </div>
            {result.validUntil && (
              <div className="flex gap-2">
                <dt className="w-40 shrink-0 text-muted-foreground">Berlaku s.d.</dt>
                <dd>{new Date(result.validUntil).toLocaleDateString("id-ID")}</dd>
              </div>
            )}
          </dl>
          {result.competencies.length > 0 && (
            <div className="mt-4">
              <p className="kicker mb-2">KOMPETENSI</p>
              <ul className="space-y-1">
                {result.competencies.map((c: any) => (
                  <li key={c.code} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                    <span className="flex-1 truncate">{c.title}</span>
                    <span className="font-mono text-xs font-bold">{c.accuracy}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
