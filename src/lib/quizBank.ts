/**
 * BANK SOAL CEK PEMAHAMAN — SERVER ONLY.
 * File ini HANYA boleh di-import oleh fungsi Convex (src/convex/quiz.ts).
 * Jangan pernah mengimpornya dari komponen client — index jawaban (`answer`)
 * tidak boleh ikut ter-bundle ke browser.
 *
 * Setiap lesson punya pool ≥5 soal; server mengacak 3-5 soal + urutan opsinya
 * per sesi, memvalidasi jawaban di server, dan hanya mengembalikan soal tanpa kunci.
 */

export interface QuizQuestion {
  id: string;
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

const q = (
  id: string,
  question: string,
  options: [string, string, string, string] | [string, string, string, string, string] | [string, string, string, string, string, string],
  answer: number,
  explain: string,
): QuizQuestion => ({ id, q: question, options, answer, explain });

export const QUIZ_BANK: Record<string, QuizQuestion[]> = {
  /* ---------------- WORLD 1 — Database Quest ---------------- */
  "w1-l1": [
    q("w1-l1-q1", "Di analogi lemari arsip, satu FORMULIR siswa mewakili...?", ["Satu database", "Satu tabel", "Satu baris", "Satu kolom"], 2, "Formulir = satu baris (record). Kolomnya adalah bagian-bagian form yang diisi."),
    q("w1-l1-q2", "Di analogi lemari arsip, LEMARI keseluruhan mewakili...?", ["Database", "Tabel", "Baris", "Query"], 0, "Lemari = database, laci = tabel, formulir = baris."),
    q("w1-l1-q3", "Program yang bertugas menjaga dan mengelola database disebut...?", ["DBMS", "CPU", "Browser", "Compiler"], 0, "DBMS (Database Management System) — contohnya MySQL."),
    q("w1-l1-q4", "MySQL adalah...?", ["Bahasa pemrograman", "DBMS relasional", "Sistem operasi", "Text editor"], 1, "MySQL adalah DBMS (software pengelola database), bukan bahasa pemrograman."),
    q("w1-l1-q5", "SQL adalah singkatan dari...?", ["Simple Question Language", "Structured Query Language", "System Quality Label", "Serial Query Logic"], 1, "Structured Query Language — bahasa untuk berbicara dengan database."),
    q("w1-l1-q6", "Kenapa data disimpan di database, bukan di file teks terpisah?", ["Supaya file-nya banyak", "Agar terstruktur, mudah dicari, dan bisa dihubungkan", "Karena lebih kecil ukurannya", "Supaya tidak bisa dibuka"], 1, "Database menyimpan data terstruktur dan relasinya — pencarian & penggabungan jadi mudah."),
  ],
  "w1-l2": [
    q("w1-l2-q1", "Kalau ada 500 siswa di sekolah, tabel students idealnya punya berapa BARIS?", ["500", "3", "Tergantung jumlah kolom", "1"], 0, "Satu baris = satu siswa. Kolom menentukan lebar tabel, jumlah data menentukan tingginya."),
    q("w1-l2-q2", "Satu KOLOM dalam tabel mewakili...?", ["Satu entitas data", "Satu jenis data/atribut", "Satu database", "Satu query"], 1, "Kolom = satu jenis informasi yang sama untuk semua baris, misalnya `name`."),
    q("w1-l2-q3", "Satu baris tabel dalam istilah database disebut juga...?", ["Field", "Record", "Index", "Schema"], 1, "Baris = record. Kolom = field."),
    q("w1-l2-q4", "Kolom `id` yang menjadi identitas unik tiap baris disebut...?", ["Foreign Key", "Primary Key", "Label", "Counter"], 1, "Primary Key — penanda unik yang membedakan tiap baris."),
    q("w1-l2-q5", "Nilai yang belum diisi dalam sebuah sel tabel direpresentasikan dengan...?", ["0", "Teks kosong \"\"", "NULL", "FALSE"], 2, "NULL berarti nilai tidak diketahui/belum diisi — berbeda dari 0 atau teks kosong."),
    q("w1-l2-q6", "Tabel `students` berisi data siswa. Tabel lain yang menyimpan daftar kelas sebaiknya...?", ["Digabung ke tabel students", "Tabel terpisah bernama classes", "Disimpan di kolom students", "Tidak perlu disimpan"], 1, "Satu tabel untuk satu jenis entitas — kelas punya tabel sendiri, lalu dihubungkan."),
  ],
  "w1-l3": [
    q("w1-l3-q1", "Bahasa yang dipakai untuk mengobrol dengan MySQL adalah...?", ["HTML", "SQL", "CSS", "Python"], 1, "SQL (Structured Query Language) — bahasa standar database relasional."),
    q("w1-l3-q2", "Query `SELECT 'halo database';` akan...?", ["Membuat tabel", "Menampilkan teks 'halo database'", "Menghapus data", "Error"], 1, "SELECT bisa menampilkan nilai langsung — cara klasik uji koneksi pertama."),
    q("w1-l3-q3", "SQL termasuk bahasa...?", ["Deklaratif — kamu bilang MAU APA", "Prosedural — kamu tulis CARA langkah demi langkah", "Grafis", "Mesin"], 0, "Dalam SQL kamu mendeklarasikan hasil yang diinginkan; DBMS yang mencari caranya."),
    q("w1-l3-q4", "Apa yang terjadi kalau query salah ketik?", ["Komputer mati", "Muncul pesan error yang bisa dipelajari", "Data otomatis terhapus", "MySQL memperbaiki sendiri"], 1, "Error SQL jelas dan aman — dibaca, diperbaiki, diulang. Itu cara belajar terbaik."),
    q("w1-l3-q5", "MySQL menyimpan datanya dalam bentuk...?", ["File teks biasa", "Tabel-tabel yang saling berelasi", "Gambar", "Video"], 1, "Model relasional: data dipisah per tabel dan dihubungkan lewat kunci."),
  ],

  /* ---------------- WORLD 2 — Table Builder ---------------- */
  "w2-l1": [
    q("w2-l1-q1", "Perintah untuk membuat database baru bernama sekolah adalah...?", ["MAKE DATABASE sekolah", "CREATE DATABASE sekolah;", "NEW DATABASE sekolah", "ADD DATABASE sekolah;"], 1, "Sintaks resmi: CREATE DATABASE nama_db;"),
    q("w2-l1-q2", "Perintah untuk membuat tabel baru adalah...?", ["CREATE TABLE students (...);", "MAKE TABLE students", "INSERT TABLE students", "NEW students;"], 0, "CREATE TABLE nama (kolom tipe, ...);"),
    q("w2-l1-q3", "Perintah `USE sekolah;` fungsinya...?", ["Menghapus database", "Memilih database yang akan dipakai", "Membuat tabel", "Menampilkan data"], 1, "USE memilih database aktif sebelum membuat/mengakses tabel."),
    q("w2-l1-q4", "Di dalam CREATE TABLE, yang kita definisikan adalah...?", ["Isi datanya langsung", "Nama kolom beserta tipe datanya", "Password database", "Nama pengguna"], 1, "Definisi tabel = cetak biru kolom + tipe data, belum berisi data."),
    q("w2-l1-q5", "Perintah untuk melihat daftar tabel di database aktif adalah...?", ["SHOW TABLES;", "LIST TABLE;", "SELECT TABLES;", "DISPLAY TABLES;"], 0, "SHOW TABLES; menampilkan semua tabel di database aktif."),
    q("w2-l1-q6", "Apa yang terjadi kalau CREATE TABLE dijalankan dengan nama tabel yang sudah ada?", ["Tabel ditimpa", "Error — tabel sudah ada", "Tabel kedua dibuat", "Data lama dihapus"], 1, "Nama tabel harus unik; gunakan IF NOT EXISTS bila ingin aman."),
  ],
  "w2-l2": [
    q("w2-l2-q1", "Apa fungsi VARCHAR(100)?", ["Angka maksimal 100", "Teks sampai 100 karakter", "Tanggal", "Nilai benar/salah"], 1, "VARCHAR(n) = teks variabel dengan panjang maksimal n karakter."),
    q("w2-l2-q2", "Untuk menyimpan harga produk dengan sen, tipe data paling tepat adalah...", ["INT", "DECIMAL", "DATE", "BOOLEAN"], 1, "DECIMAL menjaga presisi angka pecahan — cocok untuk uang."),
    q("w2-l2-q3", "Tipe data paling tepat untuk kolom umur adalah...?", ["VARCHAR", "INT", "DATE", "TEXT"], 1, "Umur berupa bilangan bulat — pakai INT."),
    q("w2-l2-q4", "Tipe data untuk tanggal lahir adalah...?", ["VARCHAR", "BOOLEAN", "DATE", "INT"], 2, "DATE menyimpan tanggal sehingga bisa diurutkan & dihitung umurnya."),
    q("w2-l2-q5", "Tipe data untuk kolom `lunas` yang hanya bernilai ya/tidak adalah...?", ["BOOLEAN", "INT", "DATE", "VARCHAR(10)"], 0, "BOOLEAN untuk dua kemungkinan: TRUE/FALSE."),
    q("w2-l2-q6", "Beda utama CHAR(10) dan VARCHAR(10)?", ["CHAR selalu pakai 10 karakter (dipadati), VARCHAR mengikuti isi", "Tidak ada bedanya", "VARCHAR hanya untuk angka", "CHAR lebih cepat selalu"], 0, "CHAR panjang tetap, VARCHAR panjang mengikuti isi data."),
  ],

  /* ---------------- WORLD 3 — Query Dasar ---------------- */
  "w3-l1": [
    q("w3-l1-q1", "Menampilkan SEMUA kolom dari tabel students adalah...", ["SHOW students;", "SELECT * FROM students;", "GET students;", "OPEN students;"], 1, "SELECT * FROM nama_tabel; — bintang berarti semua kolom."),
    q("w3-l1-q2", "Tanda `*` pada SELECT * artinya...?", ["Semua kolom", "Semua tabel", "Perkalian", "Komentar"], 0, "* = wildcard semua kolom."),
    q("w3-l1-q3", "Kata kunci untuk menentukan tabel yang diambil datanya adalah...?", ["WHERE", "FROM", "ORDER", "INTO"], 1, "SELECT ... FROM nama_tabel."),
    q("w3-l1-q4", "Hasil sebuah query SELECT berbentuk...?", ["File", "Tabel (baris & kolom)", "Gambar", "Teks bebas"], 1, "Hasil query selalu berbentuk result set — tabel sementara."),
    q("w3-l1-q5", "Menampilkan hanya kolom `name` dari students adalah...", ["SELECT name FROM students;", "SELECT students FROM name;", "SELECT * FROM name;", "SELECT name OF students;"], 0, "Sebut nama kolomnya setelah SELECT, tabelnya setelah FROM."),
    q("w3-l1-q6", "Urutan penulisan dasar sebuah query SELECT adalah...", ["FROM → SELECT", "SELECT → FROM", "WHERE → SELECT", "SELECT → WHERE → FROM"], 1, "SELECT dulu (kolom apa), lalu FROM (dari tabel mana)."),
  ],
  "w3-l2": [
    q("w3-l2-q1", "Menampilkan hanya nama dan kelas siswa adalah...", ["SELECT * FROM students;", "SELECT name, class_id FROM students;", "SELECT name AND class_id;", "SELECT students FROM name;"], 1, "Pisahkan kolom dengan koma: SELECT kolom1, kolom2 FROM tabel;"),
    q("w3-l2-q2", "Kenapa kita tidak selalu pakai SELECT *?", ["Supaya terlihat pro", "Boros — mengangkut data yang tidak diperlukan", "SELECT * sering error", "Karena tidak bisa digabung WHERE"], 1, "Ambil kolom yang perlu saja: lebih cepat dan jelas."),
    q("w3-l2-q3", "Urutan kolom pada hasil query mengikuti...?", ["Urutan di tabel asli", "Urutan yang kita tulis di SELECT", "Urutan alfabet", "Acak"], 1, "Hasil mengikuti urutan kolom yang kamu tulis."),
    q("w3-l2-q4", "Fungsi `AS` pada `SELECT name AS nama_siswa` adalah...?", ["Mengganti nama kolom pada hasil", "Mengganti isi data", "Menghapus kolom", "Menambah kolom baru"], 0, "AS memberi alias — nama tampilan kolom hasil."),
    q("w3-l2-q5", "Query `SELECT name FROM students;` mengembalikan berapa kolom?", ["Semua kolom", "1 kolom", "2 kolom", "0 kolom"], 1, "Hanya kolom name — satu kolom, semua baris."),
    q("w3-l2-q6", "Bisa memilih kolom yang sama dua kali dengan nama berbeda?", ["Tidak bisa", "Bisa, dengan alias berbeda", "Hanya di tabel besar", "Hanya dengan WHERE"], 1, "SELECT name, name AS nama_lama FROM ... — alias membedakannya."),
  ],

  /* ---------------- WORLD 4 — Filter ---------------- */
  "w4-l1": [
    q("w4-l1-q1", "Menampilkan hanya siswa kelas 3 adalah...", ["SELECT * FROM students WHERE class_id = 3;", "SELECT * FROM students HAVE class_id = 3;", "SELECT * WHERE students = 3;", "FILTER students BY 3;"], 0, "WHERE memfilter baris: hanya yang kondisinya benar yang tampil."),
    q("w4-l1-q2", "Klausa WHERE dipakai untuk...?", ["Mengurutkan data", "Memfilter baris", "Mengganti nama kolom", "Membuat tabel"], 1, "WHERE menyaring baris mana yang ikut ke hasil."),
    q("w4-l1-q3", "Operator \"tidak sama dengan\" dalam MySQL adalah...", ["=! atau <>", "<> atau !=", "=<", "~~"], 1, "Keduanya valid: <> dan != berarti tidak sama dengan."),
    q("w4-l1-q4", "`WHERE class_id = 3 AND age > 15` artinya...", ["Salah satu kondisi cukup", "Kedua kondisi harus benar", "Tidak ada yang tampil", "Kelas 3 ATAU umur di atas 15"], 1, "AND = keduanya harus terpenuhi; OR = salah satu cukup."),
    q("w4-l1-q5", "Kalau kondisi WHERE tidak cocok dengan satu baris pun, hasilnya...", ["Error", "Tabel hasil kosong (0 baris)", "Semua baris tampil", "MySQL berhenti"], 1, "Hasil kosong bukan error — artinya tidak ada data yang cocok."),
    q("w4-l1-q6", "Memfilter teks: `WHERE name = 'andi pratama'` — perhatikan bahwa...", ["Teks dibungkus kutip satu", "Teks tanpa kutip", "Teks dibungkus kurung", "Teks pakai tanda #"], 0, "Nilai teks dalam SQL dibungkus kutip satu: '...'."),
  ],
  "w4-l2": [
    q("w4-l2-q1", "Mencari nama yang diawali huruf 'A' adalah...", ["WHERE name LIKE 'A%'", "WHERE name = 'A'", "WHERE name IN 'A'", "WHERE name %A"], 0, "LIKE 'A%' — % menggantikan sisa karakter apa pun."),
    q("w4-l2-q2", "Dalam LIKE, simbol `%` berarti...?", ["Tepat satu karakter", "Nol atau lebih karakter apa pun", "Persen", "Komentar"], 1, "% = wildcard banyak karakter; _ = tepat satu karakter."),
    q("w4-l2-q3", "Dalam LIKE, simbol `_` berarti...?", ["Nol karakter", "Tepat satu karakter", "Spasi", "Semua karakter"], 1, "Underscore menggantikan tepat satu karakter."),
    q("w4-l2-q4", "`WHERE class_id IN (1, 2, 3)` sama artinya dengan...", ["class_id = 1 AND class_id = 2", "class_id = 1 OR class_id = 2 OR class_id = 3", "class_id > 3", "class_id BETWEEN 1 DAN 2"], 1, "IN adalah singkatan rapi dari beberapa OR."),
    q("w4-l2-q5", "`WHERE age BETWEEN 14 AND 16` mencakup nilai...", ["14 dan 16 saja", "14 sampai 16 termasuk 14 dan 16", "15 saja", "14 sampai 16 tanpa 16"], 1, "BETWEEN inklusif — batas bawah dan atas ikut."),
    q("w4-l2-q6", "Menampilkan siswa yang BUKAN kelas 1, 2, atau 3 adalah...", ["WHERE class_id NOT IN (1,2,3)", "WHERE class_id IN (4)", "WHERE class_id <> (1,2,3)", "WHERE NOT class_id"], 0, "NOT IN membalik IN — mengecualikan daftar nilai."),
  ],

  /* ---------------- WORLD 5 — Urut & Rapikan ---------------- */
  "w5-l1": [
    q("w5-l1-q1", "Mengurutkan nilai dari yang TERTINGGI adalah...", ["ORDER BY score DESC", "ORDER BY score ASC", "SORT score DOWN", "GROUP BY score"], 0, "DESC = descending (besar → kecil), ASC = ascending (kecil → besar)."),
    q("w5-l1-q2", "Tanpa ASC/DESC, ORDER BY default-nya adalah...", ["DESC", "ASC", "Acak", "Sesuai input"], 1, "Default ORDER BY adalah ASC (kecil ke besar)."),
    q("w5-l1-q3", "Menampilkan hanya 10 baris pertama adalah...", ["TOP 10", "LIMIT 10", "FIRST 10", "MAX 10"], 1, "LIMIT membatasi jumlah baris hasil."),
    q("w5-l1-q4", "`ORDER BY score DESC LIMIT 3` menghasilkan...", ["3 baris pertama tabel", "3 nilai terbesar", "Semua nilai urut", "3 baris acak"], 1, "Urutkan dulu (terbesar dulu), baru ambil 3 — top-3."),
    q("w5-l1-q5", "`LIMIT 5 OFFSET 5` artinya...", ["5 baris pertama", "Melewati 5 baris, ambil 5 berikutnya", "10 baris", "Baris ke-5 saja"], 1, "OFFSET melewati baris — dasar dari pagination halaman 2."),
    q("w5-l1-q6", "Untuk mendapat NILAI TERENDAH dengan cepat, urutan yang tepat adalah...", ["ORDER BY score DESC", "ORDER BY score ASC LIMIT 1", "ORDER BY score DESC LIMIT 0", "GROUP BY score"], 1, "ASC mengurutkan kecil → besar, jadi baris pertama adalah yang terkecil."),
  ],
  "w5-l2": [
    q("w5-l2-q1", "Menampilkan daftar kelas TANPA duplikat adalah...", ["SELECT DISTINCT class_id FROM students;", "SELECT UNIQUE class_id;", "SELECT class_id NODUP;", "SELECT class_id GROUP;"], 0, "DISTINCT membuang nilai duplikat pada hasil."),
    q("w5-l2-q2", "DISTINCT bekerja pada...?", ["Satu baris saja", "Kombinasi nilai kolom yang dipilih", "Semua tabel", "Index"], 1, "DISTINCT membandingkan gabungan nilai seluruh kolom terpilih."),
    q("w5-l2-q3", "Kolom berisi {3, 3, 1, 2, 3}. `SELECT DISTINCT` menghasilkan berapa baris?", ["5", "4", "3", "1"], 2, "Nilai uniknya 1, 2, 3 — jadi 3 baris."),
    q("w5-l2-q4", "DISTINCT bisa digabung dengan ORDER BY?", ["Tidak bisa", "Bisa", "Hanya dengan WHERE", "Hanya di MySQL lama"], 1, "DISTINCT dan ORDER BY boleh dipakai bersama."),
    q("w5-l2-q5", "DISTINCT berguna untuk pertanyaan seperti...", ["Berapa total nilai?", "Kelas apa saja yang ada di sekolah?", "Siapa siswa nilai tertinggi?", "Berapa baris tabel?"], 1, "Daftar nilai unik = kandidat terkuat DISTINCT."),
    q("w5-l2-q6", "`SELECT DISTINCT name, class_id` dengan 2 siswa beda nama tapi kelas sama akan...", ["Menjadi 1 baris", "Tetap 2 baris (namanya beda)", "Error", "Hanya kelasnya tampil"], 1, "Kombinasinya beda (nama berbeda) — keduanya tampil."),
  ],

  /* ---------------- WORLD 6 — Ubah Data ---------------- */
  "w6-l1": [
    q("w6-l1-q1", "Menambah siswa baru bernama Andi adalah...", ["ADD INTO students ...", "INSERT INTO students (name) VALUES ('Andi');", "CREATE students 'Andi';", "PUT students 'Andi';"], 1, "INSERT INTO tabel (kolom) VALUES (nilai);"),
    q("w6-l1-q2", "Kalau INSERT tidak menyebut daftar kolom, maka...", ["Boleh, nilai bebas", "Harus mengisi SEMUA kolom sesuai urutan definisi", "Otomatis diisi NULL semua", "Error selalu"], 1, "Tanpa daftar kolom, VALUES harus lengkap dan berurutan."),
    q("w6-l1-q3", "Memasukkan 3 siswa sekaligus ditulis dengan...", ["Tiga kali INSERT saja selalu", "VALUES (...), (...), (...)", "INSERT MANY", "VALUES & VALUES"], 1, "Multi-row insert: VALUES (..), (..), (..) — lebih efisien."),
    q("w6-l1-q4", "Kolom yang tidak disebut dalam INSERT akan...", ["Terisi NULL atau default", "Terisi 0 selalu", "Membuat error", "Terisi acak"], 0, "Kolom yang tak diisi mengambil default, atau NULL bila boleh."),
    q("w6-l1-q5", "INSERT dengan tipe data yang salah (angka ke kolom DATE) akan...", ["Diterima asal", "Ditolak dengan error tipe", "Otomatis dikonversi selalu", "Menghapus tabel"], 1, "MySQL memvalidasi tipe — salah tipe = error (atau konversi ketat sesuai mode)."),
    q("w6-l1-q6", "Setelah INSERT berhasil, data...", ["Sementara sampai logout", "Langsung tersimpan di tabel", "Menunggu persetujuan guru", "Masuk sampel"], 1, "INSERT langsung menulis ke tabel."),
  ],
  "w6-l2": [
    q("w6-l2-q1", "Apa yang terjadi kalau UPDATE dijalankan TANPA WHERE?", ["Tidak ada yang berubah", "SEMUA baris ikut berubah", "Hanya baris pertama", "Error"], 1, "UPDATE tanpa WHERE mengubah seluruh tabel — bahaya!"),
    q("w6-l2-q2", "Apa yang terjadi kalau DELETE dijalankan TANPA WHERE?", ["Tidak terjadi apa-apa", "Semua baris terhapus", "Hapus satu baris", "Error"], 1, "DELETE tanpa WHERE mengosongkan seluruh tabel."),
    q("w6-l2-q3", "Mengganti nama siswa ber-id 5 adalah...", ["UPDATE students SET name='Budi' WHERE id = 5;", "UPDATE students WHERE name='Budi';", "CHANGE students 5 'Budi';", "MODIFY students SET name;"], 0, "UPDATE tabel SET kolom = nilai WHERE kunci."),
    q("w6-l2-q4", "Kebiasaan aman sebelum UPDATE/DELETE besar-besaran adalah...", ["Langsung jalankan", "Uji dulu dengan SELECT dengan WHERE yang sama", "Matikan internet", "Hapus tabelnya dulu"], 1, "SELECT dulu untuk melihat baris mana yang akan kena."),
    q("w6-l2-q5", "Menghapus siswa ber-id 5 adalah...", ["DELETE students WHERE id = 5;", "DELETE FROM students WHERE id = 5;", "REMOVE students 5;", "DROP students id 5;"], 1, "DELETE FROM tabel WHERE syarat;"),
    q("w6-l2-q6", "Bedanya DELETE dan DROP TABLE?", ["Sama saja", "DELETE hapus barisnya, DROP hapus tabel beserta strukturnya", "DELETE hapus tabel, DROP hapus baris", "DROP hanya untuk view"], 1, "DELETE = data; DROP = tabel (struktur + data) hilang."),
  ],

  /* ---------------- WORLD 7 — Relasi ---------------- */
  "w7-l1": [
    q("w7-l1-q1", "Di tabel scores, kolom student_id yang menunjuk ke students.id berperan sebagai...", ["Primary Key", "Foreign Key", "Index", "View"], 1, "Kolom yang menunjuk PK tabel lain = foreign key."),
    q("w7-l1-q2", "Syarat Primary Key adalah...", ["Boleh duplikat asal urut", "Unik dan tidak boleh NULL", "Harus berupa teks", "Harus diisi manual"], 1, "PK harus unik untuk setiap baris dan tidak boleh kosong."),
    q("w7-l1-q3", "Bolehkah dua baris punya nilai Primary Key yang sama?", ["Boleh kalau beda tabel", "Tidak boleh", "Boleh kalau NULL", "Boleh kalau angka kecil"], 1, "Duplikat PK akan ditolak database."),
    q("w7-l1-q4", "Fungsi AUTO_INCREMENT adalah...", ["Menaikkan nomor id otomatis tiap insert", "Mengurutkan tabel", "Menghapus data lama", "Membuat index"], 0, "AUTO_INCREMENT membuat PK angka bertambah sendiri."),
    q("w7-l1-q5", "Berapa banyak Primary Key dalam satu tabel?", ["Tak terbatas", "Maksimal 5", "Satu", "Dua"], 2, "Satu PK per tabel (bisa berupa gabungan kolom, tapi tetap satu PK)."),
    q("w7-l1-q6", "Foreign Key boleh bernilai NULL ketika...", ["Tidak boleh sama sekali", "Relasinya opsional (tidak semua baris punya pasangan)", "Tabelnya kecil", "PK-nya angka"], 1, "FK NULL = baris ini belum/bukan bagian dari relasi itu."),
  ],
  "w7-l2": [
    q("w7-l2-q1", "Satu siswa punya tepat satu profil detail. Relasinya adalah...", ["One to One", "One to Many", "Many to Many", "Tidak berelasi"], 0, "1 : 1 — satu entitas, satu pasangan."),
    q("w7-l2-q2", "Satu kelas berisi banyak siswa. Relasi classes → students adalah...", ["One to One", "One to Many", "Many to Many", "Self relation"], 1, "1 kelas : banyak siswa = One to Many."),
    q("w7-l2-q3", "Siswa bisa ambil banyak mapel, mapel diambil banyak siswa. Relasinya...", ["One to One", "One to Many", "Many to Many", "Tidak berelasi"], 2, "N : M — butuh tabel jembatan."),
    q("w7-l2-q4", "Tabel jembatan (mis. enrollments) biasanya berisi...", ["Semua data siswa", "Pasangan foreign key dari kedua tabel", "Hanya nama mapel", "Gambar"], 1, "Tabel jembatan menyimpan pasangan FK, mis. student_id + subject_id."),
    q("w7-l2-q5", "Relasi antar tabel secara teknis dibangun lewat...", ["Warna kolom", "Foreign key yang menunjuk primary key", "Nama tabel mirip", "Urutan pembuatan"], 1, "FK → PK adalah mesin relasi database relasional."),
    q("w7-l2-q6", "Contoh relasi One to Many lain yang wajar adalah...", ["Guru → mapel yang diampu (satu guru banyak mapel)", "Siswa ↔ NIS", "Kelas ↔ wali kelas", "NIS ↔ siswa"], 0, "Satu sisi punya satu, sisi lain punya banyak — One to Many."),
  ],

  /* ---------------- WORLD 8 — JOIN ---------------- */
  "w8-l1": [
    q("w8-l1-q1", "Menggabungkan students dengan scores ditulis...", ["FROM students JOIN scores ON students.id = scores.student_id", "JOIN students AND scores", "MERGE students, scores", "COMBINE students scores"], 0, "JOIN ... ON kondisi penghubung (FK = PK)."),
    q("w8-l1-q2", "Klausa ON berisi...", ["Syarat filter biasa saja", "Kondisi penghubung kedua tabel", "Nama kolom yang ditampilkan", "Urutan hasil"], 1, "ON mendefinisikan pasangan baris mana yang cocok."),
    q("w8-l1-q3", "INNER JOIN hanya menghasilkan...", ["Semua baris kedua tabel", "Baris yang cocok di KEDUA tabel", "Baris tabel kiri saja", "Baris acak"], 1, "INNER JOIN = irisan: baris yang punya pasangan di kedua sisi."),
    q("w8-l1-q4", "`FROM students s JOIN scores sc` — huruf s dan sc disebut...", ["Alias tabel", "Primary key", "Index", "Kolom"], 0, "Alias mempersingkat penulisan: s.name, sc.score."),
    q("w8-l1-q5", "Siswa yang belum punya nilai akan...", ["Tampil dengan nilai 0", "Tidak muncul di hasil INNER JOIN", "Error", "Muncul dua kali"], 1, "Tanpa pasangan di scores, baris itu tak lolos INNER JOIN."),
    q("w8-l1-q6", "Menghitung jumlah nilai per siswa butuh kombinasi...", ["JOIN + GROUP BY", "DISTINCT saja", "LIMIT saja", "UPDATE"], 0, "Gabungkan tabel, lalu kelompokkan per siswa."),
  ],
  "w8-l2": [
    q("w8-l2-q1", "LEFT JOIN menghasilkan...", ["Hanya baris yang cocok", "Semua baris tabel KIRI + pasangan kanan (NULL jika tak ada)", "Semua baris tabel kanan", "Irisan kedua tabel"], 1, "LEFT JOIN mempertahankan seluruh baris tabel kiri."),
    q("w8-l2-q2", "Mencari siswa yang TIDAK punya nilai adalah...", ["LEFT JOIN scores ... WHERE scores.id IS NULL", "INNER JOIN scores", "WHERE score > 0", "GROUP BY student_id"], 0, "LEFT JOIN + IS NULL = baris kiri tanpa pasangan kanan."),
    q("w8-l2-q3", "Mengetes nilai kosong di SQL yang benar adalah...", ["= NULL", "IS NULL", "== NULL", "NULL()"], 1, "NULL tak bisa dibandingkan dengan = — wajib IS NULL / IS NOT NULL."),
    q("w8-l2-q4", "Hasil `NULL = NULL` adalah...", ["TRUE", "FALSE", "NULL (tidak diketahui)", "Error"], 2, "Perbandingan dengan NULL hasilnya NULL — itulah kenapa pakai IS NULL."),
    q("w8-l2-q5", "Pada baris LEFT JOIN yang tak punya pasangan, kolom tabel kanan berisi...", ["0", "Teks kosong", "NULL", "Acak"], 2, "Kolom kanan diisi NULL."),
    q("w8-l2-q6", "Beda utama INNER JOIN dan LEFT JOIN adalah...", ["Kecepatan", "INNER buang baris tanpa pasangan, LEFT pertahankan baris kiri", "LEFT hanya untuk angka", "INNER hanya 2 kolom"], 1, "Pilihan JOIN menentukan siapa yang 'selamat' di hasil."),
  ],

  /* ---------------- WORLD 9 — Agregasi ---------------- */
  "w9-l1": [
    q("w9-l1-q1", "Menghitung jumlah semua siswa adalah...", ["SELECT COUNT(*) FROM students;", "SELECT SUM(students);", "SELECT TOTAL FROM students;", "COUNT students;"], 0, "COUNT(*) menghitung jumlah baris."),
    q("w9-l1-q2", "Jumlah siswa PER kelas didapat dengan...", ["WHERE class_id", "GROUP BY class_id", "ORDER BY class_id", "DISTINCT class_id saja"], 1, "GROUP BY mengelompokkan baris sebelum agregat dihitung."),
    q("w9-l1-q3", "Filter SETELAH pengelompokan memakai...", ["WHERE", "HAVING", "LIMIT", "FILTER"], 1, "HAVING menyaring hasil agregat (GROUP BY), WHERE menyaring baris mentah."),
    q("w9-l1-q4", "Kolom non-agregat di SELECT wajib...", ["Ditulis ulang dua kali", "Masuk daftar GROUP BY", "Diberi tanda *", "Dihilangkan"], 1, "Semua kolom non-agregat harus ada di GROUP BY."),
    q("w9-l1-q5", "`SELECT class_id, COUNT(*) FROM students GROUP BY class_id` menghasilkan...", ["Satu baris total", "Satu baris per kelas berisi jumlah siswanya", "Semua siswa", "Kelas tanpa siswa"], 1, "Tiap kelompok = satu baris hasil."),
    q("w9-l1-q6", "Mengurutkan hasil agregat dari terbesar memakai...", ["HAVING COUNT DESC", "ORDER BY COUNT(*) DESC", "GROUP BY DESC", "LIMIT DESC"], 1, "Agregat selesai → baru bisa diurutkan dengan ORDER BY."),
  ],
  "w9-l2": [
    q("w9-l2-q1", "Total penjumlahan nilai kolom score memakai...", ["TOTAL(score)", "SUM(score)", "ADD(score)", "PLUS(score)"], 1, "SUM menjumlahkan seluruh nilai kolom numerik."),
    q("w9-l2-q2", "Rata-rata nilai memakai...", ["MEAN(score)", "AVG(score)", "MID(score)", "CENTER(score)"], 1, "AVG = average (rata-rata)."),
    q("w9-l2-q3", "Nilai tertinggi dan terendah didapat dengan...", ["TOP(score) dan BOTTOM(score)", "MAX(score) dan MIN(score)", "HIGH(score) dan LOW(score)", "FIRST dan LAST"], 1, "MAX/MIN — sering dipakai bersama GROUP BY."),
    q("w9-l2-q4", "Saat menghitung AVG, nilai NULL akan...", ["Dihitung 0", "Diabaikan (tidak dihitung)", "Membuat error", "Dihitung dua kali"], 1, "Agregat mengabaikan NULL — rata-rata tetap wajar."),
    q("w9-l2-q5", "`ROUND(AVG(score), 1)` artinya...", ["Bulatkan ke atas", "Rata-rata dibulatkan 1 angka desimal", "Ambil 1 baris", "Hitung 1 kali"], 1, "ROUND(x, n) membulatkan ke n desimal."),
    q("w9-l2-q6", "Menggabungkan agregat dengan JOIN (mis. rata-rata nilai per mapel) butuh...", ["JOIN scores-subjects lalu GROUP BY mapel", "DISTINCT saja", "UPDATE dulu", "LIMIT 1"], 0, "Pola klasik: relasikan dulu, kelompokkan, hitung."),
  ],
  "w9-l3": [
    q("w9-l3-q1", "3 produk terlaris di kantin didapat dengan pola...", ["GROUP BY product → ORDER BY total DESC → LIMIT 3", "SELECT * LIMIT 3", "DISTINCT product", "WHERE total > 3"], 0, "Kelompokkan, urutkan menurun, batasi 3 — top-N."),
    q("w9-l3-q2", "Total pendapatan (jumlah × harga) dihitung dengan...", ["SUM(quantity * price)", "SUM(quantity) + SUM(price)", "AVG(quantity)", "COUNT(*)"], 0, "Agregasi atas hasil perkalian dua kolom."),
    q("w9-l3-q3", "Transaksi per hari dikelompokkan dengan...", ["GROUP BY tanggal transaksi", "ORDER BY tanggal", "DISTINCT tanggal saja", "LIMIT per hari"], 0, "GROUP BY kolom tanggal → agregat harian."),
    q("w9-l3-q4", "Produk yang BELUM pernah dibeli ditemukan dengan...", ["INNER JOIN", "LEFT JOIN + IS NULL", "GROUP BY", "SUM"], 1, "LEFT JOIN dari products ke transactions, ambil yang tak punya pasangan."),
    q("w9-l3-q5", "Boss challenge kantin melatih gabungan...", ["JOIN + GROUP BY + ORDER BY + LIMIT", "INSERT saja", "CREATE TABLE", "UPDATE + DELETE"], 0, "Semua keterampilan SELECT digabung jadi satu laporan."),
    q("w9-l3-q6", "Sebelum menulis query laporan yang rumit, langkah bijak adalah...", ["Langsung tulis satu query raksasa", "Pecah bertahap: cek JOIN dulu, baru agregasi", "Hapus datanya", "Pakai SELECT *"], 1, "Bangun bertahap — verifikasi tiap lapis sebelum digabung."),
  ],

  /* ---------------- WORLD 10 — Subquery Dungeon ---------------- */
  "w10-l1": [
    q("w10-l1-q1", "Dalam query ber-subquery, bagian yang dieksekusi lebih dulu adalah...", ["Query terluar", "Query di dalam kurung", "Keduanya bersamaan", "Tergantung urutan penulisan"], 1, "Subquery dievaluasi dulu, hasilnya jadi input query luar."),
    q("w10-l1-q2", "Subquery adalah...", ["Query di dalam query lain", "Query yang gagal", "Tabel sementara permanen", "Nama kolom"], 0, "Query bersarang dalam kurung."),
    q("w10-l1-q3", "Subquery untuk `WHERE class_id = (SELECT ...)` harus menghasilkan...", ["Banyak baris", "Tepat satu nilai (scalar)", "Selalu NULL", "Tabel penuh"], 1, "Operator = butuh satu nilai; banyak baris butuh IN."),
    q("w10-l1-q4", "Keuntungan subquery dibanding query terpisah dua kali adalah...", ["Lebih lambat selalu", "Logika bertahap dalam satu pernyataan", "Tidak butuh tabel", "Otomatis cepat"], 1, "Satu pernyataan, logika bertingkat — mudah dibaca."),
    q("w10-l1-q5", "Subquery yang ditaruh di daftar SELECT disebut...", ["Scalar subquery", "Join", "Union", "View"], 0, "Scalar subquery menghasilkan satu nilai per baris."),
    q("w10-l1-q6", "Subquery paling cocok untuk pertanyaan seperti...", ["Daftar semua siswa", "Siswa yang nilainya DI ATAS rata-rata", "Membuat tabel baru", "Menghapus kolom"], 1, "Bandingkan tiap baris dengan nilai agregat dari subquery."),
  ],
  "w10-l2": [
    q("w10-l2-q1", "`WHERE id IN (SELECT ...)` cocok ketika subquery menghasilkan...", ["Satu nilai", "Daftar nilai", "Selalu kosong", "Hanya NULL"], 1, "IN menerima banyak nilai dari subquery."),
    q("w10-l2-q2", "Banyak kasus subquery sederhana bisa diganti dengan...", ["JOIN", "INSERT", "CREATE", "DROP"], 0, "Subquery IN sering bisa ditulis ulang sebagai JOIN."),
    q("w10-l2-q3", "JOIN lebih tepat daripada subquery ketika...", ["Butuh kolom dari tabel lain di hasil", "Butuh satu angka pembanding", "Menghapus data", "Mengurutkan saja"], 0, "Kalau kolom tabel lain harus tampil, JOIN pilihan alami."),
    q("w10-l2-q4", "`NOT IN (SELECT x ...)` bisa jebakan ketika...", ["Subquery lambat", "Hasil subquery mengandung NULL — hasil bisa kosong semua", "Tabelnya kecil", "Ada index"], 1, "NULL dalam NOT IN membuat perbandingan tak pernah TRUE."),
    q("w10-l2-q5", "Mencari siswa yang TIDAK ada di tabel alumni dengan subquery ditulis...", ["WHERE id NOT IN (SELECT student_id FROM alumni)", "WHERE id IN alumni", "JOIN alumni", "WHERE alumni = 0"], 0, "NOT IN + subquery daftar id."),
    q("w10-l2-q6", "Membaca query bersarang paling mudah dilakukan dengan...", ["Membaca dari tengah (subquery) ke luar", "Membaca mundur", "Skip subquery", "Hitung kurung saja"], 0, "Pahami dulu hasil subquery, baru logika query luar."),
  ],
  "w10-l3": [
    q("w10-l3-q1", "Untuk mendapat NILAI TERENDAH, arah ORDER BY yang tepat adalah...", ["DESC", "ASC", "LIMIT 0", "GROUP BY"], 1, "ASC mengurutkan kecil → besar, baris pertama yang terkecil."),
    q("w10-l3-q2", "Nilai TERtinggi tiap kelas didapat dengan...", ["MAX(score) GROUP BY class_id", "MAX(score) saja", "ORDER BY score", "LIMIT 1"], 0, "Agregat MAX + pengelompokan per kelas."),
    q("w10-l3-q3", "Pola \"top-N per grup\" menggabungkan...", ["GROUP BY + ORDER BY + LIMIT (sering via subquery/JOIN)", "INSERT + UPDATE", "DISTINCT saja", "WHERE saja"], 0, "Kelompokkan, urutkan dalam grup, ambil N teratas."),
    q("w10-l3-q4", "Harga termurah per kategori produk adalah...", ["MIN(price) GROUP BY category", "MIN(price) tanpa GROUP", "ORDER BY price LIMIT 1 saja", "AVG(price)"], 0, "MIN per grup kategori."),
    q("w10-l3-q5", "MIN/MAX juga bekerja pada tipe data...", ["Hanya angka", "Angka, tanggal, bahkan teks (urutan alfabet)", "Hanya teks", "Hanya tanggal"], 1, "Semua tipe yang punya urutan alami."),
    q("w10-l3-q6", "Siswa dengan nilai paling rendah (satu orang) diambil dengan...", ["ORDER BY score ASC LIMIT 1", "MIN saja tanpa SELECT", "GROUP BY student", "WHERE score = MIN"], 0, "Urutkan menaik, ambil satu."),
  ],

  /* ---------------- WORLD 11 — Database Architect ---------------- */
  "w11-l1": [
    q("w11-l1-q1", "Dalam perancangan database, 'Siswa' yang datanya perlu disimpan paling tepat disebut...", ["Attribute", "Entity", "Record", "Index"], 1, "Siswa adalah entity — benda yang datanya disimpan. Nama/NIS adalah attribute-nya."),
    q("w11-l1-q2", "Attribute adalah...", ["Benda yang datanya disimpan", "Karakteristik dari entity", "Tabel jembatan", "Perintah SQL"], 1, "Attribute = sifat/ciri entity, mis. nama dan tanggal lahir siswa."),
    q("w11-l1-q3", "Saat diimplementasikan, entity menjadi...", ["Kolom", "Tabel", "Baris", "Database"], 1, "Entity → tabel, attribute → kolom, tiap instance → baris."),
    q("w11-l1-q4", "Contoh attribute dari entity Buku adalah...", ["Judul dan pengarang", "Perpustakaan", "Rak buku", "Sistem"], 0, "Judul/pengarang adalah ciri buku itu sendiri."),
    q("w11-l1-q5", "Menentukan entity dimulai dari...", ["Daftar kata benda penting yang datanya perlu disimpan", "Daftar query", "Daftar user", "Daftar warna UI"], 0, "Cari 'benda' yang datanya dicatat — itu kandidat entity."),
    q("w11-l1-q6", "Satu entity dalam database berisi banyak...", ["Tabel", "Baris (banyak instance)", "Database", "Server"], 1, "Satu tabel entity menyimpan banyak instance-nya sebagai baris."),
  ],
  "w11-l2": [
    q("w11-l2-q1", "Kolom `transactions.product_id` menunjuk ke `products.id`. Nama perannya?", ["Primary Key", "Foreign Key", "Index", "Alias"], 1, "Kolom yang menunjuk PK tabel lain disebut foreign key."),
    q("w11-l2-q2", "Pilihan Primary Key paling ideal adalah...", ["Angka unik yang tidak pernah berubah", "Email yang bisa diganti", "Nama lengkap", "Nomor HP"], 0, "PK ideal: unik, stabil, sederhana — id angka otomatis."),
    q("w11-l2-q3", "Kenapa email kurang cocok jadi Primary Key?", ["Email pasti duplikat", "Email bisa berubah dan panjang", "Email tidak unik", "Email hanya untuk login"], 1, "Data yang bisa berubah jangan dijadikan pengenal permanen."),
    q("w11-l2-q4", "Key buatan sistem (mis. id auto-increment) disebut...", ["Natural key", "Surrogate key", "Foreign key", "Super key"], 1, "Surrogate key = pengenal buatan tanpa makna bisnis — stabil."),
    q("w11-l2-q5", "NIS siswa yang memang unik di dunia nyata disebut...", ["Surrogate key", "Natural key", "Foreign key", "Composite key"], 1, "Natural key datang dari dunia nyata (NIS, ISBN)."),
    q("w11-l2-q6", "PK gabungan dua kolom (composite) dipakai biasanya di...", ["Tabel jembatan relasi N:M", "Tabel master", "View", "Index"], 0, "Tabel jembatan sering pakai pasangan FK sebagai kunci gabungan."),
  ],
  "w11-l3": [
    q("w11-l3-q1", "ERD adalah singkatan dari...", ["Entity Relationship Diagram", "Easy Report Data", "Extended Relational Database", "Element Record Design"], 0, "Diagram untuk merancang entity dan relasinya."),
    q("w11-l3-q2", "Garis berlabel 1 — N pada ERD berarti relasi...", ["One to One", "One to Many", "Many to Many", "Tidak ada relasi"], 1, "Satu di sisi pertama, banyak di sisi kedua."),
    q("w11-l3-q3", "Relasi Many to Many pada ERD diselesaikan di implementasi dengan...", ["Menggabungkan dua tabel jadi satu", "Tabel jembatan", "Menghapus relasi", "Menambah kolom teks"], 1, "N:M selalu dipecah lewat tabel jembatan."),
    q("w11-l3-q4", "Simbol 'kaki gagak' (crow's foot) di ujung garis ERD menandakan sisi...", ["Satu", "Banyak (many)", "Opsional saja", "Kunci utama"], 1, "Crow's foot = many."),
    q("w11-l3-q5", "Membaca ERD sebelum menulis query penting agar...", ["Kita tahu tabel apa saja, kolomnya, dan bagaimana mereka terhubung", "Query jalan lebih cepat", "Tidak perlu WHERE", "Data jadi benar"], 0, "Struktur dulu, baru query — tidak menebak-nebak nama kolom."),
    q("w11-l3-q6", "Pada ERD sekolah, relasi students — scores hampir pasti berlabel...", ["1 — N (satu siswa banyak nilai)", "1 — 1", "N — M langsung", "Tidak berhubungan"], 0, "Satu siswa punya banyak baris nilai."),
  ],

  /* ---------------- WORLD 12 — Normalization Lab ---------------- */
  "w12-l1": [
    q("w12-l1-q1", "Data yang sama disimpan berulang-ulang berujung pada...", ["Hemat storage", "Inkonsistensi dan boros tempat", "Query lebih cepat", "Tampilan bagus"], 1, "Duplikasi = rawan tidak sinkron dan membuang storage."),
    q("w12-l1-q2", "Anomali update terjadi ketika...", ["Mengubah satu fakta harus mengubah banyak baris", "Data terlalu sedikit", "Query terlalu cepat", "Tabel terlalu kecil"], 0, "Satu fakta tersebar di banyak baris = update berisiko lupa."),
    q("w12-l1-q3", "Tujuan utama normalisasi adalah...", ["Mempercantik tabel", "Merapikan struktur dan mengurangi duplikasi", "Memperbanyak tabel sebanyak mungkin", "Menghapus data lama"], 1, "Struktur rapi → data konsisten."),
    q("w12-l1-q4", "Tabel yang belum diberi aturan normalisasi disebut bentuk...", ["1NF", "UNF (unnormalized form)", "3NF", "BCNF"], 1, "UNF = bentuk mentah sebelum normalisasi."),
    q("w12-l1-q5", "Proses normalisasi pada intinya adalah...", ["Menambah kolom teks", "Memecah tabel mengikuti aturan bertingkat", "Mengganti nama kolom", "Menambah index"], 1, "Pecah bertahap: UNF → 1NF → 2NF → 3NF."),
    q("w12-l1-q6", "Gejala tabel berantakan yang paling khas adalah...", ["Ada kolom id", "Banyak sel berisi daftar dan data berulang", "Nama tabel panjang", "Pakai MySQL"], 1, "Sel multi-nilai + duplikasi = sinyal kuat butuh normalisasi."),
  ],
  "w12-l2": [
    q("w12-l2-q1", "Syarat utama 1NF adalah...", ["Semua nilai atom — tidak ada daftar dalam satu sel", "Tabel harus punya 3 kolom", "Semua kolom angka", "Tidak boleh ada NULL"], 0, "1NF: satu sel satu nilai."),
    q("w12-l2-q2", "Kolom `hobi` berisi \"renang, futsal\" melanggar...", ["1NF", "2NF saja", "3NF saja", "Tidak melanggar apa pun"], 0, "Dua nilai dalam satu sel = bukan atom."),
    q("w12-l2-q3", "Solusi kolom multi-nilai adalah...", ["Tambah kolom hobi2, hobi3", "Pecah ke tabel terpisah dengan foreign key", "Gabung jadi satu teks panjang", "Hapus datanya"], 1, "Tabel baru (student_hobbies) + FK — bukan kolom tambahan."),
    q("w12-l2-q4", "Nilai atom memudahkan hal ini:", ["Menampilkan data", "Memfilter: WHERE hobi = 'renang'", "Menyimpan lebih cepat", "Mencetak laporan"], 1, "Kalau hobi digabung teks, pencarian per hobi jadi sulit."),
    q("w12-l2-q5", "Kelompok data berulang (repeating groups) diselesaikan dengan...", ["Baris tambahan di tabel sama", "Tabel baru + relasi", "Kolom baru", "Index"], 1, "Pindahkan pengulangan ke tabel sendiri."),
    q("w12-l2-q6", "Contoh pelanggaran 1NF lain adalah...", ["Kolom no_telepon berisi \"0812..., 0857...\"", "Kolom nama berisi satu nama", "Ada kolom id", "Ada foreign key"], 0, "Banyak nomor dalam satu sel — bukan atom."),
  ],
  "w12-l3": [
    q("w12-l3-q1", "2NF mensyaratkan 1NF plus...", ["Tidak ada ketergantungan parsial pada bagian PK composite", "Semua kolom teks", "Tidak ada NULL", "Minimal 3 tabel"], 0, "Kolom non-kunci harus bergantung pada SELURUH PK."),
    q("w12-l3-q2", "3NF melarang...", ["Ketergantungan transitif antar kolom non-kunci", "Foreign key", "Primary key angka", "Tabel kecil"], 0, "Non-kunci tidak boleh bergantung pada non-kunci lain."),
    q("w12-l3-q3", "Kolom `harga_produk` disimpan ulang di tabel penjualan padahal sudah ada di products. Ini melanggar...", ["3NF", "1NF", "Bukan pelanggaran", "2NF saja selalu"], 0, "harga_produk bergantung pada product_id (non-kunci → fakta tabel lain) — transitif."),
    q("w12-l3-q4", "Solusi tepat kasus harga di tabel penjualan adalah...", ["Simpan product_id saja; harga tinggal di products", "Duplikat saja asal cepat", "Tambah kolom harga2", "Hapus products"], 0, "Fakta produk hidup di tabel produk."),
    q("w12-l3-q5", "Manfaat terbesar 3NF adalah...", ["Update satu tempat — tidak ada versi fakta yang bertabrakan", "Tabel jadi banyak", "Query pasti cepat", "Tidak perlu backup"], 0, "Satu fakta satu tempat = konsistensi."),
    q("w12-l3-q6", "Normalisasi berlebihan sampai puluhan tabel kecil bisa menyebabkan...", ["Query jadi rumit karena banyak JOIN", "Data rusak", "Tidak bisa insert", "MySQL error"], 0, "Normalisasi sampai 3NF umumnya cukup; jangan ekstrem tanpa alasan."),
  ],

  /* ---------------- WORLD 13 — Performance Lab ---------------- */
  "w13-l1": [
    q("w13-l1-q1", "SELECT * pada tabel berjuta baris itu mahal karena...", ["MySQL harus mengangkut semua kolom & baris", "Bintangnya berat", "Nama kolom panjang", "Tabel besar pasti error"], 0, "Data yang tidak perlu tetap dibaca dan dikirim."),
    q("w13-l1-q2", "Query TANPA WHERE pada tabel besar akan...", ["Full table scan — baca seluruh tabel", "Otomatis cepat", "Berhenti di 100 baris", "Ditolak MySQL"], 0, "Tanpa filter, semua baris diperiksa."),
    q("w13-l1-q3", "Faktor utama kecepatan sebuah query adalah...", ["Jumlah data yang discan dan ada/tidaknya index", "Versi MySQL saja", "Warna tema editor", "Panjang nama tabel"], 0, "Makin sedikit yang discan, makin cepat."),
    q("w13-l1-q4", "Cara yang benar untuk mengetahui query lambat adalah...", ["Merasa saja", "Menguji dengan data besar / melihat execution plan (EXPLAIN)", "Menanya teman", "Restart server"], 1, "Ukur, jangan menebak."),
    q("w13-l1-q5", "Kenapa LIMIT membantu performa?", ["MySQL berhenti begitu baris yang diminta cukup", "Menghapus data", "Membuat index otomatis", "Memperkecil tabel"], 0, "LIMIT memotong pekerjaan lebih awal."),
    q("w13-l1-q6", "Kebiasaan yang bikin aplikasi melambat seiring waktu adalah...", ["Query SELECT * di setiap halaman tanpa filter", "Pakai WHERE", "Pakai index", "Normalisasi"], 0, "Semakin besar data, semakin terasa bebannya."),
  ],
  "w13-l2": [
    q("w13-l2-q1", "Index itu seperti...", ["Daftar isi buku — lompat langsung ke halaman yang dicari", "Sampul buku", "Halaman acak", "Penutup buku"], 0, "Index memungkinkan MySQL lompat ke data tanpa membaca semuanya."),
    q("w13-l2-q2", "Index mempercepat operasi...", ["WHERE dan JOIN pada kolom terindeks", "INSERT", "DROP", "CREATE"], 0, "Pencarian dan penggabungan pada kolom terindeks jadi jauh lebih cepat."),
    q("w13-l2-q3", "Efek samping index adalah...", ["INSERT/UPDATE jadi sedikit lebih lambat karena index ikut diperbarui", "Data hilang", "Tabel terkunci", "Query error"], 0, "Index = trade-off: baca cepat, tulis sedikit lebih mahal."),
    q("w13-l2-q4", "Kolom yang paling pantas diberi index adalah...", ["Yang sering dipakai di WHERE/JOIN", "Semua kolom sekaligus", "Kolom foto", "Kolom catatan panjang"], 0, "Index kolom yang paling sering dicari/dihubungkan."),
    q("w13-l2-q5", "Primary Key otomatis...", ["Terindeks", "Tanpa index", "Dihapus otomatis", "Diubah MySQL"], 0, "PK selalu punya index bawaan."),
    q("w13-l2-q6", "Index pada tabel kecil (puluhan baris) biasanya...", ["Tidak terasa bedanya", "Wajib", "Merusak data", "Dilarang"], 0, "Index terasa di data besar; di tabel kecil dampaknya minimal."),
  ],
  "w13-l3": [
    q("w13-l3-q1", "Prinsip query hemat adalah...", ["Kolom pas + WHERE pas + LIMIT bila perlu", "Selalu SELECT *", "Tanpa WHERE supaya cepat", "Ambil semua lalu saring di aplikasi"], 0, "Ambil seperlunya — biarkan database yang menyaring."),
    q("w13-l3-q2", "Preview 10 data terbaru dari tabel besar sebaiknya...", ["SELECT * tanpa LIMIT", "SELECT kolom perlu + ORDER BY + LIMIT 10", "Ambil semua lalu potong di JavaScript", "COUNT dulu 10 kali"], 1, "Saring dan batasi di sisi database."),
    q("w13-l3-q3", "Untuk sekadar tahu berapa barisnya, gunakan...", ["SELECT * lalu hitung sendiri", "COUNT(*)", "LIMIT 999999", "SUM"], 1, "COUNT menghitung di server tanpa mengangkut data."),
    q("w13-l3-q4", "Menyaring data di aplikasi (bukan di WHERE) berakibat...", ["Data mentah ikut terkirim — boros jaringan & memori", "Lebih aman", "Lebih cepat selalu", "Index aktif"], 0, "Biarkan WHERE yang bekerja di dekat data."),
    q("w13-l3-q5", "Kolom yang TIDAK dipakai aplikasi sebaiknya...", ["Ikut di-SELECT saja asal lengkap", "Tidak diambil dalam query", "Dihapus dari tabel", "Diubah jadi NULL"], 1, "Query hanya kolom yang benar-benar ditampilkan."),
    q("w13-l3-q6", "Pagination yang sehat memakai...", ["LIMIT + OFFSET (atau keyset)", "Mengambil semua data tiap halaman", "Refresh penuh tanpa LIMIT", "Menyimpan semua di localStorage"], 0, "LIMIT/OFFSET memecah hasil jadi halaman."),
  ],

  /* ---------------- WORLD 14 — Transaction ---------------- */
  "w14-l1": [
    q("w14-l1-q1", "Transaksi database adalah...", ["Rangkaian operasi yang sukses SEMUA atau gagal SEMUA", "Satu query saja", "Backup otomatis", "Koneksi internet"], 0, "Prinsip all-or-nothing."),
    q("w14-l1-q2", "Contoh operasi yang wajib pakai transaksi adalah...", ["Transfer saldo: kurangi A, tambah B", "SELECT daftar siswa", "Melihat tanggal", "Menampilkan logo"], 0, "Dua perubahan yang harus terjadi bersama."),
    q("w14-l1-q3", "Jika langkah kedua transfer gagal, maka...", ["Langkah pertama dibatalkan (rollback)", "Langkah pertama tetap tersimpan", "Server mati", "Data digandakan"], 0, "Gagal sebagian tidak boleh terjadi."),
    q("w14-l1-q4", "Sifat 'sekali jalan utuh' transaksi disebut...", ["Atomicity", "Duplikasi", "Indexing", "Sorting"], 0, "Atomic = tak terbagi: sukses utuh atau batal utuh."),
    q("w14-l1-q5", "Tanpa transaksi, transfer yang gagal di tengah bisa menyebabkan...", ["Uang berkurang dari A tapi tidak masuk ke B", "Saldo bertambah sendiri", "Tidak ada efek", "Bank otomatis memperbaiki"], 0, "Inilah bencana yang dicegah transaksi."),
    q("w14-l1-q6", "Transaksi berlaku pada...", ["Satu database/sesi kerja yang sama", "Dua server berbeda otomatis", "Semua aplikasi", "Hanya SELECT"], 0, "Operasi dalam satu transaksi berada di satu konteks database."),
  ],
  "w14-l2": [
    q("w14-l2-q1", "Perintah yang membuat perubahan menjadi PERMANEN adalah...", ["COMMIT", "ROLLBACK", "SAVE", "CLOSE"], 0, "COMMIT mengunci perubahan."),
    q("w14-l2-q2", "Perintah yang membatalkan transaksi kembali ke kondisi awal adalah...", ["COMMIT", "ROLLBACK", "UNDO TABLE", "RESET DB"], 1, "ROLLBACK membatalkan semua perubahan transaksi itu."),
    q("w14-l2-q3", "Transaksi dimulai dengan...", ["START TRANSACTION / BEGIN", "OPEN DB", "RUN", "GO"], 0, "START TRANSACTION (atau BEGIN) membuka blok transaksi."),
    q("w14-l2-q4", "ROLLBACK paling tepat dipakai saat...", ["Ada langkah yang gagal atau data tidak valid", "Semua sukses", "Setelah COMMIT", "Saat server mati saja"], 0, "Deteksi gagal → batalkan rapi."),
    q("w14-l2-q5", "Setelah COMMIT dijalankan, ROLLBACK akan...", ["Tidak bisa membatalkan lagi", "Masih bisa", "Menghapus tabel", "Restart transaksi"], 0, "COMMIT = titik tidak kembali."),
    q("w14-l2-q6", "Urutan hidup transaksi yang benar adalah...", ["START → operasi → COMMIT/ROLLBACK", "COMMIT → START → operasi", "Operasi → START → COMMIT", "ROLLBACK → START"], 0, "Buka, kerjakan, tutup dengan COMMIT atau ROLLBACK."),
  ],
  "w14-l3": [
    q("w14-l3-q1", "Aturan praktis kapan butuh transaksi adalah...", ["Bila ada beberapa perubahan yang harus konsisten bersama", "Selalu, untuk SELECT pun", "Tidak pernah perlu", "Hanya untuk tabel besar"], 0, "Semakin banyak langkah kritis, semakin butuh transaksi."),
    q("w14-l3-q2", "Membuat order + mengurangi stok sebaiknya...", ["Satu transaksi", "Dua transaksi terpisah", "Tanpa validasi", "Dikerjakan user manual"], 0, "Order tanpa stok berkurang = data bohong."),
    q("w14-l3-q3", "Query SELECT tunggal untuk tampilan biasanya...", ["Tidak butuh transaksi", "Wajib transaksi", "Wajib ROLLBACK", "Dilarang"], 0, "Membaca saja — tidak mengubah data."),
    q("w14-l3-q4", "Pindah stok antar gudang tanpa transaksi berisiko...", ["Stok hilang di tengah jalan", "Stok berlipat", "Tidak ada risiko", "Gudang terkunci"], 0, "Kurangi berhasil, tambah gagal → stok menguap."),
    q("w14-l3-q5", "Pembayaran + pencatatan order idealnya...", ["Dalam satu transaksi agar keduanya utuh", "Dipisah jauh", "Dilakukan ganda", "Tanpa catatan"], 0, "Dua sisi dari satu kejadian bisnis."),
    q("w14-l3-q6", "Jika aplikasi crash di tengah transaksi yang belum COMMIT, maka...", ["Semua perubahan transaksi itu dibatalkan otomatis", "Setengah tersimpan", "Semua tersimpan", "Database rusak"], 0, "Tanpa COMMIT, tidak ada yang permanen."),
  ],

  /* ---------------- WORLD 15 — Security ---------------- */
  "w15-l1": [
    q("w15-l1-q1", "Password user di database sebaiknya disimpan sebagai...", ["Teks biasa (plaintext)", "Hash", "Base64", "Balik huruf saja"], 1, "Hash membuat kebocoran database tidak langsung membocorkan password."),
    q("w15-l1-q2", "Sifat fungsi hash adalah...", ["Satu arah — sulit dikembalikan ke aslinya", "Dua arah", "Selalu bisa didekripsi", "Hanya untuk angka"], 0, "Hash memang tidak dirancang untuk dibalik."),
    q("w15-l1-q3", "Kenapa plaintext password berbahaya?", ["DB bocor = semua password langsung ketahuan", "Membuat database lambat", "Melanggar HTML", "Tidak apa-apa sebenarnya"], 0, "Satu kebocoran, semua akun jatuh."),
    q("w15-l1-q4", "Contoh fungsi hash yang dirancang untuk password adalah...", ["bcrypt / argon2", "base64", "URL encode", "ROT13"], 0, "bcrypt/argon2 lambat secara sengaja — tahan brute force."),
    q("w15-l1-q5", "Saat login, yang dibandingkan adalah...", ["Hash password input vs hash tersimpan", "Password input vs hash tersimpan", "Panjang password saja", "Username saja"], 0, "Hash input, lalu bandingkan dengan hash di database."),
    q("w15-l1-q6", "Fungsi tambahan 'salt' pada hash password berarti...", ["Menambah data acak unik agar hash dua password sama tetap berbeda", "Menggarami data", "Mempercepat hash", "Menghapus password"], 0, "Salt menggagalkan tabel lookup (rainbow table)."),
  ],
  "w15-l2": [
    q("w15-l2-q1", "Prinsip least privilege adalah...", ["Memberi akses seminimal yang dibutuhkan", "Memberi semua akses ke semua orang", "Menghapus semua akses", "Akses bebas untuk admin saja"], 0, "Semakin kecil hak, semakin kecil kerusakan bila bocor."),
    q("w15-l2-q2", "`GRANT SELECT ON sekolah.* TO 'siswa'` artinya akun siswa hanya boleh...", ["Membaca data", "Menghapus tabel", "Membuat user", "Mengubah struktur"], 0, "SELECT saja — tidak bisa tulis maupun ubah struktur."),
    q("w15-l2-q3", "Akun yang dipakai aplikasi web sebaiknya...", ["Tidak punya hak DROP atau GRANT", "Punya semua hak biar praktis", "Sama dengan root", "Tanpa password"], 0, "Aplikasi jarang butuh menghapus tabel."),
    q("w15-l2-q4", "Akun root database dipakai untuk...", ["Administrasi oleh manusia, bukan aplikasi", "Koneksi harian aplikasi", "Login siswa", "Backup otomatis tiap detik"], 0, "Root terlalu kuat untuk dipakai aplikasi."),
    q("w15-l2-q5", "REVOKE digunakan untuk...", ["Menarik hak akses", "Memberi hak akses", "Menghapus tabel", "Mengganti password"], 0, "Kebalikan GRANT."),
    q("w15-l2-q6", "Kalau akun aplikasi bocor, kerusakan terburuknya dibatasi oleh...", ["Hak akses minimum akun itu", "Kecepatan server", "Ukuran database", "Nama akun"], 0, "Least privilege memperkecil ledakan."),
  ],
  "w15-l3": [
    q("w15-l3-q1", "SQL injection terjadi ketika...", ["Input user digabung mentah ke dalam query SQL", "Query terlalu cepat", "Lupa COMMIT", "Index terlalu banyak"], 0, "Input jadi bagian kode SQL = celahnya."),
    q("w15-l3-q2", "Input `' OR '1'='1` di form login berpotensi...", ["Membypass pengecekan password", "Mempercepat login", "Menghapus tabel", "Tidak berpengaruh"], 0, "Kondisi selalu benar → login tanpa password sah."),
    q("w15-l3-q3", "Pertahanan utama SQL injection adalah...", ["Prepared statement / parameterized query", "Menyembunyikan form", "Mengganti MySQL", "Matikan internet"], 0, "Parameter terpisah dari kode SQL."),
    q("w15-l3-q4", "Kenapa prepared statement aman?", ["Input diperlakukan sebagai nilai data, bukan dieksekusi sebagai SQL", "Input dienkripsi", "Input dihapus", "Server lebih cepat"], 0, "Struktur query sudah tetap; input hanya nilai."),
    q("w15-l3-q5", "Lapisan pertahanan tambahan yang tepat adalah...", ["Validasi input + akun database least privilege", "Menambah index", "SELECT *", "Matikan log"], 0, "Defensif berlapis: validasi + hak minimal."),
    q("w15-l3-q6", "Menggabungkan string input langsung ke query (concatenation) adalah...", ["Pola berbahaya yang harus dihindari", "Best practice", "Wajib di MySQL", "Hanya berbahaya di produksi"], 0, "Itulah pintu masuk klasik injection."),
  ],
};

/** Ambil pool soal untuk lesson (bisa null bila lesson belum punya bank). */
export function quizPoolFor(lessonId: string): QuizQuestion[] {
  return QUIZ_BANK[lessonId] ?? [];
}
