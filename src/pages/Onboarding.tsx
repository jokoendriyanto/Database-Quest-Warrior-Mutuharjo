import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { AVATAR_OPTIONS } from "@/lib/game";
import { Loader2, PartyPopper, ArrowRight, Flame, Trophy, Swords } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Onboarding() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const updateProfile = useMutation(api.profile.updateProfile);

  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState<string | null>(null);
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
      await updateProfile({ avatarEmoji: avatar ?? "🦉", onboarded: true });
      navigate("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="clay-blob -left-16 top-16 size-64 bg-primary/25" />
      <div className="clay-blob -right-10 bottom-20 size-72 bg-accent/30" />

      {/* progress dots */}
      <div className="relative z-10 mx-auto mt-8 flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "h-2.5 rounded-full transition-all",
              i === step ? "w-8 bg-primary" : i < step ? "w-2.5 bg-primary/60" : "w-2.5 bg-border",
            )}
          />
        ))}
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 items-center px-4">
        {step === 0 && (
          <div className="clay w-full p-8 text-center">
            <p className="text-5xl" aria-hidden>👋</p>
            <h1 className="mt-3 text-2xl font-black tracking-tight">
              Selamat datang, {firstName}!
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Perjalananmu menjadi <strong>Database Grandmaster</strong> dimulai dari sini.
              Tenang, kita nggak bakal mulai dari query 20 baris. 😭 Kita mulai dari nol —
              pelan-pelan, sambil main.
            </p>
            <Button
              onClick={() => setStep(1)}
              className="clay-btn mt-7 h-12 w-full rounded-2xl bg-primary text-base font-extrabold"
            >
              Siap! Lanjut <ArrowRight className="size-4" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="clay w-full p-8">
            <h1 className="text-center text-2xl font-black tracking-tight">Pilih Avatarmu 🎭</h1>
            <p className="mt-1.5 text-center text-sm text-muted-foreground">
              Ini wajahmu di leaderboard & battle arena. Pilih yang paling kamu banget.
            </p>
            <div className="mt-6 grid grid-cols-5 gap-2.5">
              {AVATAR_OPTIONS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  aria-label={`Pilih avatar ${a}`}
                  className={cn(
                    "aspect-square rounded-2xl text-2xl transition-transform hover:-translate-y-0.5",
                    avatar === a
                      ? "clay-btn scale-105 bg-primary"
                      : "bg-secondary/70",
                    avatar !== a && !avatar ? "" : "",
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
            <Button
              disabled={!avatar}
              onClick={() => setStep(2)}
              className="clay-btn mt-7 h-12 w-full rounded-2xl bg-primary text-base font-extrabold"
            >
              Kunci Avatar <ArrowRight className="size-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="clay w-full p-8">
            <h1 className="text-center text-2xl font-black tracking-tight">
              Cara Main dalam 30 Detik ⏱️
            </h1>
            <ul className="mt-5 space-y-3">
              {[
                { icon: Trophy, title: "Kumpulkan XP", text: "Selesaikan lesson (+20), latihan SQL (+50), challenge boss (+150+)." },
                { icon: Flame, title: "Jaga Streak", text: "Main minimal sehari sekali biar flame-mu tetap menyala." },
                { icon: Swords, title: "Battle di Arena", text: "Kalahkan bot buat XP ekstra — menang pertama lawan tiap bot = +100!" },
              ].map((r) => (
                <li key={r.title} className="clay-sm flex items-start gap-3 p-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <r.icon className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold">{r.title}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{r.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              onClick={finish}
              disabled={saving}
              className="clay-btn mt-7 h-12 w-full rounded-2xl bg-primary text-base font-extrabold"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <PartyPopper className="size-4" /> Mulai Perjalanan
                </>
              )}
            </Button>
          </div>
        )}
      </main>

      <footer className="relative z-10 pb-6 text-center text-xs text-muted-foreground">
        Made With ♥ By MrStepen ( Joko Endriyanto )
      </footer>
    </div>
  );
}
