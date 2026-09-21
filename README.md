# Task Management API (NestJS)

REST API untuk manajemen project dan task, dengan fitur AI Command: instruksi bahasa natural diubah AI menjadi operasi create/update Task, lalu dieksekusi dalam satu transaksi database.

## Stack

- NestJS + TypeScript (ditulis untuk NestJS 11, sudah dijalankan di NestJS 12.x)
- PostgreSQL 18 + TypeORM
- Redis (rate limiting endpoint AI)
- JWT (Passport) + bcrypt
- Zod (validasi struktur response AI)
- Gemini atau OpenAI, dipilih lewat env `AI_PROVIDER`

## Prasyarat

- Node.js dan npm (diuji di Node 24)
- Docker Desktop, dalam keadaan berjalan sebelum menjalankan `docker compose`
- Git
- API key untuk provider AI. Gemini bisa dibuat di https://aistudio.google.com/apikey
- Postman (opsional, untuk mencoba endpoint)

## Setup dan instalasi

Dari nol, urutannya begini:

```bash
git clone <url-repo> task-management-api
cd task-management-api

# 1. Salin template env, lalu isi nilai aslinya (lihat bagian Konfigurasi)
cp .env.example .env

# 2. Jalankan PostgreSQL dan Redis
docker compose up -d

# 3. Install dependency
npm install

# 4. Build, lalu isi data awal (seed). Seed cukup dijalankan sekali.
npm run build
npm run seed

# 5. Jalankan aplikasi
npm run start:dev
```

Aplikasi berjalan di `http://localhost:3000` (atau sesuai `APP_PORT`).

Beberapa hal yang sering bikin tersandung:

- Salin `.env.example` dengan `cp`, jangan di-rename. File contoh harus tetap ada di repo.
- Seed dijalankan dari hasil build, bukan lewat `tsx` atau `ts-node`. Alasannya, entity TypeORM butuh metadata decorator yang tidak dihasilkan `tsx` (error `ColumnTypeUndefinedError`). Script di `package.json`:

  ```json
  "seed": "node dist/database/seeders/seed.js"
  ```

- PostgreSQL di container dipetakan ke port host **5433**, bukan 5432, supaya tidak bentrok dengan PostgreSQL lokal (di Windows biasanya berjalan sebagai service `postgres.exe`). Kalau bentrok, seed dan aplikasi bisa diam-diam masuk ke database lokal, bukan ke container.

### docker-compose.yml

Kredensial database tidak ditulis langsung di compose file. Nilainya dibaca dari `.env` (Docker Compose otomatis membaca file `.env` di folder yang sama), jadi password di container dan di aplikasi selalu sama:

```yaml
services:
  postgres:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DATABASE_NAME}
      POSTGRES_USER: ${DATABASE_USER}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    ports:
      - "5433:5432"
    volumes:
      # PostgreSQL 18 memakai struktur direktori data baru,
      # volume dipasang di /var/lib/postgresql (bukan .../data)
      - postgres_data:/var/lib/postgresql

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## Konfigurasi .env

### .env.example

File ini yang masuk ke repo. Isinya hanya placeholder, tidak ada nilai asli:

```dotenv
APP_PORT=3000
NODE_ENV=development

DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=task_management
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

JWT_SECRET=change_this_to_a_long_random_string
# Format: angka + satuan, contoh 1d, 12h, 30m
JWT_EXPIRES_IN=1d

# Pilihan provider: openai | gemini
AI_PROVIDER=gemini
AI_API_KEY=your_api_key
# Model harus cocok dengan provider yang dipilih
AI_MODEL=gemini-3.6-flash

