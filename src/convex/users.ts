import { getAuthUserId } from "@convex-dev/auth/server";
import { query, QueryCtx } from "./_generated/server";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      const user = await getCurrentUser(ctx);

      if (user === null) {
        return null;
      }

      return user;
    } catch (err) {
      // Penyebab umum di production: session token masih ada di browser
      // tapi user-nya sudah dihapus (mis. reset DB). getAuthUserId sukses
      // karena token valid, tapi ctx.db.get(userId) gagal karena id tidak
      // ada lagi. Jangan biarkan error ini crash seluruh app — kembalikan
      // null supaya client menganggap user belum login dan diarahkan ke
      // halaman masuk.
      console.warn("users:currentUser failed, treating as signed out:", err);
      return null;
    }
  },
});

/**
 * Use this function internally to get the current user data. Remember to handle the null user case.
 * @param ctx
 * @returns
 */
export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};
