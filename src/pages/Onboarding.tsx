import { useCallback, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AVATAR_OPTIONS } from "@/lib/game";
import { Loader2, PartyPopper, ArrowRight, Flame, Trophy, Swords, Check, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarUpload } from "@/components/AvatarUpload";
import type { Id } from "@/convex/_generated/dataModel";

export default function Onboarding() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const updateProfile = useMutation(api.profile.updateProfile);

  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarUploaded, setAvatarUploaded] = useState(false);
  const [saving, setSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (user.onboarded) return <Navigate to="/dashboard" replace />;

  const firstName = (user.name ?? "Petualang").split(" ")[0];

  const finish = async () => {
    setSaving(true);
    try {
      // Jika upload foto, jangan set avatarEmoji (biarkan default, foto sudah tersimpan)
      await updateProfile({
        avatarEmoji: avatarUploaded ? undefined : (avatar ?? "🦉"),
        onboarded: true,
      });
      navigate("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUploaded = useCallback(() => {
    setAvatarUploaded(true);
    setAvatar(null); // clear emoji selection
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="grid-motif absolute inset-0" aria-hidden />

      {/* step indicator — mono numbering, bukan dots dekoratif */}
      <div className="relative z-10 mx-auto mt-10 w-full max-w-xl">
        <p className="kicker">Setup · Step {step + 1} / 3</p>
        <div className="inset-track mt-2">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 items-center px-4">
        {step === 0 && (
          <section className="panel-raised w-full p-8 text-left">
            <p className="kicker">Selamat datang</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
              Halo, {firstName}.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Perjalananmu jadi <strong className="text-foreground">Database Grandmaster</strong> mulai
              dari sini. Tenang — kita nggak mulai dari query 20 baris. Kita mulai dari nol,
              pelan-pelan, sambil main.
            </p>

            <pre className="caret-blink mt-5 rounded-lg border border-border bg-muted/60 p-4 font-mono text-[13px] leading-6 text-muted-foreground">
{`-- level 0, xp 0, rank: NEWBIE
SELECT * FROM journey WHERE student = '${firstName.toLowerCase()}';`}
            </pre>

            <Button onClick={() => setStep(1)} className="mt-7 h-11 w-full font-bold sm:w-auto sm:px-8">
              Mulai Setup <ArrowRight className="size-4" />
            </Button>
          </section>
        )}

        {step === 1 && (
          <section className="panel-raised w-full p-8">
            <p className="kicker">Identitas</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Pilih avatarmu</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Ini wajahmu di leaderboard dan battle arena.
            </p>

            {/* Upload foto custom */}
            <div className="mt-5 flex flex-col items-center rounded-lg border border-dashed border-primary/40 bg-accent/30 p-5">
              <AvatarUpload
                avatarUrl={null}
                emoji={avatar ?? "🦉"}
                onAvatarChange={(url) => {
                  if (url) handleAvatarUploaded();
                  else setAvatarUploaded(false);
                }}
                size="lg"
              />
              {avatarUploaded && (
                <p className="mt-2 rounded-md border border-success/40 bg-success/10 px-3 py-1 font-mono text-[11px] text-success">
                  ✓ Foto terupload — akan tampil di profil & leaderboard
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 font-mono text-[10px] text-muted-foreground">
                  {avatarUploaded ? "ATAU GUNAKAN EMOJI" : "ATAU PILIH EMOJI"}
                </span>
              </div>
            </div>

            {/* Grid emoji */}
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_OPTIONS.map((a) => (
                <button
                  key={a}
                  onClick={() => { setAvatar(a); setAvatarUploaded(false); }}
                  aria-label={`Pilih avatar ${a}`}
                  aria-pressed={avatar === a && !avatarUploaded}
                  className={cn(
                    "relative aspect-square rounded-lg border text-2xl transition-colors",
                    avatar === a && !avatarUploaded
                      ? "border-primary bg-accent"
                      : "border-border bg-card hover:border-muted-foreground/40",
                  )}
                >
                  {a}
                  {avatar === a && !avatarUploaded && (
                    <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-7 flex gap-2">
              <Button variant="ghost" onClick={() => setStep(0)} className="h-11">Kembali</Button>
              <Button
                disabled={!avatar && !avatarUploaded}
                onClick={() => setStep(2)}
                className="h-11 flex-1 font-bold sm:flex-none sm:px-8"
              >
                Lanjut <ArrowRight className="size-4" />
              </Button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="panel-raised w-full p-8">
            <p className="kicker">Aturan main</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Cara main dalam 30 detik</h1>
            <ul className="mt-5 divide-y divide-border border-y border-border">
              {[
                { icon: Trophy, title: "Kumpulkan XP", text: "Selesaikan lesson (+20), latihan SQL (+50), challenge boss (+150+).", num: "01" },
                { icon: Flame, title: "Jaga streak", text: "Main minimal sehari sekali biar flame-mu tetap menyala.", num: "02" },
                { icon: Swords, title: "Battle di arena", text: "Kalahkan bot buat XP ekstra — kemenangan pertama lawan tiap bot = +100!", num: "03" },
              ].map((r) => (
                <li key={r.title} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                  <span className="font-mono text-xs text-muted-foreground">{r.num}</span>
                  <r.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-bold">{r.title}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{r.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex gap-2">
              <Button variant="ghost" onClick={() => setStep(1)} disabled={saving} className="h-11">Kembali</Button>
              <Button onClick={finish} disabled={saving} className="h-11 flex-1 font-bold sm:flex-none sm:px-8">
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <PartyPopper className="size-4" /> Masuk ke Dashboard
                  </>
                )}
              </Button>
            </div>
          </section>
        )}
      </main>

      <footer className="relative z-10 pb-6 text-center text-xs text-muted-foreground">
        Made With Love By MrStepen ( Joko Endriyanto )
      </footer>
    </div>
  );
}
