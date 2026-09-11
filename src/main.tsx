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
      const msg = this.state.message;
      // Error Convex (mis. "[CONVEX Q(users:currentUser)] Server Error")
      // biasanya sesi usang — tidak perlu stack trace untuk pengguna.
      const isConvexError = /CONVEX Q\(|Server Error|Could not find.*_id/i.test(msg);
      if (isConvexError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
            <div className="max-w-md text-center">
              <p className="kicker">Koneksi Database</p>
              <h1 className="mt-2 text-xl font-bold tracking-tight">
                Sesi kamu sudah tidak berlaku
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Data sesi lama di browser tidak cocok dengan server. Muat ulang
                halaman ini untuk masuk kembali — progres belajarmu aman.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Muat Ulang
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem("convex-auth-token");
                    window.location.href = "/auth";
                  }}
                  className="rounded-md border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-secondary"
                >
                  Masuk ulang
                </button>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {msg}
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

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);



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


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <AntiCheatGuard />
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
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
