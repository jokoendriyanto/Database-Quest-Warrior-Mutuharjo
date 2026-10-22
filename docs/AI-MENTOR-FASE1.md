# AI Mentor + Pengaturan Model AI — Fase 1 (Backend) & Fase 2 (UI)

Dokumen operasional untuk PRD `PRD_AI_Mentor_Database_Quest.md`.
Fase 1 mencakup: tabel, pencatatan attempt, service OpenAI-compatible, endpoint
AI Mentor, dan endpoint pengaturan model untuk guru.
Fase 2 (UI): panel AI Mentor di playground dan tab "Pengaturan Model AI" di
menu guru, lihat bagian 7.

---

## 1. Lingkup yang sudah diimplementasi

| Bagian | File | Status |
|---|---|---|
| Tabel `mentorHints`, `aiProviderProfiles`, `aiSettingsAudit` | `src/convex/schema.ts` | ✅ |
| `exerciseAttempts.errorMessage` (pemicu hint level 3 + evidence) | `src/convex/schema.ts`, `src/convex/game.ts` | ✅ |
| Pencatatan attempt otomatis | `src/convex/game.ts` (`submitExercise`) | ✅ sudah ada, ditambah `errorMessage` |
| Enkripsi API key (AES-256-GCM) | `src/lib/ai-crypto.ts` | ✅ |
| Klien OpenAI-compatible (chat + models + never-rules filter) | `src/lib/ai-provider.ts` | ✅ |
| Prompt builder (PRD 8.5, tanpa PII) | `src/lib/mentor-context.ts` | ✅ |
| Endpoint AI Mentor (`status`, `history`, `requestHint`) | `src/convex/mentor.ts`, `src/convex/mentorActions.ts` | ✅ |
| Endpoint pengaturan guru (CRUD, tes koneksi, aktivasi, models) | `src/convex/aiSettings.ts`, `src/convex/aiSettingsActions.ts` | ✅ |

### Keputusan mapping yang dipakai

- **D.1** Panel hint statis (`exercise.hints`) tetap berdampingan, tidak diganti.
- **D.2** Scope = exercise kurikulum (dipakai `SqlPlayground`). Studi kasus guru
  & Weekly Boss belum (bisa ditambah Fase lanjutan).
- **D.3** Hint AI ikut mengurangi multiplier XP — ditegakkan **server-side** di
  `game.ts` (client tidak bisa mengakali).

---

## 2. Migrasi tabel

**Tidak ada langkah SQL.** Convex adalah database dokument schemaless dengan
validator; "migrasi" = push schema baru. Tabel dibuat otomatis saat baris pertama
diinsert.

```bash
# Dari root project — push function + schema ke deployment
bun convex dev --once
```

Deployment aktif (di-pin di `src/lib/convex-url.ts`):
`https://whimsical-mouse-408.convex.cloud`

Schema baru bersifat **aditif** (tabel baru + 1 field optional). Data lama aman,
tidak ada field yang dihapus/diubah tipe.

---

## 3. Environment variables (wajib dibaca untuk fitur jalan)

Semua di-set di **deployment Convex**, bukan `.env` Freebuff. Dua cara:

```bash
# Cara CLI (dari root project)
bunx convex env set APP_ENCRYPTION_KEY '<random 32+ karakter>'
bunx convex env set AI_MENTOR_ENABLED 'true'
# Opsional — fallback jika guru belum buat profil di UI:
bunx convex env set MENTOR_BASE_URL 'https://api.groq.com/openai/v1'
bunx convex env set MENTOR_API_KEY '<key groq>'
bunx convex env set MENTOR_MODEL 'llama-3.3-70b-versatile'
```

Atau via Convex Dashboard → Deployment `whimsical-mouse-408` → Settings →
Environment Variables.

| Var | Wajib | Fungsi |
|---|---|---|
| `APP_ENCRYPTION_KEY` | Ya (untuk simpan key cloud) | Master key AES-256-GCM. Hilang = key tersimpan tak bisa dibuka. |
| `AI_MENTOR_ENABLED` | Ya (untuk nyalakan fitur) | Feature flag rollout (PRD 12). Default **OFF**; `true`/`1` menyalakan. |
| `MENTOR_BASE_URL` | Opsional | Fallback provider jika belum ada profil aktif. |
| `MENTOR_API_KEY` | Opsional | API key untuk fallback (boleh kosong untuk lokal). |
| `MENTOR_MODEL` | Opsional | Model untuk fallback. |

**Catatan:** tanpa `AI_MENTOR_ENABLED=true`, endpoint hint selalu menolak dan
panel (Fase 2) akan tersembunyi — ini disengaja supaya biaya AI tidak menyala
sebelum pilot siap.

---

## 4. Test manual via curl

Semua endpoint Convex bisa dipanggil via HTTP API:
`POST {CONVEX_URL}/api/{query|mutation|action}` dengan body
`{"path":"module:function","args":{...},"format":"json"}`.

### 4.1 Endpoint publik (tanpa auth) — sudah diverifikasi

```bash
CONVEX_URL="https://whimsical-mouse-408.convex.cloud"

# Status AI Mentor -> {"status":"success","value":{"enabled":false,"model":null}}
curl -s -X POST "$CONVEX_URL/api/query" -H 'Content-Type: application/json' \
  -d '{"path":"mentor:status","args":{},"format":"json"}'

# Riwayat hint (kosong untuk siswa tanpa riwayat)
curl -s -X POST "$CONVEX_URL/api/query" -H 'Content-Type: application/json' \
  -d '{"path":"mentor:history","args":{"exerciseId":"w4-class-xi1"},"format":"json"}'
```

