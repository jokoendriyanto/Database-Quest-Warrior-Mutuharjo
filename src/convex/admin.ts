import {
  getAuthUserId,
  modifyAccountCredentials,
  retrieveAccount,
  createAccount,
  invalidateSessions,
} from "@convex-dev/auth/server";
import { action, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { roleValidator } from "./schema";
import { findStats, todayStr } from "./gameState";
import { levelFromXp } from "../lib/game";

/* ------------------------------- helpers ---------------------------------- */

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not authenticated");
  const me = await ctx.db.get(userId);
  if (!me || me.role !== "admin") {
    throw new Error("Hanya admin yang bisa mengakses ini.");
  }
  return userId;
}

/* ------------------------------- overview --------------------------------- */

/** Statistik ringkas seluruh sistem — admin only. */
export const overview = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const me = await ctx.db.get(userId);
    if (!me || me.role !== "admin") return { denied: true as const };

    const users = await ctx.db.query("users").collect();
    const students = users.filter((u) => u.role === "student");
    const teachers = users.filter((u) => u.role === "teacher");
    const today = todayStr();

    const perClass = new Map<string, number>();
    for (const s of students) {
      const key = s.className ?? "(tanpa kelas)";
      perClass.set(key, (perClass.get(key) ?? 0) + 1);
    }

    const activeToday = (
      await Promise.all(
        students.map(async (s) => {
          const st = await findStats(ctx, s._id);
          return st.lastActiveDate === today;
        }),
      )
    ).filter(Boolean).length;

    const totalXp = (
      await Promise.all(students.map(async (s) => (await findStats(ctx, s._id)).xp))
    ).reduce((a, b) => a + b, 0);

    return {
      denied: false as const,
      totalUsers: users.length,
      totalStudents: students.length,
      totalTeachers: teachers.length,
      activeToday,
      totalXp,
      perClass: [...perClass.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    };
  },
});

/* -------------------------------- users ----------------------------------- */

/** Daftar seluruh user + XP — admin only. */
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { denied: true as const, users: [] };
    const me = await ctx.db.get(userId);
    if (!me || me.role !== "admin") return { denied: true as const, users: [] };

    const users = await ctx.db.query("users").collect();
    const out = [];
    for (const u of users) {
      const st = await findStats(ctx, u._id);
      out.push({
        id: u._id,
        name: u.name ?? "",
        username: u.username ?? "",
        email: u.email ?? "",
        role: u.role ?? "student",
        className: u.className ?? "",
        avatarEmoji: u.avatarEmoji ?? "🦉",
        xp: st.xp,
        level: levelFromXp(st.xp),
        duelRating: st.duelRating ?? 1000,
        lastActiveDate: st.lastActiveDate ?? "",
      });
    }
    out.sort((a: any, b: any) => b.xp - a.xp);
    return { denied: false as const, users: out };
  },
});

/** Ganti role user — admin only. Admin tidak bisa menurunkan dirinya sendiri. */
export const setRole = mutation({
  args: { userId: v.id("users"), role: roleValidator },
  handler: async (ctx, { userId, role }) => {
    const meId = await requireAdmin(ctx);
    if (userId === meId && role !== "admin") {
      throw new Error("Kamu tidak bisa menurunkan role dirimu sendiri.");
    }
    await ctx.db.patch(userId, { role });
    return { ok: true };
  },
});

/** Pindahkan siswa ke kelas lain — admin/guru. */
export const setClass = mutation({
  args: { userId: v.id("users"), className: v.string() },
  handler: async (ctx, { userId, className }) => {
    const meId = await getAuthUserId(ctx);
    if (meId === null) throw new Error("Not authenticated");
    const me = await ctx.db.get(meId);
    if (!me || (me.role !== "teacher" && me.role !== "admin")) {
      throw new Error("Hanya guru/admin yang bisa mengubah kelas siswa.");
    }
    await ctx.db.patch(userId, { className: className.trim() || undefined });
    return { ok: true };
  },
});

/* --------------------------- reset password ------------------------------- */

/** Baca data dasar user dari dalam action (actions tidak punya ctx.db). */
export const getUserBasic = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const u = await ctx.db.get(userId);
    if (!u) return null;
    return { email: u.email ?? "", name: u.name ?? "", role: u.role ?? "student" };
  },
});

/**
 * Guru/admin me-reset password siswa.
 * - Siswa sudah punya akun password  → secret di-update.
 * - Siswa lama tanpa akun password   → akun password baru dibuat dan
 *   ditautkan ke user yang sama (lewat callback createOrUpdateUser).
 * Semua sesi aktif siswa dicabut setelah reset.
 */
export const resetPassword = action({
  args: { userId: v.id("users"), newPassword: v.string() },
  handler: async (ctx, { userId, newPassword }) => {
    const meId = await getAuthUserId(ctx);
    if (meId === null) throw new Error("Not authenticated");
    const me = await ctx.runQuery(internal.admin.getUserBasic, { userId: meId });
    if (!me || (me.role !== "teacher" && me.role !== "admin")) {
      throw new Error("Hanya guru/admin yang bisa reset password.");
    }
    if (newPassword.length < 8) {
      throw new Error("Password baru minimal 8 karakter.");
    }

    const target = await ctx.runQuery(internal.admin.getUserBasic, { userId });
    if (!target?.email) {
      throw new Error("Siswa ini tidak punya email terdaftar.");
    }
    const email = target.email;

    // sudah punya akun password? kalau belum, buat lalu tautkan ke user ini.
    // retrieveAccount THROW "InvalidAccountId" saat akun belum ada — jangan biarkan crash.
    let existing: unknown = null;
    try {
      existing = await retrieveAccount(ctx, {
        provider: "password",
        account: { id: email },
      });
    } catch {
      // belum punya akun password — dibuat di bawah
    }
    if (existing) {
      await modifyAccountCredentials(ctx, {
        provider: "password",
        account: { id: email, secret: newPassword },
      });
    } else {
      await createAccount(ctx, {
        provider: "password",
        account: { id: email, secret: newPassword },
        profile: {
          email,
          name: target.name,
          existingUserId: userId,
        } as any,
      });
    }

    // cabut semua sesi aktif — password lama tidak lagi berguna
    await invalidateSessions(ctx, { userId: userId as any });
    return { ok: true };
  },
});
