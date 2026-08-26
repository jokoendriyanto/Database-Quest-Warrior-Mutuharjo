import { kantinDb, schoolDb } from "./data/datasets";

/**
 * Kurikulum Database Quest Warrior: Mutuharjo
 * Tone konten: senior programmer ngajarin adik kelas — santai, singkat, tetap teknis.
 */

export type LessonBlock =
  | { type: "heading"; text: string }
  | { type: "text"; text: string }
  | { type: "code"; code: string; caption?: string }
  | { type: "callout"; text: string; tone: "info" | "warn" | "fun" }
  | { type: "analogy"; title: string; text: string }
  | { type: "buatApa"; text: string }
  | { type: "note"; text: string }
  | { type: "quiz"; question: string; options: string[]; answer: number; explain: string };

export interface Exercise {
  id: string;
  worldNum: number;
  title: string;
  instruction: string;
  difficulty: "easy" | "normal" | "hard" | "boss";
  starter: string;
  solution: string;
  hints: [string, string, string, string];
  xp: number;
  dataset: "school" | "kantin";
}

export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  blocks: LessonBlock[];
  exerciseIds: string[];
}

export interface World {
  num: number;
  slug: string;
  title: string;
  subtitle: string;
  emoji: string;
  color: string;
  lessons: Lesson[];
  comingSoon?: boolean;
}

/* ------------------------------ Exercises ------------------------------ */

const EX = (e: Exercise) => e;

