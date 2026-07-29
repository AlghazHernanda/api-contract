# Requirements Document

## Introduction

Fitur ini menambahkan kemampuan bagi pengguna yang sudah login untuk memberi nilai (rating) 1 sampai 10 beserta komentar pada sebuah film atau serial TV, langsung dari halaman detail. Pemicunya adalah tombol "+" pada halaman detail yang membuka sebuah popup (modal) berisi kontrol bintang skala 1–10 dan kolom komentar. Data rating dan komentar disimpan permanen di Supabase PostgreSQL, terikat pada akun pengguna dan pada item media (film atau serial) yang dinilai.

Fitur ini juga menetapkan arsitektur backend untuk rating/review: satu tabel penyimpanan tunggal yang menangani kedua jenis media melalui kolom pembeda tipe media, satu review per pengguna per item media (perilaku upsert), endpoint HTTP terpisah pada proxy server yang mengikuti pola `routes → controller → model` yang sudah dipakai project, serta endpoint agregat untuk menampilkan rata-rata rating pengguna di halaman detail.

Cakupan fitur ini mencakup backend (endpoint, model data, skema tabel) dan frontend (tombol pemicu, modal, tampilan ringkasan dan daftar review).

## Glossary

- **Media_Type**: Nilai teks yang membedakan jenis item media, dengan nilai yang diizinkan `movie` atau `tv`.
- **Media_Id**: Bilangan bulat positif berupa identifier TheMovieDB untuk sebuah film atau serial TV.
- **Media_Item**: Kombinasi Media_Type dan Media_Id yang secara unik menunjuk pada satu film atau satu serial TV.
- **Authenticated_User**: Pengguna yang mengirim permintaan dengan JSON Web Token yang valid pada header `Authorization: Bearer <token>` dan barisnya masih ada di tabel `users`.
- **Auth_Middleware**: Middleware `authenticateToken` pada `src/middleware/auth.ts` yang memverifikasi token dan mengisi `req.user`.
- **Review_Record**: Satu satuan data tersimpan yang berisi identifier pengguna, Media_Type, Media_Id, nilai rating, komentar, waktu pembuatan, dan waktu pembaruan.
- **Review_Model**: Lapisan akses data berbentuk class statis yang menjalankan query terhadap tabel penyimpanan Review_Record melalui instance `sql` dari `src/utils/database.ts`.
- **Rating_API**: Kumpulan endpoint HTTP yang melayani operasi baca dan tulis Review_Record, terdaftar pada Proxy_Server.
- **Rating_Service**: Gabungan lapisan routes, controller, dan Review_Model yang membentuk implementasi backend fitur rating.
- **Proxy_Server**: Aplikasi Express pada `src/proxy-server.ts` yang berjalan di port 3001.
- **Rating_Summary**: Objek agregat berisi `average_rating` dan `review_count` untuk satu Media_Item.
- **Detail_Page**: Komponen halaman detail pada frontend React, yaitu `MovieDetail.jsx` untuk film dan `TvSeriesDetail.jsx` untuk serial TV.
- **Rating_Trigger**: Tombol berlabel "+" pada Detail_Page yang membuka Rating_Modal.
- **Rating_Modal**: Komponen popup pada frontend yang menampilkan kontrol bintang 1–10, kolom komentar, dan aksi simpan.
- **Database**: Instance Supabase PostgreSQL yang diakses melalui postgres.js.

## Requirements

### Requirement 1: Pemicu Rating pada Halaman Detail

**User Story:** Sebagai pengguna, saya ingin ada tombol "+" di halaman detail film atau serial, sehingga saya dapat membuka form penilaian tanpa berpindah halaman.

#### Acceptance Criteria

