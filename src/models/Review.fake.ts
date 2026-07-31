import {
  CreateReviewPayload,
  MediaRef,
  MediaType,
  RatingSummary,
  ReviewListItem,
  ReviewListParams,
  ReviewListResult,
  ReviewOwnerRecord,
  ReviewRecord,
} from '../types/review';

/**
 * Fake in-memory ReviewModel untuk property test (task 5.2).
 * Requirements: 5.5, 6.2, 7.3
 *
 * Modul ini menirukan semantik Database yang dipakai `src/models/Review.ts`:
 * - unique constraint `(user_id, media_type, media_id)` beserta perilaku upsert
 *   `ON CONFLICT DO UPDATE` (Req 5.5)
 * - penetapan `created_at`/`updated_at` dari waktu server, dengan `created_at`
 *   tidak berubah pada pembaruan dan `updated_at` tidak pernah mundur (Req 5.1, 5.3, 5.6)
 * - agregat `ROUND(AVG(rating)::numeric, 1)` + `COUNT(*)::int`, termasuk
 *   `average_rating` null ketika tidak ada baris (Req 6.2, 6.3, 6.4)
 * - urutan daftar `updated_at DESC, created_at DESC, id DESC`, `total` dari
 *   `COUNT(*)` yang tidak terpengaruh limit/offset, dan elemen daftar berisi
 *   tepat lima field tanpa `password`/`email` (Req 7.2, 7.3, 7.7, 7.8, 7.9)
 * - CHECK constraint tingkat tabel pada `rating`, `media_id`, dan panjang `comment` (Req 3.8)
 *
 * Antarmuka tujuh metode di bawah identik dengan `ReviewModel`; kesesuaiannya
 * dijaga pada waktu kompilasi lewat `implements ReviewModelInterface`. Metode
 * bantu uji (`reset`, `seed`, `registerUser`, kontrol jam) dipisah dari antarmuka
 * tersebut sehingga tidak mengubah kontrak model.
 */

// Sisi statis ReviewModel nyata, diambil sebagai tipe saja (tanpa import runtime,
// sehingga fake tidak pernah membuka koneksi database).
type RealReviewModelStatic = typeof import('./Review').ReviewModel;

export type ReviewModelInterface = Pick<
  RealReviewModelStatic,
  | 'upsert'
  | 'findByUserAndMedia'
  | 'getSummary'
  | 'listByMedia'
  | 'deleteByUserAndMedia'
  | 'findById'
  | 'deleteById'
>;

// Representasi satu baris tabel `reviews` di memori
export interface FakeReviewRow {
  id: number;
  user_id: number;
  media_type: MediaType;
  media_id: number;
  rating: number;
  comment: string | null;
  created_at: Date;
  updated_at: Date;
}

// Baris awal untuk `seed`; timestamp dan id opsional
export interface FakeReviewSeedRow {
  id?: number;
  user_id: number;
  media_type: MediaType;
  media_id: number;
  rating: number;
  comment?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export const COMMENT_MAX_LENGTH = 1000;
export const MEDIA_ID_MAX = 2147483647;

// Waktu awal jam terkontrol: tetap agar seluruh test bersifat deterministik
export const DEFAULT_EPOCH_MS = Date.UTC(2025, 0, 5, 9, 0, 0);

/**
 * Kesalahan yang menirukan pelanggaran constraint PostgreSQL, dipakai agar
 * property test dapat membedakan penolakan database dari kesalahan lain.
 */
export class FakeConstraintViolation extends Error {
  constructor(public readonly constraint: string, message: string) {
    super(message);
    this.name = 'FakeConstraintViolation';
  }
}

export class FakeReviewModel implements ReviewModelInterface {
  private rows: FakeReviewRow[] = [];
  private usernames = new Map<number, string>();
  private nextId = 1;
  private currentTimeMs = DEFAULT_EPOCH_MS;

  // ---------------------------------------------------------------------------
  // Antarmuka identik dengan ReviewModel
  // ---------------------------------------------------------------------------

