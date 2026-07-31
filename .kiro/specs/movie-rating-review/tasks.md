# Implementation Plan: Movie Rating & Review

## Overview

Implementasi dilakukan dari bawah ke atas mengikuti pola project: tipe → migrasi skema → validator murni → Review_Model → controller → routes → pendaftaran pada Proxy_Server, lalu frontend: service → helper murni → Rating_Modal → komponen ringkasan/daftar → integrasi pada `MovieDetail.jsx` dan `TvSeriesDetail.jsx`.

Backend memakai TypeScript (`src/`), frontend memakai React 17 + JSX (`frontend-react/src/`). Perangkat uji: `vitest` + `fast-check` untuk backend, `vitest` + `@testing-library/react` v12 + `jsdom` untuk frontend. Setiap property test dijalankan minimal 100 iterasi dan diberi komentar penanda `// Feature: movie-rating-review, Property {number}: {property_text}`.

## Tasks

- [x] 1. Siapkan perangkat uji dan tipe dasar
  - [x] 1.1 Konfigurasi test runner backend
    - Tambahkan devDependency `vitest`, `fast-check`, dan script `"test": "vitest --run"` pada `package.json` root
    - Buat `vitest.config.ts` dengan environment `node` dan pola berkas uji `src/**/*.test.ts`
    - _Requirements: 11.3_

  - [x] 1.2 Konfigurasi test runner frontend
    - Tambahkan devDependency `vitest`, `fast-check`, `jsdom`, `@testing-library/react@^12`, `@testing-library/user-event`, `@testing-library/jest-dom` dan script `"test": "vitest --run"` pada `frontend-react/package.json`
    - Buat `frontend-react/vitest.config.js` (environment `jsdom`, setup file) terpisah dari `vite.config.js`
    - _Requirements: 11.3_

  - [x] 1.3 Definisikan tipe TypeScript review
    - Buat `src/types/review.ts` berisi `MediaType`, `MediaRef`, `ReviewRecord`, `ReviewOwnerRecord`, `CreateReviewPayload`, `RatingSummary`, `ReviewListItem`, `ReviewListParams`, `ReviewListResult`
    - Setiap field bertipe eksplisit, tanpa tipe `any`
    - _Requirements: 11.3_

