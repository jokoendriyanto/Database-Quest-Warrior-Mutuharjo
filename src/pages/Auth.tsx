import { Suspense, useEffect, useRef, useState } from "react";
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
import { Loader2, UserRoundPen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONVEX_URL } from "@/lib/convex-url";
import { LottieAnimation, SparkleAnimation } from "@/components/ui/lottie-animation";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // guard: selama registrasi berlangsung, jangan auto-redirect duluan
  const registeringRef = useRef(false);

  // form fields
  const [identifier, setIdentifier] = useState(""); // login: username atau email
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [className, setClassName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");

  // kelas resmi dari database — dikelola guru/admin
  const classes = useQuery(api.classes.list);
  const classOptions = classes?.map((c) => c.name) ?? [];

  const completeProfile = useMutation(api.profile.completeProfile);

  useEffect(() => {
    if (!authLoading && isAuthenticated && !registeringRef.current) {
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const usernameNorm = username.trim().toLowerCase();
  const usernameValid = /^[a-z0-9_]{3,20}$/.test(usernameNorm);

  const usernameTakenResult = useQuery(api.profile.checkUsername, {
    username: mode === "register" && usernameValid ? usernameNorm : "___idle___",
  });
  const usernameAvailable =
    mode === "register" && usernameValid ? usernameTakenResult !== false : true;

  /** resolveIdentifier lewat convex client (bukan fetch) — helper kecil */
  async function fetchResolved(identifier: string): Promise<string | null> {
    const { ConvexHttpClient } = await import("convex/browser");
    const client = new ConvexHttpClient(CONVEX_URL);
    const res = await client.query(api.profile.resolveIdentifier, { identifier });
    return res?.email ?? null;
  }

  /* --------------------------- login: password --------------------------- */

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const id = identifier.trim();
    if (!id || !password) return;
    setBusy(true);
    try {
      let targetEmail = id.toLowerCase();
      if (!id.includes("@")) {
        const resolved = await fetchResolved(id);
        if (!resolved) throw new Error("Invalid credentials");
        targetEmail = resolved;
      }
      await signIn("password", { flow: "signIn", email: targetEmail, password });
      // sukses — effect di atas yang mengarahkan ke tujuan
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.includes("Invalid credentials")
          ? "Username/email atau password salah."
          : msg.includes("Too many") || msg.includes("rate")
            ? "Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi."
            : msg || "Gagal masuk. Coba lagi ya.",
      );
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  /* ------------------ registrasi: langsung, tanpa kode OTP ---------------- */

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!usernameAvailable) {
      setError(`Username "${usernameNorm}" sudah dipakai. Coba yang lain ya.`);
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password belum sama dengan password.");
      return;
    }
    setBusy(true);
    registeringRef.current = true;
    try {
      await signIn("password", {
        flow: "signUp",
        email: email.trim().toLowerCase(),
        password,
      });
      // Tunggu session auth aktif di server (max ~3s)
      for (let i = 0; i < 15; i++) {
        try {
          await completeProfile({
            username: usernameNorm,
            name: name.trim(),
            className: className || undefined,
            role,
          });
          break;
        } catch {
          if (i === 14) throw new Error("Gagal menyimpan profil. Coba masuk ulang.");
          await new Promise((r) => setTimeout(r, 200));
        }
      }
      navigate("/onboarding");
    } catch (err) {
      registeringRef.current = false;
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.includes("already exists")
          ? "Email sudah terdaftar — coba masuk dulu ya."
          : msg.includes("Invalid password")
            ? "Password minimal 8 karakter."
            : msg || "Gagal membuat akun. Coba lagi ya.",
      );
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
              Database Quest Warrior<span className="text-muted-foreground">: Mutuharjo</span>
            </span>
          </Link>
        </div>

        <div className="relative max-w-lg">
          {/* Lottie accent — SQL quest floating animation */}
          <div className="absolute -right-4 -top-4 size-16 opacity-50 sm:size-20">
            <LottieAnimation animation="sql-quest" size="full" loop speed={0.7} />
          </div>
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
            Adu skill. <SparkleAnimation className="ml-1 inline-block size-5 align-middle" />
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
            <span className="text-sm font-extrabold tracking-tight">Database Quest Warrior: Mutuharjo</span>
          </Link>

          {/* tabs */}
          <div className="grid grid-cols-2 rounded-lg border border-border p-1">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
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

          {mode === "login" && (
            <form onSubmit={handlePasswordLogin} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="identifier">Username atau Email</Label>
                <Input
                  id="identifier"
                  placeholder="joko123 atau joko@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <p className="text-xs text-muted-foreground">
                  Lupa password? Hubungi gurumu — guru bisa mereset password dari halaman guru.
                </p>
              </div>
              <Button type="submit" disabled={busy} className="h-11 w-full font-bold">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <>Masuk <ArrowRight className="size-4" /></>}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  className="font-semibold text-foreground hover:text-primary"
                >
                  Daftar sekarang
                </button>
              </p>
            </form>
          )}

          {mode === "register" && (
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
                  <Select value={className} onValueChange={setClassName} required={classOptions.length > 0}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={classes ? "Pilih kelas" : "Memuat…"} />
                    </SelectTrigger>
                    <SelectContent>
                      {classOptions.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {classes && classOptions.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Belum ada kelas terdaftar — hubungi guru/admin.
                    </p>
                  )}
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
              <div className="grid grid-cols-2 gap-3">
                <Field label="Password">
                  <Input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="min. 8 karakter"
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Ulangi Password">
                  <Input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="ulangi password"
                    autoComplete="new-password"
                  />
                </Field>
              </div>
              <Button
                type="submit"
                disabled={
                  busy ||
                  !usernameValid ||
                  usernameTakenResult === false ||
                  (classOptions.length > 0 && !className)
                }
                className="h-11 w-full font-bold"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <>Buat Akun <UserRoundPen className="size-4" /></>}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Langsung masuk setelah daftar — tanpa verifikasi email.
              </p>
            </form>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </div>

        <footer className="mx-auto w-full max-w-md pt-8 text-xs text-muted-foreground">
          Made With Love By MrStepen ( Joko Endriyanto ) · © 2026 Database Quest Warrior: Mutuharjo
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