  // Upsert atomik pada kombinasi unik (user_id, media_type, media_id) (Req 5.5)
  async upsert(
    userId: number,
    payload: CreateReviewPayload
  ): Promise<{ review: ReviewRecord; wasInserted: boolean }> {
    const { media_type, media_id, rating, comment } = payload;

    this.assertTableConstraints(media_type, media_id, rating, comment);

    const existing = this.findRow(userId, media_type, media_id);
    const now = this.now();

    if (existing) {
      // DO UPDATE: hanya rating, comment, dan updated_at berubah; id, user_id,
      // media_type, media_id, dan created_at dipertahankan (Req 5.3, 5.6)
      existing.rating = rating;
      existing.comment = comment;
      existing.updated_at = now;
      return { review: this.toReviewRecord(existing), wasInserted: false };
    }

    // INSERT: created_at dan updated_at bernilai sama dengan waktu server (Req 5.1)
    const inserted: FakeReviewRow = {
      id: this.nextId++,
      user_id: userId,
      media_type,
      media_id,
      rating,
      comment,
      created_at: now,
      updated_at: new Date(now.getTime()),
    };
    this.rows.push(inserted);
    return { review: this.toReviewRecord(inserted), wasInserted: true };
  }

  async findByUserAndMedia(userId: number, media: MediaRef): Promise<ReviewRecord | null> {
    const row = this.findRow(userId, media.media_type, media.media_id);
    return row ? this.toReviewRecord(row) : null;
  }

  // ROUND(AVG(rating)::numeric, 1): pembulatan setengah menjauh dari nol (Req 6.2)
  async getSummary(media: MediaRef): Promise<RatingSummary> {
    const matching = this.rowsForMedia(media.media_type, media.media_id);

    if (matching.length === 0) {
      // AVG mengembalikan NULL ketika tidak ada baris (Req 6.4)
      return {
        media_type: media.media_type,
        media_id: media.media_id,
        average_rating: null,
        review_count: 0,
      };
    }

    const sum = matching.reduce((total, row) => total + row.rating, 0);

    return {
      media_type: media.media_type,
      media_id: media.media_id,
      average_rating: roundHalfAwayFromZeroOneDecimal(sum, matching.length),
      review_count: matching.length,
    };
  }

  // `total` dari COUNT(*) penuh (tanpa join, tanpa limit/offset) sebagaimana
  // query nyata, sedangkan `items` melewati INNER JOIN users (Req 7.3, 7.7, 7.9)
  async listByMedia(params: ReviewListParams): Promise<ReviewListResult> {
    const { media_type, media_id, limit, offset } = params;

    const matching = this.rowsForMedia(media_type, media_id);
    const total = matching.length;

    const joined = matching.filter((row) => this.usernames.has(row.user_id));
    const ordered = [...joined].sort(compareForList);

    const items: ReviewListItem[] = ordered
      .slice(offset, offset + limit)
      .map((row) => ({
        // Tepat lima field; `password` dan `email` tidak pernah tersedia di sini
        username: this.usernames.get(row.user_id) as string,
        rating: row.rating,
        comment: row.comment,
        created_at: new Date(row.created_at.getTime()),
        updated_at: new Date(row.updated_at.getTime()),
      }));

    return { items, total, limit, offset };
  }

  async deleteByUserAndMedia(userId: number, media: MediaRef): Promise<number> {
    const before = this.rows.length;
    this.rows = this.rows.filter(
      (row) =>
        !(
          row.user_id === userId &&
          row.media_type === media.media_type &&
          row.media_id === media.media_id
        )
    );
    return before - this.rows.length;
  }

  async findById(id: number): Promise<ReviewOwnerRecord | null> {
    const row = this.rows.find((candidate) => candidate.id === id);
    return row ? { user_id: row.user_id, ...this.toReviewRecord(row) } : null;
  }

  // Hanya menghapus bila pemiliknya cocok (Req 4.5)
  async deleteById(id: number, userId: number): Promise<number> {
    const before = this.rows.length;
    this.rows = this.rows.filter((row) => !(row.id === id && row.user_id === userId));
    return before - this.rows.length;
  }