### 4.2 Endpoint terproteksi — harus DITOLAK tanpa login

```bash
# Request hint tanpa auth -> error (belum login / flag off)
curl -s -X POST "$CONVEX_URL/api/action" -H 'Content-Type: application/json' \
  -d '{"path":"mentor:requestHint","args":{"exerciseId":"w4-class-xi1","level":1},"format":"json"}'

# Daftar profil guru tanpa auth -> error "Not authenticated"
curl -s -X POST "$CONVEX_URL/api/query" -H 'Content-Type: application/json' \
  -d '{"path":"aiSettings:list","args":{},"format":"json"}'
```

> Catatan: via curl API, error auth tampil sebagai `"Server Error"` (Convex
> menyamarkan detail dari klien tanpa hak admin). Pesan sebenarnya
> ("Not authenticated" / "Hanya guru/admin") terlihat di log server atau saat
> dipanggil dengan sesi login.

### 4.3 Endpoint yang butuh sesi login (guru)

`aiSettings:*` dan `mentor:requestHint` butuh token autentikasi Convex Auth.
Curl polos tidak punya sesi. Dua pilihan:

**A. Lewat dashboard (paling mudah untuk Fase 1).** Buka Convex Dashboard →
tab **Functions** → cari `aiSettings:testConnection` → jalankan dengan args,
login sebagai akun guru di sesi itu.

**B. Lewat curl dengan token.** Ambil token dari browser yang sudah login
(Application → Local Storage → kunci auth Convex), lalu:

```bash
curl -s -X POST "$CONVEX_URL/api/action" \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <USER_JWT>' \
  -d '{"path":"aiSettings:testConnection","args":{"baseUrl":"https://api.groq.com/openai/v1","apiKey":"<key>","model":"llama-3.3-70b-versatile"},"format":"json"}'
```

Test end-to-end alur siswa (gagal 2x -> hint 1 -> 2 -> 3) paling praktis lewat
UI Fase 2; di Fase 1 ini jalur server sudah teruji lewat guard + smoke test di
atas.

---

## 5. Verifikasi Fase 1 (sudah dijalankan)

| Check | Hasil |
|---|---|
| `bun convex dev --once` (push function + schema) | ✅ exit 0, functions ready |
| `bun tsc -b --noEmit` | ✅ exit 0 |
| `bunx eslint` (file AI Mentor baru) | ✅ exit 0 |
| `mentor:status` tanpa auth | ✅ `{enabled:false,model:null}` |
| `mentor:history` tanpa auth | ✅ `{hints:[]}` |
| `aiSettings:list` tanpa auth | ✅ ditolak "Not authenticated" |
| `mentor:requestHint` tanpa auth/flag | ✅ ditolak |
| Tidak ada em dash di string UI/output | ✅ (hanya di komentar kode) |## 6. Endpoint tambahan untuk kebutuhan UI (Fase 2)

| Endpoint | File | Fungsi |
|---|---|---|
| `mentor:progress` (query) | `src/convex/mentor.ts` | Progres per case: `failedAttempts`, `hintsUsed`, `nextLevel`, `cooldownRemaining`, `dailyRemaining`, `eligible`, `stuck`. Dipakai panel untuk state tombol dan kartu bantuan guru. |
| `aiSettings:remove` melempar `ConvexError` | `src/convex/aiSettings.ts` | Supaya pesan "profile_active" sampai ke UI guru (9.10 butuh pesan jelas). |

## 7. Fase 2 (UI) — sudah diimplementasi

| Bagian | File | Keterangan |
|---|---|---|
| Panel AI Mentor (PRD 8.9) | `src/components/AiMentorPanel.tsx` | Header + subtitle, bubble "Petunjuk 1/2/3", tombol "Minta Petunjuk" dengan state disabled/countdown/aktif, kartu "Minta bantuan guru" saat stuck, loading "AI Mentor lagi mikir...", error ramah tanpa detail teknis. |
| Pemasangan di halaman case/playground | `src/components/SqlPlayground.tsx` | Desktop: di bawah editor dan feedback. Mobile: tab "mentor". |
| Pengaturan Model AI (PRD 9.9) | `src/components/teacher/AiSettingsPanel.tsx` | Kartu profil aktif atau peringatan, daftar profil (key ter-mask 4 karakter terakhir), form preset + field 9.2, "Ambil daftar model", "Tes Koneksi" dengan area hasil, hapus dengan konfirmasi, riwayat audit. |
| Tab menu guru | `src/pages/TeacherPage.tsx` | Item "Pengaturan Model AI". |

Catatan:

- Panel AI Mentor **tidak tampil** selama `AI_MENTOR_ENABLED` off atau belum ada
  profil aktif/env fallback (perilaku ini memang diminta PRD 8.11 poin 8).
- API key tidak pernah dikirim utuh ke client: list hanya `api_key_last4`,
  input form hanya berisi ketikan guru sampai disimpan (terenkripsi).
- Tidak ada em dash di seluruh string UI fitur ini (PRD 10.3).

### Langkah melihat fitur hidup

```bash
bunx convex env set AI_MENTOR_ENABLED 'true'
# lalu buka /teacher -> Pengaturan Model AI -> Tambah Profil -> Tes Koneksi -> Simpan -> Aktifkan
# atau set fallback env: MENTOR_BASE_URL / MENTOR_API_KEY / MENTOR_MODEL
```
