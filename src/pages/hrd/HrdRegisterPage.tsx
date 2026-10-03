import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSeo } from "@/lib/seo";
import { Loader2, Building2 } from "lucide-react";

/**
 * Halaman registrasi + onboarding HRD.
 * Alur: buat akun (Convex Auth password) → isi data perusahaan →
 * role di-set hrd → masuk Talent Dashboard.
 * Tidak mengubah alur registrasi siswa/guru di /auth.
 */
export default function HrdRegisterPage() {
  useSeo({
    title: "Registrasi HRD — Database Quest Warrior",
    description:
      "Daftarkan perusahaan Anda untuk mengakses profil kompetensi siswa SMK Muhammadiyah 1 Sukoharjo.",
    path: "/hrd/register",
  });

  const { isLoading, isAuthenticated, user } = useAuth();
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const registerHrdAccount = useMutation(api.hrd.registerHrdAccount);
  const convex = useConvex();

  const [mode, setMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [about, setAbout] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companySaved, setCompanySaved] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        // Login murni — form ini tidak memuat data perusahaan.
        await signIn("password", {
          flow: "signIn",
          email: email.trim().toLowerCase(),
          password,
        });
        // Tunggu sesi auth sampai role terbaca: signIn selesai sebelum
        // token sempat terpakai, jadi query pertama bisa null.
        let me: { role?: string } | null = null;
        for (let attempt = 0; attempt < 15; attempt++) {
          me = await convex.query(api.users.currentUser);
          if (me) break;
          await new Promise((r) => setTimeout(r, 200));
        }
        if (!me) throw new Error("Sesi login belum aktif. Silakan coba lagi.");
        if (me.role !== "hrd") {
          throw new Error(
            "Akun ini belum terdaftar sebagai HRD. Buat akun lewat tab Daftar.",
          );
        }
        setCompanySaved(true);
        navigate("/hrd");
        return;
      }

      // Daftar: tanpa field name di signUp; nama disimpan server
      // melalui registerHrdAccount.
      await signIn("password", {
        flow: "signUp",
        email: email.trim().toLowerCase(),
        password,
      });
      // Setelah auth, daftarkan role + perusahaan.
      // Retry kecil mengantisipasi propagasi sesi auth (pola yang sama
      // dipakai alur registrasi siswa/guru di /auth).
      let lastErr: unknown = null;
      for (let attempt = 0; attempt < 15; attempt++) {
        try {
          await registerHrdAccount({
            companyName: companyName.trim(),
            name: name.trim() || undefined,
            industry: industry.trim() || undefined,
            website: website.trim() || undefined,
            about: about.trim() || undefined,
          });
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
          await new Promise((r) => setTimeout(r, 200));
        }
      }
      if (lastErr) throw lastErr;
      setCompanySaved(true);
      navigate("/hrd");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.includes("Invalid password") || msg.includes("Invalid credentials")
          ? "Email/password salah, atau password minimal 8 karakter."
          : msg || "Gagal mendaftar. Coba lagi.",
      );
    } finally {
      setBusy(false);
    }
  };

  // Sudah login sebagai HRD → langsung dashboard (via effect, bukan render)
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === "hrd") {
      navigate("/hrd", { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_520px]">
      {/* Panel kiri — branding, gaya konsisten dengan /auth */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-secondary/60 p-10 lg:flex">
        <div className="grid-motif absolute inset-0" aria-hidden />
        <div className="relative">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="font-mono text-sm font-bold tracking-tight text-primary">
              dq<span className="text-muted-foreground">:</span>
            </span>
            <span className="text-sm font-extrabold tracking-tight">
              Database Quest Warrior
              <span className="text-muted-foreground">: Mutuharjo</span>
            </span>
          </Link>
        </div>
        <div className="relative max-w-lg">
          <p className="kicker">TALENT PARTNERSHIP</p>
          <h2 className="mt-3 text-2xl font-extrabold leading-snug tracking-tight">
            Temukan calon Junior Database Programmer berbasis Skill Matrix yang
            dapat dipertanggungjawabkan.
          </h2>
          <ul className="mt-6 space-y-1.5 text-sm text-muted-foreground">
            <li>
              <span className="mr-2 font-mono text-xs text-primary">01</span>
              Competency Profile dari latihan SQL nyata
            </li>
            <li>
              <span className="mr-2 font-mono text-xs text-primary">02</span>
              Sertifikat kompetensi yang bisa diverifikasi
            </li>
            <li>
              <span className="mr-2 font-mono text-xs text-primary">03</span>
              Kandidat hanya tampil dengan izin siswa
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-muted-foreground">
          SMK Muhammadiyah 1 Sukoharjo · PPLG
        </p>
      </aside>

      {/* Panel kanan — form */}
      <main className="flex flex-col px-4 py-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <p className="kicker">UNTUK PERUSAHAAN</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
            {mode === "register" ? "Registrasi HRD" : "Masuk HRD"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "register"
              ? "Buat akun perusahaan dan langsung akses Talent Dashboard."
              : "Masuk dengan akun perusahaan yang sudah terdaftar."}
          </p>

          <div className="mt-5 grid grid-cols-2 rounded-lg border border-border p-1">
            {(["register", "login"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className={`rounded-md py-2 text-sm font-bold transition-colors ${
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "register" ? "Daftar" : "Sudah punya akun"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-5 space-y-3.5">
            {mode === "register" && (
              <div className="space-y-1.5">
                <Label htmlFor="hrd-name">Nama Anda</Label>
                <Input
                  id="hrd-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama rekruter"
                  autoComplete="name"
                />
              </div>
            )}
            {mode === "register" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="hrd-company">Nama Perusahaan *</Label>
                  <Input
                    id="hrd-company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="PT Teknologi Nusantara"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="hrd-industry">Industri</Label>
                    <Input
                      id="hrd-industry"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="Software House"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hrd-website">Website</Label>
                    <Input
                      id="hrd-website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://…"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hrd-about">Tentang perusahaan</Label>
                  <Textarea
                    id="hrd-about"
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    rows={2}
                    placeholder="Deskripsi singkat…"
                  />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="hrd-email">Email Kerja *</Label>
              <Input
                id="hrd-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hrd@perusahaan.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hrd-password">Password *</Label>
              <Input
                id="hrd-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min. 8 karakter"
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                required
              />
            </div>

            {error && (
              <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {companySaved && (
              <p role="status" className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                {mode === "register" ? "Perusahaan terdaftar!" : "Berhasil masuk."}
              </p>
            )}

            <Button type="submit" disabled={busy} className="h-11 w-full font-bold">
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Building2 className="size-4" />
                  {mode === "register" ? "Daftarkan Perusahaan" : "Masuk"}
                </>
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Siswa/guru?{" "}
            <Link to="/auth" className="font-semibold text-foreground hover:text-primary">
              Masuk di sini
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