1. WHEN data Media_Item pada halaman detail selesai dimuat, THE Detail_Page SHALL menampilkan Rating_Trigger berlabel "+" di dalam area aksi yang berada pada blok informasi utama Media_Item (blok yang memuat judul dan poster), dalam waktu maksimal 500 ms setelah data selesai dimuat, tanpa memerlukan pengguna menggulir halaman pada viewport dengan tinggi minimal 720 px
2. WHEN Authenticated_User menekan Rating_Trigger, THE Detail_Page SHALL membuka Rating_Modal dalam waktu maksimal 300 ms dengan Media_Type bernilai salah satu dari dua nilai yang mungkin (film atau serial) sesuai halaman detail yang aktif, dan Media_Id bernilai identik dengan Media_Id item media yang sedang ditampilkan
3. IF pengguna yang belum login (status autentikasi bernilai tidak terautentikasi) menekan Rating_Trigger, THEN THE Detail_Page SHALL menampilkan pesan yang menyatakan bahwa penilaian memerlukan login beserta tautan aktif ke halaman login, SHALL tidak membuka Rating_Modal, dan SHALL mempertahankan pesan tersebut tetap terlihat hingga pengguna menutupnya atau berpindah halaman
4. WHILE Rating_Modal terbuka, THE Rating_Modal SHALL menampilkan judul Media_Item yang sedang dinilai secara identik dengan judul yang ditampilkan pada Detail_Page, dengan pemotongan teks disertai indikator pemotongan untuk judul yang melebihi 120 karakter
5. WHEN Authenticated_User menekan tombol tutup pada Rating_Modal, THE Detail_Page SHALL menyembunyikan Rating_Modal dalam waktu maksimal 300 ms, SHALL mempertahankan seluruh data detail yang sudah dimuat tanpa permintaan ulang ke sumber data, dan SHALL membuang masukan penilaian yang belum dikirim
6. THE Rating_Trigger SHALL memiliki atribut `aria-label` berisi teks yang menyebutkan aksi memberi rating beserta judul Media_Item, SHALL dapat dicapai melalui navigasi keyboard berurutan, dan SHALL dapat diaktifkan dengan tombol Enter maupun Space dengan hasil yang identik dengan aktivasi melalui klik
7. WHILE proses verifikasi status autentikasi masih berlangsung, THE Detail_Page SHALL menampilkan Rating_Trigger dalam keadaan nonaktif yang tidak merespons klik, Enter, maupun Space, dan SHALL mengaktifkannya kembali dalam waktu maksimal 300 ms setelah status autentikasi selesai ditentukan
8. IF pemuatan data Media_Item gagal atau Media_Id tidak ditemukan pada sumber data, THEN THE Detail_Page SHALL tidak menampilkan Rating_Trigger dan SHALL menampilkan pesan kesalahan yang menyatakan bahwa detail media tidak dapat dimuat
9. WHEN Authenticated_User menekan tombol Escape saat Rating_Modal terbuka, THE Rating_Modal SHALL tertutup dengan perilaku yang identik dengan penekanan tombol tutup, dan THE Detail_Page SHALL mengembalikan fokus keyboard ke Rating_Trigger

### Requirement 2: Input Rating Bintang dan Komentar

**User Story:** Sebagai pengguna, saya ingin memilih nilai bintang 1 sampai 10 dan menulis komentar, sehingga saya dapat menyampaikan penilaian saya secara lengkap.

#### Acceptance Criteria

1. WHILE Rating_Modal terbuka, THE Rating_Modal SHALL menampilkan tepat 10 kontrol bintang yang mewakili nilai bilangan bulat 1 sampai 10 dalam urutan naik
2. WHEN pengguna memilih kontrol bintang ke-N dengan N berupa bilangan bulat 1 sampai 10, THE Rating_Modal SHALL menetapkan N sebagai satu-satunya nilai rating aktif dan menggantikan nilai rating aktif sebelumnya apabila sudah ada
3. WHEN pengguna memilih kontrol bintang ke-N, THE Rating_Modal SHALL menandai kontrol bintang 1 sampai N sebagai terpilih dan kontrol bintang N+1 sampai 10 sebagai tidak terpilih
4. WHILE nilai rating aktif sudah ditetapkan, THE Rating_Modal SHALL menampilkan nilai rating aktif dalam format teks numerik `N/10` dengan N sama dengan nilai rating aktif
5. WHILE nilai rating aktif belum ditetapkan, THE Rating_Modal SHALL menampilkan penanda pada area teks numerik yang menyatakan bahwa nilai rating belum dipilih dan tidak menampilkan angka rating apa pun
6. THE Rating_Modal SHALL menyediakan kolom komentar teks bebas yang menerima panjang isi 0 sampai 1000 karakter
7. IF pengguna memasukkan atau menempelkan teks yang membuat panjang isi kolom komentar melebihi 1000 karakter, THEN THE Rating_Modal SHALL mempertahankan hanya 1000 karakter pertama, mengabaikan karakter berikutnya, dan menampilkan penanda bahwa batas 1000 karakter telah tercapai
8. WHEN pengguna mengubah isi kolom komentar, THE Rating_Modal SHALL memperbarui tampilan jumlah karakter terpakai beserta batas 1000 karakter pada perubahan tersebut tanpa memerlukan interaksi tambahan
9. WHILE nilai rating aktif belum ditetapkan, THE Rating_Modal SHALL menonaktifkan tombol simpan sehingga penekanan tombol simpan tidak mengirim permintaan simpan
10. WHEN pengguna memilih salah satu kontrol bintang, THE Rating_Modal SHALL mengaktifkan tombol simpan sebagai hasil interaksi tersebut tanpa memerlukan interaksi tambahan pada kontrol lain
11. WHEN pengguna menekan tombol simpan dengan nilai rating aktif sudah ditetapkan dan kolom komentar kosong, THE Rating_Modal SHALL mengirim permintaan simpan tanpa menampilkan pesan kesalahan validasi pada kolom komentar

### Requirement 3: Validasi Data Rating di Backend