export const EXERCISES: Exercise[] = [
  EX({
    id: "w3-select-all",
    worldNum: 3,
    title: "Panggil Semua Siswa",
    instruction:
      "Bagian TU butuh daftar lengkap siswa. Ambil SEMUA kolom dan semua baris dari tabel `students`.",
    difficulty: "easy",
    starter: "SELECT *\nFROM students;\n",
    solution: "SELECT * FROM students;",
    hints: [
      "Kamu cuma butuh dua kata kunci: SELECT dan FROM.",
      "Tanda `*` artinya 'semua kolom'.",
      "Strukturnya: SELECT * FROM nama_tabel;",
      "Query-nya persis begini: SELECT * FROM students;",
    ],
    xp: 50,
    dataset: "school",
  }),
  EX({
    id: "w3-select-cols",
    worldNum: 3,
    title: "Cuma Nama & Email",
    instruction:
      "Gak perlu semua data. Tampilkan hanya kolom `name` dan `email` dari tabel `students`.",
    difficulty: "easy",
    starter: "SELECT ...\nFROM students;\n",
    solution: "SELECT name, email FROM students;",
    hints: [
      "Setelah SELECT, tulis nama kolomnya dipisah koma.",
      "Urutannya: kolom yang mau ditampilkan, lalu FROM.",
      "Formatnya: SELECT kolom1, kolom2 FROM tabel;",
      "Jawabannya: SELECT name, email FROM students;",
    ],
    xp: 50,
    dataset: "school",
  }),
  EX({
    id: "w4-class-xi1",
    worldNum: 4,
    title: "Detektif Kelas XI PPLG 1",
    instruction:
      "Wali kelas XI PPLG 1 minta daftar siswanya. Di database ini, XI PPLG 1 punya `class_id = 3`. Filter tabel `students` untuk itu!",
    difficulty: "normal",
    starter: "SELECT *\nFROM students\nWHERE ...;\n",
    solution: "SELECT * FROM students WHERE class_id = 3;",
    hints: [
      "Pakai klausa WHERE buat menyaring baris.",
      "Perbandingannya pakai tanda sama dengan: class_id = 3.",
      "Struktur: SELECT * FROM students WHERE class_id = ...;",
      "Lengkapnya: SELECT * FROM students WHERE class_id = 3;",
    ],
    xp: 50,
    dataset: "school",
  }),
  EX({
    id: "w4-gmail",
    worldNum: 4,
    title: "Berburu Email Gmail",
    instruction:
      "TU curiga beberapa email siswa pakai akun pribadi. Cari semua siswa yang emailnya mengandung `gmail.com` (pakai LIKE).",
    difficulty: "normal",
    starter: "SELECT *\nFROM students\nWHERE email ...;\n",
    solution: "SELECT * FROM students WHERE email LIKE '%gmail.com';",
    hints: [
      "LIKE dipakai untuk pencarian pola pada string.",
      "Simbol `%` artinya 'apa saja' — jadi '%gmail.com' berarti diakhiri gmail.com.",
      "Strukturnya: WHERE email LIKE '%gmail.com';",
      "Lengkapnya: SELECT * FROM students WHERE email LIKE '%gmail.com';",
    ],
    xp: 50,
    dataset: "school",
  }),
  EX({
    id: "w4-score-between",
    worldNum: 4,
    title: "Nilai Kompeten",
    instruction:
      "Nilai 80 sampai 90 dianggap kompeten. Ambil semua baris dari `scores` yang nilainya BETWEEN 80 AND 90.",
    difficulty: "normal",
    starter: "SELECT *\nFROM scores\nWHERE score ...;\n",
    solution: "SELECT * FROM scores WHERE score BETWEEN 80 AND 90;",
    hints: [
      "BETWEEN itu inklusif — batas bawah dan atas ikut terambil.",
      "Polanya: BETWEEN nilai_awal AND nilai_akhir.",
      "WHERE score BETWEEN 80 AND 90 adalah intinya.",
      "Lengkapnya: SELECT * FROM scores WHERE score BETWEEN 80 AND 90;",
    ],
    xp: 50,
    dataset: "school",
  }),
  EX({
    id: "w5-top5",
    worldNum: 5,
    title: "Top 5 Juara Kelas",
    instruction:
      "Siapa aja yang punya nilai tertinggi? Urutkan `scores` dari nilai terbesar, lalu ambil 5 teratas saja.",
    difficulty: "normal",
    starter: "SELECT *\nFROM scores\nORDER BY ...\nLIMIT ...;\n",
    solution: "SELECT * FROM scores ORDER BY score DESC LIMIT 5;",
    hints: [
      "ORDER BY mengurutkan hasil; DESC berarti menurun (terbesar dulu).",
      "LIMIT membatasi jumlah baris yang ditampilkan.",
      "Gabungkan: ORDER BY score DESC lalu LIMIT 5.",
      "Lengkapnya: SELECT * FROM scores ORDER BY score DESC LIMIT 5;",
    ],
    xp: 50,
    dataset: "school",
  }),
  EX({
    id: "w5-distinct-class",
    worldNum: 5,
    title: "Daftar Kelas Unik",
    instruction:
      "Dari tabel `students`, tampilkan nilai `class_id` yang unik saja — tanpa duplikat. Pakai DISTINCT.",
    difficulty: "normal",
    starter: "SELECT DISTINCT ...\nFROM students;\n",
    solution: "SELECT DISTINCT class_id FROM students;",
    hints: [
      "DISTINCT diletakkan tepat setelah SELECT.",
      "Dia membuang baris hasil yang kembar.",
      "Hanya satu kolom yang dibutuhkan: class_id.",
      "Lengkapnya: SELECT DISTINCT class_id FROM students;",
    ],
    xp: 50,
    dataset: "school",
  }),
  EX({
    id: "w6-insert",
    worldNum: 6,
    title: "Terima Siswa Baru",
    instruction:
      "Siswa baru datang! Tambahkan ke `students`: id 14, nama 'Sinta Maharani', class_id 3, email 'sinta.m@sch.id', gender 'P'.",
    difficulty: "normal",
    starter: "INSERT INTO students (id, name, class_id, email, gender)\nVALUES (...);\n",
    solution:
      "INSERT INTO students (id, name, class_id, email, gender) VALUES (14, 'Sinta Maharani', 3, 'sinta.m@sch.id', 'P');",
    hints: [
      "INSERT INTO mendefinisikan tabel dan daftar kolom, VALUES berisi nilainya.",
      "String wajib pakai kutip tunggal: 'Sinta Maharani'.",
      "Angka (id 14, class_id 3) gak perlu kutip.",
      "Lengkapnya: INSERT INTO students (id, name, class_id, email, gender) VALUES (14, 'Sinta Maharani', 3, 'sinta.m@sch.id', 'P');",
    ],
    xp: 50,
    dataset: "school",
  }),
  EX({
    id: "w6-update-email",
    worldNum: 6,
    title: "Perbaiki Email Budi",
    instruction:
      "Email Budi Santoso (id 3) ternyata salah ketik. Ubah emailnya menjadi 'budi.santoso@sch.id'. Jangan lupa WHERE — kalau lupa, SEMUA email bisa keganti! 😱",
    difficulty: "hard",
    starter: "UPDATE students\nSET ...\nWHERE ...;\n",
    solution: "UPDATE students SET email = 'budi.santoso@sch.id' WHERE id = 3;",
    hints: [
      "Struktur UPDATE: UPDATE tabel SET kolom = nilai WHERE syarat;",
      "SET cuma menyebut kolom yang berubah: email.",
      "Syaratnya spesifik: id = 3.",
      "Lengkapnya: UPDATE students SET email = 'budi.santoso@sch.id' WHERE id = 3;",
    ],
    xp: 100,
    dataset: "school",
  }),
  EX({
    id: "w6-delete-low",
    worldNum: 6,
    title: "Bersihkan Nil Rusak",
    instruction:
      "Ada nilai rusak di `scores` — baris dengan score di bawah 60 harus dihapus. Ingat kebiasaan aman: SELECT dulu buat cek, baru DELETE.",
    difficulty: "hard",
    starter: "-- Cek dulu:\n-- SELECT * FROM scores WHERE score < 60;\n\nDELETE FROM scores\nWHERE ...;\n",
    solution: "DELETE FROM scores WHERE score < 60;",
    hints: [
      "DELETE FROM tidak pakai tanda bintang (*).",
      "Syaratnya: score < 60.",
      "Tanpa WHERE, seluruh isi tabel lenyap. Selalu tulis WHERE!",
      "Lengkapnya: DELETE FROM scores WHERE score < 60;",
    ],
    xp: 100,
    dataset: "school",
  }),
  EX({
    id: "w8-join-basic",
    worldNum: 8,
    title: "Satukan Siswa & Kelas",
    instruction:
      "Tampilkan nama siswa beserta nama kelasnya: kolom `students.name` dan `classes.name` (beri alias AS class_name). Gabungkan dengan INNER JOIN lewat `students.class_id = classes.id`.",
    difficulty: "hard",
    starter:
      "SELECT students.name, classes.name AS class_name\nFROM students\nINNER JOIN classes ON ...;\n",
    solution:
      "SELECT students.name, classes.name AS class_name FROM students INNER JOIN classes ON students.class_id = classes.id;",
    hints: [
      "Saat JOIN, sebutkan tabel asal tiap kolom: students.name, classes.name.",
      "Kondisi penggabungnya: ON students.class_id = classes.id.",
      "Alias dipakai supaya nama kolom hasilnya beda: AS class_name.",
      "Lengkapnya: SELECT students.name, classes.name AS class_name FROM students INNER JOIN classes ON students.class_id = classes.id;",
    ],
    xp: 100,
    dataset: "school",
  }),
  EX({
    id: "w8-left-join-null",
    worldNum: 8,
    title: "Siswa Tanpa Nilai",
    instruction:
      "Cari siswa yang BELUM punya nilai sama sekali. Pakai LEFT JOIN dari `students` ke `scores`, lalu WHERE scores.score IS NULL. Tampilkan hanya `students.name`.",
    difficulty: "boss",
    starter:
      "SELECT students.name\nFROM students\nLEFT JOIN scores ON ...\nWHERE ...;\n",
    solution:
      "SELECT students.name FROM students LEFT JOIN scores ON students.id = scores.student_id WHERE scores.score IS NULL;",
    hints: [
      "LEFT JOIN menjaga SEMUA baris kiri meski tak ada pasangan di kanan.",
      "Baris tanpa pasangan akan punya kolom kanan bernilai NULL.",
      "Syaratnya: WHERE scores.score IS NULL (bukan = NULL).",
      "Lengkapnya: SELECT students.name FROM students LEFT JOIN scores ON students.id = scores.student_id WHERE scores.score IS NULL;",
    ],
    xp: 150,
    dataset: "school",
  }),
  EX({
    id: "w9-count-per-class",
    worldNum: 9,
    title: "Hitung Siswa per Kelas",
    instruction:
      "Dari tabel `students`, hitung jumlah siswa tiap kelas. Tampilkan `class_id` dan COUNT(*) dengan alias `total`, dikelompokkan dengan GROUP BY class_id.",
    difficulty: "normal",
    starter: "SELECT class_id, COUNT(*) AS total\nFROM students\nGROUP BY ...;\n",
    solution: "SELECT class_id, COUNT(*) AS total FROM students GROUP BY class_id;",
    hints: [
      "COUNT(*) menghitung jumlah baris dalam tiap grup.",
      "GROUP BY class_id membuat satu grup per kelas.",
      "Alias diberikan lewat AS total.",
      "Lengkapnya: SELECT class_id, COUNT(*) AS total FROM students GROUP BY class_id;",
    ],
    xp: 50,
    dataset: "school",
  }),
  EX({
    id: "w9-avg-subject",
    worldNum: 9,
    title: "Rata-Rata per Mapel",
    instruction:
      "Hitung rata-rata nilai (`AVG(score)` alias `rata_rata`) dari tabel `scores`, dikelompokkan per `subject_id`.",
    difficulty: "normal",
    starter: "SELECT subject_id, AVG(score) AS rata_rata\nFROM scores\nGROUP BY ...;\n",
    solution: "SELECT subject_id, AVG(score) AS rata_rata FROM scores GROUP BY subject_id;",
    hints: [
      "AVG otomatis melewati nilai NULL.",
      "Kelompokkan berdasarkan mapel: GROUP BY subject_id.",
      "Alias-nya: AS rata_rata.",
      "Lengkapnya: SELECT subject_id, AVG(score) AS rata_rata FROM scores GROUP BY subject_id;",
    ],
    xp: 50,
    dataset: "school",
  }),
  EX({
    id: "w9-boss-kantin",
    worldNum: 9,
    title: "BOSS: Seblak Itu Beneran Laku?",
    instruction:
      "Bu Kantin butuh bukti. Dari database kantin, gabungkan `transactions` dengan `products` (ON transactions.product_id = products.id), hitung jumlah transaksi tiap produk (COUNT(*) AS total_transaksi), tampilkan `products.name`, urutkan dari yang terbanyak, ambil 3 besar.",
    difficulty: "boss",
    starter:
      "SELECT products.name, COUNT(*) AS total_transaksi\nFROM transactions\nINNER JOIN products ON ...\nGROUP BY ...\nORDER BY ...\nLIMIT 3;\n",
    solution:
      "SELECT products.name, COUNT(*) AS total_transaksi FROM transactions INNER JOIN products ON transactions.product_id = products.id GROUP BY products.name ORDER BY total_transaksi DESC LIMIT 3;",
    hints: [
      "Mulai dari pola dasarnya: JOIN dulu, baru agregasi.",
      "Grup berdasarkan nama produk: GROUP BY products.name.",
      "Urutkan pakai alias: ORDER BY total_transaksi DESC.",
      "Lengkapnya: SELECT products.name, COUNT(*) AS total_transaksi FROM transactions INNER JOIN products ON transactions.product_id = products.id GROUP BY products.name ORDER BY total_transaksi DESC LIMIT 3;",
    ],
    xp: 200,
    dataset: "kantin",
  }),

  /* ------------------------- W10 · Subquery Dungeon ---------------------- */
  EX({
    id: "w10-top-price",
    worldNum: 10,
    title: "Produk Termahal",
    instruction:
      "Subquery bisa nyari nilai ekstrem. Tapi di sandbox ini kita pakai jurus alternatif: urutkan `products` dari harga terbesar (ORDER BY price DESC), lalu ambil 1 baris saja. Tampilkan `name` dan `price`.",
    difficulty: "normal",
    starter: "SELECT name, price\nFROM products\nORDER BY ...\nLIMIT ...;\n",
    solution: "SELECT name, price FROM products ORDER BY price DESC LIMIT 1;",
    hints: [
      "Ini padanan dari: SELECT ... WHERE price = (SELECT MAX(price) ...).",
      "ORDER BY price DESC menaruh harga tertinggi di baris pertama.",
      "Cukup LIMIT 1 — satu produk termahal.",
      "Lengkapnya: SELECT name, price FROM products ORDER BY price DESC LIMIT 1;",
    ],
    xp: 100,
    dataset: "kantin",
  }),
  EX({
    id: "w10-cheapest-snack",
    worldNum: 10,
    title: "Snack Termurah",
    instruction:
      "Gabungkan dua jurus: filter dulu kategori snack (category_id = 3) dengan WHERE, lalu cari yang termurah lewat ORDER BY price ASC dan LIMIT 1. Tampilkan `name` dan `price`.",
    difficulty: "hard",
    starter: "SELECT name, price\nFROM products\nWHERE ...\nORDER BY ...\nLIMIT 1;\n",
    solution: "SELECT name, price FROM products WHERE category_id = 3 ORDER BY price ASC LIMIT 1;",
    hints: [
      "Ini padanan dari: WHERE price = (SELECT MIN(price) ... WHERE category_id = 3).",
      "WHERE dulu untuk mempersempit ke kategori snack.",
      "ASC berarti menaik — harga termurah muncul duluan.",
      "Lengkapnya: SELECT name, price FROM products WHERE category_id = 3 ORDER BY price ASC LIMIT 1;",
    ],
    xp: 100,
    dataset: "kantin",
  }),
  EX({
    id: "w10-max-subject",
    worldNum: 10,
    title: "Mapel Penyimpan Nilai Tertinggi",
    instruction:
      "Nilai tertinggi se-sekolah ada di mapel mana? Kelompokkan `scores` per `subject_id`, cari MAX(score) alias `tertinggi`, urutkan dari yang terbesar, ambil 1.",
    difficulty: "hard",
    starter: "SELECT subject_id, MAX(score) AS tertinggi\nFROM scores\nGROUP BY ...\nORDER BY ...\nLIMIT 1;\n",
    solution: "SELECT subject_id, MAX(score) AS tertinggi FROM scores GROUP BY subject_id ORDER BY tertinggi DESC LIMIT 1;",
    hints: [
      "Pola dasarnya: GROUP BY subject_id lalu MAX(score).",
      "Alias AS tertinggi bisa dipakai lagi di ORDER BY.",
      "Urutkan menurun: ORDER BY tertinggi DESC, lalu LIMIT 1.",
      "Lengkapnya: SELECT subject_id, MAX(score) AS tertinggi FROM scores GROUP BY subject_id ORDER BY tertinggi DESC LIMIT 1;",
    ],
    xp: 100,
    dataset: "school",
  }),

  /* ------------------------ W11 · Database Architect --------------------- */
  EX({
    id: "w11-catalog",
    worldNum: 11,
    title: "Katalog Kelas PPLG",
    instruction:
      "Sebelum mendesain schema, kamu harus lancar membaca data yang sudah ada. Dari `classes`, tampilkan kolom `name` dan `grade` untuk major 'PPLG', urutkan berdasarkan nama kelas.",
    difficulty: "normal",
    starter: "SELECT name, grade\nFROM classes\nWHERE ...\nORDER BY ...;\n",
    solution: "SELECT name, grade FROM classes WHERE major = 'PPLG' ORDER BY name ASC;",
    hints: [
      "Filter pakai WHERE major = 'PPLG' — ingat, string pakai kutip tunggal.",
      "ORDER BY name ASC menyusun kelas alfabetis.",
      "Kolom yang diminta cuma dua: name dan grade.",
      "Lengkapnya: SELECT name, grade FROM classes WHERE major = 'PPLG' ORDER BY name ASC;",
    ],
    xp: 50,
    dataset: "school",
  }),
  EX({
    id: "w11-insert-junction",
    worldNum: 11,
    title: "Isi Tabel Perantara",
    instruction:
      "Tabel `scores` adalah tabel perantara many-to-many antara students dan subjects. Tari Ayu (student_id 13) baru saja mengambil Pemrograman Web (subject_id 2) dengan nilai 85. Masukkan sebagai baris baru: id 19.",
    difficulty: "normal",
    starter: "INSERT INTO scores (id, student_id, subject_id, score)\nVALUES (...);\n",
    solution: "INSERT INTO scores (id, student_id, subject_id, score) VALUES (19, 13, 2, 85);",
    hints: [
      "Tabel perantara isinya cuma 'penunjuk': student_id dan subject_id adalah foreign key.",
      "Struktur: INSERT INTO scores (kolom...) VALUES (nilai...).",
      "Semua nilainya angka — tidak perlu kutip.",
      "Lengkapnya: INSERT INTO scores (id, student_id, subject_id, score) VALUES (19, 13, 2, 85);",
    ],
    xp: 100,
    dataset: "school",
  }),
  EX({
    id: "w11-count-class-join",
    worldNum: 11,
    title: "Kapasitas Kelas Terisi",
    instruction:
      "Wali kelas butuh rekap: nama kelas dan jumlah siswanya. JOIN `students` dengan `classes` (ON students.class_id = classes.id), tampilkan `classes.name` dan COUNT(*) alias `jumlah`, kelompokkan per nama kelas, urutkan alfabetis.",
    difficulty: "hard",
    starter: "SELECT classes.name, COUNT(*) AS jumlah\nFROM students\nINNER JOIN classes ON ...\nGROUP BY ...\nORDER BY ...;\n",
    solution: "SELECT classes.name, COUNT(*) AS jumlah FROM students INNER JOIN classes ON students.class_id = classes.id GROUP BY classes.name ORDER BY classes.name ASC;",
    hints: [
      "Kondisi JOIN-nya: ON students.class_id = classes.id.",
      "Kelompokkan berdasarkan kolom yang ditampilkan: GROUP BY classes.name.",
      "Urutkan alfabetis: ORDER BY classes.name ASC.",
      "Lengkapnya: SELECT classes.name, COUNT(*) AS jumlah FROM students INNER JOIN classes ON students.class_id = classes.id GROUP BY classes.name ORDER BY classes.name ASC;",
    ],
    xp: 150,
    dataset: "school",
  }),

  /* ------------------------- W12 · Normalization Lab --------------------- */
  EX({
    id: "w12-dup-buyers",
    worldNum: 12,
    title: "Deteksi Data Berulang",
    instruction:
      "Data pembeli yang berulang adalah gejala tabel belum ternormalisasi. Dari `transactions`, hitung berapa kali tiap `buyer_name` muncul (COUNT(*) alias `jumlah`), kelompokkan per buyer_name, urutkan dari yang terbanyak lalu nama alfabetis, ambil 3 teratas.",
    difficulty: "hard",
    starter: "SELECT buyer_name, COUNT(*) AS jumlah\nFROM transactions\nGROUP BY ...\nORDER BY ...\nLIMIT 3;\n",
    solution: "SELECT buyer_name, COUNT(*) AS jumlah FROM transactions GROUP BY buyer_name ORDER BY jumlah DESC, buyer_name ASC LIMIT 3;",
    hints: [
      "GROUP BY buyer_name membentuk satu grup per pembeli.",
      "ORDER BY bisa dua kolom: jumlah DESC dulu, baru buyer_name ASC sebagai pemecah seri.",
      "Pola dua kolom di ORDER BY: ORDER BY jumlah DESC, buyer_name ASC.",
      "Lengkapnya: SELECT buyer_name, COUNT(*) AS jumlah FROM transactions GROUP BY buyer_name ORDER BY jumlah DESC, buyer_name ASC LIMIT 3;",
    ],
    xp: 150,
    dataset: "kantin",
  }),
  EX({
    id: "w12-atomic-category",
    worldNum: 12,
    title: "Nilai Atom per Kategori",
    instruction:
      "1NF mensyaratkan nilai atom dan tanpa pengulangan grup. Latihan ringan: tampilkan daftar `category_id` unik yang punya produk di tabel `products`, urutkan menaik.",
    difficulty: "easy",
    starter: "SELECT DISTINCT ...\nFROM products\nORDER BY ...;\n",
    solution: "SELECT DISTINCT category_id FROM products ORDER BY category_id ASC;",
    hints: [
      "DISTINCT membuang duplikat — pas untuk daftar kategori unik.",
      "POSITION: DISTINCT ditulis tepat setelah SELECT.",
      "Urutkan: ORDER BY category_id ASC.",
      "Lengkapnya: SELECT DISTINCT category_id FROM products ORDER BY category_id ASC;",
    ],
    xp: 50,
    dataset: "kantin",
  }),

  /* ------------------------- W13 · Performance Lab ----------------------- */
  EX({
    id: "w13-select-needed",
    worldNum: 13,
    title: "Ambil yang Perlu Saja",
    instruction:
      "Query cepat dimulai dari kebiasaan: jangan SELECT * kalau cuma butuh dua kolom. Tampilkan `name` dan `price` produk yang harganya <= 3000, urutkan dari termurah (pemecah seri: nama alfabetis).",
    difficulty: "normal",
    starter: "SELECT name, price\nFROM products\nWHERE ...\nORDER BY ...;\n",
    solution: "SELECT name, price FROM products WHERE price <= 3000 ORDER BY price ASC, name ASC;",
    hints: [
      "Operator <= artinya 'kurang dari atau sama dengan'.",
      "ORDER BY dua kolom: price ASC dulu, lalu name ASC biar seri jelas.",
      "Tanpa SELECT * — cukup name dan price.",
      "Lengkapnya: SELECT name, price FROM products WHERE price <= 3000 ORDER BY price ASC, name ASC;",
    ],
    xp: 100,
    dataset: "kantin",
  }),
  EX({
    id: "w13-top-sold",
    worldNum: 13,
    title: "Scan Sepincung Punya",
    instruction:
      "LIMIT bukan cuma buat papan peringkat — dia memangkas kerja scan database. Ambil 1 produk paling laku: tampilkan `name` dan `sold` dari `products`, urutkan penjualan menurun.",
    difficulty: "easy",
    starter: "SELECT name, sold\nFROM products\nORDER BY ...\nLIMIT ...;\n",
    solution: "SELECT name, sold FROM products ORDER BY sold DESC LIMIT 1;",
    hints: [
      "Kolom sold menyimpan jumlah terjual.",
      "DESC = dari besar ke kecil — terlaris di posisi pertama.",
      "Cukup satu baris: LIMIT 1.",
      "Lengkapnya: SELECT name, sold FROM products ORDER BY sold DESC LIMIT 1;",
    ],
    xp: 50,
    dataset: "kantin",
  }),
  EX({
    id: "w13-low-stock",
    worldNum: 13,
    title: "Laporan Stok Kritis",
    instruction:
      "Restock cepat butuh query cepat. Dari `products`, ambil `name` dan `stock` yang stock-nya di bawah 30, urutkan dari yang paling kritis (paling kecil), pemecah seri nama alfabetis.",
    difficulty: "normal",
    starter: "SELECT name, stock\nFROM products\nWHERE ...\nORDER BY ...;\n",
    solution: "SELECT name, stock FROM products WHERE stock < 30 ORDER BY stock ASC, name ASC;",
    hints: [
      "Syaratnya: stock < 30.",
      "Paling kritis = stok paling kecil = ORDER BY stock ASC.",
      "Tambahkan name ASC sebagai pemecah seri.",
      "Lengkapnya: SELECT name, stock FROM products WHERE stock < 30 ORDER BY stock ASC, name ASC;",
    ],
    xp: 100,
    dataset: "kantin",
  }),

  /* --------------------------- W14 · Transaction ------------------------- */
  EX({
    id: "w14-safe-update",
    worldNum: 14,
    title: "Update Stok Aman",
    instruction:
      "Dalam transaction sungguhan, UPDATE stok selalu punya syarat yang pasti. Roti Bakar (id 8) baru dibeli — ubah stoknya menjadi tepat 18. Jangan lupa WHERE!",
    difficulty: "normal",
    starter: "UPDATE products\nSET ...\nWHERE ...;\n",
    solution: "UPDATE products SET stock = 18 WHERE id = 8;",
    hints: [
      "Struktur: UPDATE tabel SET kolom = nilai WHERE syarat.",
      "Syarat paling aman adalah primary key: WHERE id = 8.",
      "SET cuma satu kolom: stock.",
      "Lengkapnya: UPDATE products SET stock = 18 WHERE id = 8;",
    ],
    xp: 100,
    dataset: "kantin",
  }),
  EX({
    id: "w14-insert-tx",
    worldNum: 14,
    title: "Catat Transaksi Baru",
    instruction:
      "Setiap pembelian adalah satu baris yang harus konsisten. Sinta beli 2 Es Teh Manis (product_id 4) total 6000. Catat ke `transactions` sebagai id 15.",
    difficulty: "normal",
    starter: "INSERT INTO transactions (id, product_id, buyer_name, qty, total)\nVALUES (...);\n",
    solution: "INSERT INTO transactions (id, product_id, buyer_name, qty, total) VALUES (15, 4, 'Sinta', 2, 6000);",
    hints: [
      "Sebutkan semua kolom secara eksplisit — kebiasaan aman.",
      "String pakai kutip tunggal: 'Sinta'. Angka polos.",
      "Perhatikan urutan kolom sama dengan urutan VALUES.",
      "Lengkapnya: INSERT INTO transactions (id, product_id, buyer_name, qty, total) VALUES (15, 4, 'Sinta', 2, 6000);",
    ],
    xp: 100,
    dataset: "kantin",
  }),

  /* ----------------------------- W15 · Security -------------------------- */
  EX({
    id: "w15-gmail-audit",
    worldNum: 15,
    title: "Audit Email Pribadi",
    instruction:
      "Data pribadi sekolah sebaiknya di domain resmi. Dari `students`, audit siapa saja yang emailnya berakhiran @gmail.com — tampilkan `name` dan `email`, urutkan alfabetis.",
    difficulty: "normal",
    starter: "SELECT name, email\nFROM students\nWHERE ...\nORDER BY ...;\n",
    solution: "SELECT name, email FROM students WHERE email LIKE '%@gmail.com' ORDER BY name ASC;",
    hints: [
      "Pola akhiran pakai LIKE dengan % di depan: '%@gmail.com'.",
      "Urutkan alfabetis: ORDER BY name ASC.",
      "Dua kolom saja: name dan email.",
      "Lengkapnya: SELECT name, email FROM students WHERE email LIKE '%@gmail.com' ORDER BY name ASC;",
    ],
    xp: 100,
    dataset: "school",
  }),
  EX({
    id: "w15-min-columns",
    worldNum: 15,
    title: "Least Privilege: Kolom Minimal",
    instruction:
      "Prinsip keamanan: ambil data seminimal mungkin. Tampilkan hanya `name` dan `subject` semua guru dari tabel `teachers`, urutkan alfabetis — tanpa SELECT *.",
    difficulty: "easy",
    starter: "SELECT ...\nFROM teachers\nORDER BY ...;\n",
    solution: "SELECT name, subject FROM teachers ORDER BY name ASC;",
    hints: [
      "Ganti kebiasaan SELECT * dengan menyebut kolom eksplisit.",
      "Kolomnya: name dan subject.",
      "Urutkan: ORDER BY name ASC.",
      "Lengkapnya: SELECT name, subject FROM teachers ORDER BY name ASC;",
    ],
    xp: 50,
    dataset: "school",
  }),
];