- [x] 2. Migrasi skema tabel reviews
  - [x] 2.1 Tambahkan pembuatan objek database review pada `initializeDatabase`
    - Pada `src/utils/database.ts`: `CREATE TABLE IF NOT EXISTS reviews` dengan `user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `media_type VARCHAR(10)`, `media_id INT` (tanpa foreign key), `rating SMALLINT`, `comment VARCHAR(1000)`, default `NOW()` pada `created_at`/`updated_at`
    - Tambahkan `CHECK` media_type, `CHECK media_id > 0`, `CHECK rating BETWEEN 1 AND 10`, dan `UNIQUE (user_id, media_type, media_id)`
    - Tambahkan `CREATE INDEX IF NOT EXISTS idx_reviews_media`, dan trigger `update_reviews_updated_at` melalui pemeriksaan `pg_trigger` mengikuti pola trigger `users`/`movies`
    - Pertahankan perilaku throw error ke pemanggil pada kegagalan
    - _Requirements: 3.8, 5.9, 9.5, 11.5, 11.6, 11.7, 11.9, 11.10_

  - [x] 2.2 Tulis integration test skema dan idempotensi migrasi
    - Verifikasi tabel, unique constraint, default timestamp, index, dan trigger terbentuk
    - Jalankan `initializeDatabase` 3 kali berturut-turut tanpa error, tanpa duplikat objek, data review tetap utuh
    - Verifikasi constraint menolak rating 0, 11, dan desimal tanpa mengubah isi tabel
    - Verifikasi `DELETE` baris `users` menghapus review `movie` dan `tv` milik pengguna tersebut
    - _Requirements: 3.8, 9.5, 11.5, 11.6, 11.7, 11.9, 11.10_

- [x] 3. Implementasi validator murni
  - [x] 3.1 Implementasi `src/utils/reviewValidation.ts`
    - Ekspor konstanta batas (`COMMENT_MAX_LENGTH`, `MEDIA_ID_MAX`, `LIMIT_MIN/MAX`, `OFFSET_MAX`, `DEFAULT_LIMIT`, `DEFAULT_OFFSET`) dan tipe `ValidationError`/`ValidationResult<T>`
    - Implementasi `normalizeComment`, `validateCreateReviewPayload`, `validateMediaParams`, `validateListParams` sebagai fungsi murni yang mengumpulkan satu entri kesalahan per field gagal dan mengabaikan field asing termasuk identifier pengguna
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.10, 4.3, 6.6, 7.4, 7.5, 7.6_

  - [x] 3.2 Tulis property test payload sah diteruskan apa adanya
    - **Property 1: Payload sah selalu diterima dan diteruskan apa adanya**
    - **Validates: Requirements 3.1**

  - [x] 3.3 Tulis property test normalisasi komentar
    - **Property 3: Normalisasi komentar memangkas ujung dan mengubah komentar kosong menjadi null**
    - **Validates: Requirements 3.6, 3.7**

  - [x] 3.4 Tulis property test parsing parameter query
    - **Property 8: Parsing parameter query menerapkan nilai bawaan dan menolak nilai di luar rentang**
    - **Validates: Requirements 6.6, 7.4, 7.6**

  - [x] 3.5 Tulis unit test kasus batas validator
    - Rating 0, 11, dan desimal; `media_id` 1 dan 2147483647; komentar 0, 1, 1000, dan 1001 karakter; komentar berisi whitespace unicode, emoji, kutip tunggal, dan `--`; `limit` 1, 10, 50, 51; `offset` 0 dan 999999999
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 7.5_

- [x] 4. Checkpoint - validator dan skema
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implementasi Review_Model
  - [x] 5.1 Implementasi `src/models/Review.ts`
    - Static class `ReviewModel` dengan `upsert` (`INSERT ... ON CONFLICT (user_id, media_type, media_id) DO UPDATE ... RETURNING ..., (xmax = 0) AS was_inserted`), `findByUserAndMedia`, `getSummary` (`ROUND(AVG(rating)::numeric, 1)` + `COUNT(*)::int`), `listByMedia` (query `COUNT(*)` terpisah + query halaman dengan `ORDER BY updated_at DESC, created_at DESC, id DESC`), `deleteByUserAndMedia`, `findById`, `deleteById`
    - Query hanya memilih `username` dari `users` melalui `INNER JOIN`, tanpa kolom `password` maupun `email`
    - Seluruh nilai input disisipkan sebagai parameter tagged template `sql`
    - _Requirements: 5.1, 5.3, 5.5, 5.6, 5.8, 5.9, 6.2, 6.3, 6.4, 7.2, 7.3, 7.7, 7.8, 7.9, 11.1, 11.2_

  - [x] 5.2 Buat fake in-memory ReviewModel untuk property test
    - Modul uji yang menerapkan semantik unique constraint `(user_id, media_type, media_id)`, penetapan `created_at`/`updated_at`, urutan daftar, agregat, dan penghapusan, dengan antarmuka identik `ReviewModel`
    - _Requirements: 5.5, 6.2, 7.3_

  - [ ]* 5.3 Tulis property test semantik upsert
    - **Property 4: Upsert memelihara satu review per pengguna per item media**
    - **Validates: Requirements 4.3, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.9**

  - [ ]* 5.4 Tulis property test idempotensi simpan berulang
    - **Property 5: Simpan berulang dengan payload identik bersifat idempoten**
    - **Validates: Requirements 5.7**

  - [ ]* 5.5 Tulis property test ringkasan rating
    - **Property 6: Ringkasan rating sama dengan perhitungan referensi**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

  - [ ]* 5.6 Tulis property test daftar review
    - **Property 7: Daftar review konsisten terhadap paginasi, urutan, dan bentuk elemen**
    - **Validates: Requirements 7.2, 7.3, 7.5, 7.7, 7.8, 7.9**

  - [ ]* 5.7 Tulis property test penghapusan review sendiri
    - **Property 9: Penghapusan review sendiri bersifat round-trip terbalik**
    - **Validates: Requirements 9.2, 9.3**

  - [ ]* 5.8 Tulis integration test semantik database nyata
    - Dua upsert paralel pada kombinasi yang sama menyisakan satu baris tanpa status 500
    - Trigger `BEFORE UPDATE` memperbarui `updated_at` pada pembaruan nyata
    - Simpan Review_Record `media_type` `tv` dengan `media_id` yang tidak ada pada tabel `movies`
    - _Requirements: 5.6, 5.8, 5.9_

- [ ] 6. Implementasi controller, routes, dan pendaftaran endpoint
  - [ ] 6.1 Implementasi `src/controllers/reviewController.ts`
    - Handler `upsertReviewHandler` (201 baru / 200 pembaruan), `getMyReviewHandler` (`data: null` bila belum ada), `getRatingSummaryHandler`, `getReviewListHandler` (`total`, `limit`, `offset`, `count`), `deleteMyReviewHandler` (404 bila tidak ada), `deleteReviewByIdHandler` (403 bukan pemilik, 404 tidak ada)
    - Pemilik selalu dari `req.user.id`; validasi gagal merespons 400 `{ error, details }` tanpa memanggil model; catch merespons 500 dengan pesan generik dan `console.error`
    - Tanpa pernyataan SQL di lapisan ini
    - _Requirements: 3.9, 3.10, 4.3, 4.5, 5.2, 5.4, 5.8, 6.1, 6.5, 6.6, 7.6, 8.9, 9.2, 9.3, 10.6, 11.1, 11.8, 11.11_

  - [ ] 6.2 Implementasi `src/routes/reviewRoutes.ts`
    - Route publik `GET /summary` dan `GET /`; route terproteksi `GET /me`, `POST /`, `DELETE /`, `DELETE /:id` dengan `authenticateToken` sebelum handler
    - Daftarkan `/summary` dan `/me` sebelum `/:id`; tanpa SQL maupun logika validasi
    - _Requirements: 4.1, 4.4_

  - [ ] 6.3 Daftarkan Rating_API pada Proxy_Server
    - `app.use('/api/reviews', reviewRoutes)` pada `src/proxy-server.ts` sebagai satu-satunya prefix review
    - Tambahkan error middleware yang merespons 400 `{ error: 'Request body must be valid JSON' }` untuk `SyntaxError` body JSON
    - _Requirements: 3.11, 11.4_

  - [ ]* 6.4 Tulis property test kumpulan kesalahan validasi
    - **Property 2: Setiap field tidak sah menghasilkan tepat satu entri kesalahan dan model tidak dipanggil**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.9, 3.10**

  - [ ]* 6.5 Tulis property test penolakan tanpa otorisasi
    - **Property 10: Endpoint terproteksi menolak permintaan tanpa otorisasi sebelum validasi payload**
    - **Validates: Requirements 4.1, 4.2, 4.6, 4.7, 8.4**

  - [ ]* 6.6 Tulis property test penghapusan oleh bukan pemilik
    - **Property 11: Penghapusan oleh bukan pemilik ditolak dan baris tetap utuh**
    - **Validates: Requirements 4.5**

  - [ ]* 6.7 Tulis property test endpoint baca tanpa autentikasi
    - **Property 12: Endpoint baca menghasilkan response yang sama terlepas dari header autentikasi**
    - **Validates: Requirements 4.4**

  - [ ]* 6.8 Tulis property test bentuk response dan kebocoran detail teknis
    - **Property 13: Response tidak pernah mencampur data dengan kesalahan maupun membocorkan detail teknis**
    - **Validates: Requirements 10.6, 11.8, 11.11**

  - [ ]* 6.9 Tulis unit test dan pemeriksaan statis lapisan backend
    - Body bukan JSON valid → 400 dengan field `error`
    - Pemeriksaan tidak ada literal SQL pada `reviewRoutes.ts` dan `reviewController.ts`
    - Path review di luar prefix `/api/reviews` menghasilkan 404
    - _Requirements: 3.11, 11.1, 11.4_

- [ ] 7. Checkpoint - backend Rating_API
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Tambahkan skor TheMovieDB pada response detail
  - [ ] 8.1 Tambahkan `vote_average` pada transformer detail film
    - Tambahkan field pada `ModifyMovieTypes` di `src/types/modifyMovie.ts` dan pada `modifyMovieResponse` di `src/controllers/movieController.ts`
    - _Requirements: 6.7, 6.8_

  - [ ] 8.2 Tambahkan `vote_average` pada transformer detail serial TV
    - Tambahkan field pada tipe detail di `src/types/tvSeries.ts` dan pada transformer detail di `src/controllers/tvSeriesController.ts`
    - _Requirements: 6.7, 6.8_

- [ ] 9. Implementasi service dan proxy frontend
  - [ ] 9.1 Implementasi `frontend-react/src/services/reviewService.js`
    - Fungsi `getReviewSummary`, `getReviews`, `getMyReview`, `saveReview`, `deleteMyReview` dengan base URL `/api/reviews`
    - Header `Authorization: Bearer <token>` dari `authService` pada endpoint terproteksi
    - `AbortController` dengan batas 10 detik; error membawa `status` dan pesan dari field `error`, atau pesan umum bila body tidak memuat `error`/tidak dapat diurai
    - _Requirements: 8.1, 10.4, 10.5_

  - [ ] 9.2 Tambahkan entri proxy `/api/reviews`
    - Arahkan `/api/reviews` ke `http://localhost:3001` pada `frontend-react/vite.config.js`
    - _Requirements: 11.4_

  - [ ]* 9.3 Tulis unit test pemetaan kesalahan service
    - Body error tanpa field `error`, body bukan JSON, dan batas waktu 10 detik menghasilkan error bertanda yang benar
    - _Requirements: 10.4, 10.5_