**User Story:** Sebagai pengelola sistem, saya ingin backend memvalidasi setiap data rating yang masuk, sehingga data yang tersimpan di Database selalu berada dalam rentang yang sah.

#### Acceptance Criteria

1. WHEN Rating_API menerima permintaan simpan yang memuat `rating` berupa bilangan bulat 1 sampai 10, `media_type` bernilai `movie` atau `tv`, `media_id` berupa bilangan bulat 1 sampai 2.147.483.647, dan `comment` berupa string dengan panjang paling banyak 1000 karakter setelah pemangkasan atau tidak disertakan, THE Rating_API SHALL meneruskan seluruh nilai tersebut ke Review_Model
2. IF field `rating` tidak disertakan, bernilai null, bukan bilangan bulat, atau berada di luar rentang 1 sampai 10, THEN THE Rating_API SHALL merespons status 400 dengan pesan kesalahan yang menyebut field `rating`
3. IF field `media_type` tidak disertakan atau bernilai selain string `movie` atau `tv` dengan pembandingan peka huruf besar-kecil, THEN THE Rating_API SHALL merespons status 400 dengan pesan kesalahan yang menyebut field `media_type`
4. IF field `media_id` tidak disertakan, bukan bilangan bulat, atau berada di luar rentang 1 sampai 2.147.483.647, THEN THE Rating_API SHALL merespons status 400 dengan pesan kesalahan yang menyebut field `media_id`
5. IF field `comment` disertakan dengan tipe selain string atau null, atau panjangnya melebihi 1000 karakter setelah pemangkasan, THEN THE Rating_API SHALL merespons status 400 dengan pesan kesalahan yang menyebut field `comment`
6. WHERE field `comment` disertakan sebagai string, THE Rating_API SHALL memangkas karakter spasi, tab, dan baris baru di awal dan akhir nilai tersebut sebelum meneruskan komentar ke Review_Model
7. WHERE komentar tidak disertakan, bernilai null, atau bernilai string kosong setelah pemangkasan, THE Review_Model SHALL menyimpan Review_Record dengan komentar bernilai null
8. THE Database SHALL menolak operasi penyimpanan Review_Record yang nilai rating-nya bukan bilangan bulat atau berada di luar rentang 1 sampai 10 melalui batasan pada tingkat tabel, dan mempertahankan isi tabel tanpa perubahan
9. IF permintaan simpan gagal validasi pada satu field atau lebih, THEN THE Rating_API SHALL menolak permintaan tanpa memanggil Review_Model dan mempertahankan Review_Record yang sudah tersimpan tanpa perubahan
10. IF satu permintaan simpan memuat lebih dari satu field yang gagal validasi, THEN THE Rating_API SHALL merespons status 400 dengan satu entri kesalahan untuk setiap field yang gagal pada respons tersebut
11. IF body permintaan simpan bukan objek JSON yang dapat diurai, THEN THE Rating_API SHALL merespons status 400 dengan body berisi field `error`

### Requirement 4: Autentikasi dan Kepemilikan Review

**User Story:** Sebagai pengguna, saya ingin rating hanya dapat dibuat dan diubah oleh pemiliknya, sehingga penilaian saya terlindungi dari perubahan oleh orang lain.

#### Acceptance Criteria

1. THE Rating_API SHALL menerapkan Auth_Middleware sebelum eksekusi controller pada setiap endpoint yang membuat, memperbarui, atau menghapus Review_Record, serta pada endpoint pembacaan Review_Record milik pengguna sendiri
2. IF permintaan tulis dikirim tanpa header `Authorization` atau dengan nilai header yang tidak berbentuk `Bearer <token>`, THEN THE Rating_API SHALL merespons status 401 dengan body berisi field `error` dan tidak membuat, mengubah, atau menghapus Review_Record apa pun
3. WHEN permintaan tulis lolos Auth_Middleware, THE Rating_API SHALL menetapkan identifier pemilik Review_Record dari `req.user.id` dan mengabaikan field identifier pengguna yang dikirim pada body permintaan tanpa merespons kesalahan validasi karena keberadaan field tersebut
4. THE Rating_API SHALL merespons permintaan pembacaan Rating_Summary dan daftar Review_Record dengan status 200 dan body yang sama baik ketika header `Authorization` tidak disertakan, berisi token yang tidak sah, maupun berisi token yang sah
5. IF Authenticated_User mengirim permintaan hapus untuk Review_Record yang ada di Database dan pemiliknya berbeda dari `req.user.id`, THEN THE Rating_API SHALL merespons status 403 dengan body berisi field `error` dan mempertahankan nilai rating, komentar, serta `updated_at` Review_Record tersebut tanpa perubahan
6. IF token pada permintaan tulis sudah kedaluwarsa, tidak dapat diverifikasi, atau merujuk pada pengguna yang barisnya sudah tidak ada di tabel `users`, THEN THE Rating_API SHALL merespons status 401 dengan body berisi field `error` dan tidak membuat, mengubah, atau menghapus Review_Record apa pun
7. IF permintaan tulis tidak lolos Auth_Middleware sementara payload permintaan juga tidak memenuhi aturan validasi, THEN THE Rating_API SHALL merespons status 401 dan tidak menjalankan validasi payload

