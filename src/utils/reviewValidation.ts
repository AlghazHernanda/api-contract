import { CreateReviewPayload, MediaRef, MediaType, ReviewListParams } from '../types/review';

// Batas nilai yang dipakai validator dan lapisan lain (Req 3.2, 3.4, 3.5, 7.5)
export const COMMENT_MAX_LENGTH = 1000;
export const MEDIA_ID_MAX = 2147483647;
export const LIMIT_MIN = 1;
export const LIMIT_MAX = 50;
export const OFFSET_MAX = 999999999;
export const DEFAULT_LIMIT = 10;
export const DEFAULT_OFFSET = 0;

const RATING_MIN = 1;
const RATING_MAX = 10;
const MEDIA_ID_MIN = 1;
const OFFSET_MIN = 0;

const MESSAGES = {
  rating: `rating must be an integer between ${RATING_MIN} and ${RATING_MAX}`,
  media_type: 'media_type must be either "movie" or "tv"',
  media_id: `media_id must be an integer between ${MEDIA_ID_MIN} and ${MEDIA_ID_MAX}`,
  comment: `comment must be a string of at most ${COMMENT_MAX_LENGTH} characters`,
  limit: `limit must be an integer between ${LIMIT_MIN} and ${LIMIT_MAX}`,
  offset: `offset must be an integer between ${OFFSET_MIN} and ${OFFSET_MAX}`
} as const;

export interface ValidationError {
  field: string;
  message: string;
}

export type ValidationResult<T> =
  | { valid: true; value: T }
  | { valid: false; errors: ValidationError[] };

// Hanya string bertanda opsional dan digit yang dianggap bilangan bulat
const INTEGER_PATTERN = /^[+-]?\d+$/;

// Membaca satu field tanpa melempar error untuk input non-objek.
// Field asing (termasuk user_id) tidak pernah dibaca sehingga otomatis diabaikan (Req 4.3)
function readField(source: unknown, field: string): unknown {
  if (typeof source !== 'object' || source === null) {
    return undefined;
  }
  return (source as Record<string, unknown>)[field];
}

// Nilai query yang tidak disertakan atau berupa string kosong dianggap absen (Req 7.4)
function isAbsent(raw: unknown): boolean {
  if (raw === undefined || raw === null) {
    return true;
  }
  return typeof raw === 'string' && raw.trim() === '';
}

// Mengembalikan bilangan bulat dalam rentang, atau null bila tidak sah.
// `allowString` dipakai untuk parameter query yang selalu datang sebagai string dari Express
function toIntegerInRange(
  raw: unknown,
  min: number,
  max: number,
  allowString: boolean
): number | null {
  let parsed: number;

  if (typeof raw === 'number') {
    parsed = raw;
  } else if (allowString && typeof raw === 'string' && INTEGER_PATTERN.test(raw.trim())) {
    parsed = Number(raw.trim());
  } else {
    return null;
  }

  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

// Pembandingan peka huruf besar-kecil terhadap dua nilai yang diizinkan (Req 3.3)
function toMediaType(raw: unknown): MediaType | null {
  if (raw === 'movie' || raw === 'tv') {
    return raw;
  }
  return null;
}

/**
 * Memangkas spasi, tab, dan baris baru di kedua ujung komentar (Req 3.6).
 * Komentar yang tidak disertakan, bernilai null, atau kosong setelah pemangkasan
 * menghasilkan null (Req 3.7).
 */
export function normalizeComment(comment: unknown): string | null {
  if (typeof comment !== 'string') {
    return null;
  }

  const trimmed = comment.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Validasi body permintaan simpan. Mengumpulkan tepat satu entri kesalahan
 * untuk setiap field yang gagal (Req 3.10) dan mengabaikan field asing (Req 4.3).
 */
export function validateCreateReviewPayload(body: unknown): ValidationResult<CreateReviewPayload> {
  const errors: ValidationError[] = [];

  const rating = toIntegerInRange(readField(body, 'rating'), RATING_MIN, RATING_MAX, false);
  if (rating === null) {
    errors.push({ field: 'rating', message: MESSAGES.rating });
  }

  const mediaType = toMediaType(readField(body, 'media_type'));
  if (mediaType === null) {
    errors.push({ field: 'media_type', message: MESSAGES.media_type });
  }

  const mediaId = toIntegerInRange(readField(body, 'media_id'), MEDIA_ID_MIN, MEDIA_ID_MAX, false);
  if (mediaId === null) {
    errors.push({ field: 'media_id', message: MESSAGES.media_id });
  }

  const rawComment = readField(body, 'comment');
  let comment: string | null = null;
  if (rawComment !== undefined && rawComment !== null) {
    if (typeof rawComment !== 'string') {
      errors.push({ field: 'comment', message: MESSAGES.comment });
    } else {
      const normalized = normalizeComment(rawComment);
      if (normalized !== null && normalized.length > COMMENT_MAX_LENGTH) {
        errors.push({ field: 'comment', message: MESSAGES.comment });
      } else {
        comment = normalized;
      }
    }
  }

  if (rating === null || mediaType === null || mediaId === null || errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    value: {
      media_type: mediaType,
      media_id: mediaId,
      rating,
      comment
    }
  };
}

/**
 * Validasi media_type dan media_id dari parameter query (Req 6.6).
 * Nilai numerik diterima sebagai string karena Express selalu menyerahkan query sebagai string.
 */
export function validateMediaParams(query: unknown): ValidationResult<MediaRef> {
  const errors: ValidationError[] = [];

  const mediaType = toMediaType(readField(query, 'media_type'));
  if (mediaType === null) {
    errors.push({ field: 'media_type', message: MESSAGES.media_type });
  }

  const mediaId = toIntegerInRange(readField(query, 'media_id'), MEDIA_ID_MIN, MEDIA_ID_MAX, true);
  if (mediaId === null) {
    errors.push({ field: 'media_id', message: MESSAGES.media_id });
  }

  if (mediaType === null || mediaId === null) {
    return { valid: false, errors };
  }

  return { valid: true, value: { media_type: mediaType, media_id: mediaId } };
}

/**
 * Validasi parameter daftar review: media_type, media_id, limit, offset.
 * `limit` dan `offset` bersifat opsional dengan nilai bawaan 10 dan 0 (Req 7.4),
 * dan nilai di luar rentang menghasilkan kesalahan per parameter (Req 7.6).
 */
export function validateListParams(query: unknown): ValidationResult<ReviewListParams> {
  const media = validateMediaParams(query);
  const errors: ValidationError[] = media.valid ? [] : [...media.errors];

  const rawLimit = readField(query, 'limit');
  let limit: number | null = DEFAULT_LIMIT;
  if (!isAbsent(rawLimit)) {
    limit = toIntegerInRange(rawLimit, LIMIT_MIN, LIMIT_MAX, true);
    if (limit === null) {
      errors.push({ field: 'limit', message: MESSAGES.limit });
    }
  }

  const rawOffset = readField(query, 'offset');
  let offset: number | null = DEFAULT_OFFSET;
  if (!isAbsent(rawOffset)) {
    offset = toIntegerInRange(rawOffset, OFFSET_MIN, OFFSET_MAX, true);
    if (offset === null) {
      errors.push({ field: 'offset', message: MESSAGES.offset });
    }
  }

  if (!media.valid || limit === null || offset === null) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    value: {
      media_type: media.value.media_type,
      media_id: media.value.media_id,
      limit,
      offset
    }
  };
}
