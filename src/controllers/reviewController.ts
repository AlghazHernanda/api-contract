import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { AuthenticatedRequest } from '../middleware/auth';
import { ReviewModel } from '../models/Review';
import {
  MEDIA_ID_MAX,
  ValidationError,
  validateCreateReviewPayload,
  validateListParams,
  validateMediaParams
} from '../utils/reviewValidation';

// Lapisan ini tidak pernah mengeksekusi query; seluruh akses data lewat ReviewModel (Req 11.1)

const ID_MIN = 1;
const ID_MESSAGE = `id must be an integer between ${ID_MIN} and ${MEDIA_ID_MAX}`;
const INTEGER_PATTERN = /^[+-]?\d+$/;

// Response kegagalan validasi: hanya error + details, tanpa field data (Req 3.9, 6.6, 7.6)
function respondValidationFailed(res: Response, errors: ValidationError[]): void {
  res.status(400).json({ error: 'Validation failed', details: errors });
}

// Pesan generik ke client, detail teknis hanya ke log server (Req 10.6, 11.8, 11.11)
function respondServerError(res: Response, logLabel: string, error: unknown, message: string): void {
  console.error(logLabel, error);
  res.status(500).json({ error: message });
}

// Identifier Review_Record dari path parameter; bukan bilangan bulat sah → tidak valid
function parseReviewId(raw: unknown): number | null {
  if (typeof raw !== 'string' || !INTEGER_PATTERN.test(raw.trim())) {
    return null;
  }

  const parsed = Number(raw.trim());
  if (!Number.isSafeInteger(parsed) || parsed < ID_MIN || parsed > MEDIA_ID_MAX) {
    return null;
  }

  return parsed;
}

/**
 * POST /api/reviews — buat atau perbarui review milik pengguna terautentikasi.
 * 201 untuk baris baru, 200 untuk pembaruan (Req 5.2, 5.4).
 */
export const upsertReviewHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const result = validateCreateReviewPayload(req.body);
    if (!result.valid) {
      // Model tidak dipanggil sama sekali ketika validasi gagal (Req 3.9, 3.10)
      respondValidationFailed(res, result.errors);
      return;
    }

    // Pemilik selalu dari token, field identifier pengguna pada body diabaikan (Req 4.3)
    const userId = req.user!.id;
    const { review, wasInserted } = await ReviewModel.upsert(userId, result.value);

    res.status(wasInserted ? 201 : 200).json({
      requestId: randomUUID(),
      data: review
    });
  } catch (error) {
    respondServerError(res, 'Upsert review error:', error, 'Failed to save review');
  }
};

/**
 * GET /api/reviews/me — pramuat review milik pengguna sendiri.
 * `data` bernilai null ketika pengguna belum pernah menilai item media (Req 8.9).
 */
export const getMyReviewHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const result = validateMediaParams(req.query);
    if (!result.valid) {
      respondValidationFailed(res, result.errors);
      return;
    }

    const review = await ReviewModel.findByUserAndMedia(req.user!.id, result.value);

    res.status(200).json({
      requestId: randomUUID(),
      data: review
    });
  } catch (error) {
    respondServerError(res, 'Get my review error:', error, 'Failed to fetch review');
  }
};

/**
 * GET /api/reviews/summary — ringkasan rating pengguna aplikasi.
 * Tidak memerlukan autentikasi; response identik untuk semua pemanggil (Req 4.4, 6.1, 6.5).
 */
export const getRatingSummaryHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = validateMediaParams(req.query);
    if (!result.valid) {
      // Tanpa field average_rating maupun review_count pada body (Req 6.6)
      respondValidationFailed(res, result.errors);
      return;
    }

    const summary = await ReviewModel.getSummary(result.value);

    res.status(200).json({
      requestId: randomUUID(),
      data: summary
    });
  } catch (error) {
    respondServerError(res, 'Get rating summary error:', error, 'Failed to fetch rating summary');
  }
};

/**
 * GET /api/reviews — daftar review satu item media beserta metadata paginasi.
 * Tidak memerlukan autentikasi (Req 4.4, 7.6).
 */
export const getReviewListHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = validateListParams(req.query);
    if (!result.valid) {
      // Tanpa field data pada body (Req 7.6)
      respondValidationFailed(res, result.errors);
      return;
    }

    const { items, total, limit, offset } = await ReviewModel.listByMedia(result.value);

    res.status(200).json({
      requestId: randomUUID(),
      data: items,
      total,
      limit,
      offset,
      count: items.length
    });
  } catch (error) {
    respondServerError(res, 'Get review list error:', error, 'Failed to fetch reviews');
  }
};

/**
 * DELETE /api/reviews — hapus review sendiri pada satu item media.
 * 404 ketika kombinasi pengguna + media tidak memiliki baris (Req 9.2, 9.3).
 */
export const deleteMyReviewHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const result = validateMediaParams(req.query);
    if (!result.valid) {
      respondValidationFailed(res, result.errors);
      return;
    }

    const deletedCount = await ReviewModel.deleteByUserAndMedia(req.user!.id, result.value);
    if (deletedCount === 0) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    res.status(200).json({
      requestId: randomUUID(),
      data: {
        deleted: true,
        media_type: result.value.media_type,
        media_id: result.value.media_id
      }
    });
  } catch (error) {
    respondServerError(res, 'Delete my review error:', error, 'Failed to delete review');
  }
};

/**
 * DELETE /api/reviews/:id — hapus Review_Record berdasarkan identifier.
 * 403 ketika pemiliknya berbeda tanpa mengubah baris, 404 ketika tidak ada (Req 4.5).
 */
export const deleteReviewByIdHandler = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const id = parseReviewId(req.params.id);
    if (id === null) {
      respondValidationFailed(res, [{ field: 'id', message: ID_MESSAGE }]);
      return;
    }

    const review = await ReviewModel.findById(id);
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    if (review.user_id !== req.user!.id) {
      // Baris tetap utuh: penghapusan tidak dijalankan (Req 4.5)
      res.status(403).json({ error: 'You can only delete your own review' });
      return;
    }

    const deletedCount = await ReviewModel.deleteById(id, req.user!.id);
    if (deletedCount === 0) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    res.status(200).json({
      requestId: randomUUID(),
      data: { deleted: true, id }
    });
  } catch (error) {
    respondServerError(res, 'Delete review by id error:', error, 'Failed to delete review');
  }
};
