import { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, MailQuestion, UserRoundPen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CLASSES = [
  "X PPLG 1",
  "X PPLG 2",
  "XI PPLG 1",
  "XI PPLG 2",
  "XII PPLG 1",
  "XII PPLG 2",
];

function resolveRedirectAfterAuth(returnTo: string | null, fallback = "/dashboard") {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) return returnTo;
  return fallback;
}

function AuthInner() {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get("mode");
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"));

  const [mode, setMode] = useState<"login" | "register">(
    modeParam === "register" ? "register" : "login",
  );
  const [step, setStep] = useState<"form" | "otp">("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [className, setClassName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [isRegistering, setIsRegistering] = useState(mode === "register");

  // registration state kept across steps
  const [regData, setRegData] = useState<{
    name: string;
    username: string;
    className: string;
    role: "student" | "teacher";
  } | null>(null);

  const completeProfile = useMutation(api.profile.completeProfile);

  useEffect(() => {
    if (!authLoading && isAuthenticated && step === "form") {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, step, navigate, redirect]);

  const usernameNorm = username.trim().toLowerCase();
  const usernameValid = /^[a-z0-9_]{3,20}$/.test(usernameNorm);

  const usernameTakenResult = useQuery(api.profile.checkUsername, {
    username: isRegistering && usernameValid ? usernameNorm : "___idle___",
  });
  const usernameAvailable =
    isRegistering && usernameValid ? usernameTakenResult !== false : true;

  /* ------------------------- kirim kode verifikasi ------------------------ */
  const startVerification = async (targetEmail: string) => {
    await signIn("email-otp", { email: targetEmail });
    setPendingEmail(targetEmail);
    setStep("otp");
    setOtp("");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const identifier = email.trim().toLowerCase();
    if (!identifier) return;
    setBusy(true);
    try {
      let targetEmail = identifier;
      if (!identifier.includes("@")) {
        const resolved = await fetchResolved(identifier);
        if (!resolved) {
          throw new Error(
            `Username "${identifier}" nggak ketemu. Coba cek lagi, atau daftar dulu ya!`,
          );
        }
        targetEmail = resolved;
      }
      await startVerification(targetEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim kode.");
    } finally {
      setBusy(false);
    }
  };

  /** resolveIdentifier lewat convex client (bukan fetch) — helper kecil */
  async function fetchResolved(identifier: string): Promise<string | null> {
    const { ConvexHttpClient } = await import("convex/browser");
    const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL as string);
    const res = await client.query(api.profile.resolveIdentifier, { identifier });
    return res?.email ?? null;
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!usernameAvailable) {
      setError(`Username "${usernameNorm}" sudah dipakai. Coba yang lain ya.`);
      return;
    }
    setBusy(true);
    try {
      setRegData({ name: name.trim(), username: usernameNorm, className, role });
      await startVerification(email.trim().toLowerCase());
      setIsRegistering(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim kode.");
    } finally {
      setBusy(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otp.length !== 6) return;
    setBusy(true);
    try {
      await signIn("email-otp", { email: pendingEmail, code: otp });
      if (regData) {
        await completeProfile({
          username: regData.username,
          name: regData.name,
          className: regData.className || undefined,
          role: regData.role,
        });
        navigate("/onboarding");
        return;
      }
      navigate(redirect);
    } catch (err) {
      setError("Kode verifikasi salah atau sudah kedaluwarsa. Coba lagi ya.");
      console.error(err);
      setOtp("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_480px] xl:grid-cols-[1fr_520px]">
      {/* ------------------------- kiri: brand & motif ------------------------ */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-secondary/60 p-10 lg:flex">
        <div className="grid-motif absolute inset-0" aria-hidden />
        <div className="relative">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="font-mono text-sm font-bold tracking-tight text-primary">
              dq<span className="text-muted-foreground">:</span>
            </span>
            <span className="text-sm font-extrabold tracking-tight">
              Database Quest<span className="text-muted-foreground">: Mutuharjo</span>
            </span>
          </Link>
        </div>

        <div className="relative max-w-lg">
          <p className="kicker">Query hari ini</p>
          <pre className="caret-blink mt-4 rounded-lg border border-border bg-card p-5 font-mono text-[15px] leading-7 text-foreground">
{`SELECT *
FROM future_developers
WHERE effort > excuse;`}
          </pre>

          <p className="mt-8 text-2xl font-extrabold leading-snug tracking-tight">
            Belajar SQL.
            <br />
            Pecahkan kasus.
            <br />
            Adu skill.
          </p>
          <ul className="mt-6 space-y-1.5 text-sm text-muted-foreground">
            <li><span className="mr-2 font-mono text-xs text-primary">01</span>Pelajaran singkat dengan analogi yang masuk akal</li>
            <li><span className="mr-2 font-mono text-xs text-primary">02</span>SQL Playground beneran — bukan simulasi</li>
            <li><span className="mr-2 font-mono text-xs text-primary">03</span>Ranked battle, turnamen, dan leaderboard kelas</li>
          </ul>
        </div>

        <p className="relative text-xs text-muted-foreground">
          SMK Muhammadiyah 1 Sukoharjo · PPLG
        </p>
      </aside>

      {/* ----------------------------- kanan: form ---------------------------- */}
      <main className="flex flex-col px-4 py-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          {/* brand kecil untuk mobile */}
          <Link to="/" className="mb-6 flex items-center gap-2 lg:hidden">
            <span className="font-mono text-sm font-bold text-primary">dq:</span>
            <span className="text-sm font-extrabold tracking-tight">Database Quest: Mutuharjo</span>
          </Link>

          {/* tabs */}
          <div className="grid grid-cols-2 rounded-lg border border-border p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  if (step === "otp") return;
                  setMode(m);
                  setIsRegistering(m === "register");
                  setError(null);
                }}
                disabled={step === "otp"}
                className={cn(
                  "rounded-md py-2 text-sm font-bold transition-colors",
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "login" ? "Masuk" : "Daftar"}
              </button>
            ))}
          </div>

          {step === "form" && mode === "login" && (
            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="identifier">Username atau Email</Label>
                <Input
                  id="identifier"
                  placeholder="joko123 atau joko@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
                <p className="text-xs text-muted-foreground">
                  Kode verifikasi dikirim ke email kamu — tanpa password yang gampang lupa.
                </p>
              </div>
              <Button type="submit" disabled={busy} className="h-11 w-full font-bold">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <>Masuk <ArrowRight className="size-4" /></>}
              </Button>
            </form>
          )}

          {step === "form" && mode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-3.5">
              <Field label="Nama Lengkap">
                <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Andi Pratama" autoComplete="name" />
              </Field>
              <Field label="Username">
                <Input
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="andi123"
                  className="font-mono"
                  autoComplete="off"
                />
                <p className={cn("text-xs", usernameValid ? (usernameAvailable ? "text-success" : "text-destructive") : "text-muted-foreground")}>
                  {!usernameValid
                    ? "3–20 karakter: huruf kecil, angka, underscore."
                    : usernameTakenResult === false
                      ? `Username "${usernameNorm}" sudah dipakai`
                      : "Username tersedia ✓"}
                </p>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kelas">
                  <Select value={className} onValueChange={setClassName} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Daftar sebagai">
                  <Select value={role} onValueChange={(v) => setRole(v as "student" | "teacher")}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Siswa</SelectItem>
                      <SelectItem value="teacher">Guru</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Email">
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="andi@example.com"
                  autoComplete="email"
                />
              </Field>
              <Button
                type="submit"
                disabled={busy || !usernameValid || usernameTakenResult === false || !className}
                className="h-11 w-full font-bold"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <>Buat Akun <UserRoundPen className="size-4" /></>}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="mt-6 space-y-4 text-center">
              <MailQuestion className="mx-auto size-8 text-primary" />
              <div>
                <p className="font-bold">Cek email kamu</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Kami mengirim 6 digit kode ke{" "}
                  <span className="font-semibold text-foreground">{pendingEmail}</span>
                </p>
              </div>
              <div className="flex justify-center">
                <InputOTP value={otp} onChange={setOtp} maxLength={6} disabled={busy}>
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                type="submit"
                disabled={busy || otp.length !== 6}
                className="h-11 w-full font-bold"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <>Verifikasi & Masuk <ArrowRight className="size-4" /></>}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("form")} disabled={busy}>
                Pakai email / akun lain
              </Button>
            </form>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </div>

        <footer className="mx-auto w-full max-w-md pt-8 text-xs text-muted-foreground">
          Made With Love By MrStepen ( Joko Endriyanto ) · © 2026 Database Quest: Mutuharjo
        </footer>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthInner />
    </Suspense>
  );
}
