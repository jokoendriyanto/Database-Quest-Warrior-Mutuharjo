# Glosarium Database Quest Warrior

**Bahan catatan buat anak SMK.** Semua istilah diambil dari materi World 01–15 di aplikasi Database Quest Warrior. Penjelasannya pakai bahasa sehari-hari, contohnya SQL beneran yang bisa langsung dicoba di sandbox.

---

## Cara pakai glosarium ini

1. Buka world yang lagi kamu kerjain di aplikasi.
2. Salin istilah + artinya ke catatannya kamu — formatnya sengaja pendek, tinggal tempel.
3. Ulangi bagian **Ingat!** — itu bagian yang paling sering jadi bahan kuis dan battle.
4. Contoh SQL-nya jangan cuma dibaca. Tempel ke sandbox, tekan **Run SQL**, lihat hasilnya.

---

## Peta 15 World

| # | World | Inti yang dipelajari | Istilah kunci |
|---|---|---|---|
| 01 | Database Is Everywhere | Kenalan sama data & database | data, tabel, baris, kolom, DBMS, SQL |
| 02 | Table Builder | Bikin tabel & memilih tipe data | CREATE TABLE, INT, VARCHAR, PRIMARY KEY |
| 03 | SELECT Adventure | Ambil data pertama kali | SELECT, FROM, `*` |
| 04 | Data Detective | Filter data | WHERE, LIKE, IN, BETWEEN |
| 05 | Sort It Out | Rapikan & pangkas hasil | ORDER BY, LIMIT, DISTINCT |
| 06 | CRUD Warrior | Tambah, ubah, hapus data | INSERT, UPDATE, DELETE |
| 07 | Relationship | Kaitkan antar tabel | Primary Key, Foreign Key, relasi |
| 08 | JOIN Battle | Gabungkan tabel | INNER JOIN, LEFT JOIN, NULL |
| 09 | Aggregate Arena | Hitung & kelompokkan | COUNT, SUM, AVG, GROUP BY |
| 10 | Subquery Dungeon | Query di dalam query | subquery, ORDER BY + LIMIT 1 |
| 11 | Database Architect | Rancang database | entity, attribute, ERD |
| 12 | Normalization Lab | Rapihin data berantakan | 1NF, 2NF, 3NF |
| 13 | Performance Lab | Bikin query cepat | INDEX, scan, LIMIT |
| 14 | Transaction | Amankan rangkaian perubahan | COMMIT, ROLLBACK |
| 15 | Security | Jaga data & akun | hashing, least privilege, SQL injection |

**Alur belajarnya:** World 01–06 = dasar (baca, tulis, urutkan data). World 07–10 = data bersaudara (relasi, gabung, hitung). World 11–13 = berpikir seperti perancang (desain, rapi, cepat). World 14–15 = berpikir seperti profesional (aman & konsisten).

---

## World 01: Database Is Everywhere

Yang dipelajari: kenalan dulu sama data, database, dan kenapa ini ada di mana-mana.

- **Data** — fakta yang udah dicatat. Nama kamu, nilai ulangan, harga seblak hari ini, absensi kelas tadi pagi. Belum tentu rapi, tapi tetap data.
- **Database (DB)** — tempat nyimpan data yang udah terorganisir.
  - Analogi: **lemari arsip sekolah**. Lemarinya ya database-nya.
- **Tabel** — satu laci di dalam lemari. Contoh: `students`, `classes`, `scores`.
- **Baris (record)** — satu isian formulir di dalam laci. Satu siswa = satu baris.
- **Kolom (field)** — bagian yang kamu isi di formulir: nama, NIS, kelas. Kolom menentukan *lebar* tabel, jumlah data menentukan *tingginya*.
- **DBMS** (Database Management System) — program yang jadi penjaga lemarinya. MySQL, PostgreSQL, SQLite itu DBMS.
- **MySQL** — DBMS paling populer di dunia. WordPress, toko online, sistem sekolah banyak yang pakai.
- **SQL** (Structured Query Language) — bahasa buat ngobrol sama database. Nggak cuma MySQL: Oracle dan PostgreSQL juga ngerti SQL.

