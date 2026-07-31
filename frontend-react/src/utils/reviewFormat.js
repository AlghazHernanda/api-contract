// Helper format murni untuk fitur rating & review.
// Tanpa React, tanpa akses jaringan, tanpa efek samping (Req 1.4, 2.6, 2.7, 2.8, 6.7)

// Batas keras panjang komentar, sejalan dengan validator backend dan kolom VARCHAR(1000)
export const COMMENT_MAX_LENGTH = 1000;

// Batas panjang judul Media_Item sebelum dipotong pada Rating_Modal (Req 1.4)
export const TITLE_MAX_LENGTH = 120;

// Indikator pemotongan judul
export const TRUNCATION_INDICATOR = '…';

// Membatasi isi komentar pada 1000 karakter pertama.
// Masukan dengan panjang <= 1000 dikembalikan apa adanya; masukan bukan string
// (termasuk null/undefined) dianggap komentar kosong (Req 2.6, 2.7)
export const clampComment = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.length <= COMMENT_MAX_LENGTH ? value : value.slice(0, COMMENT_MAX_LENGTH);
};

// Jumlah karakter terpakai, selalu sama dengan panjang nilai setelah pembatasan (Req 2.8)
export const countCharacters = (value) => clampComment(value).length;

// Judul Media_Item: identik bila <= 120 karakter, dipotong beserta indikator bila lebih (Req 1.4)
export const formatTitle = (title) => {
  if (typeof title !== 'string') {
    return '';
  }

  return title.length <= TITLE_MAX_LENGTH
    ? title
    : `${title.slice(0, TITLE_MAX_LENGTH)}${TRUNCATION_INDICATOR}`;
};

// Rata-rata rating pengguna dalam format `N,N/10`; nilai tidak tersedia mengembalikan null
// sehingga pemanggil dapat menampilkan teks alternatif (Req 6.7)
export const formatAverageRating = (average) => {
  if (average === null || average === undefined || average === '') {
    return null;
  }

  const numeric = typeof average === 'number' ? average : Number(average);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return `${numeric.toFixed(1).replace('.', ',')}/10`;
};