REDIS_HOST=localhost
REDIS_PORT=6379
```

Placeholder di atas sengaja dibuat tetap lolos validasi Joi (misalnya `JWT_SECRET` minimal 16 karakter), jadi aplikasi bisa boot setelah `cp` walau belum diisi. Tapi fitur AI tetap butuh `AI_API_KEY` yang asli.

### Penjelasan variabel

| Variabel | Wajib | Sensitif | Keterangan |
|---|---|---|---|
| `APP_PORT` | tidak | tidak | Port aplikasi, default 3000 |
| `NODE_ENV` | tidak | tidak | `development`, `production`, atau `test`. Selain `production`, TypeORM `synchronize` aktif |
| `DATABASE_HOST` | ya | tidak | `localhost` untuk Docker lokal |
| `DATABASE_PORT` | tidak | tidak | Port host hasil mapping Docker: `5433` |
| `DATABASE_NAME` | ya | tidak | Nama database |
| `DATABASE_USER` | ya | tidak | User database |
| `DATABASE_PASSWORD` | ya | **ya** | Dipakai juga oleh container lewat compose |
| `JWT_SECRET` | ya | **ya** | Minimal 16 karakter, lebih baik acak dan panjang |
| `JWT_EXPIRES_IN` | tidak | tidak | Masa berlaku token, default `1d` |
| `AI_PROVIDER` | tidak | tidak | `openai` atau `gemini` |
| `AI_API_KEY` | ya | **ya** | Key dari provider yang dipilih |
| `AI_MODEL` | tidak | tidak | Kalau kosong, kode memakai default per provider. Lebih aman diisi eksplisit |
| `REDIS_HOST`, `REDIS_PORT` | tidak | tidak | Default `localhost:6379` |

Tiga variabel bertanda sensitif itulah yang tidak boleh keluar dari mesin lokal.

Untuk provider OpenAI, ubah tiga baris ini:

```dotenv
AI_PROVIDER=openai
AI_API_KEY=<key openai>
AI_MODEL=gpt-4o-mini
```

### Membuat JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Aturan supaya .env tidak membocorkan data sensitif

File `.env` yang dipakai lokal memang berisi API key, password database, dan JWT secret. Yang perlu dijaga adalah file itu tidak pernah keluar dari mesin. Aturannya:

1. `.env` ada di `.gitignore`. Yang di-commit hanya `.env.example` dengan placeholder.
2. `docker-compose.yml`, `postman_collection.json`, dan kode sumber tidak boleh memuat password, key, atau token asli.
3. Kalau sebuah key pernah muncul di commit, log, screenshot, atau chat, anggap sudah bocor: cabut (revoke) di dashboard provider lalu buat yang baru. Menghapus dari commit terakhir tidak cukup, riwayat git tetap menyimpannya.

Cek sebelum push:

```bash
git ls-files | grep -i env                 # hanya .env.example yang boleh muncul
git check-ignore -v .env                   # harus menunjuk ke aturan di .gitignore
git log --all --full-history -- .env       # harus kosong (tidak pernah ter-commit)
git grep -nE "AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,}"   # cari pola key Gemini/OpenAI di file tracked
```

Kalau `postman_collection.json` di-export ulang setelah login, pastikan variabel `adminToken` dan `userToken` di dalamnya masih kosong.

## Menjalankan aplikasi

```bash
npm run start:dev                          # development, auto-reload
npm run build && npm run start:prod        # production
```

Reset database dari awal (semua data hilang):

```bash
docker compose down -v
docker compose up -d
npm run seed
```

Volume lama menyimpan password lama. Jadi kalau `DATABASE_PASSWORD` diganti setelah container pernah dibuat, `down -v` wajib dilakukan supaya password baru berlaku.

### Akun hasil seed

Hanya untuk pengujian lokal:

| Role | Email | Password |
|---|---|---|
| admin | admin@example.com | password123 |
| user | user@example.com | password123 |

Seed juga membuat satu project (`Website Revamp`, ID 1) dengan dua task. Seed tidak idempotent: menjalankannya dua kali akan gagal karena email sudah terdaftar.

### Mencoba lewat Postman

Import `postman_collection.json` dari root project. Request **Login Admin (seed)** dan **Login User (seed)** otomatis menyimpan token ke variabel collection `adminToken` dan `userToken`. Variabel itu bisa dilihat di tab Variables pada halaman collection (klik nama collection-nya).

### Endpoint

| Method | Endpoint | Akses |
|---|---|---|
| POST | `/register` | Publik |
| POST | `/login` | Publik |
| POST | `/projects` | Admin |
| GET | `/projects` | Admin, User |
| GET | `/projects/:id` | Admin |
| PUT | `/projects/:id` | Admin |
| DELETE | `/projects/:id` | Admin |
| GET | `/projects/:id/tasks` | Admin, User |
| POST | `/ai/command` | Admin, User (dibatasi rate limit) |

`POST` mengembalikan 201 kecuali `/login` yang mengembalikan 200.

Contoh AI Command (ganti `<accessToken>` dengan token hasil login):

```bash
curl -X POST http://localhost:3000/ai/command \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"prompt": "Buat task baru di project ID 1 dengan judul Fix Login Bug, assign ke user ID 2. Sekalian ubah status task ID 1 jadi done."}'
```

### Rate limit

`/ai/command` dibatasi 10 request per menit per user lewat Redis (`incr` di setiap request, sedangkan `expire` 60 detik hanya dipasang pada request pertama di tiap jendela). Request ke-11 dalam jendela yang sama mendapat 429. Kalau Redis mati, guard membiarkan request lewat (fail-open) supaya pengembangan tanpa Redis tidak terblokir.

### Memeriksa audit log

```bash
docker compose exec postgres psql -U postgres -d task_management \
  -c 'SELECT id, user_id, status, failed_reason FROM "audit-logs" ORDER BY id DESC LIMIT 5;'