> **Ingat!** Kita bilang "database" buat *isi* lemarinya, "DBMS" buat *aplikasi* penjaganya. Di aplikasi quest ini kita pakai SQL lewat sandbox yang aman — salah ketik justru jadi bahan belajar.

---

## World 02: Table Builder

Yang dipelajari: membuat database, membuat tabel, memilih tipe data.

- **CREATE DATABASE** — perintah bikin database baru.

  ```sql
  CREATE DATABASE sekolah;
  ```

- **CREATE TABLE** — perintah bikin tabel beserta kolom-kolomnya.

  ```sql
  CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150)
  );
  ```

- **Tipe data** — jenis isi sebuah kolom, ibarat wadah. Pilih yang tepat sejak awal:

  | Tipe data | Buat apa | Contoh isi |
  |---|---|---|
  | `INT` | angka bulat | `42` |
  | `DECIMAL(10,2)` | uang / desimal | `8000.00` |
  | `VARCHAR(n)` | teks sampai n karakter | `'Andi Pratama'` |
  | `TEXT` | tulisan panjang | deskripsi produk |
  | `DATE` | tanggal | `'2026-08-25'` |
  | `BOOLEAN` | benar/salah | `TRUE` / `FALSE` |

- **VARCHAR(100)** — teks variabel dengan panjang maksimal 100 karakter.
- **PRIMARY KEY (PK)** — kolom identitas unik tiap baris. Wajib beda, gak boleh kosong. Kalau duplikat, MySQL bakal marah — itu fitur, bukan bug.

> **Ingat!** Salah tipe data = data berantakan di kemudian hari. Simpan uang di `INT`? Koma-nya ilang. Simpan tanggal di `VARCHAR`? Gak bisa diurutkan dengan bener.

---

## World 03: SELECT Adventure

Yang dipelajari: ambil data pertamamu dari database sekolah.

- **Query** — perintah yang kamu tulis buat minta data ke database.
- **SELECT** — ambil / lihat data. Ini jurus paling sering dipakai.
- **FROM** — dari tabel mana datanya diambil.
- **`*` (tanda bintang)** — artinya "semua kolom".
- **Kolom eksplisit** — menyebut nama kolom sendiri, bukan pakai `*`.

  ```sql
  SELECT * FROM students;            -- semua kolom
  SELECT name, email FROM students;  -- cuma dua kolom ini
  ```

- **Cara baca query:** `SELECT` → ambil, `*` → semua kolom, `FROM` → dari, `students` → tabelnya. Jadi: "Ambil semua data dari tabel students."

> **Ingat!** `SELECT *` enak buat eksplorasi, tapi di aplikasi sungguhan kita jarang menampilkan semuanya. Mau daftar kontak? Cukup `name` dan `email` — lebih ringan dan lebih rapi.

---

## World 04: Data Detective

Yang dipelajari: WHERE dan teman-temannya — filter data seperti detektif.

- **WHERE** — nyaring baris. Cuma ambil yang cocok sama syarat kamu.

  ```sql
  SELECT * FROM students WHERE class_id = 3;  -- siswa XI PPLG 1 saja
  ```

- **Operator pembanding:**

  | Operator | Arti |
  |---|---|
  | `=` | sama dengan (cukup satu `=`, bukan `==`) |
  | `!=` | tidak sama dengan |
  | `>` `>=` | lebih besar / lebih besar atau sama dengan |
  | `<` `<=` | lebih kecil / lebih kecil atau sama dengan |

- **AND / OR** — penggabung syarat. `AND` = dua-duanya harus bener. `OR` = salah satu cukup.
- **LIKE** — cari pola di dalam teks.
- **Wildcard `%`** — artinya "apa saja".

  ```sql
  WHERE email LIKE '%gmail.com'   -- diakhiri gmail.com
  WHERE email LIKE '%gmail%'      -- mengandung gmail di mana saja
  ```

- **IN** — cocokkan dengan daftar nilai: `WHERE class_id IN (1, 2)`.
- **BETWEEN ... AND** — ambil rentang nilai, dan **inklusif** — batas bawah dan atas ikut keambil.

  ```sql
  WHERE score BETWEEN 80 AND 90
  ```