- [ ] 10. Implementasi helper format murni frontend
  - [ ] 10.1 Implementasi `frontend-react/src/utils/reviewFormat.js`
    - `clampComment` (batas keras 1000 karakter), `countCharacters`, `formatTitle` (pemotongan >120 karakter dengan indikator), `formatAverageRating` (format `N,N/10`)
    - _Requirements: 1.4, 2.6, 2.7, 2.8, 6.7_

  - [ ]* 10.2 Tulis property test pembatasan dan pencacahan teks
    - **Property 15: Pembatasan dan pencacahan teks pada modal**
    - **Validates: Requirements 1.4, 2.6, 2.7, 2.8**

- [ ] 11. Implementasi Rating_Modal
  - [ ] 11.1 Buat struktur `RatingModal.jsx` dengan kontrol bintang dan kolom komentar
    - 10 kontrol bintang urut naik, penandaan 1..N terpilih, teks `N/10`, penanda saat rating belum dipilih
    - Kolom komentar dengan pembatasan 1000 karakter dan pencacah karakter; tombol simpan nonaktif hingga rating ditetapkan
    - Judul Media_Item ditampilkan melalui `formatTitle`
    - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11_

  - [ ]* 11.2 Tulis property test state bintang dan tombol simpan
    - **Property 14: State kontrol bintang dan keaktifan tombol simpan konsisten**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.9, 2.10, 2.11**

  - [ ] 11.3 Implementasi pramuat review sendiri pada modal
    - Kirim tepat satu permintaan pramuat saat modal dibuka; nonaktifkan 10 kontrol bintang, kolom komentar, dan tombol simpan selama proses
    - Petakan respons berisi review ke rating aktif, isi komentar, pencacah, dan label aksi pembaruan; respons null ke form kosong berlabel aksi pembuatan
    - Kegagalan/batas waktu 10 detik → form kosong mode pembuatan, pesan pramuat gagal, dan aksi ulangi
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.6, 8.7, 8.8_

  - [ ]* 11.4 Tulis property test pemetaan respons pramuat
    - **Property 16: Respons pramuat dipetakan tepat ke state modal**
    - **Validates: Requirements 8.1, 8.2, 8.5, 8.7, 8.8**

  - [ ] 11.5 Implementasi alur simpan beserta penanganan kegagalan
    - Paling banyak satu permintaan simpan aktif, tombol simpan dan aksi hapus nonaktif selama proses, indikator proses pada area tombol
    - Sukses 200/201 → notifikasi keberhasilan dan penutupan otomatis ≤ 2 detik
    - Kegagalan per kelas (400–499 selain 401, 401 dengan tautan `/login`, 500–599, body tanpa `error`, jaringan, batas waktu 10 detik) mempertahankan rating dan komentar; aksi kirim ulang maksimal 3 kali dengan payload identik lalu pesan coba kembali nanti; area notifikasi maksimal 5 butir
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.7, 10.8, 10.9, 10.10, 10.11_

  - [ ]* 11.6 Tulis property test satu permintaan simpan aktif dan penutupan pada sukses
    - **Property 21: Paling banyak satu permintaan simpan aktif, dan sukses menutup modal**
    - **Validates: Requirements 10.1, 10.2**

  - [ ]* 11.7 Tulis property test pemertahanan isi form pada kegagalan
    - **Property 22: Isi form dipertahankan pada setiap kelas kegagalan**
    - **Validates: Requirements 6.11, 8.6, 9.8, 10.3, 10.4, 10.5, 10.7, 10.9**

  - [ ]* 11.8 Tulis property test kirim ulang berpayload identik
    - **Property 23: Kirim ulang mengirim payload identik dengan batas tiga percobaan**
    - **Validates: Requirements 10.8, 10.10, 10.11**

  - [ ] 11.9 Implementasi alur hapus rating dengan konfirmasi
    - Aksi hapus tampil aktif hanya ketika review pengguna ada; menekannya menampilkan konfirmasi dengan aksi konfirmasi dan batal tanpa mengirim permintaan
    - Konfirmasi mengirim permintaan hapus; sukses mengembalikan modal ke form kosong berlabel aksi pembuatan; kegagalan mempertahankan aksi hapus aktif beserta rating dan komentar
    - _Requirements: 9.1, 9.4, 9.6, 9.7, 9.8_

  - [ ]* 11.10 Tulis property test konfirmasi hapus
    - **Property 24: Konfirmasi hapus menahan permintaan sampai dikonfirmasi**
    - **Validates: Requirements 9.1, 9.6, 9.7**

  - [ ] 11.11 Implementasi jalur penutupan modal
    - Tombol tutup dan tombol Escape menyembunyikan modal, membuang masukan yang belum dikirim, tidak meminta ulang data detail, dan mengembalikan fokus keyboard ke Rating_Trigger
    - _Requirements: 1.5, 1.9_

  - [ ]* 11.12 Tulis property test ekuivalensi jalur penutupan
    - **Property 18: Semua jalur penutupan modal ekuivalen**
    - **Validates: Requirements 1.5, 1.9**

  - [ ]* 11.13 Tulis unit test kasus contoh modal
    - Tepat 10 kontrol bintang bernilai 1–10 urut naik; penanda tanpa angka saat rating belum dipilih; respons pramuat `data: null` → form kosong, label pembuatan, tombol simpan nonaktif
    - _Requirements: 2.1, 2.5, 8.3_