```

Kalau tabel tidak ditemukan, lihat nama sebenarnya dengan `\dt` di dalam `psql`.

## Bagaimana prompt AI dirancang

Ide utamanya: prompt bukan satu-satunya pagar. LLM bisa salah atau dimanipulasi, jadi prompt hanya bertugas mengarahkan, sementara keamanan sebenarnya dijaga oleh kode.

Lapisan pertama adalah system prompt di `ai.service.ts`:

- Perannya dibuat sempit: mengubah instruksi bahasa natural menjadi daftar operasi CRUD pada tabel Task, tidak lebih.
- Format output dikunci ke JSON saja, tanpa teks tambahan, dengan struktur `{ "actions": [...] }`. Dua bentuk action ditulis eksplisit lengkap dengan field opsionalnya dan nilai enum (`todo | in_progress | done`, `low | medium | high`).
- Ada aturan larangan tertulis: hanya `create_task` dan `update_task`, tidak boleh ada operasi apa pun ke tabel User, tidak boleh ada field di luar skema.
- Untuk instruksi yang tidak berkaitan dengan Task, model diminta mengembalikan `{ "actions": [] }` daripada mengarang aksi.
- System prompt dan instruksi user dikirim sebagai pesan terpisah, jadi teks dari user tidak bercampur dengan aturan.

Di sisi pemanggilan, `temperature: 0` dipakai supaya output stabil, dan JSON mode provider diaktifkan (`response_format: json_object` untuk OpenAI, `responseMimeType: application/json` untuk Gemini).

Contoh instruksi dan bentuk output yang diharapkan:

```text
"Buat task baru di project ID 1 dengan judul 'Fix Login Bug', assign ke user ID 2.
 Sekalian ubah status task ID 1 jadi 'done'."