### Requirement 5: Penyimpanan Satu Review per Pengguna per Item Media

**User Story:** Sebagai pengguna, saya ingin rating saya untuk satu film atau serial tersimpan sebagai satu penilaian yang dapat saya perbarui, sehingga riwayat penilaian saya tidak terduplikasi.

#### Acceptance Criteria

1. WHEN Authenticated_User mengirim permintaan simpan yang lolos validasi Rating_API untuk Media_Item yang belum memiliki Review_Record milik pengguna tersebut, THE Review_Model SHALL membuat tepat satu Review_Record baru berisi identifier pemilik dari `req.user.id`, Media_Type, Media_Id, nilai rating, dan komentar dari permintaan tersebut, dengan `created_at` dan `updated_at` bernilai sama dengan waktu server saat operasi pembuatan dijalankan
2. WHEN Review_Model berhasil membuat Review_Record baru, THE Rating_API SHALL merespons status 201 dengan body berisi Review_Record hasil penyimpanan yang mencakup identifier Review_Record, Media_Type, Media_Id, nilai rating, komentar, `created_at`, dan `updated_at`
3. WHEN Authenticated_User mengirim permintaan simpan yang lolos validasi Rating_API untuk Media_Item yang sudah memiliki Review_Record milik pengguna tersebut, THE Review_Model SHALL memperbarui nilai rating dan komentar pada Review_Record tersebut tanpa mengubah identifier pemilik, Media_Type, Media_Id, dan `created_at`
4. WHEN Review_Model berhasil memperbarui Review_Record, THE Rating_API SHALL merespons status 200 dengan body berisi Review_Record hasil pembaruan yang mencakup identifier Review_Record, Media_Type, Media_Id, nilai rating, komentar, `created_at`, dan `updated_at`
5. THE Review_Model SHALL memelihara paling banyak satu Review_Record untuk setiap kombinasi identifier pengguna, Media_Type, dan Media_Id, sehingga setiap operasi simpan berikutnya pada kombinasi yang sama mengubah baris yang sudah ada tanpa menambah jumlah baris
6. WHEN Review_Model memperbarui Review_Record, THE Review_Model SHALL menetapkan kolom `updated_at` ke waktu server saat operasi pembaruan dijalankan dengan nilai lebih besar dari atau sama dengan nilai `updated_at` sebelumnya
7. WHEN permintaan simpan dengan payload identik dikirim dua kali secara berurutan oleh Authenticated_User yang sama, dengan pengiriman kedua dilakukan setelah respons pengiriman pertama diterima, THE Review_Model SHALL menyisakan tepat satu Review_Record dengan nilai rating dan komentar identik dengan hasil pengiriman pertama
8. IF dua permintaan simpan dari Authenticated_User yang sama untuk Media_Item yang sama diproses secara bersamaan sehingga operasi penyimpanan melanggar batasan unik pada kombinasi identifier pengguna, Media_Type, dan Media_Id, THEN THE Review_Model SHALL memperbarui Review_Record yang sudah ada alih-alih menambah baris baru dan THE Rating_API SHALL merespons status 200 tanpa merespons status 500
9. THE Review_Model SHALL menyimpan Review_Record dengan Media_Type `tv` tanpa memerlukan baris terkait pada tabel `movies` dan tanpa menghasilkan kesalahan batasan referensial, dan THE Rating_API SHALL merespons status 201 untuk pembuatan atau status 200 untuk pembaruan pada Review_Record tersebut

### Requirement 6: Ringkasan Rating Pengguna

**User Story:** Sebagai pengguna, saya ingin melihat rata-rata rating dari pengguna lain pada halaman detail, sehingga saya mendapat gambaran penilaian komunitas.

#### Acceptance Criteria

