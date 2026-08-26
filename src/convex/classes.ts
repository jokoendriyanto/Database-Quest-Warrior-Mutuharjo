import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/** Kelas resmi dari database — dipakai halaman auth, profil, dan admin. */

const DEFAULT_CLASSES = [
  "X PPLG 1",
  "X PPLG 2",
  "XI PPLG 1",
  "XI PPLG 2",
  "XII PPLG 1",
  "XII PPLG 2",
];

/** Daftar kelas — publik (dipakai halaman registrasi sebelum login). */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("classes").withIndex("by_name").collect();
    return rows.map((c) => ({ id: c._id, name: c.name }));
  },
});

/** Tambah kelas baru (guru/admin). Nama unik, case-insensitive. */
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const me = await ctx.db.get(userId);
    if (!me || (me.role !== "teacher" && me.role !== "admin")) {
      throw new Error("Hanya guru/admin yang bisa menambah kelas.");
    }
    const clean = name.trim();
    if (!clean) throw new Error("Nama kelas tidak boleh kosong.");
    if (clean.length > 40) throw new Error("Nama kelas terlalu panjang.");

    const existing = await ctx.db
      .query("classes")
      .withIndex("by_name")
      .collect();
    if (existing.some((c) => c.name.toLowerCase() === clean.toLowerCase())) {
      throw new Error(`Kelas "${clean}" sudah ada.`);
    }
    await ctx.db.insert("classes", { name: clean, createdAt: Date.now() });
    return { ok: true };
  },
});

/** Hapus kelas (guru/admin). Siswa tetap menyimpan nama kelas lama di profil. */
export const remove = mutation({
  args: { id: v.id("classes") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const me = await ctx.db.get(userId);
    if (!me || (me.role !== "teacher" && me.role !== "admin")) {
      throw new Error("Hanya guru/admin yang bisa menghapus kelas.");
    }
    await ctx.db.delete(id);
    return { ok: true };
  },
});

/** Seed kelas default (idempotent) — dipanggil admin saat setup pertama. */
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const me = await ctx.db.get(userId);
    if (!me || (me.role !== "teacher" && me.role !== "admin")) {
      throw new Error("Hanya guru/admin yang bisa seed kelas.");
    }
    const existing = await ctx.db.query("classes").withIndex("by_name").collect();
    const have = new Set(existing.map((c) => c.name.toLowerCase()));
    let added = 0;
    for (const name of DEFAULT_CLASSES) {
      if (!have.has(name.toLowerCase())) {
        await ctx.db.insert("classes", { name, createdAt: Date.now() });
        added++;
      }
    }
    return { added };
  },
});
