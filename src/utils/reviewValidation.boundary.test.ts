import { describe, expect, it } from 'vitest';
import {
  COMMENT_MAX_LENGTH,
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
  LIMIT_MAX,
  LIMIT_MIN,
  MEDIA_ID_MAX,
  OFFSET_MAX,
  ValidationError,
  validateCreateReviewPayload,
  validateListParams,
  validateMediaParams
} from './reviewValidation';

// Payload minimal yang sah, dipakai sebagai dasar setiap kasus batas
function payload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { rating: 5, media_type: 'movie', media_id: 550, ...overrides };
}

// Mengembalikan daftar field yang gagal, memastikan tepat satu entri per field (Req 3.10)
function failedFields(errors: ValidationError[]): string[] {
  return errors.map((error) => error.field).sort();
}

describe('validateCreateReviewPayload - batas rating (Req 3.2)', () => {
  it('menerima rating batas bawah 1 dan batas atas 10', () => {
    for (const rating of [1, 10]) {
      const result = validateCreateReviewPayload(payload({ rating }));

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.value.rating).toBe(rating);
      }
    }
  });

  it('menolak rating 0, 11, dan nilai desimal dengan tepat satu kesalahan bernama rating', () => {
    for (const rating of [0, 11, 7.5, -1, 10.0001]) {
      const result = validateCreateReviewPayload(payload({ rating }));

      expect(result.valid).toBe(false);
      if (result.valid) {
        continue;
      }

      expect(failedFields(result.errors)).toEqual(['rating']);
      expect(result.errors[0].message).toContain('rating');
    }
  });

  it('menolak rating yang tidak disertakan maupun bernilai null', () => {
    const bodies: Array<Record<string, unknown>> = [
      { media_type: 'movie', media_id: 550 },
      payload({ rating: null })
    ];

    for (const body of bodies) {
      const result = validateCreateReviewPayload(body);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(failedFields(result.errors)).toEqual(['rating']);
      }
    }
  });
});

describe('validateCreateReviewPayload - batas media_type (Req 3.3)', () => {
  it('menerima tepat dua nilai yang diizinkan', () => {
    for (const mediaType of ['movie', 'tv'] as const) {
      const result = validateCreateReviewPayload(payload({ media_type: mediaType }));

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.value.media_type).toBe(mediaType);
      }
    }
  });

  it('menolak variasi huruf besar-kecil dan nilai lain karena pembandingan peka huruf', () => {
    for (const mediaType of ['Movie', 'MOVIE', 'Tv', 'TV', 'movie ', 'film', '']) {
      const result = validateCreateReviewPayload(payload({ media_type: mediaType }));

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(failedFields(result.errors)).toEqual(['media_type']);
        expect(result.errors[0].message).toContain('media_type');
      }
    }
  });
});

describe('validateCreateReviewPayload - batas media_id (Req 3.4)', () => {
  it('menerima media_id 1 dan 2147483647', () => {
    for (const mediaId of [1, MEDIA_ID_MAX]) {
      const result = validateCreateReviewPayload(payload({ media_id: mediaId }));

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.value.media_id).toBe(mediaId);
      }
    }
  });

  it('menolak media_id 0, 2147483648, desimal, dan bentuk string', () => {
    for (const mediaId of [0, -1, MEDIA_ID_MAX + 1, 1.5, '550']) {
      const result = validateCreateReviewPayload(payload({ media_id: mediaId }));

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(failedFields(result.errors)).toEqual(['media_id']);
        expect(result.errors[0].message).toContain('media_id');
      }
    }
  });
});

describe('validateCreateReviewPayload - batas panjang komentar (Req 3.5)', () => {
  it('menerima komentar 0, 1, dan 1000 karakter', () => {
    const cases: Array<{ comment: string; expected: string | null }> = [
      { comment: '', expected: null },
      { comment: 'x', expected: 'x' },
      { comment: 'a'.repeat(COMMENT_MAX_LENGTH), expected: 'a'.repeat(COMMENT_MAX_LENGTH) }
    ];

    for (const { comment, expected } of cases) {
      const result = validateCreateReviewPayload(payload({ comment }));

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.value.comment).toBe(expected);
      }
    }
  });

  it('menolak komentar 1001 karakter dengan tepat satu kesalahan bernama comment', () => {
    const result = validateCreateReviewPayload(
      payload({ comment: 'a'.repeat(COMMENT_MAX_LENGTH + 1) })
    );

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(failedFields(result.errors)).toEqual(['comment']);
      expect(result.errors[0].message).toContain('comment');
    }
  });

  it('menerima komentar 1002 karakter yang menjadi 1000 karakter setelah pemangkasan', () => {
    const core = 'a'.repeat(COMMENT_MAX_LENGTH);
    const result = validateCreateReviewPayload(payload({ comment: ` ${core} ` }));

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value.comment).toBe(core);
      expect(result.value.comment?.length).toBe(COMMENT_MAX_LENGTH);
    }
  });

  it('menerima komentar tidak disertakan atau null sebagai komentar null', () => {
    for (const body of [payload(), payload({ comment: null })]) {
      const result = validateCreateReviewPayload(body);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.value.comment).toBeNull();
      }
    }
  });

  it('menolak komentar bertipe selain string atau null', () => {
    for (const comment of [42, true, {}, ['teks']]) {
      const result = validateCreateReviewPayload(payload({ comment }));

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(failedFields(result.errors)).toEqual(['comment']);
      }
    }
  });
});

