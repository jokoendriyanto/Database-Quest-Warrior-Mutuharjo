import type { Database } from "../sql/engine";

/**
 * Case Universe 01 — SEKOLAH
 * Bagian TU butuh bantuanmu membereskan data. Ini database-nya.
 */
export const schoolDb: Database = {
  classes: {
    name: "classes",
    columns: ["id", "name", "grade", "major"],
    rows: [
      { id: 1, name: "X PPLG 1", grade: "X", major: "PPLG" },
      { id: 2, name: "X PPLG 2", grade: "X", major: "PPLG" },
      { id: 3, name: "XI PPLG 1", grade: "XI", major: "PPLG" },
      { id: 4, name: "XI PPLG 2", grade: "XI", major: "PPLG" },
    ],
  },
  students: {
    name: "students",
    columns: ["id", "name", "class_id", "email", "gender"],
    rows: [
      { id: 1, name: "Andi Pratama", class_id: 3, email: "andi@gmail.com", gender: "L" },
      { id: 2, name: "Siti Nurhaliza", class_id: 3, email: "siti.n@sch.id", gender: "P" },
      { id: 3, name: "Budi Santoso", class_id: 4, email: "budi123@gmail.com", gender: "L" },
      { id: 4, name: "Raka Wibowo", class_id: 1, email: "raka@sch.id", gender: "L" },
      { id: 5, name: "Dewi Lestari", class_id: 1, email: "dewi.lestari@gmail.com", gender: "P" },
      { id: 6, name: "Fahri Ahmad", class_id: 2, email: "fahri@gmail.com", gender: "L" },
      { id: 7, name: "Nadia Putri", class_id: 2, email: "nadia.putri@sch.id", gender: "P" },
      { id: 8, name: "Joko Susilo", class_id: 3, email: "joko.susilo@gmail.com", gender: "L" },
      { id: 9, name: "Maya Anggraini", class_id: 4, email: "maya@sch.id", gender: "P" },
      { id: 10, name: "Rizky Ramadhan", class_id: 4, email: "rizky.r@gmail.com", gender: "L" },
      { id: 11, name: "Intan Permata", class_id: 1, email: "intan.p@gmail.com", gender: "P" },
      { id: 12, name: "Yoga Prasetyo", class_id: 2, email: "yoga.prasetyo@sch.id", gender: "L" },
      { id: 13, name: "Tari Ayu", class_id: 1, email: "tari.ayu@sch.id", gender: "P" },
    ],
  },
  teachers: {
    name: "teachers",
    columns: ["id", "name", "subject"],
    rows: [
      { id: 1, name: "Pak Joko Endriyanto", subject: "Produktif RPL" },
      { id: 2, name: "Bu Ratna Sari", subject: "Matematika" },
      { id: 3, name: "Pak Dedi Kurniawan", subject: "Bahasa Indonesia" },
      { id: 4, name: "Bu Lia Amelia", subject: "Bahasa Inggris" },
    ],
  },
  subjects: {
    name: "subjects",
    columns: ["id", "name", "teacher_id"],
    rows: [
      { id: 1, name: "Basis Data", teacher_id: 1 },
      { id: 2, name: "Pemrograman Web", teacher_id: 1 },
      { id: 3, name: "Matematika", teacher_id: 2 },
      { id: 4, name: "Bahasa Indonesia", teacher_id: 3 },
      { id: 5, name: "Bahasa Inggris", teacher_id: 4 },
    ],
  },
  scores: {
    name: "scores",
    columns: ["id", "student_id", "subject_id", "score"],
    rows: [
      { id: 1, student_id: 1, subject_id: 1, score: 92 },
      { id: 2, student_id: 1, subject_id: 3, score: 85 },
      { id: 3, student_id: 2, subject_id: 1, score: 88 },
      { id: 4, student_id: 2, subject_id: 4, score: 90 },
      { id: 5, student_id: 3, subject_id: 1, score: 55 },
      { id: 6, student_id: 3, subject_id: 5, score: 70 },
      { id: 7, student_id: 4, subject_id: 1, score: 78 },
      { id: 8, student_id: 5, subject_id: 1, score: 95 },
      { id: 9, student_id: 5, subject_id: 3, score: 82 },
      { id: 10, student_id: 6, subject_id: 1, score: 66 },
      { id: 11, student_id: 7, subject_id: 1, score: 84 },
      { id: 12, student_id: 7, subject_id: 5, score: 79 },
      { id: 13, student_id: 8, subject_id: 1, score: 71 },
      { id: 14, student_id: 9, subject_id: 1, score: 89 },
      { id: 15, student_id: 10, subject_id: 2, score: 75 },
      { id: 16, student_id: 11, subject_id: 1, score: 93 },
      { id: 17, student_id: 12, subject_id: 1, score: 62 },
      { id: 18, student_id: 12, subject_id: 4, score: 77 },
    ],
  },
};

