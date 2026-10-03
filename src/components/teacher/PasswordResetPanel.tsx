import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyRound, Loader2 } from "lucide-react";

export default function PasswordResetPanel() {
  const overview = useQuery(api.game.teacherOverview);
  const resetFn = useAction(api.admin.resetPassword);

  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  if (overview?.denied) return null;
  const students = overview?.students ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    if (password.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    setBusy(true);
    try {
      await resetFn({ userId: userId as any, newPassword: password });
      setOkMsg("Password sudah diganti. Semua sesi lama siswa dicabut — minta dia login dengan password baru.");
      setPassword("");
      setUserId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal reset password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section className="rounded-lg border border-border p-5">
        <h2 className="kicker mb-1">RESET PASSWORD SISWA</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Untuk siswa yang lupa password. Password baru dikirim tidak ke mana-mana —
          berikan langsung ke siswa, lalu sarankan dia mengganti sendiri nanti.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Pilih siswa</Label>
            <Select value={userId} onValueChange={setUserId} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={students.length ? "Pilih siswa…" : "Belum ada siswa"} />
              </SelectTrigger>
              <SelectContent>
                {students.map((s: any) => (
                  <SelectItem key={s.userId} value={String(s.userId)}>
                    {s.name} · {s.className || "tanpa kelas"} (@{s.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Password baru</Label>
            <Input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min. 8 karakter"
              className="font-mono"
              autoComplete="off"
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

          <Button type="submit" disabled={busy || !userId} size="sm">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <><KeyRound className="size-4" /> Ganti Password</>}
          </Button>
        </form>
      </section>
    </div>
  );
}
