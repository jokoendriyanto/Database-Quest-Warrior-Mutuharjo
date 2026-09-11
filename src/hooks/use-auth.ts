import { useEffect, useRef } from "react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";

export function useAuth() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const { signIn, signOut } = useAuthActions();

  // Token masih dianggap valid oleh Convex (isAuthenticated = true) tapi
  // server tidak menemukan user-nya — biasanya session lama setelah data
  // production di-reset atau user dihapus. Tanpa penanganan ini halaman
  // terproteksi crash dengan "[CONVEX Q(users:currentUser)] Server Error".
  const sessionInvalid = !isAuthLoading && isAuthenticated && user === null;

  // Hapus sekali per mount: clearToken membuang token usang sehingga
  // isAuthenticated kembali false dan RequireAuth mengarahkan ke /auth.
  const clearedRef = useRef(false);
  useEffect(() => {
    if (sessionInvalid && !clearedRef.current) {
      clearedRef.current = true;
      signOut().catch(() => {
        /* gagal clear token — biarkan RequireAuth menangani */
      });
    }
  }, [sessionInvalid, signOut]);

  // Derive isLoading directly from the dependencies instead of managing separate state
  const isLoading = isAuthLoading || user === undefined;

  return {
    isLoading,
    isAuthenticated,
    sessionInvalid,
    user,
    signIn,
    signOut,
  };
}
