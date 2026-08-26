import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getStats } from "./gameState";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

/** Cek ketersediaan & format username (untuk form registrasi). */
export const checkUsername = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const norm = username.trim().toLowerCase();
    if (!USERNAME_RE.test(norm)) return false;
    const existing = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", norm))
      .first();
    return !existing;
  },
});

/**
 * Login memakai SATU field "username atau email".
 * Jika input mengandung '@' → pakai langsung sebagai email.
 * Jika tidak → resolve username menjadi email di sisi server.
 */
export const resolveIdentifier = query({
  args: { identifier: v.string() },
  handler: async (ctx, { identifier }) => {
    const value = identifier.trim().toLowerCase();
    if (!value) return null;
    if (value.includes("@")) return { email: value };
    const user = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", value))
      .first();
    if (!user?.email) return null;
    return { email: user.email };
  },
});

/** Lengkapi profil setelah verifikasi email OTP (registrasi siswa/guru). */
export const completeProfile = mutation({
  args: {
    username: v.string(),
    name: v.string(),
    className: v.optional(v.string()),
    avatarEmoji: v.optional(v.string()),
    role: v.union(v.literal("student"), v.literal("teacher")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const username = args.username.trim().toLowerCase();
    if (!USERNAME_RE.test(username)) {
      throw new Error(
        "Username harus 3–20 karakter, hanya huruf kecil, angka, dan underscore.",
      );
    }
    const clash = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", username))
      .first();
    if (clash && clash._id !== userId) {
      throw new Error(`Username "${username}" sudah dipakai. Coba yang lain ya.`);
    }
    if (!args.name.trim()) throw new Error("Nama lengkap wajib diisi.");

    await ctx.db.patch(userId, {
      name: args.name.trim(),
      username,
      className: args.className ?? undefined,
      avatarEmoji: args.avatarEmoji ?? undefined,
      role: args.role,
    });

    // pastikan stats ada supaya leaderboard & dashboard siap
    await getStats(ctx, userId);
    return { ok: true };
  },
});

/** Generate upload URL untuk avatar — client upload langsung ke Convex storage. */
export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

/** Simpan avatar hasil upload — terima storage ID, hapus file lama jika ada. */
export const saveAvatar = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, { storageId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Hapus file lama jika ada
    if (user.image) {
      try {
        await ctx.storage.delete(user.image as any);
      } catch {
        /* file mungkin sudah tidak ada */
      }
    }

    await ctx.db.patch(userId, { image: storageId });
    return { ok: true };
  },
});

/** Hapus avatar — kembali ke emoji default. */
export const removeAvatar = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    if (user.image) {
      try {
        await ctx.storage.delete(user.image as any);
      } catch {
        /* ok */
      }
    }
    await ctx.db.patch(userId, { image: undefined });
    return { ok: true };
  },
});

/** Update ringan: avatar saat onboarding, dsb. */
export const updateProfile = mutation({
  args: {
    avatarEmoji: v.optional(v.string()),
    className: v.optional(v.string()),
    onboarded: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const patch: Record<string, unknown> = {};
    if (args.avatarEmoji !== undefined) patch.avatarEmoji = args.avatarEmoji;
    if (args.className !== undefined) patch.className = args.className;
    if (args.onboarded !== undefined) patch.onboarded = args.onboarded;
    if (Object.keys(patch).length) await ctx.db.patch(userId, patch);
    return { ok: true };
  },
});
