import sql from '../utils/database';
import {
  CreateReviewPayload,
  MediaRef,
  RatingSummary,
  ReviewListItem,
  ReviewListParams,
  ReviewListResult,
  ReviewOwnerRecord,
  ReviewRecord,
} from '../types/review';

// Baris hasil upsert membawa flag pembeda INSERT vs UPDATE lewat kolom sistem xmax
type UpsertRow = ReviewRecord & { was_inserted: boolean };

// Baris agregat: numeric dikembalikan postgres.js sebagai string, COUNT(*)::int sebagai number
type SummaryRow = { average_rating: string | null; review_count: number };

type CountRow = { total: number };

export class ReviewModel {
  // Upsert atomik: satu statement, aman terhadap dua permintaan bersamaan (Req 5.5, 5.8)
  // media_id tanpa foreign key sehingga media_type 'tv' tidak butuh baris di movies (Req 5.9)
  static async upsert(
    userId: number,
    payload: CreateReviewPayload
  ): Promise<{ review: ReviewRecord; wasInserted: boolean }> {
    const { media_type, media_id, rating, comment } = payload;

    try {
      const [row] = await sql<UpsertRow[]>`
        INSERT INTO reviews (user_id, media_type, media_id, rating, comment)
        VALUES (${userId}, ${media_type}, ${media_id}, ${rating}, ${comment})
        ON CONFLICT (user_id, media_type, media_id)
        DO UPDATE SET
          rating = EXCLUDED.rating,
          comment = EXCLUDED.comment,
          updated_at = NOW()
        RETURNING id, media_type, media_id, rating, comment, created_at, updated_at,
                  (xmax = 0) AS was_inserted
      `;

      const { was_inserted, ...review } = row;
      return { review, wasInserted: was_inserted };
    } catch (error) {
      throw error;
    }
  }

  // Review milik pengguna sendiri untuk satu item media (Req 8.9)
  static async findByUserAndMedia(
    userId: number,
    media: MediaRef
  ): Promise<ReviewRecord | null> {
    try {
      const rows = await sql<ReviewRecord[]>`
        SELECT id, media_type, media_id, rating, comment, created_at, updated_at
        FROM reviews
        WHERE user_id = ${userId}
          AND media_type = ${media.media_type}
          AND media_id = ${media.media_id}
      `;
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Agregat rata-rata dibulatkan satu desimal, dan jumlah review (Req 6.2, 6.3, 6.4)
  static async getSummary(media: MediaRef): Promise<RatingSummary> {
    try {
      const [row] = await sql<SummaryRow[]>`
        SELECT
          ROUND(AVG(rating)::numeric, 1) AS average_rating,
          COUNT(*)::int                  AS review_count
        FROM reviews
        WHERE media_type = ${media.media_type}
          AND media_id = ${media.media_id}
      `;

      return {
        media_type: media.media_type,
        media_id: media.media_id,
        // AVG mengembalikan NULL ketika tidak ada baris (Req 6.4)
        average_rating: row.average_rating === null ? null : Number(row.average_rating),
        review_count: Number(row.review_count),
      };
    } catch (error) {
      throw error;
    }
  }

  // Dua query: total tidak terpengaruh limit/offset dan tetap benar walaupun halaman
  // kosong (Req 7.7, 7.9). Hanya username yang diambil dari users (Req 7.2, 7.8)
  static async listByMedia(params: ReviewListParams): Promise<ReviewListResult> {
    const { media_type, media_id, limit, offset } = params;

    try {
      const [countRow] = await sql<CountRow[]>`
        SELECT COUNT(*)::int AS total
        FROM reviews
        WHERE media_type = ${media_type}
          AND media_id = ${media_id}
      `;

      const items = await sql<ReviewListItem[]>`
        SELECT u.username, r.rating, r.comment, r.created_at, r.updated_at
        FROM reviews r
        INNER JOIN users u ON u.id = r.user_id
        WHERE r.media_type = ${media_type}
          AND r.media_id = ${media_id}
        ORDER BY r.updated_at DESC, r.created_at DESC, r.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      return {
        items: Array.from(items),
        total: Number(countRow.total),
        limit,
        offset,
      };
    } catch (error) {
      throw error;
    }
  }

  // Hapus review milik pengguna sendiri; 0 berarti tidak ada yang terhapus (Req 9.2, 9.3)
  static async deleteByUserAndMedia(userId: number, media: MediaRef): Promise<number> {
    try {
      const deleted = await sql<{ id: number }[]>`
        DELETE FROM reviews
        WHERE user_id = ${userId}
          AND media_type = ${media.media_type}
          AND media_id = ${media.media_id}
        RETURNING id
      `;
      return deleted.length;
    } catch (error) {
      throw error;
    }
  }

  // Menyertakan user_id untuk pemeriksaan kepemilikan di controller (Req 4.5)
  static async findById(id: number): Promise<ReviewOwnerRecord | null> {
    try {
      const rows = await sql<ReviewOwnerRecord[]>`
        SELECT id, user_id, media_type, media_id, rating, comment, created_at, updated_at
        FROM reviews
        WHERE id = ${id}
      `;
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Hapus berdasarkan id hanya bila pemiliknya cocok (Req 4.5)
  static async deleteById(id: number, userId: number): Promise<number> {
    try {
      const deleted = await sql<{ id: number }[]>`
        DELETE FROM reviews
        WHERE id = ${id}
          AND user_id = ${userId}
        RETURNING id
      `;
      return deleted.length;
    } catch (error) {
      throw error;
    }
  }
}