export const EXERCISE_MAP = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return EXERCISE_MAP.get(id);
}

export function exerciseDataset(id: string) {
  const ex = EXERCISE_MAP.get(id);
  return ex?.dataset === "kantin" ? kantinDb : schoolDb;
}

/** Pool latihan untuk Battle Arena (tanpa boss). */
export function battlePool(): Exercise[] {
  return EXERCISES.filter((e) => e.difficulty === "easy" || e.difficulty === "normal");
}

/* -------------------------------- Worlds -------------------------------- */

function lesson(
  id: string,
  title: string,
  minutes: number,
  blocks: LessonBlock[],
  exerciseIds: string[] = [],
): Lesson {
  return { id, title, minutes, blocks, exerciseIds };
}

export const WORLDS: World[] = [
  {
    num: 1,
    slug: "database-basics",
    title: "Database Is Everywhere",
    subtitle: "Kenalan dulu: data, database, dan kenapa ini ada di mana-mana.",
    emoji: "🌍",
    color: "#a5b4fc",
    lessons: [
      lesson(
        "w1-l1",
        "Database Itu Apa Sih?",
        4,
        [
          { type: "heading", text: "Mulai dari yang paling sederhana 👀" },
          {
            type: "text",
            text: "Coba ingat-ingat: absensi kelas, nilai rapor, daftar barang kantin... semuanya itu DATA. Data adalah fakta yang dicatat — nama kamu, nilai ulanganmu, harga seblak hari ini.",
          },
          { type: "analogy", title: "Database = Lemari Arsip Sekolah 🗄️", text: "Bayangkan satu lemari arsip. Lemarinya ya database-nya. Tiap laci adalah satu tabel. Tiap formulir di dalam laci adalah satu baris. Tiap bagian yang diisi di formulir (nama, NIS, kelas) adalah satu kolom." },
          { type: "code", code: "DATABASE SEKOLAH\n├── students   → data siswa\n├── classes    → data kelas\n├── teachers   → data guru\n├── subjects   → data mapel\n└── scores     → data nilai", caption: "Contoh isi database sekolah di quest ini" },
          { type: "callout", text: "DBMS (Database Management System) itu program yang jadi penjaga lemari — contohnya MySQL. Kita bilang 'database' buat isinya, DBMS buat aplikasinya.", tone: "info" },
          { type: "quiz", question: "Di analogi lemari arsip, satu FORMULIR siswa mewakili...?", options: ["Satu database", "Satu tabel", "Satu baris", "Satu kolom"], answer: 2, explain: "Formulir = satu baris (record). Kolomnya adalah bagian-bagian form yang diisi." },
        ],
      ),
      lesson(
        "w1-l2",
        "Tabel, Baris, Kolom",
        4,
        [
          { type: "heading", text: "Bedah satu tabel 📋" },
          { type: "text", text: "Tabel itu cara paling gampang menyimpan sesuatu yang bentuknya seragam. Semua siswa punya nama, email, kelas — ya udah, kita bikin kolom untuk masing-masing." },
          { type: "code", code: "students\n| id | name           | class_id |\n|----|----------------|----------|\n| 1  | Andi Pratama   | 3        |\n| 2  | Siti Nurhaliza | 3        |", caption: "1 tabel bernama students, 2 baris, 3 kolom" },
          { type: "text", text: "Kolom `id` di atas penting banget: dia adalah identitas unik tiap baris. Namanya Primary Key — nanti kita bedah tuntas di World Relationship." },
          { type: "quiz", question: "Kalau ada 500 siswa di sekolah, tabel students idealnya punya berapa BARIS?", options: ["500", "3", "Tergantung jumlah kolom", "1"], answer: 0, explain: "Satu baris = satu siswa. Kolom menentukan lebar tabel, jumlah data menentukan tingginya." },
        ],
      ),
      lesson("w1-l3", "Kenalan Sama MySQL", 3, [
        { type: "heading", text: "Bahasa yang bakal kamu kuasai 🗣️" },
        { type: "text", text: "MySQL adalah DBMS paling populer di dunia — WordPress, toko online, sampai sistem sekolah banyak yang pakai. Untuk ngobrol sama MySQL, kita pakai bahasa SQL (Structured Query Language)." },
        { type: "code", code: "SELECT 'halo database';", caption: "SQL pertamamu — nanti langsung kamu jalankan sendiri" },
        { type: "callout", text: "Di Database Quest Warrior kamu praktik langsung di SQL sandbox yang aman — salah ketik? Tenang, errornya malah jadi bahan belajar. 🔥", tone: "fun" },
      ]),
    ],
  },
  {
    num: 2,
    slug: "table-builder",
    title: "Table Builder",
    subtitle: "Membuat database, membuat tabel, memilih tipe data.",
    emoji: "🧱",
    color: "#86efac",
    lessons: [
      lesson("w2-l1", "CREATE DATABASE & CREATE TABLE", 5, [
        { type: "heading", text: "Bangun rumahnya dulu 🏗️" },
        { type: "text", text: "Sebelum simpan data, kita siapkan tempatnya. CREATE DATABASE membuat 'lemari'-nya, CREATE TABLE membuat 'lacinya'." },
        { type: "code", code: "CREATE DATABASE sekolah;\n\nCREATE TABLE students (\n  id INT PRIMARY KEY,\n  name VARCHAR(100),\n  email VARCHAR(150)\n);", caption: "Tabel dimulai dari nama kolom + tipe data" },
        { type: "callout", text: "PRIMARY KEY di kolom id artinya: setiap baris WAJIB punya id yang beda. Duplikat? MySQL bakal marah. Itu fitur, bukan bug. 😄", tone: "info" },
        { type: "quiz", question: "Apa fungsi VARCHAR(100)?", options: ["Angka maksimal 100", "Teks sampai 100 karakter", "Tanggal", "Nilai benar/salah"], answer: 1, explain: "VARCHAR(n) = teks variabel dengan panjang maksimal n karakter." },
      ]),
      lesson("w2-l2", "Memilih Tipe Data", 5, [
        { type: "heading", text: "Jangan asal comot tipe data 🎯" },
        { type: "text", text: "Tipe data itu seperti wadah: INT untuk angka bulat, DECIMAL untuk uang, DATE untuk tanggal, BOOLEAN untuk benar/salah, TEXT untuk tulisan panjang." },
        { type: "code", code: "price   DECIMAL(10,2)   -- uang: 8000.00\nstock   INT             -- 42 buah\ncreated DATE            -- '2026-08-25'\nis_active BOOLEAN       -- TRUE / FALSE", caption: "Tipe data umum dan contoh isinya" },
        { type: "callout", text: "Salah tipe data = data berantakan di masa depan. Simpan uang di INT? Uang koma ilang. Simpan tanggal di VARCHAR? Gak bisa diurutin dengan bener.", tone: "warn" },
        { type: "quiz", question: "Untuk menyimpan harga produk dengan sen, tipe data paling tepat adalah...", options: ["INT", "DECIMAL", "DATE", "BOOLEAN"], answer: 1, explain: "DECIMAL menjaga presisi angka pecahan — cocok untuk uang." },
      ]),
    ],
  },
  {
    num: 3,
    slug: "select-adventure",
    title: "SELECT Adventure",
    subtitle: "Ambil data pertamamu dari database sekolah.",
    emoji: "🚀",
    color: "#fcd34d",
    lessons: [
      lesson(
        "w3-l1",
        "Query Pertamamu",
        5,
        [
          { type: "heading", text: "Kenalan sama SELECT 👀" },
          {
            type: "buatApa",
            text: "SELECT dipakai setiap kali kamu butuh MELIHAT data — laporan, pencarian, dashboard. Nggak ada SELECT, nggak ada yang bisa dibaca.",
          },
          { type: "text", text: "Database sekolah bisa punya ribuan data siswa. Masa kita buka satu-satu? Bisa lulus duluan sebelum selesai. 😭 Nah, SELECT tugasnya mengambil data yang kita butuhkan." },
          { type: "code", code: "SELECT * FROM students;", caption: "* dibaca 'semua kolom'" },
          { type: "text", text: "Bacanya: SELECT → ambil, * → semua kolom, FROM → dari, students → tabel students. Artinya: 'Ambil semua data dari tabel students.'" },
          { type: "callout", text: "Sekarang giliran kamu — buka latihan di bawah dan jalankan query pertamamu!", tone: "fun" },
        ],
        ["w3-select-all"],
      ),
      lesson("w3-l2", "Pilih Kolom yang Penting", 4, [
        { type: "heading", text: "Nggak semua data perlu ditampilkan ✂️" },
        { type: "text", text: "SELECT * itu enak buat eksplorasi, tapi di aplikasi sungguhan kita jarang menampilkan semuanya. Mau daftar kontak? Cukup name dan email." },
        { type: "code", code: "SELECT name, email\nFROM students;", caption: "Kolom dipisah koma, urutan bebas" },
        { type: "text", text: "Hasilnya tabel baru yang cuma berisi dua kolom itu. Rapi, ringan, jelas." },
      ], ["w3-select-cols"]),
    ],
  },
  {
    num: 4,
    slug: "data-detective",
    title: "Data Detective",
    subtitle: "WHERE dan teman-temannya: filter data seperti detektif.",
    emoji: "🕵️",
    color: "#fda4af",
    lessons: [
      lesson(
        "w4-l1",
        "The Power of WHERE",
        6,
        [
        { type: "heading", text: "Filter itu kekuatan super 🔍" },
        {
          type: "buatApa",
          text: "WHERE dipakai saat pertanyaannya spesifik: 'siswa XI PPLG 1 saja', 'nilai di atas 80 saja'. Tanpa WHERE, kamu selalu dapat SEMUA data — dan itu bukan jawaban.",
        },
        { type: "text", text: "Ambil semua data itu gampang. Seni sebenarnya adalah ambil SEBAGIAN data yang relevan. Di sinilah WHERE masuk." },
          { type: "code", code: "SELECT * FROM students\nWHERE class_id = 3;", caption: "Hanya siswa dengan class_id 3 (XI PPLG 1)" },
          { type: "text", text: "Operator pembanding yang tersedia: = != > < >= <=. Dan bisa digabung: AND (dua-duanya harus benar), OR (salah satu cukup)." },
          { type: "callout", text: "Satu tanda '=' sudah berarti 'sama dengan' di SQL. Bukan '==', bukan ':='. Santai aja. 😌", tone: "info" },
        ],
        ["w4-class-xi1"],
      ),
      lesson("w4-l2", "LIKE, IN, BETWEEN", 6, [
        { type: "heading", text: "Tiga jurus filter lanjutan 🥋" },
        { type: "text", text: "Kadang syaratnya bukan sekadar '='. Mau cari email yang mengandung kata tertentu? Pakai LIKE dengan wildcard % (artinya 'apa saja')." },
        { type: "code", code: "WHERE email LIKE '%gmail.com'   -- diakhiri gmail.com\nWHERE class_id IN (1, 2)         -- salah satu dari daftar\nWHERE score BETWEEN 80 AND 90    -- rentang, inklusif", caption: "Tiga jurus, tiga situasi berbeda" },
        { type: "callout", text: "'%gmail%' vs '%gmail.com' — posisi % menentukan di mana 'apa saja' boleh muncul. Detektif teliti itu keren. 🕵️", tone: "fun" },
      ], ["w4-gmail", "w4-score-between"]),
    ],
  },
  {
    num: 5,
    slug: "sort-it",
    title: "Sort It Out",
    subtitle: "ORDER BY, LIMIT, DISTINCT — rapikan dan pangkas hasil.",
    emoji: "🪄",
    color: "#c4b5fd",
    lessons: [
      lesson("w5-l1", "ORDER BY & LIMIT", 5, [
        { type: "heading", text: "Juara kelas itu cuma soal urutan 🏆" },
        { type: "text", text: "Data mentah itu acak-acakan. ORDER BY menyusunnya; ASC menaik (default), DESC menurun. LIMIT memangkas hasil — 'kasih aku 5 teratas aja'." },
        { type: "code", code: "SELECT * FROM scores\nORDER BY score DESC\nLIMIT 5;", caption: "5 nilai tertinggi, terurut dari juara" },
        { type: "callout", text: "Perhatikan urutan penulisannya: WHERE dulu (kalau ada), baru ORDER BY, paling akhir LIMIT.", tone: "info" },
      ], ["w5-top5"]),
      lesson("w5-l2", "DISTINCT", 4, [
        { type: "heading", text: "Buang yang kembar 👯" },
        { type: "text", text: "Mau tahu kelas apa saja yang ada tanpa melihat daftar siswa berulang? DISTINCT membuang hasil duplikat." },
        { type: "code", code: "SELECT DISTINCT class_id FROM students;" },
      ], ["w5-distinct-class"]),
    ],
  },
  {
    num: 6,
    slug: "crud-warrior",
    title: "CRUD Warrior",
    subtitle: "INSERT, UPDATE, DELETE — kuasainya, plus kebiasaan amannya.",
    emoji: "⚔️",
    color: "#fdba74",
    lessons: [
      lesson("w6-l1", "INSERT: Menambah Data", 5, [
        { type: "heading", text: "Siswa baru datang! 🎒" },
        { type: "text", text: "Menambah data = INSERT INTO. Sebutkan kolomnya, isi VALUES-nya. String pakai kutip tunggal, angka polos." },
        { type: "code", code: "INSERT INTO students (name, class_id, email, gender)\nVALUES ('Sinta Maharani', 3, 'sinta.m@sch.id', 'P');" },
        { type: "callout", text: "Sebutkan kolom secara eksplisit — lebih aman daripada mengandalkan urutan kolom tabel.", tone: "info" },
      ], ["w6-insert"]),
      lesson("w6-l2", "UPDATE & DELETE (Aman!) ", 6, [
        { type: "heading", text: "Kekuatan besar, tanggung jawab besar 🦸" },
        { type: "text", text: "UPDATE mengubah, DELETE menghapus. Keduanya punya musib klasik: LUPA WHERE. Tanpa WHERE, semua baris kena." },
        { type: "analogy", title: "Kebiasaan Emas 💡", text: "Sebelum UPDATE/DELETE, jalankan SELECT dengan WHERE yang sama. Lihat baris mana yang akan kena. Sudah yakin? Baru eksekusi. Ini kebiasaan programmer profesional, bukan opsional." },
        { type: "code", code: "-- 1. Cek dulu\nSELECT * FROM students WHERE id = 3;\n-- 2. Baru ubah\nUPDATE students SET email = 'baru@sch.id' WHERE id = 3;" },
      ], ["w6-update-email", "w6-delete-low"]),
    ],
  },
  {
    num: 7,
    slug: "relationship",
    title: "Relationship",
    subtitle: "Primary Key, Foreign Key, dan relasi antar tabel.",
    emoji: "🔗",
    color: "#93c5fd",
    lessons: [
      lesson("w7-l1", "Primary & Foreign Key", 6, [
        { type: "heading", text: "ID kartu pelajar 🪪" },
        { type: "text", text: "Primary Key (PK) adalah identitas unik sebuah baris — seperti NIS untuk siswa. Foreign Key (FK) adalah kolom yang MENUNJUK ke PK tabel lain — seperti kolom class_id di tabel students yang menunjuk ke classes.id." },
        { type: "code", code: "students.class_id  ──menunjuk──▶  classes.id\n(Foreign Key)                      (Primary Key)" },
        { type: "quiz", question: "Di tabel scores, kolom student_id berperan sebagai...", options: ["Primary Key", "Foreign Key", "Index", "View"], answer: 1, explain: "student_id menunjuk ke students.id — itulah definisi Foreign Key." },
      ]),
      lesson("w7-l2", "Jenis-jenis Relasi", 6, [
        { type: "heading", text: "One-to-One, One-to-Many, Many-to-Many 💞" },
        { type: "text", text: "One-to-one: satu wajib punya SATU profil (users ↔ profiles). One-to-many: satu kelas punya BANYAK siswa. Many-to-many: siswa mengambil banyak mapel, mapel diambil banyak siswa — dijembatani tabel perantara seperti scores." },
        { type: "callout", text: "Relasi many-to-many SELALU butuh tabel perantara. Kalau nemu desain tanpa itu, biasanya ada bau. 👃", tone: "fun" },
      ]),
    ],
  },
  {
    num: 8,
    slug: "join-battle",
    title: "JOIN Battle",
    subtitle: "INNER JOIN, LEFT JOIN — gabungkan tabel seperti pro.",
    emoji: "🤝",
    color: "#67e8f9",
    lessons: [
      lesson("w8-l1", "INNER JOIN", 7, [
        { type: "heading", text: "Dua tabel jadi satu 🤝" },
        {
          type: "buatApa",
          text: "JOIN dipakai saat data yang kita butuhkan tersebar di beberapa tabel — nama siswa di students, nama kelasnya di classes. Satu query, satu jawaban utuh.",
        },
        { type: "text", text: "Data sering tersebar di beberapa tabel (itu bagus!). JOIN menyatukannya saat dibutuhkan. INNER JOIN hanya mengambil baris yang PUNYA pasangan di kedua sisi." },
        { type: "code", code: "SELECT students.name, classes.name AS class_name\nFROM students\nINNER JOIN classes\n  ON students.class_id = classes.id;" },
        { type: "callout", text: "Saat dua tabel punya kolom bernama sama (misal 'name'), kasih alias AS biar hasilnya jelas.", tone: "info" },
      ], ["w8-join-basic"]),
      lesson("w8-l2", "LEFT JOIN & NULL", 7, [
        { type: "heading", text: "Yang penting kiri tetap ada ⬅️" },
        { type: "text", text: "LEFT JOIN menjaga SEMUA baris tabel kiri, meski di kanan tidak ada pasangan — kolom kanannya jadi NULL. Jurus favorit untuk mencari 'data yang TIDAK punya relasi'." },
        { type: "code", code: "SELECT students.name\nFROM students\nLEFT JOIN scores ON students.id = scores.student_id\nWHERE scores.score IS NULL;" },
      ], ["w8-left-join-null"]),
    ],
  },
  {
    num: 9,
    slug: "aggregate-arena",
    title: "Aggregate Arena",
    subtitle: "COUNT, SUM, AVG, GROUP BY — berpikir seperti data analyst.",
    emoji: "📊",
    color: "#f9a8d4",
    lessons: [
      lesson("w9-l1", "COUNT & GROUP BY", 7, [
        { type: "heading", text: "Dari barisan baris ke ringkasan 📊" },
        {
          type: "buatApa",
          text: "COUNT & GROUP BY dipakai untuk menjawab pertanyaan manajerial: 'berapa siswa per kelas?', 'produk apa yang paling laku?'. Data mentah jadi keputusan.",
        },
        { type: "text", text: "Agregasi mengubah banyak baris jadi satu angka ringkasan. COUNT menghitung, GROUP BY membentuk kelompoknya — satu baris hasil per grup." },
        {
          type: "note",
          text: "SELECT * oke untuk latihan. Untuk production, ambil kolom yang memang dibutuhkan — lebih cepat dan hasilnya gampang dibaca.",
        },
        { type: "code", code: "SELECT class_id, COUNT(*) AS total\nFROM students\nGROUP BY class_id;" },
      ], ["w9-count-per-class"]),
      lesson("w9-l2", "SUM, AVG, MIN, MAX", 6, [
        { type: "heading", text: "Statistik instan 🧮" },
        { type: "text", text: "SUM menjumlah, AVG merata-ratakan, MIN/MAX mencari ekstrem. Semua bekerja per grup kalau ada GROUP BY." },
        { type: "code", code: "SELECT subject_id,\n       AVG(score) AS rata_rata,\n       MAX(score) AS tertinggi\nFROM scores\nGROUP BY subject_id;" },
      ], ["w9-avg-subject"]),
      lesson("w9-l3", "Case Kantin: Boss Challenge", 8, [
        { type: "heading", text: "Bu Kantin butuh jawaban 🍜" },
        { type: "analogy", title: "Pertanyaan Bu Kantin", text: "\"Seblak itu beneran paling laku, atau cuma perasaan saya?\" — jawab dengan data: gabungkan transaksi dengan produk, hitung transaksi per produk, ambil 3 besar. Ini kombinasi semua skill kamu sejauh ini!" },
        { type: "callout", text: "Ini BOSS challenge — XP-nya besar karena butuh JOIN + GROUP BY + ORDER BY + LIMIT sekaligus. Kamu siap. 💪", tone: "warn" },
      ], ["w9-boss-kantin"]),
    ],
  },
  {
    num: 10,
    slug: "subquery-dungeon",
    title: "Subquery Dungeon",
    subtitle: "Query di dalam query — dan cara klasik menggantinya dengan JOIN.",
    emoji: "🏰",
    color: "#d8b4fe",
    lessons: [
      lesson(
        "w10-l1",
        "Apa Itu Subquery?",
        5,
        [
          { type: "heading", text: "Query bersarang 🪆" },
          { type: "text", text: "Kadang satu query aja nggak cukup. Contoh: 'tampilkan produk dengan harga di atas rata-rata'. Untuk tahu rata-ratanya, kamu harus query dulu — baru pakai hasilnya buat filter. Dua langkah dalam satu perintah = subquery." },
          { type: "code", code: "SELECT name, price\nFROM products\nWHERE price > (SELECT AVG(price) FROM products);", caption: "Subquery di dalam tanda kurung jalan duluan, hasilnya dipakai WHERE luar" },
          { type: "analogy", title: "Subquery = Catatan Kecil di Ujung Pensil ✏️", text: "Kamu mau beli HP di bawah rata-rata harga. Sebelum ke toko, kamu catat dulu angka rata-ratanya di ujung pensil. Catatan itu = subquery: dihitung dulu, dipakai kemudian." },
          { type: "quiz", question: "Di query dengan subquery, bagian mana yang dieksekusi lebih dulu?", options: ["Query terluar", "Query di dalam kurung", "Keduanya bersamaan", "Tergantung urutan penulisan"], answer: 1, explain: "Subquery dievaluasi dulu, lalu hasilnya jadi input untuk query luar." },
        ],
      ),
      lesson(
        "w10-l2",
        "Subquery vs JOIN",
        6,
        [
          { type: "heading", text: "Dua jalan ke tujuan yang sama 🛤️" },
          { type: "text", text: "Banyak pertanyaan yang bisa dijawab dengan subquery ATAU dengan JOIN. 'Siswa yang punya nilai' bisa ditulis dengan subquery WHERE id IN (...), tapi versi JOIN-nya lebih cepat dan lebih umum dipakai di production." },
          { type: "code", code: "-- Versi subquery\nSELECT name FROM students\nWHERE id IN (SELECT student_id FROM scores);\n\n-- Versi JOIN (hasil sama, lebih efisien)\nSELECT DISTINCT students.name\nFROM students\nINNER JOIN scores ON students.id = scores.student_id;", caption: "Dua gaya, satu jawaban" },
          { type: "callout", text: "Di SQL sandbox quest ini, latihan memakai versi JOIN — selain didukung penuh, ini kebiasaan baik yang langsung kepakai kerja nanti.", tone: "info" },
        ],
        ["w10-top-price", "w10-cheapest-snack"],
      ),
      lesson(
        "w10-l3",
        "Pola Ekstrem per Grup",
        5,
        [
          { type: "heading", text: "Cari si ter-... 🏆" },
          { type: "text", text: "Pertanyaan klasik subquery: 'produk termahal', 'nilai tertinggi'. Polanya: ORDER BY kolom yang diukur, arahkan ASC/DESC, ambil paling atas dengan LIMIT 1." },
          { type: "code", code: "SELECT name, price\nFROM products\nORDER BY price DESC\nLIMIT 1;", caption: "Produk termahal — tanpa subquery pun bisa" },
          { type: "quiz", question: "Untuk mendapat NILAI TERENDAH, arah ORDER BY yang tepat adalah...", options: ["DESC", "ASC", "LIMIT 0", "GROUP BY"], answer: 1, explain: "ASC mengurutkan dari kecil ke besar, jadi baris pertama adalah yang terkecil." },
        ],
        ["w10-max-subject"],
      ),
    ],
  },
  {
    num: 11,
    slug: "db-architect",
    title: "Database Architect",
    subtitle: "Entity, attribute, ERD, dan rancang schema pertamamu.",
    emoji: "🏛️",
    color: "#fca5a5",
    lessons: [
      lesson(
        "w11-l1",
        "Entity & Attribute",
        5,
        [
          { type: "heading", text: "Berpikir seperti perancang 📐" },
          { type: "buatApa", text: "Sebelum bikin aplikasi perpustakaan, kelas online, atau kasir — architect menentukan: data apa saja yang disimpan, dan bagaimana tabelnya saling terhubung. Ini fondasi; salah di sini, berantakan di atasnya." },
          { type: "text", text: "ENTITY adalah 'benda' yang datanya penting: Siswa, Produk, Transaksi. ATTRIBUTE adalah detail yang dicatat: nama, harga, stok. Di database nyata: entity → tabel, attribute → kolom, satu kejadian entity → baris." },
          { type: "code", code: "ENTITY: Produk 🍜\n├── id          (PK)\n├── name\n├── category_id (FK → categories.id)\n├── price\n├── stock\n└── sold", caption: "Satu entity dari database kantin" },
          { type: "quiz", question: "Dalam perancangan database, 'Siswa' yang datanya perlu disimpan paling tepat disebut...", options: ["Attribute", "Entity", "Record", "Index"], answer: 1, explain: "Siswa adalah entity — benda yang datanya disimpan. Nama/NIS adalah attribute-nya." },
        ],
      ),
      lesson(
        "w11-l2",
        "Primary Key & Foreign Key",
        6,
        [
          { type: "heading", text: "Penghubung antar tabel 🔗" },
          { type: "text", text: "PRIMARY KEY (PK): identitas unik tiap baris — tidak boleh kembar, tidak boleh kosong. FOREIGN KEY (FK): kolom yang menunjuk PK tabel lain. Dari sinilah RELATIONSHIP lahir." },
          { type: "code", code: "students.class_id  →  classes.id\n     (FK)                    (PK)\n\nArtinya: tiap siswa 'menunjuk' satu kelas.", caption: "Relasi students → classes" },
          { type: "analogy", title: "PK = NIS, FK = Kolom 'Kelas' di Form Siswa 🪪", text: "NIS tidak boleh kembar — itu PK. Sedangkan kolom kelas di formulir siswa tidak berisi data kelas lengkap, cuma menunjuk ke data kelas — itu FK." },
          { type: "quiz", question: "Kolom `transactions.product_id` menunjuk ke `products.id`. Nama perannya?", options: ["Primary Key", "Foreign Key", "Index", "Alias"], answer: 1, explain: "Kolom yang menunjuk PK tabel lain disebut foreign key." },
        ],
        ["w11-count-class-join"],
      ),
      lesson(
        "w11-l3",
        "Membaca ERD & Relasi",
        6,
        [
          { type: "heading", text: "ERD: peta database 🗺️" },
          { type: "text", text: "ERD (Entity Relationship Diagram) menggambarkan entity sebagai kotak dan relasi sebagai garis. Tiga bentuk relasi: 1:1 (satu-satu), 1:N (satu ke banyak), N:M (banyak ke banyak)." },
          { type: "code", code: "classes 1 ──── N students        (satu kelas: banyak siswa)\nstudents 1 ── N scores           (satu siswa: banyak nilai)\nstudents N ── M subjects         (lewat tabel perantara!)\n                 │\n                 └── tabel perantara menyimpan pasangan\n                     student_id + subject_id", caption: "Relasi di database sekolah" },
          { type: "callout", text: "Relasi N:M selalu butuh tabel perantara (junction table). Di quest ini tabel perantaranya kamu isi sendiri di latihan bawah — rasakan bedanya.", tone: "info" },
        ],
        ["w11-catalog", "w11-insert-junction"],
      ),
    ],
  },
  {
    num: 12,
    slug: "normalization-lab",
    title: "Normalization Lab",
    subtitle: "UNF, 1NF, 2NF, 3NF — obat data berantakan.",
    emoji: "🧪",
    color: "#bef264",
    lessons: [
      lesson(
        "w12-l1",
        "Data Berantakan Itu Mahal",
        5,
        [
          { type: "heading", text: "Kenapa data harus rapi 🧹" },
          { type: "text", text: "Bayangkan satu tabel raksasa: data siswa, nama kelas, dan wali kelas dijejalkan jadi satu. Nama kelas ditulis berulang ratusan kali. Kalau nama kelas salah ketik di satu baris? Data kamu kontradiksi. Inilah masalah yang dijawab NORMALIZATION." },
          { type: "code", code: "-- Tidak dinormalisasi (UNF)\n| siswa  | kelas     | wali kelas        |\n| Andi   | XI PPLG 1 | Pak Joko          |\n| Siti   | XI PPLG 1 | Pak Joko          |  ← berulang!\n\n-- Dinormalisasi\nclasses(id, name, homeroom_teacher)\nstudents(id, name, class_id → classes.id)", caption: "Satu fakta disimpan sekali" },
          { type: "analogy", title: "Normalization = Resep yang Dirapikan 📖", text: "Resep masakan yang baik tidak menulis 'garam' lalu menjelaskan apa itu garam di tiap langkah. Dijelaskan sekali di bagian bahan, langkah-langkah cuma menyebut namanya. Database rapi bekerja sama: satu fakta, satu tempat." },
          { type: "quiz", question: "Tujuan utama normalization adalah...", options: ["Mempercepat ketik", "Menghilangkan duplikasi & inkonsistensi data", "Menambah tabel sebanyak mungkin", "Menghapus semua relasi"], answer: 1, explain: "Inti normalization: tiap fakta disimpan tepat satu kali, di tempat yang tepat." },
        ],
      ),
      lesson(
        "w12-l2",
        "1NF: Nilai Atom",
        5,
        [
          { type: "heading", text: "Satu sel, satu nilai ⚛️" },
          { type: "text", text: "First Normal Form (1NF): tiap sel hanya berisi SATU nilai atom — tidak ada daftar di dalam satu sel. 'hobi: coding, futsal' dalam satu sel melanggar 1NF, karena susah dicari, dihitung, dan di-update." },
          { type: "code", code: "-- Melanggar 1NF\n| produk | kategori          |\n| Seblak | makanan, snack    |\n\n-- Memenuhi 1NF\n| produk | kategori |\n| Seblak | makanan  |", caption: "Pecah jadi nilai atom" },
          { type: "text", text: "Di SQL, kita cek 'keatom-an' data dengan SELECT DISTINCT — kalau hasilnya pendek dan bersih, berarti datanya sudah tersimpan sebagai nilai tunggal per baris." },
        ],
        ["w12-atomic-category"],
      ),
      lesson(
        "w12-l3",
        "2NF & 3NF: Deteksi Duplikat",
        6,
        [
          { type: "heading", text: "Naik level kebersihan 🧼" },
          { type: "text", text: "2NF: semua kolom non-kunci bergantung penuh pada seluruh primary key (relevan untuk PK gabungan). 3NF: kolom non-kunci tidak bergantung pada kolom non-kunci lain. Gejala pelanggarannya sama: data berulang yang seharusnya tidak perlu." },
          { type: "code", code: "-- Deteksi duplikasi: kelompokkan, hitung, lihat yang > 1\nSELECT buyer_name, COUNT(*) AS jumlah\nFROM transactions\nGROUP BY buyer_name\nORDER BY jumlah DESC;", caption: "Tekanan GROUP BY untuk menemukan pengulangan" },
          { type: "callout", text: "Duplikat bukan selalu salah — pembeli bisa belanja dua kali. Tapi duplikat pada data yang seharusnya unik (email, NIS, username) adalah alarm schema. Belajar membedakan keduanya = skill architect. 🕵️", tone: "warn" },
        ],
        ["w12-dup-buyers"],
      ),
    ],
  },
  {
    num: 13,
    slug: "performance-lab",
    title: "Performance Lab",
    subtitle: "Index, LIMIT, dan query yang tidak buang-buang kerja.",
    emoji: "⚡",
    color: "#fde047",
    lessons: [
      lesson(
        "w13-l1",
        "Kenapa Query Bisa Lambat",
        5,
        [
          { type: "heading", text: "13 baris terasa instan... 🐢" },
          { type: "text", text: "Di sandbox ini 13 baris siswa terasa instan. Sekarang bayangkan tabel yang sama dengan 13 JUTA baris. SELECT * yang membaca semua kolom, tanpa filter, tanpa batas — itu resep server menjerit." },
          { type: "code", code: "-- Lambat di production: baca semua, buang sebagian besar\nSELECT * FROM students;\n\n-- Cepat: hanya yang dibutuhkan\nSELECT name, class_id FROM students LIMIT 20;", caption: "Prinsip: baca seminimal mungkin" },
          { type: "quiz", question: "Kebiasaan mana yang paling membahayakan performa di tabel besar?", options: ["SELECT * tanpa WHERE dan LIMIT", "Menyebut kolom eksplisit", "Pakai ORDER BY", "Pakai alias"], answer: 0, explain: "Membaca semua kolom dan semua baris berarti database bekerja maksimal untuk hasil yang sebagian besar dibuang." },
        ],
      ),
      lesson(
        "w13-l2",
        "Index: Daftar Isi Database",
        5,
        [
          { type: "heading", text: "Lompat ke halaman yang tepat 📑" },
          { type: "text", text: "Mencari 'Basis Data' di buku 1000 halaman tanpa daftar isi = balik halaman satu-satu. Dengan daftar isi = langsung lompat. INDEX adalah daftar isi database: struktur tambahan yang membuat pencarian kolom tertentu melompat, bukan memindai." },
          { type: "code", code: "CREATE INDEX idx_students_class\nON students (class_id);\n\n-- Sekarang query ini tidak memindai seluruh tabel:\nSELECT * FROM students WHERE class_id = 3;", caption: "Index di kolom yang sering difilter" },
          { type: "callout", text: "Index bukan gratis: tiap index memperlambat INSERT/UPDATE sedikit karena ikut dirawat. Pasang di kolom yang sering dicari/di-JOIN — bukan semua kolom.", tone: "info" },
          { type: "quiz", question: "Kolom mana yang PALING layak diberi index?", options: ["Kolom yang jarang dipakai", "Kolom yang sering muncul di WHERE dan JOIN", "Semua kolom sekaligus", "Kolom yang isinya selalu berubah tiap detik"], answer: 1, explain: "Index paling menguntungkan di kolom filter/join yang sering dipakai." },
        ],
      ),
      lesson(
        "w13-l3",
        "Query Hemat: Kolom Pas & LIMIT",
        5,
        [
          { type: "heading", text: "Baca seperlunya ✂️" },
          { type: "text", text: "Dua senjata query hemat: (1) sebut kolom eksplisit — bukan *; (2) LIMIT untuk membatasi baris. Dashboard yang menampilkan '5 produk terlaris' tidak butuh membaca jutaan baris — cukup urutkan dan ambil 5." },
          { type: "code", code: "SELECT name, sold\nFROM products\nORDER BY sold DESC\nLIMIT 3;", caption: "Top 3 — cepat karena berhenti setelah cukup" },
          { type: "callout", text: "Kebiasaan ini juga keamanan: query yang hemat tidak membocorkan kolom yang tidak perlu. Dua burung dengan satu batu. 🎯", tone: "fun" },
        ],
        ["w13-select-needed", "w13-top-sold", "w13-low-stock"],
      ),
    ],
  },
  {
    num: 14,
    slug: "transaction",
    title: "Transaction",
    subtitle: "COMMIT, ROLLBACK — jaring pengaman data.",
    emoji: "🔄",
    color: "#5eead4",
    lessons: [
      lesson(
        "w14-l1",
        "All or Nothing",
        5,
        [
          { type: "heading", text: "Operasi yang tidak boleh setengah jalan ⚖️" },
          { type: "text", text: "Transfer uang: kurangi saldo A, tambah saldo B. Bayangkan server mati di tengah jalan — saldo A sudah berkurang, B belum ditambah. Uang menguap. TRANSACTION memastikan serangkaian operasi terjadi SEMUA atau TIDAK SAMA SEKALI." },
          { type: "code", code: "START TRANSACTION;\n\nUPDATE accounts SET balance = balance - 50000 WHERE id = 1;\nUPDATE accounts SET balance = balance + 50000 WHERE id = 2;\n\nCOMMIT; -- sukses: semua diterapkan\n-- atau ROLLBACK; -- gagal: semua dibatalkan", caption: "Dua UPDATE, satu nasib" },
          { type: "analogy", title: "Transaction = Simpan Game 🎮", text: "Sebelum bos fight kamu save dulu. Kalau kalah, tinggal load — bukan mulai dari awal. ROLLBACK itu tombol load: database kembali ke kondisi terakhir yang aman." },
          { type: "quiz", question: "Jika terjadi error SETELAH dua UPDATE dalam satu transaction sebelum COMMIT, maka...", options: ["Update pertama tetap tersimpan", "Keduanya dibatalkan dengan ROLLBACK", "Database otomatis commit", "Hanya baris terakhir yang hilang"], answer: 1, explain: "Belum di-COMMIT artinya belum final — ROLLBACK membatalkan seluruh rangkaian." },
        ],
      ),
      lesson(
        "w14-l2",
        "COMMIT & ROLLBACK di Dunia Nyata",
        5,
        [
          { type: "heading", text: "Kapan transaction dipakai? 💼" },
          { type: "text", text: "Setiap kali DUA perubahan harus konsisten bersama: kurangi stok + catat transaksi; terima pembayaran + tandai pesanan lunas; daftar kursus + potong kuota. Satu UPDATE sendirian jarang butuh transaction — rangkaian yang saling bergantung selalu butuh." },
          { type: "code", code: "START TRANSACTION;\n\nUPDATE products SET stock = stock - 2 WHERE id = 4;\nINSERT INTO transactions (product_id, buyer_name, qty, total)\nVALUES (4, 'Tari', 2, 6000);\n\nCOMMIT;", caption: "Stok dan catatan penjualan: satu paket" },
          { type: "callout", text: "Di latihan world ini kamu menjalankan perubahan satu per satu — tapi biasakan berpikir 'perubahan ini bagian dari rangkaian apa?' Itu mindset backend developer.", tone: "info" },
        ],
        ["w14-safe-update", "w14-insert-tx"],
      ),
    ],
  },
  {
    num: 15,
    slug: "security",
    title: "Security",
    subtitle: "Password hashing, hak akses, dan paham SQL injection.",
    emoji: "🔐",
    color: "#a78bfa",
    lessons: [
      lesson(
        "w15-l1",
        "Password Jangan Polosan",
        5,
        [
          { type: "heading", text: "Jangan simpan password apa adanya 🔑" },
          { type: "text", text: "Kalau database bocor dan password tersimpan polos, semua akun langsung dibajak. Solusinya HASHING: password diubah jadi sidik jari satu arah. Login tinggal membandingkan sidik jari — bukan password aslinya." },
          { type: "code", code: "-- JANGAN\npassword: 'rahasia123'\n\n-- BENAR (hash, contoh bcrypt)\npassword_hash:\n'$2b$12$KIXQ...pQ9O'\n\n-- Login: hash input, bandingkan hash", caption: "Hash satu arah: tidak bisa di-'un-hash'" },
          { type: "analogy", title: "Hash = Sidik Jari 🫆", text: "Dari orang, kamu bisa buat sidik jari. Dari sidik jari, kamu TIDAK bisa merekonstruksi orangnya. Password → hash bekerja persis begitu." },
          { type: "quiz", question: "Kenapa password disimpan sebagai hash, bukan teks asli?", options: ["Biar hemat ruang", "Supaya bocornya database tidak langsung membocorkan password", "Agar login lebih cepat", "Supaya password mudah dibaca admin"], answer: 1, explain: "Hash satu arah melindungi pengguna saat database bocor — admin pun tidak perlu tahu password asli." },
        ],
      ),
      lesson(
        "w15-l2",
        "Least Privilege & Hak Akses",
        5,
        [
          { type: "heading", text: "Akses seminimal yang dibutuhkan 🎫" },
          { type: "text", text: "Prinsip least privilege: setiap pengguna database hanya diberi hak yang benar-benar dia perlukan. Aplikasi kantin tidak butuh DELETE tabel siswa. Akun laporan cukup SELECT — tanpa UPDATE." },
          { type: "code", code: "-- Akun khusus laporan: baca saja\nCREATE USER 'report_app'@'%' IDENTIFIED BY '...';\nGRANT SELECT ON sekolah.* TO 'report_app'@'%';\n\n-- Bahkan bisa dibatasi per kolom:\nGRANT SELECT (name, class_id) ON sekolah.students\nTO 'report_app'@'%';", caption: "GRANT yang spesifik" },
          { type: "text", text: "Prinsip yang sama berlaku di level query: tampilkan hanya kolom yang memang diperlukan aplikasi. Itu latihanmu di world ini." },
        ],
        ["w15-min-columns"],
      ),
      lesson(
        "w15-l3",
        "SQL Injection: Serangan Klasik",
        6,
        [
          { type: "heading", text: "Ketika input jadi perintah 💉" },
          { type: "text", text: "SQL injection terjadi saat input pengguna ditempel langsung ke query. Pengetik jahat menutup string lebih awal dan menyelipkan kondisi sendiri — query kamu menurut pada dia." },
          { type: "code", code: "-- Kode rentan (input ditempel langsung):\nquery = \"SELECT * FROM users WHERE name = '\" + input + \"'\";\n\n-- Input penyerang:\n' OR '1'='1\n\n-- Hasilnya:\nSELECT * FROM users WHERE name = '' OR '1'='1'\n-- → kondisi selalu benar → SEMUA baris bocor", caption: "Klasik, berbahaya, dan mudah dicegah" },
          { type: "code", code: "-- Benar: prepared statement (input = data, bukan kode)\nstmt = db.prepare('SELECT * FROM users WHERE name = ?');\nstmt.execute([input]);", caption: "Parameterized query — obatnya sesederhana itu" },
          { type: "callout", text: "Aturan emas: JANGAN PERNAH merakit SQL dengan menggabungkan string input pengguna. Selalu pakai parameter/prepared statement — di framework mana pun.", tone: "warn" },
          { type: "quiz", question: "Cara paling tepat mencegah SQL injection adalah...", options: ["Menyembunyikan form dari user", "Pakai prepared statement / parameterized query", "Mematikan database saat malam", "Menambah index"], answer: 1, explain: "Prepared statement memisahkan kode SQL dari data input, sehingga input jahat tetap diperlakukan sebagai teks." },
        ],
        ["w15-gmail-audit"],
      ),
    ],
  },
];

/* ------------------------------- Helpers ------------------------------- */

export interface FlatLessonRef {
  lessonId: string;
  worldNum: number;
}

/** Semua lesson dalam urutan global — dipakai untuk unlock berurutan. */
export const LESSON_ORDER: FlatLessonRef[] = WORLDS.flatMap((w) =>
  w.lessons.map((l) => ({ lessonId: l.id, worldNum: w.num })),
);

export const LESSON_MAP = new Map<string, { lesson: Lesson; world: World }>();
for (const w of WORLDS) {
  for (const l of w.lessons) LESSON_MAP.set(l.id, { lesson: l, world: w });
}

export function getLesson(id: string) {
  return LESSON_MAP.get(id);
}

export function getWorldBySlug(slug: string): World | undefined {
  return WORLDS.find((w) => w.slug === slug);
}

export function totalLessonCount(): number {
  return LESSON_ORDER.length;
}