- [ ] 12. Integrasi pada halaman detail
  - [ ] 12.1 Implementasi hook `frontend-react/src/hooks/useReviewData.js`
    - State `summary`, `reviews`, `total`, `loading`, `error` dan aksi `refreshSummary`, `loadFirstPage` (`limit` 10, `offset` 0), `loadMore` (`offset` = jumlah yang sudah dimuat), `refreshAll`
    - _Requirements: 6.9, 6.10, 7.1, 7.12, 9.4_

  - [ ] 12.2 Implementasi `RatingSummary.jsx`
    - Tampilkan `average_rating` format `N,N/10` beserta `review_count` di bawah label rating pengguna aplikasi pada elemen terpisah dari skor TheMovieDB
    - `review_count` 0 → teks belum ada rating pengguna tanpa angka; kegagalan → teks ringkasan tidak tersedia beserta aksi muat ulang
    - _Requirements: 6.7, 6.8, 6.11_

  - [ ] 12.3 Implementasi `ReviewList.jsx`
    - Render `username`, rating, komentar, dan waktu tiap review; indikator proses selama permintaan berlangsung dengan mempertahankan review yang sudah dimuat
    - Aksi muat lebih banyak tampil hanya ketika jumlah dimuat < `total`; aksi coba lagi mengirim permintaan dengan parameter identik
    - _Requirements: 7.10, 7.11, 7.12, 7.13_

  - [ ] 12.4 Implementasi `RatingTrigger.jsx`
    - Tombol "+" dengan `aria-label` memuat aksi memberi rating dan judul Media_Item, dapat dicapai keyboard, aktif via klik/Enter/Space dengan hasil identik
    - Nonaktif selama status autentikasi masih diverifikasi; pengguna belum login mendapat pesan wajib login beserta tautan `/login` tanpa membuka modal
    - _Requirements: 1.2, 1.3, 1.6, 1.7_

  - [ ] 12.5 Integrasikan komponen review pada `MovieDetail.jsx`
    - Render `RatingTrigger`, `RatingSummary`, `ReviewList`, dan `RatingModal` dengan `mediaType` `movie`, `mediaId` dari detail, judul `movie.title`, hanya setelah data detail berhasil dimuat
    - Muat ulang ringkasan setelah setiap operasi tulis dan muat ulang daftar dengan `limit` 10 `offset` 0 setelah hapus; tampilkan skor TheMovieDB dari `vote_average` pada elemen terpisah
    - Kegagalan pemuatan detail → tidak menampilkan trigger dan menampilkan pesan kesalahan
    - _Requirements: 1.1, 1.8, 6.7, 6.9, 6.10, 7.1, 9.4_

  - [ ] 12.6 Integrasikan komponen review pada `TvSeriesDetail.jsx`
    - Sama dengan `MovieDetail.jsx` dengan `mediaType` `tv` dan judul `tvSeries.name`
    - _Requirements: 1.1, 1.8, 6.7, 6.9, 6.10, 7.1, 9.4_

  - [ ]* 12.7 Tulis property test aktivasi Rating_Trigger
    - **Property 17: Aktivasi Rating_Trigger konsisten pada semua metode masukan**
    - **Validates: Requirements 1.2, 1.3, 1.6, 1.7**

  - [ ]* 12.8 Tulis property test pemuatan ulang ringkasan setelah operasi tulis
    - **Property 19: Ringkasan dimuat ulang setelah setiap operasi tulis dan ditampilkan sesuai response terakhir**
    - **Validates: Requirements 6.7, 6.9, 6.10, 9.4**

  - [ ]* 12.9 Tulis property test paginasi daftar review
    - **Property 20: Paginasi daftar review pada Detail_Page**
    - **Validates: Requirements 7.1, 7.11, 7.12, 7.13**

  - [ ]* 12.10 Tulis unit test kasus contoh halaman detail
    - `review_count` 0 → teks belum ada rating pengguna tanpa angka dan skor TheMovieDB tetap tampil; pemuatan detail gagal → tanpa Rating_Trigger disertai pesan kesalahan; trigger tampil setelah detail berhasil dimuat
    - _Requirements: 1.1, 1.8, 6.8_