export const schoolTables = Object.values(schoolDb).map((t) => ({
  name: t.name,
  columns: t.columns,
  rowCount: t.rows.length,
}));

/**
 * Case Universe 02 — KANTIN
 * Bu Kantin penasaran: "Seblak itu beneran paling laku, atau cuma perasaan saya?"
 */
export const kantinDb: Database = {
  categories: {
    name: "categories",
    columns: ["id", "name"],
    rows: [
      { id: 1, name: "Makanan" },
      { id: 2, name: "Minuman" },
      { id: 3, name: "Snack" },
    ],
  },
  products: {
    name: "products",
    columns: ["id", "name", "category_id", "price", "stock", "sold"],
    rows: [
      { id: 1, name: "Seblak Kuah", category_id: 1, price: 8000, stock: 40, sold: 152 },
      { id: 2, name: "Nasi Goreng", category_id: 1, price: 10000, stock: 25, sold: 130 },
      { id: 3, name: "Mie Ayam", category_id: 1, price: 9000, stock: 30, sold: 118 },
      { id: 4, name: "Es Teh Manis", category_id: 2, price: 3000, stock: 80, sold: 210 },
      { id: 5, name: "Susu Kotak", category_id: 2, price: 5000, stock: 60, sold: 95 },
      { id: 6, name: "Kopi Sachet", category_id: 2, price: 2000, stock: 100, sold: 175 },
      { id: 7, name: "Cilok Bumbu", category_id: 3, price: 3000, stock: 50, sold: 140 },
      { id: 8, name: "Roti Bakar", category_id: 3, price: 7000, stock: 20, sold: 88 },
    ],
  },
  transactions: {
    name: "transactions",
    columns: ["id", "product_id", "buyer_name", "qty", "total"],
    rows: [
      { id: 1, product_id: 1, buyer_name: "Andi", qty: 1, total: 8000 },
      { id: 2, product_id: 4, buyer_name: "Andi", qty: 2, total: 6000 },
      { id: 3, product_id: 2, buyer_name: "Siti", qty: 1, total: 10000 },
      { id: 4, product_id: 6, buyer_name: "Budi", qty: 3, total: 6000 },
      { id: 5, product_id: 1, buyer_name: "Budi", qty: 2, total: 16000 },
      { id: 6, product_id: 7, buyer_name: "Dewi", qty: 1, total: 3000 },
      { id: 7, product_id: 4, buyer_name: "Dewi", qty: 1, total: 3000 },
      { id: 8, product_id: 3, buyer_name: "Fahri", qty: 1, total: 9000 },
      { id: 9, product_id: 5, buyer_name: "Nadia", qty: 2, total: 10000 },
      { id: 10, product_id: 8, buyer_name: "Joko", qty: 1, total: 7000 },
      { id: 11, product_id: 1, buyer_name: "Maya", qty: 1, total: 8000 },
      { id: 12, product_id: 6, buyer_name: "Rizky", qty: 2, total: 4000 },
      { id: 13, product_id: 2, buyer_name: "Intan", qty: 2, total: 20000 },
      { id: 14, product_id: 7, buyer_name: "Yoga", qty: 3, total: 9000 },
    ],
  },
};

export const kantinTables = Object.values(kantinDb).map((t) => ({
  name: t.name,
  columns: t.columns,
  rowCount: t.rows.length,
}));