1. WHEN Rating_API menerima permintaan Rating_Summary dengan Media_Type bernilai `movie` atau `tv` dan Media_Id berupa bilangan bulat positif, THE Rating_API SHALL merespons status 200 dalam waktu paling lama 2 detik dengan body berisi field `average_rating` dan `review_count`
2. THE Rating_API SHALL menghitung `average_rating` sebagai rata-rata aritmetika nilai rating seluruh Review_Record milik semua pengguna untuk Media_Item tersebut, dibulatkan ke satu angka desimal dengan pembulatan setengah ke atas, sehingga nilai hasil berada pada rentang 1.0 sampai 10.0
3. THE Rating_API SHALL menetapkan `review_count` sebagai bilangan bulat 0 atau lebih besar yang sama dengan jumlah Review_Record tersimpan untuk Media_Item tersebut
4. IF Media_Item belum memiliki Review_Record, THEN THE Rating_API SHALL merespons status 200 dengan `average_rating` bernilai null dan `review_count` bernilai 0
5. IF `review_count` bernilai 1 atau lebih, THEN THE Rating_API SHALL merespons `average_rating` berupa nilai numerik dengan tepat satu angka desimal pada rentang 1.0 sampai 10.0
6. IF Media_Type pada permintaan Rating_Summary bernilai selain `movie` atau `tv`, atau Media_Id bukan bilangan bulat positif, THEN THE Rating_API SHALL merespons status 400 dengan pesan kesalahan yang menyebut nama field yang tidak sah dan tidak menyertakan field `average_rating` maupun `review_count`
7. WHERE `review_count` bernilai 1 atau lebih, THE Detail_Page SHALL menampilkan nilai `average_rating` dalam format `N,N/10` beserta `review_count`, di bawah label yang menyebut rating pengguna aplikasi dan berbeda dari label skor TheMovieDB, serta menampilkan kedua nilai tersebut pada elemen yang terpisah dari elemen skor TheMovieDB
8. WHERE `review_count` bernilai 0, THE Detail_Page SHALL menampilkan teks yang menyatakan belum ada rating pengguna pada posisi Rating_Summary, tanpa menampilkan nilai numerik `average_rating`, dan tetap menampilkan skor TheMovieDB
9. WHEN Review_Record berhasil dibuat, diperbarui, atau dihapus melalui Rating_Modal, THE Detail_Page SHALL mengirim permintaan Rating_Summary baru dan menampilkan nilai `average_rating` serta `review_count` hasil permintaan tersebut dalam waktu paling lama 2 detik setelah respons Rating_Summary diterima
10. WHEN beberapa operasi tulis Review_Record selesai secara berurutan dalam satu sesi Rating_Modal, THE Detail_Page SHALL mengirim satu permintaan Rating_Summary setelah setiap operasi yang selesai dan menampilkan nilai dari respons Rating_Summary terakhir yang diterima
11. IF permintaan Rating_Summary gagal karena kegagalan jaringan atau respons Rating_API dengan status 500, THEN THE Detail_Page SHALL menampilkan teks yang menyatakan ringkasan rating pengguna tidak tersedia, tetap menampilkan data detail Media_Item beserta skor TheMovieDB, dan menyediakan aksi untuk memuat ulang Rating_Summary

### Requirement 7: Daftar Review pada Halaman Detail

**User Story:** Sebagai pengguna, saya ingin membaca komentar pengguna lain pada halaman detail, sehingga saya dapat mempertimbangkan pendapat mereka.

#### Acceptance Criteria

1. WHEN Detail_Page selesai memuat data detail Media_Item, THE Detail_Page SHALL mengirim satu permintaan daftar Review_Record untuk Media_Type dan Media_Id item tersebut dengan `limit` bernilai 10 dan `offset` bernilai 0
2. THE Rating_API SHALL menyertakan tepat lima field pada setiap elemen daftar Review_Record, yaitu `username` pemilik, nilai rating bilangan bulat 1 sampai 10, komentar, `created_at`, dan `updated_at`, dengan komentar bernilai null apabila Review_Record tersimpan tanpa komentar
3. THE Rating_API SHALL mengurutkan daftar Review_Record berdasarkan `updated_at` secara menurun, dan untuk Review_Record dengan nilai `updated_at` identik SHALL mengurutkan berdasarkan `created_at` secara menurun sebagai kunci urutan kedua sehingga urutan hasil bersifat sama pada setiap permintaan dengan parameter yang sama
4. THE Rating_API SHALL menggunakan nilai `limit` 10 dan `offset` 0 sebagai nilai bawaan ketika parameter tersebut tidak disertakan atau disertakan sebagai string kosong
5. THE Rating_API SHALL menerima parameter `limit` berupa bilangan bulat 1 sampai 50 dan parameter `offset` berupa bilangan bulat 0 sampai 999.999.999, serta SHALL mengembalikan paling banyak sejumlah `limit` elemen Review_Record pada satu respons daftar
6. IF parameter `limit` atau `offset` bukan bilangan bulat, bernilai negatif, atau berada di luar rentang yang diizinkan pada kriteria 5, THEN THE Rating_API SHALL merespons status 400 dengan pesan kesalahan yang menyebut nama parameter tersebut tanpa menyertakan daftar Review_Record, termasuk ketika parameter lain pada permintaan yang sama bernilai sah
7. THE Rating_API SHALL menyertakan `total` berupa bilangan bulat 0 atau lebih besar yang berisi jumlah keseluruhan Review_Record untuk Media_Item tersebut tanpa dipengaruhi nilai `limit` dan `offset` pada permintaan
8. THE Rating_API SHALL mengecualikan kolom `password` dan `email` pemilik Review_Record dari setiap elemen pada setiap halaman respons daftar, dan SHALL menggunakan `username` sebagai satu-satunya field identitas pemilik
9. WHEN Rating_API menerima permintaan daftar yang sah untuk Media_Item tanpa Review_Record atau dengan `offset` sama dengan atau lebih besar dari `total`, THE Rating_API SHALL merespons status 200 dengan daftar Review_Record kosong dan `total` berisi jumlah keseluruhan Review_Record untuk Media_Item tersebut
10. WHILE permintaan daftar Review_Record sedang berlangsung, THE Detail_Page SHALL menampilkan indikator proses pada area daftar review dan mempertahankan Review_Record yang sudah dimuat sebelumnya
11. IF permintaan daftar Review_Record gagal karena kegagalan jaringan atau respons Rating_API dengan status 500, THEN THE Detail_Page SHALL menampilkan pesan kegagalan pemuatan daftar review dan menyediakan aksi untuk mengirim ulang permintaan dengan parameter yang sama
12. IF jumlah Review_Record yang sudah dimuat pada Detail_Page bernilai lebih kecil dari nilai `total` pada respons terakhir, THEN THE Detail_Page SHALL menyediakan aksi untuk memuat Review_Record berikutnya dengan `offset` sama dengan jumlah Review_Record yang sudah dimuat
13. IF jumlah Review_Record yang sudah dimuat pada Detail_Page bernilai sama dengan atau lebih besar dari nilai `total` pada respons terakhir, THEN THE Detail_Page SHALL menyembunyikan aksi untuk memuat Review_Record berikutnya