> **Ingat!** Posisi `%` menentukan di mana "apa saja" boleh muncul. Detektif teliti itu keren. 🕵️

---

## World 05: Sort It Out

Yang dipelajari: ORDER BY, LIMIT, DISTINCT — rapikan dan pangkas hasil.

- **ORDER BY** — nyusun hasil query.
- **ASC** — urut menaik (kecil → besar). Ini urutan default.
- **DESC** — urut menurun (besar → kecil).

  ```sql
  SELECT * FROM scores ORDER BY score DESC LIMIT 5;  -- 5 nilai tertinggi
  ```

- **LIMIT** — batasi jumlah baris yang ditampilkan.
- **DISTINCT** — buang baris kembar (duplikat).

  ```sql
  SELECT DISTINCT class_id FROM students;  -- daftar kelas unik saja
  ```

- **Urutan penulisan yang bener:** `WHERE` dulu (kalau ada) → baru `ORDER BY` → paling akhir `LIMIT`.

> **Ingat!** Mau nilai TERENDAH? Pakai `ASC`. Mau tertinggi? `DESC`. Kebalikannya = hasilnya kebalik juga.

---

## World 06: CRUD Warrior

Yang dipelajari: INSERT, UPDATE, DELETE — plus kebiasaan amannya.

- **CRUD** — 4 gerakan dasar data: **C**reate (tambah), **R**ead (baca), **U**pdate (ubah), **D**elete (hapus).
- **INSERT INTO ... VALUES** — nambah baris baru.

  ```sql
  INSERT INTO students (id, name, class_id, email, gender)
  VALUES (14, 'Sinta Maharani', 3, 'sinta.m@sch.id', 'P');
  ```

  Aturan: string wajib pakai **kutip tunggal** `'Sinta Maharani'`; angka (`14`, `3`) polos aja. Sebutkan kolomnya secara eksplisit — lebih aman daripada mengandalkan urutan kolom tabel.

- **UPDATE ... SET** — ubah isi baris yang udah ada.

  ```sql
  UPDATE students SET email = 'budi.santoso@sch.id' WHERE id = 3;
  ```

- **DELETE FROM** — hapus baris.

  ```sql
  DELETE FROM scores WHERE score < 60;
  ```

- **WHERE** — penyelamatmu. Tanpa WHERE: UPDATE = **semua** baris keubah, DELETE = **seluruh isi tabel** lenyap. 😱
- **Kebiasaan emas:** sebelum UPDATE/DELETE, jalankan SELECT dengan WHERE yang sama dulu. Lihat baris mana yang bakal kena. Yakin? Baru eksekusi. Ini kebiasaan programmer profesional, bukan opsional.

  ```sql
  -- 1. Cek dulu
  SELECT * FROM students WHERE id = 3;
  -- 2. Baru ubah
  UPDATE students SET email = 'baru@sch.id' WHERE id = 3;
  ```

> **Ingat!** `DELETE FROM scores` tanpa WHERE = seluruh isi tabel habis. Selalu tulis WHERE!

---

## World 07: Relationship

Yang dipelajari: Primary Key, Foreign Key, dan relasi antar tabel.

- **Primary Key (PK)** — identitas unik sebuah baris, seperti NIS untuk siswa. Gak boleh kembar, gak boleh kosong.
- **Foreign Key (FK)** — kolom yang **menunjuk** ke PK tabel lain. Kayak kolom "kelas" di form siswa: gak berisi data kelas lengkap, cuma nunjuk ke tabel kelas.

  ```text
  students.class_id  ──menunjuk──▶  classes.id
  (Foreign Key)                      (Primary Key)
  ```

- **Relasi 1:1 (one-to-one)** — satu ↔ satu. Contoh: satu user punya satu profil.
- **Relasi 1:N (one-to-many)** — satu kelas punya banyak siswa.
- **Relasi N:M (many-to-many)** — banyak siswa mengambil banyak mapel, dan sebaliknya.
- **Tabel perantara (junction table)** — penjembatan relasi N:M. Di database sekolah: tabel `scores` yang isinya `student_id` + `subject_id`.

