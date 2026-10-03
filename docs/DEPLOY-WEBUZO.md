# Deploy Frontend ke Webuzo Panel (VPS)

Panduan lengkap untuk mendaftarkan React SPA hasil build Vite ke **Webuzo** pada VPS sendiri.

> Frontend ini **statis**. Backend (Convex) tidak di-deploy ke VPS — tetap berjalan di Convex Cloud. Yang di-upload ke Webuzo hanya hasil build.

---

## Daftar Isi

1. [Yang perlu disiapkan](#1-yang-perlu-disiapkan)
2. [Penting: URL Convex di-pin di dalam bundle](#2-penting-url-convex-di-pin-di-dalam-bundle)
3. [Metode A — Build di komputer, upload ke VPS](#3-metode-a--build-di-komputer-upload-ke-vps)
4. [Metode B — Build di server VPS](#4-metode-b--build-di-server-vps)
5. [Konfigurasi SPA Routing (.htaccess)](#5-konfigurasi-spa-routing-htaccess)
6. [Cache &amp; Kompresi](#6-cache--kompresi)
7. [SSL / HTTPS](#7-ssl--https)
8. [Checklist verifikasi](#8-checklist-verifikasi)
9. [Update berikutnya](#9-update-berikutnya)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Yang perlu disiapkan

| Kebutuhan | Keterangan |
|---|---|
| VPS + Webuzo | Minimal 1 GB RAM, 1 CPU |
| Akses root / user dengan <!--管理 --> hak kelola Webuzo | Untuk membuat domain & SSL |
| Node.js **20+** (disarankan 22) | Untuk proses build |
| Bun **1.1+** | Manajer paket proyek ini |
| Domain | Sudah diarahkan (A record) ke IP VPS |

Semua perintah di bawah memakai **Bun**. Kalau hanya ada npm, ganti `bun install` → `npm install`, `bun run build` → `npm run build`.

---

## 2. Penting: URL Convex di-pin di dalam bundle

Aplikasi **tidak membaca** `VITE_CONVEX_URL` saat runtime. URL backend di-*hardcode* di:

```
src/lib/convex-url.ts  →  export const CONVEX_URL = "https://<deployment>.convex.cloud"
```

Konsekuensinya:

- Build di mana pun (komputer, VPS, CI) hasilnya **tetap** pointing ke deployment tersebut.
- Kalau Anda ingin memakai deployment Convex sendiri, **ubah konstanta itu sebelum build**, lalu build ulang.
- Tidak perlu membuat symlink, `.env`, atau konfigurasi apa pun di sisi server.

---

## 3. Metode A — Build di komputer, upload ke VPS

Paling umum dan paling mudah dikontrol.

### 3.1 Build di komputer

```bash
# 1. Ambil kode terbaru
git clone <url-repo> dq-mutuharjo
cd dq-mutuharjo

# 2. Pasang dependency
bun install

# 3. Pastikan tipe & style bersih (opsional tapi disarankan)
./node_modules/.bin/tsc -b --noEmit

# 4. Build
bun run build
```

Hasil build ada di folder **`dist/`**.

> **Catatan penting soal build command.** Skrip `build` di `package.json` menjalankan `tsc -b && vite build`. Di beberapa server yang tidak menyediakan `node_modules/.bin` di `PATH`, perintah `vite` akan gagal dengan `sh: 1: vite: not found`. Kalau begitu, jalankan langsung lewat file binernya:
>
> ```bash
> node ./node_modules/vite/bin/vite.js build
> ```
>
> Perintah ini hanya butuh `node` dan path relatif, jadi aman di hosting mana pun.

### 3.2 Cek isi build (opsional tapi berguna)

```bash
ls dist/
# Harus ada: index.html, assets/, robots.txt, sitemap.xml,
#            manifest.webmanifest, logo.svg, og/, lottie/
```

Kalau `robots.txt` atau `sitemap.xml` tidak ada di `dist/`, berarti `public/` tidak ikut terbawa — perbaiki sebelum lanjut.

### 3.3 Upload ke Webuzo

**Cara 1 — File Manager (paling mudah)**

1. Login Webuzo → menu **File Manager**
2. Masuk ke folder domain Anda, biasanya `/home/<user>/domains/<domain>/public_html`
3. Hapus isi default (`index.html`, `.htaccess`) bila ada
4. Upload file `dist.zip`
5. Klik kanan `dist.zip` → **Extract**
6. Buka hasil extract → pindahkan **seluruh isi** ke `public_html`
7. Hapus `dist.zip` dan folder `dist` yang tidak terpakai

**Cara 2 — SFTP/SCP (lebih cepat untuk file besar)**

Di Webuzo buka menu **SSH Access / Remote MySQL & FTP** untuk mendapatkan kredensial FTP/SFTP, lalu dari komputer:

```bash
# rsync dengan --delete supaya file lama ikut dihapus
rsync -avz --delete dist/ user@ip-vps:/home/user/domains/domain-anda/public_html/
```

Atau lewat SFTP biasa dengan WinSCP / FileZilla.

---

## 4. Metode B — Build di server VPS

Kalau tidak ingin upload `node_modules` berukuran besar.

### 4.1 Akses Terminal

Webuzo menyediakan **Terminal**. Masuk ke direktori aplikasi:

```bash
cd /home/user/apps/dq-mutuharjo
# atau folder tempat Anda menaruh source
```

### 4.2 Pasang Node.js & Bun

Webuzo biasanya punya **Application Manager → Node.js Selector** untuk memasang versi Node. Aktifkan **Node 22**, lalu:

```bash
node -v   # pastikan v20 atau lebih baru

# Pasang Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
bun -v
```

### 4.3 Build

```bash
git clone <url-repo> .
bun install
bun run build
```

### 4.4 Titik ke `public_html`

Build menghasilkan `dist/`. Supaya dilayani langsung oleh web server:

```bash
# Backup isi lama
mv /home/user/domains/domain-anda/public_html \
   /home/user/domains/domain-anda/public_html.bak

# Salin hasil build
cp -r dist /home/user/domains/domain-anda/public_html

# Pastikan index.html ada di root
ls /home/user/domains/domain-anda/public_html/index.html
```

---

## 5. Konfigurasi SPA Routing (.htaccess)

**Ini langkah yang paling sering terlewat.** Aplikasi memakai React Router. Tanpa aturan rewrite, membuka `https://domain-anda/hrd/candidates` langsung akan **404**, padahal halamannya ada.

Buat file `.htaccess` di `public_html`:

```apache
# ==================================================================
# Database Quest Warrior — SPA rewrite
# ==================================================================

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Jangan proses ulang index.html
  RewriteRule ^index\.html$ - [L]

  # File & folder yang benar-benar ada dilayani apa adanya
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Selain itu, teruskan ke SPA
  RewriteRule . /index.html [L]
</IfModule>

# ------------------------------------------------------------------
# Kompresi
# ------------------------------------------------------------------
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css text/javascript
  AddOutputFilterByType DEFLATE application/javascript application/json
  AddOutputFilterByType DEFLATE image/svg+xml application/xml
</IfModule>

# ------------------------------------------------------------------
# Cache: file ber-hash boleh di-cache lama, index.html tidak boleh
# ------------------------------------------------------------------
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/html                "access plus 0 seconds"
  ExpiresByType text/css                 "access plus 1 year"
  ExpiresByType application/javascript  "access plus 1 year"
  ExpiresByType image/svg+xml            "access plus 1 year"
  ExpiresByType image/png                "access plus 1 year"
  ExpiresByType image/webp               "access plus 1 year"
</IfModule>

# ------------------------------------------------------------------
# Keamanan dasar
# ------------------------------------------------------------------
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set X-Frame-Options "SAMEORIGIN"
</IfModule>
```

### Kalau web server-nya **NGINX** (bukan Apache/LiteSpeed)

`.htaccess` diabaikan. Taruh rules ini di **Webuzo → Web Server → Nginx Config** (atau file konfigurasi site):

```nginx
location / {
  try_files $uri $uri/ /index.html;
}

location /assets/ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location = /index.html {
  add_header Cache-Control "no-cache";
}
```

### PENTING — harus di root domain

`vite.config.ts` tidak meng-set `base`, jadi build mengasumsikan aplikasi berada di **root domain** (`https://domain-anda/`).

Kalau Anda ingin deploy ke subdirektori (`https://domain-anda/dqw/`), ubah dulu:

```ts
// vite.config.ts
base: "/dqw/",
```

lalu build ulang. Kalau tidak, semua asset akan gagal dimuat (404) dan aplikasi tampil putih.

---

## 6. Cache & Kompresi

Aturan di `.htaccess` di atas sudah menangani keduanya. Yang perlu dipahami:

| File | Cache | Alasan |
|---|---|---|
| `index.html` | **tidak di-cache** | Isinya menunjuk hash asset terbaru; kalau di-cache, user dapat versi lama |
| `assets/*.js`, `assets/*.css` | 1 tahun | Namanya ber-hash, jadi aman di-cache lama |
| `robots.txt`, `sitemap.xml` | pendek | Sering diubah saat menambah halaman |

Kalau user masih melihat versi lama setelah update: **hard refresh** (`Ctrl+Shift+R`) untuk memastikan bukan cache browser.

---

## 7. SSL / HTTPS

1. Webuzo → menu **SSL/TLS** (atau **Let's Encrypt**)
2. Pilih domain Anda → **Issue/Activate**
3. Tunggu sertifikat terpasang (biasanya < 1 menit)
4. Aktifkan **Force HTTPS / Redirect** supaya semua trafik dialihkan ke HTTPS

Sertifikat Let's Encrypt berlaku 90 hari dan biasanya di-perpanjang otomatis oleh Webuzo. Pastikan email admin domain valid supaya pengingat perpanjangan terkirim.

> Halaman HRD sudah tidak ada di `robots.txt` (`Disallow: /hrd`), tetapi tetap perlu login untuk diakses — jadi URLnya tidak bocor lewat mesin pencari.

---

## 8. Checklist verifikasi

Setelah upload, cek satu per satu. Buka URL-nya di browser dan lihat responsnya:

```bash
# 1. Halaman utama
curl -I https://domain-anda/

# 2. SPA routing — HARUS 200, bukan 404
curl -I https://domain-anda/hrd/register
curl -I https://domain-anda/dashboard

# 3. Aset ter-hash — HARUS 200 + Cache-Control panjang
curl -I https://domain-anda/assets/<nama-file>.js

# 4. SEO files
curl -I https://domain-anda/robots.txt
curl -I https://domain-anda/sitemap.xml
curl -I https://domain-anda/manifest.webmanifest

# 5. HTTPS aktif
curl -I http://domain-anda/   # harus redirect ke https
```

Lalu cek manual di browser:

- [ ] Halaman utama terbuka, styling termuat (bukan putih polos)
- [ ] `/hrd/register` bisa dibuka langsung lewat URL
- [ ] Login siswa/guru berfungsi
- [ ] Tidak ada error merah di console browser
- [ ] DevTools → Network: tidak ada request 404 ke `/assets/`
- [ ] DevTools → Console: tidak ada peringatan mixed content (http:// di halaman https)

---

## 9. Update berikutnya

Setiap kali ada perubahan kode:

```bash
git pull
bun install
bun run build
rsync -avz --delete dist/ user@ip-vps:/home/user/domains/domain-anda/public_html/
```

`--delete` penting supaya file lama dengan hash yang sudah tidak terpakai ikut terhapus — kalau tidak, folder akan terus menumpuk.

Kalau lewat File Manager, zip `dist/` lalu extract dan **timpa** file lama.

---

## 10. Troubleshooting

### Halaman putih / tidak ada styling

**Penyebab:** `base` salah, atau folder struktur salah.

**Cek:**
```bash
# harus ada tepat di root public_html
ls /home/user/domains/domain-anda/public_html/index.html
ls /home/user/domains/domain-anda/public_html/assets/ | head
```

Kalau `index.html` ada tapi di dalam `dist/`, berarti Anda meng-upload foldernya, bukan isinya.

---

### Refresh ke `/hrd/register` atau `/dashboard` → 404

**Penyebab:** rewrite SPA belum aktif.

**Cek:** `.htaccess` sudah ada di `public_html`? Kalau web server NGINX, `.htaccess` tidak berlaku — pakai blok `try_files` di atas.

---

### `vite: not found` saat build di server

**Penyebab:** `node_modules/.bin` tidak ada di `PATH`.

**Solusi:**
```bash
node ./node_modules/vite/bin/vite.js build
```

---

### Login gagal / error `[CONVEX M(...)] Server Error`

Bukan masalah VPS — ini sisi **backend Convex**.

- `auth:signIn` gagal → cek environment `JWKS` di deployment Convex (`npx convex auth list`, lalu `npx convex auth add` bila belum ada).
- Error pada query tertentu → periksa apakah query itu menulis ke database. Convex **melarang** query menulis; pindahkan logicanya ke mutasi.
- Function "not found" → functions belum di-push. Jalankan `bun convex dev --once`.

---

### Perubahan tidak muncul setelah upload

1. Hard refresh (`Ctrl+Shift+R`)
2. Cek nama file aset di `index.html` — kalau masih hash lama, berarti `dist/` yang di-upload bukan hasil build terbaru
3. Pastikan `rsync --delete` dipakai, atau file lama di `public_html` sudah dibersihkan

---

### Lottie / gambar tidak tampil

Folder `lottie/` dan `og/` ada di `public/`, jadi otomatis ikut ke `dist/`. Kalau hilang, pastikan Anda mengupload **seluruh isi** `dist/`, bukan hanya `index.html` dan `assets/`.

---

## Ringkasan

```
Kode  →  bun install  →  bun run build  →  dist/
                                              ↓
                          upload ke public_html (Webuzo)
                                              ↓
                            + .htaccess (SPA rewrite)
                                              ↓
                                        https://domain-anda
```

Backend tetap di Convex Cloud — tidak ada yang perlu di-install di VPS selain web server untuk menyajikan file statis.