### Requirement 8: Pramuat Review Milik Pengguna Sendiri

**User Story:** Sebagai pengguna, saya ingin modal menampilkan rating yang pernah saya berikan, sehingga saya dapat memperbaruinya alih-alih menebak nilai sebelumnya.

#### Acceptance Criteria

1. WHEN Authenticated_User membuka Rating_Modal, THE Rating_Modal SHALL mengirim tepat satu permintaan pramuat Review_Record milik pengguna tersebut ke Rating_API dengan Media_Type dan Media_Id item media yang sedang ditampilkan beserta header `Authorization: Bearer <token>`
2. WHEN Rating_Modal menerima respons pramuat yang memuat Review_Record milik pengguna tersebut dengan nilai rating N, THE Rating_Modal SHALL menandai kontrol bintang 1 sampai N sebagai terpilih, menetapkan N sebagai nilai rating aktif, dan menampilkan label aksi pembaruan
3. WHEN Rating_Modal menerima respons pramuat yang menyatakan Review_Record milik pengguna tersebut belum ada, THE Rating_Modal SHALL menampilkan kontrol bintang tanpa pilihan, kolom komentar kosong, label aksi pembuatan, dan tombol simpan dalam keadaan nonaktif
4. IF permintaan pramuat Review_Record dikirim tanpa header `Authorization: Bearer <token>` yang valid, THEN THE Rating_API SHALL merespons status 401 dengan body berisi field `error` dan tanpa menyertakan data Review_Record
5. WHILE permintaan pramuat berlangsung, THE Rating_Modal SHALL menampilkan indikator proses pada area form serta menonaktifkan 10 kontrol bintang, kolom komentar, dan tombol simpan
6. IF permintaan pramuat Review_Record gagal karena kegagalan jaringan, karena Rating_API merespons status 400 atau lebih besar, atau karena respons tidak diterima dalam waktu 10 detik, THEN THE Rating_Modal SHALL menampilkan kontrol bintang tanpa pilihan, kolom komentar kosong, label aksi pembuatan, pesan kesalahan yang menyatakan pramuat rating tersimpan gagal, dan aksi untuk mengulang permintaan pramuat
7. WHEN Rating_Modal menerima respons pramuat yang memuat Review_Record milik pengguna tersebut dengan komentar berupa teks, THE Rating_Modal SHALL mengisi kolom komentar dengan teks tersimpan tersebut dan menampilkan jumlah karakter terpakai sesuai panjang teks tersebut beserta batas 1000 karakter
8. WHERE Review_Record hasil pramuat memiliki komentar bernilai null, THE Rating_Modal SHALL menampilkan kolom komentar kosong dengan jumlah karakter terpakai bernilai 0
9. WHEN Rating_API menerima permintaan pramuat Review_Record milik Authenticated_User untuk Media_Item yang belum memiliki Review_Record milik pengguna tersebut, THE Rating_API SHALL merespons status 200 dengan field data bernilai null

### Requirement 9: Penghapusan Rating

**User Story:** Sebagai pengguna, saya ingin menghapus rating yang pernah saya berikan, sehingga saya dapat menarik penilaian saya.

#### Acceptance Criteria