> **Ingat!** Relasi many-to-many **selalu** butuh tabel perantara. Kalau nemu desain tanpa itu, biasanya ada bau. 👃

---

## World 08: JOIN Battle

Yang dipelajari: INNER JOIN, LEFT JOIN — gabungkan tabel seperti pro.

- **JOIN** — gabungkan beberapa tabel jadi satu hasil. Dipakai saat data yang kamu butuh tersebar di beberapa tabel.
- **ON** — syarat penggabungnya.

  ```sql
  SELECT students.name, classes.name AS class_name
  FROM students
  INNER JOIN classes ON students.class_id = classes.id;
  ```

- **INNER JOIN** — cuma ambil baris yang **PUNYA pasangan** di kedua sisi. Siswa tanpa kelas? Gak muncul.
- **LEFT JOIN** — **SEMUA** baris tabel kiri dijaga, meski di kanan gak ada pasangan. Kolom kanannya jadi `NULL`.
- **NULL** — nilai kosong / "tidak ada".
- **IS NULL** — ngecek baris yang kosong. Ditulis `IS NULL`, **bukan** `= NULL`.
- **Alias (`AS`)** — nama pendek atau pengganti nama kolom hasil. Penting saat dua tabel punya kolom nama sama (misal `name`), biar hasilnya gak ketuker.

  ```sql
  SELECT students.name
  FROM students
  LEFT JOIN scores ON students.id = scores.student_id
  WHERE scores.score IS NULL;   -- siswa yang BELUM punya nilai
  ```

> **Ingat!** INNER = yang cocok aja. LEFT = kiri dipertahankan semuanya. LEFT JOIN + IS NULL = jurus cari "yang TIDAK punya apa-apa".

---

## World 09: Aggregate Arena

Yang dipelajari: COUNT, SUM, AVG, GROUP BY — berpikir seperti data analyst.

- **Agregat** — mengubah banyak baris jadi satu angka ringkasan.
- **COUNT(*)** — hitung jumlah baris.
- **SUM** — jumlahkan.
- **AVG** — rata-rata (otomatis melewati nilai NULL).
- **MIN / MAX** — nilai terkecil / terbesar.
- **GROUP BY** — kelompokkan baris sesuai kolom pilihanmu. Hasilnya: satu baris per grup.
- **Alias (`AS`)** — nama pendek buat kolom hasil hitungan.

  ```sql
  SELECT class_id, COUNT(*) AS total
  FROM students
  GROUP BY class_id;   -- jumlah siswa per kelas
  ```

- **Pola boso (boss) kantin:** JOIN dulu → GROUP BY → ORDER BY → LIMIT. Kombinasi semua skill dari awal!

  ```sql
  SELECT products.name, COUNT(*) AS total_transaksi
  FROM transactions
  INNER JOIN products ON transactions.product_id = products.id
  GROUP BY products.name
  ORDER BY total_transaksi DESC
  LIMIT 3;
  ```

> **Ingat!** Ingat SELECT aja cukup buat latihan. Di kerja nanti, ambil kolom yang memang dibutuhkan — lebih cepat dan hasilnya gampang dibaca.

---

## World 10: Subquery Dungeon

Yang dipelajari: query di dalam query — dan cara klasik menggantinya dengan JOIN.

- **Subquery** — query yang ditulis di dalam kurung di dalam query lain. Bagian dalam **jalan duluan**, hasilnya dipakai oleh query luar.

  ```sql
  SELECT name, price
  FROM products
  WHERE price > (SELECT AVG(price) FROM products);
  ```

  - Analogi: kamu mau beli HP di bawah harga rata-rata. Sebelum ke toko, kamu **catat dulu** angka rata-ratanya di ujung pensil. Catatan itu = subquery: dihitung dulu, dipakai kemudian.

- **Subquery vs JOIN** — banyak pertanyaan bisa dijawab dua cara. Contoh: "siswa yang punya nilai" bisa pakai `WHERE id IN (...)` atau pakai JOIN. Versi **JOIN lebih cepat dan lebih umum dipakai di production** — dan itu yang dipakai di latihan quest ini.

