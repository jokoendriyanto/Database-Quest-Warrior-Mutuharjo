import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Helper: assert caller is teacher or admin. */
async function requireTeacher(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not authenticated");
  const me = await ctx.db.get(userId);
  if (!me || (me.role !== "teacher" && me.role !== "admin")) {
    throw new Error("Hanya guru/admin yang bisa mengakses fitur ini.");
  }
  return userId;
}

/** Edit satu siswa — bisa ganti nama, kelas, avatarEmoji. */
export const editStudent = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    className: v.optional(v.string()),
    avatarEmoji: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireTeacher(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Siswa tidak ditemukan.");
    if (user.role !== "student") throw new Error("Target bukan siswa.");

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) {
      const clean = args.name.trim();
      if (!clean) throw new Error("Nama tidak boleh kosong.");
      if (clean.length > 100) throw new Error("Nama terlalu panjang.");
      patch.name = clean;
    }
    if (args.className !== undefined) {
      patch.className = args.className.trim() || undefined;
    }
    if (args.avatarEmoji !== undefined) {
      patch.avatarEmoji = args.avatarEmoji || undefined;
    }

    if (Object.keys(patch).length === 0) {
      throw new Error("Tidak ada perubahan yang dikirim.");
    }

    await ctx.db.patch(args.userId, patch);
    return { ok: true };
  },
});

/** Mass edit — ganti kelas untuk beberapa siswa sekaligus. */
export const massEditClass = mutation({
  args: {
    userIds: v.array(v.id("users")),
    className: v.string(),
  },
  handler: async (ctx, args) => {
    await requireTeacher(ctx);

    if (args.userIds.length === 0) throw new Error("Pilih minimal satu siswa.");
    if (args.userIds.length > 100) throw new Error("Maksimal 100 siswa per batch.");

    const clean = args.className.trim();
    let updated = 0;
    for (const uid of args.userIds) {
      const user = await ctx.db.get(uid);
      if (!user || user.role !== "student") continue;
      await ctx.db.patch(uid, { className: clean || undefined });
      updated++;
    }
    return { ok: true, updated };
  },
});

/** Mass delete — hapus beberapa siswa sekaligus (hapus stats + progress). */
export const massDeleteStudents = mutation({
  args: {
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireTeacher(ctx);

    if (args.userIds.length === 0) throw new Error("Pilih minimal satu siswa.");
    if (args.userIds.length > 50) throw new Error("Maksimal 50 siswa per batch.");

    let deleted = 0;
    for (const uid of args.userIds) {
      const user = await ctx.db.get(uid);
      if (!user || user.role !== "student") continue;

      // Hapus stats
      const stats = await ctx.db
        .query("studentStats")
        .withIndex("by_user", (q) => q.eq("userId", uid))
        .first();
      if (stats) await ctx.db.delete(stats._id);

      // Hapus lesson progress
      const progress = await ctx.db
        .query("lessonProgress")
        .withIndex("by_user", (q) => q.eq("userId", uid))
        .collect();
      for (const p of progress) await ctx.db.delete(p._id);

      // Hapus exercise attempts
      const attempts = await ctx.db
        .query("exerciseAttempts")
        .withIndex("by_user", (q) => q.eq("userId", uid))
        .collect();
      for (const a of attempts) await ctx.db.delete(a._id);

      // Hapus battle logs
      const battles = await ctx.db
        .query("battleLogs")
        .withIndex("by_user", (q) => q.eq("userId", uid))
        .collect();
      for (const b of battles) await ctx.db.delete(b._id);

      // Reset user jadi anonymous (hapus profil, jangan delete auth record)
      await ctx.db.patch(uid, {
        name: undefined,
        username: undefined,
        className: undefined,
        avatarEmoji: undefined,
        role: undefined,
        onboarded: undefined,
      });

      deleted++;
    }
    return { ok: true, deleted };
  },
});

/** Daftar kelas untuk dropdown — dari tabel classes + fallback default. */
export const classOptions = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("classes").withIndex("by_name").collect();
    if (rows.length > 0) {
      return rows.map((c) => c.name);
    }
    // Fallback jika tabel classes kosong
    return [
      "X PPLG 1",
      "X PPLG 2",
      "XI PPLG 1",
      "XI PPLG 2",
      "XII PPLG 1",
      "XII PPLG 2",
    ];
  },
});