1. WHERE Review_Record milik Authenticated_User sudah ada untuk Media_Item yang ditampilkan, THE Rating_Modal SHALL menampilkan aksi hapus rating dalam keadaan aktif, dan menyembunyikan aksi tersebut ketika Review_Record milik pengguna tersebut belum ada
2. WHEN Authenticated_User memilih aksi konfirmasi pada permintaan konfirmasi hapus, THE Rating_API SHALL menghapus Review_Record milik `req.user.id` untuk kombinasi Media_Type dan Media_Id tersebut dan merespons status 200 dengan body berisi field data yang menyatakan penghapusan berhasil
3. IF permintaan hapus ditujukan pada kombinasi `req.user.id`, Media_Type, dan Media_Id yang tidak memiliki Review_Record tersimpan, THEN THE Rating_API SHALL merespons status 404 dengan body berisi field `error` yang menyatakan review tidak ditemukan dan tidak mengubah Review_Record lain
4. WHEN Rating_API merespons status 200 untuk permintaan hapus, THE Detail_Page SHALL memuat ulang Rating_Summary dan daftar Review_Record dengan `limit` 10 dan `offset` 0 dalam waktu 2 detik sejak respons diterima, serta menampilkan Rating_Modal dengan kontrol bintang tanpa pilihan, kolom komentar kosong, dan label aksi pembuatan
5. WHEN baris pada tabel `users` dihapus, THE Database SHALL menghapus seluruh Review_Record milik pengguna tersebut untuk Media_Type `movie` maupun `tv` melalui aturan `ON DELETE CASCADE` tanpa memerlukan permintaan hapus tambahan ke Rating_API
6. WHEN Authenticated_User memilih aksi hapus rating pada Rating_Modal, THE Rating_Modal SHALL menampilkan permintaan konfirmasi yang memuat aksi konfirmasi dan aksi batal, serta menahan pengiriman permintaan hapus ke Rating_API sampai aksi konfirmasi dipilih
7. IF Authenticated_User memilih aksi batal pada permintaan konfirmasi hapus, THEN THE Rating_Modal SHALL menutup permintaan konfirmasi tanpa mengirim permintaan hapus dan mempertahankan nilai rating serta komentar yang sedang ditampilkan
8. IF permintaan hapus gagal karena kegagalan jaringan atau Rating_API merespons status 500, THEN THE Rating_Modal SHALL menampilkan pesan kesalahan yang menyatakan rating gagal dihapus, mempertahankan aksi hapus dalam keadaan aktif, dan mempertahankan Review_Record beserta nilai rating dan komentar yang ditampilkan

### Requirement 10: Umpan Balik Proses dan Penanganan Kegagalan

**User Story:** Sebagai pengguna, saya ingin mengetahui status penyimpanan rating saya, sehingga saya tahu kapan harus mencoba lagi.

#### Acceptance Criteria

1. WHILE permintaan simpan sedang berlangsung, THE Rating_Modal SHALL menonaktifkan tombol simpan dan aksi hapus rating, menampilkan indikator proses pada area tombol simpan, dan mengabaikan penekanan tombol simpan berikutnya sehingga paling banyak satu permintaan simpan aktif pada satu waktu
2. WHEN Rating_API merespons status 200 atau 201 untuk permintaan simpan, THE Rating_Modal SHALL menghentikan indikator proses, menampilkan notifikasi keberhasilan, dan menutup diri secara otomatis paling lambat 2 detik setelah notifikasi ditampilkan
3. IF Rating_API merespons status pada rentang 400 sampai 499 selain status 401, THEN THE Rating_Modal SHALL tetap terbuka, menampilkan pesan kesalahan dari field `error` pada body respons, mempertahankan nilai rating dan isi komentar yang sudah diisi, dan mengaktifkan kembali tombol simpan
4. IF body respons kesalahan dari Rating_API tidak memuat field `error` atau tidak dapat dibaca sebagai JSON, THEN THE Rating_Modal SHALL menampilkan pesan kesalahan umum bahwa penyimpanan rating gagal dan mempertahankan nilai rating serta isi komentar yang sudah diisi
5. IF permintaan simpan tidak menerima respons karena koneksi terputus atau karena tidak ada respons dalam batas waktu 10 detik, THEN THE Rating_Modal SHALL menghentikan permintaan tersebut, menampilkan pesan kegagalan penyimpanan, mempertahankan nilai rating serta isi komentar yang sudah diisi, dan menyediakan aksi untuk mengirim ulang
6. IF query terhadap Database menghasilkan kesalahan, THEN THE Rating_API SHALL merespons status 500 dengan body berisi field `error` bernilai pesan umum yang tidak memuat detail teknis kesalahan, mencatat detail kesalahan pada log server, dan mempertahankan Review_Record yang tersimpan tanpa perubahan
7. IF Rating_API merespons status 401 untuk permintaan simpan, THEN THE Rating_Modal SHALL tetap terbuka, menampilkan pesan yang mengarahkan pengguna untuk login kembali beserta tautan ke halaman login, menonaktifkan tombol simpan, dan mempertahankan nilai rating serta isi komentar yang sudah diisi
8. IF lebih dari satu pesan kesalahan berlaku pada satu percobaan simpan, THEN THE Rating_Modal SHALL menampilkan seluruh pesan yang berlaku sebagai butir terpisah pada satu area notifikasi, dengan jumlah paling banyak 5 butir
9. IF Rating_API merespons status pada rentang 500 sampai 599 untuk permintaan simpan, THEN THE Rating_Modal SHALL menampilkan pesan kegagalan penyimpanan umum, mempertahankan nilai rating serta isi komentar yang sudah diisi, dan menyediakan aksi untuk mengirim ulang
10. WHEN Authenticated_User menekan aksi kirim ulang, THE Rating_Modal SHALL menghapus pesan kesalahan sebelumnya dan mengirim ulang permintaan simpan dengan nilai rating dan isi komentar yang sama, dengan batas paling banyak 3 kali kirim ulang berturut-turut untuk satu percobaan simpan
11. IF kirim ulang ketiga untuk satu percobaan simpan juga gagal, THEN THE Rating_Modal SHALL menyembunyikan aksi kirim ulang dan menampilkan pesan yang mengarahkan pengguna mencoba kembali nanti