- [ ] 13. Checkpoint akhir - build dan seluruh test
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Setiap property test memakai `fast-check` dengan minimal 100 iterasi dan komentar penanda `// Feature: movie-rating-review, Property {number}: {property_text}`
- Properti backend murni (1, 3, 8) diuji tanpa database; properti 2, 4–7, 9–13 diuji terhadap fake in-memory ReviewModel; properti 14–24 diuji pada level komponen dengan service termock dan timer palsu
- Batas waktu pengalaman pengguna (Req 1.1, 1.2, 1.5, 1.7) dan batas 2 detik response Rating_Summary di lingkungan nyata (Req 6.1) diverifikasi manual, tidak tercakup pada task otomatis
- Checkpoint memvalidasi progres secara bertahap; checkpoint akhir mencakup `npm run build` (tsc strict) pada workspace backend

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "8.1", "8.2", "9.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "9.1", "10.1", "11.1", "12.4"] },
    { "id": 2, "tasks": ["2.2", "3.2", "3.3", "5.1", "5.2", "9.3", "10.2", "11.2", "12.1"] },
    { "id": 3, "tasks": ["3.4", "3.5", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "6.1", "11.3", "12.2", "12.3"] },
    { "id": 4, "tasks": ["6.2", "11.4", "11.5", "12.5", "12.6"] },
    { "id": 5, "tasks": ["6.3", "11.6", "11.9", "12.7", "12.8", "12.9", "12.10"] },
    { "id": 6, "tasks": ["6.4", "6.5", "6.6", "6.7", "6.8", "6.9", "11.7", "11.8", "11.10", "11.11"] },
    { "id": 7, "tasks": ["11.12", "11.13"] }
  ]
}
```
