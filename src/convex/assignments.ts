import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { EXERCISE_MAP, LESSON_MAP } from "../lib/curriculum";

/* ----------------------------- helper ------------------------------------ */

async function requireTeacher(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new Error("Not authenticated");
  const me = await ctx.db.get(userId);
  if (!me || (me.role !== "teacher" && me.role !== "admin")) {
    throw new Error("Hanya guru/admin yang bisa mengelola tugas.");
  }
  return { userId, me };
}

async function refTitle(kind: string, refId: string, ctx: any): Promise<string> {
  if (kind === "exercise") return EXERCISE_MAP.get(refId)?.title ?? refId;
  if (kind === "lesson") return LESSON_MAP.get(refId)?.lesson.title ?? refId;
  if (kind === "challenge") {
    const ch = await ctx.db.get(refId as any);
    return ch?.title ?? refId;
  }
  return refId;
}

/** Sudahkah siswa menyelesaikan pekerjaan yang ditugaskan? Dicek dari bukti nyata. */
async function hasProof(ctx: any, userId: any, kind: string, refId: string): Promise<boolean> {
  if (kind === "lesson") {
    const row = await ctx.db
      .query("lessonProgress")
      .withIndex("by_user_lesson", (q: any) => q.eq("userId", userId).eq("lessonId", refId))
      .first();
    return !!row;
  }
  if (kind === "exercise") {
    const row = await ctx.db
      .query("exerciseAttempts")
      .withIndex("by_user_exercise", (q: any) => q.eq("userId", userId).eq("exerciseId", refId))
      .filter((q: any) => q.eq(q.field("isCorrect"), true))
      .first();
    return !!row;
  }
  if (kind === "challenge") {
    const row = await ctx.db
      .query("challengeSubmissions")
      .withIndex("by_challenge_user", (q: any) =>
        q.eq("challengeId", refId).eq("userId", userId),
      )
      .filter((q: any) => q.eq(q.field("correct"), true))
      .first();
    return !!row;
  }
  return false;
}

/* ------------------------------ guru -------------------------------------- */

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    kind: v.union(v.literal("exercise"), v.literal("lesson"), v.literal("challenge")),
    refId: v.string(),
    className: v.string(), // "" = semua kelas
    dueAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireTeacher(ctx);
    const title = args.title.trim();
    if (!title) throw new Error("Judul tugas tidak boleh kosong.");

    // validasi referensi
    if (args.kind === "exercise" && !EXERCISE_MAP.has(args.refId)) {
      throw new Error("Latihan tidak ditemukan di kurikulum.");
    }
    if (args.kind === "lesson" && !LESSON_MAP.has(args.refId)) {
      throw new Error("Materi tidak ditemukan di kurikulum.");
    }
    if (args.kind === "challenge") {
      const ch = await ctx.db.get(args.refId as any);
      if (!ch) throw new Error("Challenge tidak ditemukan.");
    }

    const id = await ctx.db.insert("assignments", {
      teacherId: userId,
      title,
      description: args.description?.trim() || undefined,
      kind: args.kind,
      refId: args.refId,
      className: args.className.trim(),
      dueAt: args.dueAt,
      createdAt: Date.now(),
    });
    return { id };
  },
});

export const remove = mutation({
  args: { id: v.id("assignments") },
  handler: async (ctx, { id }) => {
    await requireTeacher(ctx);
    const subs = await ctx.db
      .query("assignmentSubmissions")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", id))
      .collect();
    for (const s of subs) await ctx.db.delete(s._id);
    await ctx.db.delete(id);
    return { ok: true };
  },
});

