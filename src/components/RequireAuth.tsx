import { useAuth } from "@/hooks/use-auth";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { DatabaseLoadingAnimation } from "@/components/ui/lottie-animation";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, sessionInvalid } = useAuth();
  const location = useLocation();

  // Sesi usang (token ada, user sudah tidak ada) — useAuth sedang
  // membersihkan token. Tetap di layar loading sampai redirect aman,
  // supaya tidak berkedip antar halaman.
  if (sessionInvalid) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <DatabaseLoadingAnimation />
          <p className="mt-4 text-sm text-muted-foreground">
            Sesi tidak valid — membersihkan sesi lama…
          </p>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <DatabaseLoadingAnimation />
      </main>
    );
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  return children;
}