  // ---------------------------------------------------------------------------
  // Metode bantu uji
  // ---------------------------------------------------------------------------

  /** Mengosongkan baris, daftar username, penghitung id, dan mengembalikan jam ke awal. */
  reset(): void {
    this.rows = [];
    this.usernames.clear();
    this.nextId = 1;
    this.currentTimeMs = DEFAULT_EPOCH_MS;
  }

  /** Mendaftarkan username pemilik; tanpa ini baris dikecualikan dari `listByMedia`. */
  registerUser(userId: number, username: string): void {
    this.usernames.set(userId, username);
  }

  registerUsers(users: { id: number; username: string }[]): void {
    for (const user of users) this.registerUser(user.id, user.username);
  }

  /** Menghapus baris `users` tanpa cascade: review tetap ada tetapi gagal INNER JOIN. */
  removeUser(userId: number): void {
    this.usernames.delete(userId);
  }

  /** Menirukan `ON DELETE CASCADE`: baris users hilang beserta seluruh review-nya (Req 9.5). */
  deleteUserWithCascade(userId: number): number {
    this.usernames.delete(userId);
    const before = this.rows.length;
    this.rows = this.rows.filter((row) => row.user_id !== userId);
    return before - this.rows.length;
  }

  /**
   * Mengisi baris awal. Menolak duplikat kombinasi unik seperti Database, dan
   * membiarkan timestamp diatur eksplisit agar urutan daftar dapat diuji.
   */
  seed(seedRows: FakeReviewSeedRow[]): void {
    for (const seedRow of seedRows) {
      const comment = seedRow.comment === undefined ? null : seedRow.comment;
      this.assertTableConstraints(seedRow.media_type, seedRow.media_id, seedRow.rating, comment);

      if (this.findRow(seedRow.user_id, seedRow.media_type, seedRow.media_id)) {
        throw new FakeConstraintViolation(
          'reviews_user_media_key',
          `duplicate key value violates unique constraint on (user_id, media_type, media_id): (${seedRow.user_id}, ${seedRow.media_type}, ${seedRow.media_id})`
        );
      }

      const id = seedRow.id ?? this.nextId;
      if (this.rows.some((row) => row.id === id)) {
        throw new FakeConstraintViolation(
          'reviews_pkey',
          `duplicate key value violates unique constraint on id: ${id}`
        );
      }

      const createdAt = seedRow.created_at ? new Date(seedRow.created_at.getTime()) : this.now();
      const updatedAt = seedRow.updated_at
        ? new Date(seedRow.updated_at.getTime())
        : new Date(createdAt.getTime());

      this.rows.push({
        id,
        user_id: seedRow.user_id,
        media_type: seedRow.media_type,
        media_id: seedRow.media_id,
        rating: seedRow.rating,
        comment,
        created_at: createdAt,
        updated_at: updatedAt,
      });

      this.nextId = Math.max(this.nextId, id + 1);
    }
  }

  /** Waktu server yang dipakai upsert; deterministik dan dikendalikan test. */
  now(): Date {
    return new Date(this.currentTimeMs);
  }

  /** Memajukan jam. Nilai negatif ditolak karena `NOW()` tidak pernah mundur. */
  advanceClock(ms: number): void {
    if (!Number.isFinite(ms) || ms < 0) {
      throw new Error(`advanceClock requires a non-negative finite value, received ${ms}`);
    }
    this.currentTimeMs += ms;
  }

  /** Menetapkan jam ke waktu tertentu; menolak waktu lebih awal dari waktu sekarang. */
  setClock(time: Date | number): void {
    const next = typeof time === 'number' ? time : time.getTime();
    if (!Number.isFinite(next)) {
      throw new Error('setClock requires a finite timestamp');
    }
    if (next < this.currentTimeMs) {
      throw new Error('setClock cannot move the clock backwards, NOW() is non-decreasing');
    }
    this.currentTimeMs = next;
  }