- **Pola ekstrem** — buat pertanyaan "termahal / tertinggi / termurah", gak wajib subquery. Urutkan, ambil paling atas:

  ```sql
  -- Produk termahal
  SELECT name, price FROM products ORDER BY price DESC LIMIT 1;

  -- Snack termurah
  SELECT name, price FROM products
  WHERE category_id = 3 ORDER BY price ASC LIMIT 1;
  ```

> **Ingat!** Yang teratas di hasil = hasil terurut. `DESC` buat cari yang terbesar, `ASC` buat cari yang terkecil, lalu `LIMIT 1`.

---

## World 11: Database Architect

Yang dipelajari: entity, attribute, ERD, dan rancang schema pertamamu.

- **Entity** — "benda" yang datanya perlu disimpan: Siswa, Produk, Transaksi. Di database: entity → **tabel**.
- **Attribute** — detail yang dicatat dari entity: nama, harga, stok. Di database: attribute → **kolom**. Satu kejadian entity → satu **baris**.

  ```text
  ENTITY: Produk
  ├── id          (PK)
  ├── name
  ├── category_id (FK → categories.id)
  ├── price
  ├── stock
  └── sold
  ```

- **ERD (Entity Relationship Diagram)** — peta database. Entity digambar kotak, relasi digambar garis.
- **Bentuk relasi di ERD:** `1:1` (satu-satu), `1:N` (satu ke banyak), `N:M` (banyak ke banyak — lewat tabel perantara!).
- **Junction table / tabel perantara** — menyimpan pasangan dari relasi N:M. Di quest ini kamu isi sendiri di latihan `scores`.

> **Ingat!** Sebelum bikin aplikasi (perpustakaan, kasir, kelas online), tentukan dulu: data apa saja yang disimpan (entity), detail apa yang dicatat (attribute), dan bagaimana tabelnya saling terhubung. Salah di fondasi = berantakan di atasnya.

---

## World 12: Normalization Lab

Yang dipelajari: UNF, 1NF, 2NF, 3NF — obat data berantakan.

- **Normalization** — seni nyimpen **satu fakta di satu tempat**, biar gak berulang dan gak kontradiksi.
  - Analogi: resep masakan yang baik menjelaskan "garam" sekali di bagian bahan — gak mengulang penjelasannya di tiap langkah.
- **UNF (Unnormalized Form)** — tabel mentah: data siswa, kelas, wali kelas dijejalkan jadi satu. Nama kelas ditulis berulang ratusan kali. Satu salah ketik = data kontradiksi.
- **1NF (First Normal Form)** — **nilai atom**: satu sel berisi satu nilai. `'coding, futsal'` di satu sel melanggar 1NF, karena susah dicari, dihitung, dan di-update.
- **2NF** — (sederhananya) semua kolom non-kunci bergantung penuh pada seluruh primary key. Relevan kalau PK-nya gabungan.
- **3NF** — kolom non-kunci tidak boleh saling bergantung satu sama lain.
- **Gejala gagal normalisasi** — data berulang yang seharusnya gak perlu.
- **Cek cepat pakai SQL:**

  ```sql
  -- Deteksi data kembar: kelompokkan, hitung, lihat yang > 1
  SELECT buyer_name, COUNT(*) AS jumlah
  FROM transactions
  GROUP BY buyer_name
  ORDER BY jumlah DESC;
  ```

> **Ingat!** Duplikat **gak selalu salah** — pembeli boleh aja belanja dua kali. Tapi data yang seharusnya unik (email, NIS, username) kalau kembar = alarm schema. Membedakan keduanya = skill architect. 🕵️

---

## World 13: Performance Lab

Yang dipelajari: Index, LIMIT, dan query yang gak buang-buang kerja.