```

```json
{
  "actions": [
    { "action": "create_task", "data": { "project_id": 1, "title": "Fix Login Bug", "assignee_id": 2 } },
    { "action": "update_task", "task_id": 1, "data": { "status": "done" } }
  ]
}
```

Lapisan berikutnya ada di kode, dan ini yang benar-benar menentukan apa yang boleh terjadi:

| Lapisan | Fungsi |
|---|---|
| Parse JSON | Output yang bukan JSON valid ditolak dengan 400 |
| Zod discriminated union | Whitelist struktural: hanya `create_task` dan `update_task` yang dikenali parser. Action lain, termasuk apa pun yang menyentuh tabel User, tidak mungkin lolos karena union-nya memang tidak mendefinisikannya |
| Cek referensi di database | `project_id`, `task_id`, dan `assignee_id` dicek keberadaannya sebelum dieksekusi |
| Satu transaksi | Semua action jalan di dalam `dataSource.transaction()`. Kalau satu gagal, semuanya rollback |
| Audit log | Ditulis di luar transaksi utama, jadi hasil sukses maupun gagal (termasuk JSON tidak valid) tetap tercatat |

Cara membuktikan rollback: kirim prompt yang memuat satu action valid dan satu action ke ID yang tidak ada (misalnya task ID 9999). Hasilnya 400 `Task ID 9999 tidak ditemukan`, action yang valid tidak tersimpan, dan audit log berstatus `failed`.

## Troubleshooting

| Gejala | Penyebab | Solusi |
|---|---|---|
| `docker compose up` gagal | Docker Desktop belum berjalan | Buka Docker Desktop dulu |
| Data masuk ke database lokal, atau `password authentication failed` | Port 5432 bentrok, atau volume lama menyimpan password lama | Pakai port 5433, samakan password, lalu `docker compose down -v` |
| Aplikasi gagal boot dengan pesan Joi (`... is required`) | `.env` belum ada atau ada typo nama variabel | Cek `.env` terhadap `.env.example` dan `env.validation.ts` |
| `ColumnTypeUndefinedError` saat seed | Seed dijalankan lewat `tsx`/`ts-node` | `npm run build`, lalu `npm run seed` dari `dist` |
| TS1272 (tipe di parameter dengan decorator) | `isolatedModules` + `emitDecoratorMetadata` aktif | Impor tipe dengan `import type` |
| `Nest can't resolve dependencies of the AiRateLimitGuard (?)` | Circular import antara `redis.module.ts` dan `rate-limit.guard.ts` | Pindahkan konstanta token ke `redis.constants.ts` |
| `JwtAuthGuard (?)` atau `AuthModuleOptions` | Penyebab pastinya belum dikonfirmasi. Dugaan: ketidakcocokan versi antara kode (ditulis untuk Nest 11) dan runtime (Nest 12) | Periksa versi `@nestjs/*` dan `@nestjs/passport`. Menambah `PassportModule` di modul terkait dan mengosongkan constructor `JwtAuthGuard` sempat dicoba |
| 401 `Unauthorized` di `/ai/command` | Token tidak terkirim atau sudah kedaluwarsa | Login ulang, pastikan header `Authorization: Bearer <token>` |
| `fetch failed` | Host provider salah (mis. typo `api.openapi.com`), atau jaringan | Host yang benar `api.openai.com`; cek koneksi |
| 400 `Invalid AI command response` terus-menerus | Bisa dari kuota provider, jaringan, atau skema Zod tidak cocok | Lihat log server dan kolom `failed_reason` di audit log |
| `You exceeded your current quota` (Gemini) | Batas free tier habis | Beri jeda, atau aktifkan billing |
| 429 di `/ai/command` | Rate limit aplikasi (10/menit) | Tunggu 60 detik |

## Catatan dan keterbatasan yang diketahui

Ini hasil pengujian, dicatat apa adanya supaya tidak ada kejutan:

1. Kegagalan provider AI (kuota, jaringan) dikembalikan ke klien sebagai 400 `Invalid AI command response`. Penyebab aslinya hanya ada di log server dan kolom `failed_reason`. Status 502/503/429 lebih tepat secara semantik.
2. Prompt di luar cakupan Task, misalnya `Hapus user dengan ID 2`, menghasilkan 201 dengan `executed: []` dan audit log berstatus `success`. Tidak ada yang dihapus (pagar Zod dan system prompt bekerja), tetapi respons ini tidak dibedakan dari permintaan sah yang kebetulan tidak menghasilkan aksi.
3. Audit log menyimpan rencana AI (`response_payload`), bukan hasil eksekusi.
4. Kolom `created_at` dan `updated_at` bertipe `timestamp` tanpa zona waktu, sehingga JSON terlihat bergeser tujuh jam dari waktu lokal. Data di database sendiri benar (UTC). Perbaikannya `type: 'timestamptz'`, yang butuh reset database dan seed ulang.
5. Free tier Gemini (sekitar 5 request pada model yang dipakai saat pengujian) lebih ketat daripada rate limit aplikasi. Jadi 429 dari provider bisa muncul sebelum limit 10/menit tercapai.
6. `role` bisa dipilih bebas saat register, sesuai spec. Ini tidak aman untuk production: registrasi publik seharusnya selalu `user`, dan promosi ke admin lewat endpoint terpisah yang dijaga.
7. Tidak ada endpoint CRUD Task manual di luar AI Command (spec hanya meminta GET). Artinya kalau provider AI sedang bermasalah, task tidak bisa dibuat.
8. `synchronize: true` dipakai supaya tabel terbentuk otomatis tanpa migration. Untuk production, matikan dan pakai TypeORM migration.
9. Redis dipakai untuk rate limiting, bukan caching, karena setiap panggilan `/ai/command` berarti biaya ke provider pihak ketiga.