  /** Salinan seluruh baris (termasuk `user_id`) untuk pemeriksaan invariant. */
  getAllRows(): FakeReviewRow[] {
    return this.rows.map((row) => ({
      ...row,
      created_at: new Date(row.created_at.getTime()),
      updated_at: new Date(row.updated_at.getTime()),
    }));
  }

  /** Jumlah baris tersimpan, seluruhnya atau untuk satu kombinasi unik. */
  countRows(key?: { user_id: number; media_type: MediaType; media_id: number }): number {
    if (!key) return this.rows.length;
    return this.rows.filter(
      (row) =>
        row.user_id === key.user_id &&
        row.media_type === key.media_type &&
        row.media_id === key.media_id
    ).length;
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private findRow(
    userId: number,
    mediaType: MediaType,
    mediaId: number
  ): FakeReviewRow | undefined {
    return this.rows.find(
      (row) =>
        row.user_id === userId && row.media_type === mediaType && row.media_id === mediaId
    );
  }

  private rowsForMedia(mediaType: MediaType, mediaId: number): FakeReviewRow[] {
    return this.rows.filter((row) => row.media_type === mediaType && row.media_id === mediaId);
  }

  private toReviewRecord(row: FakeReviewRow): ReviewRecord {
    // Bentuk sama dengan RETURNING pada query nyata: tanpa `user_id`
    return {
      id: row.id,
      media_type: row.media_type,
      media_id: row.media_id,
      rating: row.rating,
      comment: row.comment,
      created_at: new Date(row.created_at.getTime()),
      updated_at: new Date(row.updated_at.getTime()),
    };
  }

  // CHECK constraint tingkat tabel pada tabel `reviews` (Req 3.8)
  private assertTableConstraints(
    mediaType: MediaType,
    mediaId: number,
    rating: number,
    comment: string | null
  ): void {
    if (mediaType !== 'movie' && mediaType !== 'tv') {
      throw new FakeConstraintViolation(
        'reviews_media_type_check',
        `media_type must be either "movie" or "tv", received ${String(mediaType)}`
      );
    }
    if (!Number.isInteger(mediaId) || mediaId <= 0 || mediaId > MEDIA_ID_MAX) {
      throw new FakeConstraintViolation(
        'reviews_media_id_check',
        `media_id must be a positive integer within INT range, received ${String(mediaId)}`
      );
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
      throw new FakeConstraintViolation(
        'reviews_rating_check',
        `rating must be an integer between 1 and 10, received ${String(rating)}`
      );
    }
    if (comment !== null && comment.length > COMMENT_MAX_LENGTH) {
      throw new FakeConstraintViolation(
        'reviews_comment_length',
        `comment exceeds ${COMMENT_MAX_LENGTH} characters, received ${comment.length}`
      );
    }
  }
}

/**
 * ORDER BY updated_at DESC, created_at DESC, id DESC (Req 7.3).
 * Diekspor agar test dapat memakai perbandingan yang sama sebagai referensi.
 */
export function compareForList(a: FakeReviewRow, b: FakeReviewRow): number {
  const byUpdated = b.updated_at.getTime() - a.updated_at.getTime();
  if (byUpdated !== 0) return byUpdated;
  const byCreated = b.created_at.getTime() - a.created_at.getTime();
  if (byCreated !== 0) return byCreated;
  return b.id - a.id;
}

/**
 * Pembulatan satu angka desimal setengah menjauh dari nol memakai aritmetika
 * bilangan bulat, agar identik dengan `ROUND(AVG(rating)::numeric, 1)` pada
 * PostgreSQL dan bebas galat pembulatan floating point (Req 6.2).
 */
export function roundHalfAwayFromZeroOneDecimal(sum: number, count: number): number {
  const numerator = sum * 10;
  const quotient = Math.floor(numerator / count);
  const remainder = numerator - quotient * count;
  const rounded = remainder * 2 >= count ? quotient + 1 : quotient;
  return rounded / 10;
}