### Requirement 11: Arsitektur Backend dan Skema Penyimpanan

**User Story:** Sebagai developer, saya ingin fitur rating mengikuti pola arsitektur project yang sudah ada, sehingga kode mudah dirawat dan konsisten dengan modul lain.

#### Acceptance Criteria

1. THE Rating_Service SHALL memisahkan tanggung jawab ke dalam berkas terpisah untuk lapisan routes yang hanya memetakan path dan metode HTTP ke handler controller, lapisan controller yang melakukan validasi input dan pemanggilan model, serta Review_Model sebagai static class yang menjadi satu-satunya lapisan yang mengeksekusi query database, tanpa pernyataan SQL di lapisan routes maupun controller
2. THE Review_Model SHALL menjalankan seluruh query melalui instance `sql` yang diimpor dari `src/utils/database.ts` menggunakan tagged template literal dengan setiap nilai input disisipkan sebagai parameter template, tanpa penggabungan string nilai input ke dalam teks query
3. THE Rating_Service SHALL mendefinisikan dan mengekspor tipe TypeScript untuk Review_Record, Rating_Summary, dan payload permintaan pembuatan maupun pembaruan review pada direktori `src/types/`, dengan setiap field bertipe eksplisit dan tanpa penggunaan tipe `any`
4. THE Proxy_Server SHALL mendaftarkan seluruh endpoint Rating_API pada tepat satu prefix rute khusus review di bawah namespace `/api`, konsisten dengan pendaftaran prefix `/api/movie_core`, sehingga tidak ada endpoint review yang dapat diakses di luar prefix tersebut
5. WHEN fungsi `initializeDatabase` dijalankan, THE Database SHALL membuat tabel penyimpanan Review_Record apabila tabel tersebut belum ada, beserta batasan unik pada kombinasi identifier pengguna, Media_Type, dan Media_Id, serta kolom `created_at` dan `updated_at` yang bernilai default waktu saat ini
6. WHEN fungsi `initializeDatabase` dijalankan, THE Database SHALL membuat indeks pada kombinasi kolom Media_Type dan Media_Id apabila indeks tersebut belum ada, untuk mendukung query daftar dan agregat
7. WHEN fungsi `initializeDatabase` dijalankan, THE Database SHALL membuat trigger BEFORE UPDATE pada tabel penyimpanan Review_Record yang memperbarui kolom `updated_at` ke waktu saat ini, hanya jika trigger dengan nama tersebut belum terdaftar, mengikuti pola trigger tabel `users` dan `movies`
8. THE Rating_API SHALL mengembalikan body respons berformat JSON yang pada keberhasilan berisi field data hasil operasi tanpa field `error`, dan pada kegagalan berisi field `error` bernilai pesan yang menjelaskan penyebab kegagalan tanpa menyertakan teks query, nama tabel, atau stack trace
9. WHEN fungsi `initializeDatabase` dijalankan berulang hingga 3 kali berturut-turut pada database yang sudah memiliki objek penyimpanan review, THE Database SHALL menyelesaikan setiap pemanggilan tanpa error dan tanpa menghasilkan duplikat tabel, batasan unik, indeks, atau trigger, serta mempertahankan seluruh Review_Record yang sudah tersimpan
10. IF pembuatan tabel, batasan unik, indeks, atau trigger pada `initializeDatabase` gagal, THEN THE Database SHALL menghentikan proses inisialisasi, meneruskan error ke pemanggil sehingga proses startup berhenti, dan tidak mengubah maupun menghapus Review_Record yang sudah tersimpan
11. IF eksekusi query pada Review_Model gagal, THEN THE Rating_API SHALL mengembalikan respons kegagalan berisi field `error` yang mengindikasikan kegagalan akses data, tanpa menyertakan field data, dan tidak menyisakan perubahan sebagian pada Review_Record yang menjadi target operasi
