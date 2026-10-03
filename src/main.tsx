import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { useAntiCheat } from "./hooks/useAntiCheat";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";
import { CONVEX_URL } from "./lib/convex-url";
import { useSiteJsonLd } from "./lib/seo";

// Apply theme before React mounts to prevent flash
(function initTheme() {
  const stored = localStorage.getItem("dq-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (stored === "dark" || (!stored && prefersDark)) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
})();

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Learn = lazy(() => import("./pages/Learn.tsx"));
const LessonPage = lazy(() => import("./pages/LessonPage.tsx"));
const BattlePage = lazy(() => import("./pages/BattlePage.tsx"));
const Leaderboard = lazy(() => import("./pages/Leaderboard.tsx"));
const ProfilePage = lazy(() => import("./pages/ProfilePage.tsx"));
const TeacherPage = lazy(() => import("./pages/TeacherPage.tsx"));
const AssignmentsPage = lazy(() => import("./pages/AssignmentsPage.tsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const ShopPage = lazy(() => import("./pages/ShopPage.tsx"));
const CertificatePage = lazy(() => import("./pages/CertificatePage.tsx"));
// Halaman publik SEO (dapat diindeks mesin pencari)
const MateriPage = lazy(() => import("./pages/MateriPage.tsx"));
const LatihanPage = lazy(() => import("./pages/LatihanPage.tsx"));
const StudiKasusPage = lazy(() => import("./pages/StudiKasusPage.tsx"));
const TentangPage = lazy(() => import("./pages/TentangPage.tsx"));
// Modul HRD (aditif — shell & halaman terpisah dari AppShell siswa/guru)
const HrdShell = lazy(() => import("./components/HrdShell.tsx"));
const HrdRegisterPage = lazy(() => import("./pages/hrd/HrdRegisterPage.tsx"));
const HrdOverviewPage = lazy(() => import("./pages/hrd/HrdOverviewPage.tsx"));
const HrdCandidatePoolPage = lazy(() => import("./pages/hrd/HrdCandidatePoolPage.tsx"));
const HrdCandidateProfilePage = lazy(() => import("./pages/hrd/HrdCandidateProfilePage.tsx"));
const HrdSkillExplorerPage = lazy(() => import("./pages/hrd/HrdSkillExplorerPage.tsx"));
const HrdShortlistPage = lazy(() => import("./pages/hrd/HrdShortlistPage.tsx"));
const HrdVerifyPage = lazy(() => import("./pages/hrd/HrdVerifyPage.tsx"));
const HrdCompanyPage = lazy(() => import("./pages/hrd/HrdCompanyPage.tsx"));
const HrdActivityPage = lazy(() => import("./pages/hrd/HrdActivityPage.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in WebContainer environment). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(CONVEX_URL);



function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);
  return null;
}

/** Activates anti-cheat protection across the entire platform */
function AntiCheatGuard() {
  useAntiCheat();
  return null;
}

/** Mounts sitewide structured data (WebSite + EducationalOrganization). */
function SiteJsonLd() {
  useSiteJsonLd();
  return null;
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <AntiCheatGuard />
          <SiteJsonLd />
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              {/* Halaman publik (dapat diindeks) */}
              <Route path="/" element={<Landing />} />
              <Route path="/materi" element={<MateriPage />} />
              <Route path="/latihan" element={<LatihanPage />} />
              <Route path="/studi-kasus" element={<StudiKasusPage />} />
              <Route path="/tentang" element={<TentangPage />} />
              <Route path="/hrd/register" element={<HrdRegisterPage />} />
              <Route
                element={
                  <RequireAuth>
                    <HrdShell />
                  </RequireAuth>
                }
              >
                <Route path="/hrd" element={<HrdOverviewPage />} />
                <Route path="/hrd/candidates" element={<HrdCandidatePoolPage />} />
                <Route path="/hrd/candidates/:studentId" element={<HrdCandidateProfilePage />} />
                <Route path="/hrd/explorer" element={<HrdSkillExplorerPage />} />
                <Route path="/hrd/shortlist" element={<HrdShortlistPage />} />
                <Route path="/hrd/verify" element={<HrdVerifyPage />} />
                <Route path="/hrd/company" element={<HrdCompanyPage />} />
                <Route path="/hrd/activity" element={<HrdActivityPage />} />
              </Route>
              <Route
                path="/auth"
                element={<AuthPage />}
              />
              <Route
                path="/onboarding"
                element={
                  <RequireAuth>
                    <Onboarding />
                  </RequireAuth>
                }
              />
              {/* Semua halaman terproteksi memakai shell aplikasi */}
              <Route
                element={
                  <RequireAuth>
                    <AppShell />
                  </RequireAuth>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/learn" element={<Learn />} />
                <Route path="/lesson/:lessonId" element={<LessonPage />} />
                <Route path="/battle" element={<BattlePage />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/assignments" element={<AssignmentsPage />} />
                <Route path="/teacher" element={<TeacherPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/certificate" element={<CertificatePage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
)