- **Performa query** — seberapa cepat database menjawab. Di sandbox 13 baris terasa instan; bayangin tabel dengan **13 juta** baris.
- **Full scan (memindai seluruh tabel)** — database baca semua baris lalu buang sebagian besar. Mahal.
- **INDEX** — "daftar isi" database. Mencari "Basis Data" di buku 1000 halaman tanpa daftar isi = balik satu-satu. Dengan daftar isi = langsung lompat. Struktur tambahan yang bikin pencarian di kolom tertentu **melompat, bukan memindai**.

  ```sql
  CREATE INDEX idx_students_class ON students (class_id);

  -- query ini sekarang gak memindai seluruh tabel
  SELECT * FROM students WHERE class_id = 3;
  ```

- **Query hemat (3 kebiasaan):**
  1. Sebut kolom eksplisit — jangan `SELECT *` kalau cuma butuh dua kolom.
  2. Kasih `WHERE` biar cuma baca yang perlu.
  3. Pakai `LIMIT` buat memangkas baris.

  ```sql
  SELECT name, sold FROM products ORDER BY sold DESC LIMIT 3;
  ```

> **Ingat!** Index **bukan gratis** — tiap index memperlambat INSERT/UPDATE sedikit karena ikut dirawat. Pasang di kolom yang sering muncul di WHERE/JOIN, bukan semua kolom. Kebiasaan hemat juga = keamanan: query gak membocorkan kolom yang gak perlu. Dua burung satu batu. 🎯

---

## World 14: Transaction

Yang dipelajari: COMMIT, ROLLBACK — jaring pengaman data.

- **Transaction** — rangkaian operasi yang harus terjadi **semua atau tidak sama sekali** (all or nothing).
  - Contoh kasus: transfer uang — kurangi saldo A, tambah saldo B. Server mati di tengah jalan? Tanpa transaction, uangnya menguap.
- **START TRANSACTION** — mulai satu paket perubahan.

  ```sql
  START TRANSACTION;

  UPDATE accounts SET balance = balance - 50000 WHERE id = 1;
  UPDATE accounts SET balance = balance + 50000 WHERE id = 2;

  COMMIT;   -- sukses: semua diterapkan
  -- atau ROLLBACK;  -- gagal: semua dibatalkan
  ```

- **COMMIT** — tanda final. Semua perubahan di dalam transaction disimpan permanen.
- **ROLLBACK** — tombol batal. Database kembali ke kondisi terakhir yang aman, semua perubahan di paket itu gak jadi.
- **Kapan dipakai?** Tiap kali **dua perubahan harus konsisten bareng**: kurangi stok + catat transaksi, terima pembayaran + tandai pesanan lunas, daftar kursus + potong kuota. Satu UPDATE sendirian jarang butuh transaction — rangkaian yang saling bergantung **selalu** butuh.
  - Analogi: **save game sebelum boss fight**. Kalau kalah, tinggal load — bukan mulai dari awal. ROLLBACK itu tombol load-nya.

> **Ingat!** Belum di-COMMIT artinya belum final. Ada error di tengah jalan sebelum COMMIT? ROLLBACK membatalkan **seluruh** rangkaian — gak ada setengah-setengah.

---

## World 15: Security

Yang dipelajari: password hashing, hak akses, dan paham SQL injection.

- **Hashing** — mengubah password menjadi "sidik jari" satu arah. Dari orang bisa dibuat sidik jari; dari sidik jari **gak bisa** merekonstruksi orangnya. Password → hash juga begitu: gak bisa di-"un-hash".
- **Password hash** — inilah yang disimpan di database, bukan password aslinya.

  ```text
  JANGAN : password: 'rahasia123'
  BENAR  : password_hash: '$2b$12$KIXQ...pQ9O'   (contoh bcrypt)
  Login  : hash input pengguna, lalu bandingkan hash-nya
  ```

- **Least privilege** — prinsip: setiap pengguna database cuma dikasih hak yang **benar-benar dia perlukan**. Aplikasi kantin gak butuh DELETE tabel siswa. Akun laporan cukup SELECT.
- **GRANT** — perintah ngasih hak akses, bisa sampai per kolom:

  ```sql
  CREATE USER 'report_app'@'%' IDENTIFIED BY '...';
  GRANT SELECT ON sekolah.* TO 'report_app'@'%';

  -- bahkan bisa dibatasi per kolom:
  GRANT SELECT (name, class_id) ON sekolah.students
  TO 'report_app'@'%';
  ```

