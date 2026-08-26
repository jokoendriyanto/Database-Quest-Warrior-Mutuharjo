import {
  createAccount,
  modifyAccountCredentials,
  retrieveAccount,
} from "@convex-dev/auth/server";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/**
 * Akun guru bawaan — dibuat sekali, aman dijalankan ulang.
 * Login di /auth dengan username `guru` (resolveIdentifier → email) atau email langsung.
 */
const TEACHER_USERNAME = "guru";
const TEACHER_EMAIL = "guru@mutuharjo.sch.id";
const TEACHER_NAME = "Guru Produktif";
const TEACHER_PASSWORD = "Rezeki1M";

/** Cari user guru berdasarkan username. */
export const findTeacher = internalQuery({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", TEACHER_USERNAME))
      .first();
    return existing ? { id: existing._id, email: existing.email ?? TEACHER_EMAIL } : null;
  },
});

/** Buat dokumen user guru. */
export const insertTeacher = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.insert("users", {
      name: TEACHER_NAME,
      email: TEACHER_EMAIL,
      username: TEACHER_USERNAME,
      role: "teacher",
      onboarded: true,
      avatarEmoji: "🧑‍🏫",
    });
  },
});

/** Pastikan user ber-role teacher & sudah onboarded (juga jika user sudah ada). */
export const patchTeacher = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.patch(userId, { role: "teacher", onboarded: true });
  },
});

export const ensureTeacher = internalAction({
  args: {},
  handler: async (ctx): Promise<{ ok: boolean; userId: Id<"users"> }> => {
    let user: { id: Id<"users">; email: string } | null = await ctx.runQuery(
      internal.setup.findTeacher,
      {},
    );
    if (!user) {
      const userId = await ctx.runMutation(internal.setup.insertTeacher, {});
      user = { id: userId, email: TEACHER_EMAIL };
    }
    await ctx.runMutation(internal.setup.patchTeacher, { userId: user.id });

    // Sudah punya akun password → update secret; belum → buat & tautkan ke user ini.
    // Catatan: retrieveAccount THROW "InvalidAccountId" (bukan return null) saat akun belum ada.
    let existing: unknown = null;
    try {
      existing = await retrieveAccount(ctx, {
        provider: "password",
        account: { id: TEACHER_EMAIL },
      });
    } catch {
      // akun belum ada — dibuat di bawah
    }
    if (existing) {
      await modifyAccountCredentials(ctx, {
        provider: "password",
        account: { id: TEACHER_EMAIL, secret: TEACHER_PASSWORD },
      });
    } else {
      await createAccount(ctx, {
        provider: "password",
        account: { id: TEACHER_EMAIL, secret: TEACHER_PASSWORD },
        profile: {
          email: TEACHER_EMAIL,
          name: TEACHER_NAME,
          existingUserId: user.id,
        } as any,
      });
    }
    return { ok: true, userId: user.id };
  },
});
