// THIS FILE IS READ ONLY. Do not touch this file unless you are correctly adding a new auth provider in accordance to the vly auth documentation

import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // username/email + password — tanpa verifikasi email (tidak ada opsi `verify`).
    // Lupa password ditangani guru/admin lewat reset password di halaman guru.
    Password,
    Anonymous,
  ],
  callbacks: {
    /**
     * Reset password siswa lama yang belum punya akun password (mantan
     * pengguna login OTP): admin.ts memanggil createAccount dengan
     * `profile.existingUserId`, dan callback ini menautkan akun password
     * baru ke dokumen user yang sudah ada — bukan membuat user duplikat.
     */
    createOrUpdateUser: async (ctx: any, args: any): Promise<any> => {
      const marker = args?.profile?.existingUserId;
      if (typeof marker === "string" && marker) {
        const existing = await ctx.db.get(marker);
        if (existing) {
          const { existingUserId: _drop, ...profile } = args.profile;
          await ctx.db.patch(marker, profile);
          return marker as any;
        }
      }
      // perilaku default: buat user baru dari profile
      const { emailVerified, phoneVerified, ...profile } = args.profile ?? {};
      const userData: Record<string, unknown> = { ...profile };
      if (emailVerified) userData.emailVerificationTime = Date.now();
      if (phoneVerified) userData.phoneVerificationTime = Date.now();
      return (await ctx.db.insert("users", userData)) as any;
    },
  },
});