- **SQL Injection** — serangan klasik: input pengguna ditempel langsung ke query, sehingga penyerang bisa menyelipkan kondisi sendiri.

  ```text
  Kode rentan : "SELECT * FROM users WHERE name = '" + input + "'"
  Input jahat : ' OR '1'='1
  Hasilnya    : SELECT * FROM users WHERE name = '' OR '1'='1'
                → kondisi selalu benar → SEMUA baris bocor
  ```

- **Prepared statement (parameterized query)** — obatnya sesederhana itu: input diperlakukan sebagai **data**, bukan kode.

  ```sql
  stmt = db.prepare('SELECT * FROM users WHERE name = ?');
  stmt.execute([input]);
  ```

> **Ingat! Aturan emas:** JANGAN PERNAH merakit SQL dengan menggabungkan string input pengguna. Selalu pakai prepared statement — di framework mana pun.

---

## Cheat Sheet

### Urutan nulis query

```sql
SELECT kolom
FROM tabel
WHERE syarat_baris
GROUP BY pengelompokan
ORDER BY pengurutan
LIMIT jumlah_baris;
```

### Tipe data singkat

| Tipe | Buat |
|---|---|
| `INT` | angka bulat |
| `DECIMAL(10,2)` | uang |
| `VARCHAR(n)` | teks pendek–sedang |
| `TEXT` | tulisan panjang |
| `DATE` | tanggal |
| `BOOLEAN` | TRUE / FALSE |

### 7 kesalahan yang paling sering terjadi

1. Lupa `WHERE` di UPDATE/DELETE — semua baris kena.
2. Nulis `= NULL` — yang bener `IS NULL`.
3. String tanpa kutip tunggal (`'Sinta'`).
4. Urutan klausa asal tempel — `ORDER BY` harus setelah `WHERE`.
5. `SELECT *` di tabel raksasa tanpa LIMIT.
6. Nama kolom gak disebut asalnya pas JOIN (misal dua-duanya `name`) — kasih alias.
7. Ngerakit SQL dari input user — celah SQL injection.

### Beda yang sering ketuker

| Pasangan | Bedanya |
|---|---|
| `WHERE` vs `GROUP BY` | WHERE nyaring baris dulu; GROUP BY kelompokkan hasil |
| `INNER JOIN` vs `LEFT JOIN` | INNER: yang punya pasangan aja; LEFT: kiri dipertahankan semua |
| `DISTINCT` vs `GROUP BY` | DISTINCT buang kembar; GROUP BY kelompokkan buat dihitung |
| `ASC` vs `DESC` | ASC kecil→besar; DESC besar→kecil |
| Primary Key vs Foreign Key | PK = identitas unik baris sendiri; FK = penunjuk ke PK tabel lain |

### Istilah Inggris → Arti singkat

| Istilah | Arti |
|---|---|
| select | ambil / pilih |
| from | dari |
| where | di mana / dengan syarat |
| insert | sisipkan (tambah) |
| update | perbarui (ubah) |
| delete | hapus |
| join | gabungkan |
| group | kelompokkan |
| order | urutkan |
| limit | batasi |
| distinct | berbeda (tanpa kembar) |
| commit | simpan permanen |
| rollback | batalkan |
| grant | berikan hak |

---

## Cara nabung nilai dari glosarium ini

1. **Hari 1–3:** World 01–05. Kuasai baca & filter data dulu. Ini 60% soal battle.
2. **Hari 4–6:** World 06–09. Masuk zona nulis & menggabung — latihan boss di World 09 jadi ukuran kamu siap lanjut.
3. **Hari 7–9:** World 10–13. Bagian berpikir seperti developer: rancang, rapihin, cepetin.
4. **Hari 10:** World 14–15. Bagian profesional — sering muncul di tawaran kerja magang.

Tiap world: baca materi → catat istilahnya dari glosarium ini → kerjakan latihan sampai boss challenge kelar. Selamat bertualang! ⚔️