describe('validateCreateReviewPayload - isi komentar khusus (Req 3.5)', () => {
  // Karakter khusus hanya dinormalisasi pada ujungnya, tidak pernah disaring atau di-escape
  const specialComments: Array<{ label: string; comment: string }> = [
    { label: 'whitespace unicode di tengah teks', comment: 'kualitas\u00A0gambar\u3000bagus' },
    { label: 'emoji', comment: 'seru banget 🎬🍿✨' },
    { label: 'kutip tunggal', comment: "it's a 'great' movie" },
    { label: 'tanda hubung ganda', comment: 'bagus -- tapi terlalu panjang' },
    { label: 'kombinasi kutip tunggal dan komentar SQL', comment: "'; DROP TABLE reviews; --" },
    { label: 'kutip tunggal ganda ala escape SQL', comment: "O''Brien -- 🎬" }
  ];

  for (const { label, comment } of specialComments) {
    it(`meneruskan komentar berisi ${label} tanpa perubahan`, () => {
      const result = validateCreateReviewPayload(payload({ comment }));

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.value.comment).toBe(comment);
      }
    });
  }

  it('memangkas hanya ujung komentar dan mempertahankan karakter khusus di dalamnya', () => {
    const core = "🎬 it's -- bagus\u00A0sekali";
    const result = validateCreateReviewPayload(payload({ comment: `\n\t ${core} \r\n` }));

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value.comment).toBe(core);
    }
  });

  it('menerima komentar berisi emoji tepat 1000 unit kode dan menolak 1001 unit kode', () => {
    const emoji = '🎬'; // dua unit kode UTF-16
    const atLimit = emoji.repeat(COMMENT_MAX_LENGTH / 2);
    expect(atLimit.length).toBe(COMMENT_MAX_LENGTH);

    const accepted = validateCreateReviewPayload(payload({ comment: atLimit }));
    expect(accepted.valid).toBe(true);
    if (accepted.valid) {
      expect(accepted.value.comment).toBe(atLimit);
    }

    const rejected = validateCreateReviewPayload(payload({ comment: `${atLimit}a` }));
    expect(rejected.valid).toBe(false);
    if (!rejected.valid) {
      expect(failedFields(rejected.errors)).toEqual(['comment']);
    }
  });
});

describe('validateCreateReviewPayload - beberapa field gagal (Req 3.10)', () => {
  it('mengumpulkan tepat satu entri kesalahan untuk setiap field yang gagal', () => {
    const result = validateCreateReviewPayload({
      rating: 11,
      media_type: 'Movie',
      media_id: 0,
      comment: 'a'.repeat(COMMENT_MAX_LENGTH + 1)
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(failedFields(result.errors)).toEqual(['comment', 'media_id', 'media_type', 'rating']);
      expect(result.errors).toHaveLength(4);
    }
  });
});

describe('validateListParams - batas limit dan offset (Req 7.5)', () => {
  const media = { media_type: 'movie', media_id: '550' };

  it('menerima limit 1, 10, dan 50 baik sebagai string maupun number', () => {
    for (const limit of [LIMIT_MIN, DEFAULT_LIMIT, LIMIT_MAX]) {
      for (const raw of [limit, String(limit)]) {
        const result = validateListParams({ ...media, limit: raw });

        expect(result.valid).toBe(true);
        if (result.valid) {
          expect(result.value.limit).toBe(limit);
        }
      }
    }
  });

  it('menolak limit 51 dan 0 dengan kesalahan bernama limit', () => {
    for (const limit of ['51', 51, '0', 0, '-1']) {
      const result = validateListParams({ ...media, limit });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(failedFields(result.errors)).toEqual(['limit']);
        expect(result.errors[0].message).toContain('limit');
      }
    }
  });

  it('menerima offset 0 dan 999999999', () => {
    for (const offset of [0, OFFSET_MAX]) {
      for (const raw of [offset, String(offset)]) {
        const result = validateListParams({ ...media, offset: raw });

        expect(result.valid).toBe(true);
        if (result.valid) {
          expect(result.value.offset).toBe(offset);
        }
      }
    }
  });

  it('menolak offset negatif dan offset di atas 999999999', () => {
    for (const offset of ['-1', -1, String(OFFSET_MAX + 1), OFFSET_MAX + 1, '10.5']) {
      const result = validateListParams({ ...media, offset });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(failedFields(result.errors)).toEqual(['offset']);
        expect(result.errors[0].message).toContain('offset');
      }
    }
  });

  it('memakai nilai bawaan 10 dan 0 ketika limit dan offset tidak disertakan', () => {
    const result = validateListParams(media);

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value.limit).toBe(DEFAULT_LIMIT);
      expect(result.value.offset).toBe(DEFAULT_OFFSET);
    }
  });

  it('menyebut limit dan offset sekaligus ketika keduanya di luar rentang', () => {
    const result = validateListParams({ ...media, limit: '51', offset: '-1' });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(failedFields(result.errors)).toEqual(['limit', 'offset']);
      expect(result.errors).toHaveLength(2);
    }
  });
});

describe('validateMediaParams - batas media_id pada query (Req 3.3, 3.4)', () => {
  it('menerima media_id 1 dan 2147483647 sebagai string query', () => {
    for (const mediaId of [1, MEDIA_ID_MAX]) {
      const result = validateMediaParams({ media_type: 'tv', media_id: String(mediaId) });

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.value.media_id).toBe(mediaId);
        expect(result.value.media_type).toBe('tv');
      }
    }
  });

  it('menolak media_id 0 dan 2147483648 pada query', () => {
    for (const mediaId of ['0', String(MEDIA_ID_MAX + 1), '1.5']) {
      const result = validateMediaParams({ media_type: 'movie', media_id: mediaId });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(failedFields(result.errors)).toEqual(['media_id']);
      }
    }
  });
});