/** Daftar tugas untuk guru + ringkasan pengerjaan per kelas. */
export const listForTeacher = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { denied: true as const, assignments: [] };
    const me = await ctx.db.get(userId);
    if (!me || (me.role !== "teacher" && me.role !== "admin")) {
      return { denied: true as const, assignments: [] };
    }

    const rows = await ctx.db.query("assignments").order("desc").take(100);
    const students = (await ctx.db.query("users").collect()).filter(
      (u: any) => u.role === "student",
    );

    const assignments = [];
    for (const a of rows) {
      const subs = await ctx.db
        .query("assignmentSubmissions")
        .withIndex("by_assignment", (q) => q.eq("assignmentId", a._id))
        .collect();
      const target = students.filter(
        (u: any) => !a.className || u.className === a.className,
      );
      assignments.push({
        id: a._id,
        title: a.title,
        description: a.description ?? "",
        kind: a.kind,
        refId: a.refId,
        refTitle: await refTitle(a.kind, a.refId, ctx),
        className: a.className,
        dueAt: a.dueAt ?? null,
        createdAt: a.createdAt,
        targetCount: target.length,
        doneCount: subs.filter((s) => target.some((t: any) => t._id === s.userId)).length,
      });
    }
    return { denied: false as const, assignments };
  },
});

/** Detail pengerjaan satu tugas (guru): siapa sudah, siapa belum. */
export const submissions = query({
  args: { id: v.id("assignments") },
  handler: async (ctx, { id }) => {
    await requireTeacher(ctx);
    const a = await ctx.db.get(id);
    if (!a) throw new Error("Tugas tidak ditemukan.");
    const students = (await ctx.db.query("users").collect()).filter(
      (u: any) => u.role === "student" && (!a.className || u.className === a.className),
    );
    const subs = await ctx.db
      .query("assignmentSubmissions")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", id))
      .collect();
    const subMap = new Map(subs.map((s) => [s.userId, s]));
    return students.map((u: any) => {
      const s = subMap.get(u._id);
      return {
        userId: u._id,
        name: u.name ?? u.username ?? "?",
        username: u.username ?? "",
        avatarEmoji: u.avatarEmoji ?? "🦉",
        done: !!s,
        completedAt: s?.completedAt ?? null,
      };
    });
  },
});

/* ------------------------------ siswa ------------------------------------- */

/** Tugas untuk siswa yang sedang login (kelasnya sendiri + tugas umum). */
export const listForStudent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { denied: true as const, assignments: [] };
    const me = await ctx.db.get(userId);
    if (!me) return { denied: true as const, assignments: [] };
    const myClass = me.className ?? "";

    const all = await ctx.db.query("assignments").order("desc").take(100);
    const mine = all.filter((a) => !a.className || a.className === myClass);

    const assignments = [];
    for (const a of mine) {
      const sub = await ctx.db
        .query("assignmentSubmissions")
        .withIndex("by_assignment_user", (q) =>
          q.eq("assignmentId", a._id).eq("userId", userId),
        )
        .first();
      const eligible = await hasProof(ctx, userId, a.kind, a.refId);
      assignments.push({
        id: a._id,
        title: a.title,
        description: a.description ?? "",
        kind: a.kind,
        refId: a.refId,
        refTitle: await refTitle(a.kind, a.refId, ctx),
        className: a.className,
        dueAt: a.dueAt ?? null,
        createdAt: a.createdAt,
        done: !!sub,
        completedAt: sub?.completedAt ?? null,
        workCompleted: eligible, // bukti pengerjaan ada, tinggal klaim
      });
    }
    return { denied: false as const, assignments };
  },
});

/**
 * Siswa menandai tugas selesai — diverifikasi server dari bukti nyata
 * (lesson selesai / attempt benar / challenge benar). Tidak bisa dibohongi.
 */
export const markComplete = mutation({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, { assignmentId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");

    const a = await ctx.db.get(assignmentId);
    if (!a) throw new Error("Tugas tidak ditemukan.");
    const me = await ctx.db.get(userId);
    if (a.className && me?.className !== a.className) {
      throw new Error("Tugas ini bukan untuk kelasmu.");
    }

    const existing = await ctx.db
      .query("assignmentSubmissions")
      .withIndex("by_assignment_user", (q) =>
        q.eq("assignmentId", assignmentId).eq("userId", userId),
      )
      .first();
    if (existing) return { ok: true, alreadyDone: true, eligible: true };

    const eligible = await hasProof(ctx, userId, a.kind, a.refId);
    if (!eligible) {
      return { ok: false as const, alreadyDone: false, eligible: false };
    }

    await ctx.db.insert("assignmentSubmissions", {
      assignmentId,
      userId,
      completedAt: Date.now(),
    });
    return { ok: true, alreadyDone: false, eligible: true };
  },
});
