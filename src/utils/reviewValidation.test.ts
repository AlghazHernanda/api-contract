import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { MediaType } from '../types/review';
import {
  COMMENT_MAX_LENGTH,
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
  LIMIT_MAX,
  LIMIT_MIN,
  MEDIA_ID_MAX,
  OFFSET_MAX,
  normalizeComment,
  validateCreateReviewPayload,
  validateListParams,
  validateMediaParams
} from './reviewValidation';

// Hanya spasi, tab, dan baris baru sesuai Req 3.6
const WHITESPACE = [' ', '\t', '\n', '\r'];

const whitespacePadding = fc
  .array(fc.constantFrom(...WHITESPACE), { maxLength: 5 })
  .map((chars) => chars.join(''));

// Inti komentar dibatasi 1000 karakter sehingga panjang setelah pemangkasan selalu <= 1000
const commentCore = fc.string({ maxLength: COMMENT_MAX_LENGTH });

const commentString = fc
  .tuple(whitespacePadding, commentCore, whitespacePadding)
  .map(([prefix, core, suffix]) => `${prefix}${core}${suffix}`);

// Tiga bentuk komentar yang dianggap sah: string, tidak disertakan, atau null
type CommentVariant =
  | { kind: 'string'; value: string }
  | { kind: 'omitted' }
  | { kind: 'null' };

const commentVariant: fc.Arbitrary<CommentVariant> = fc.oneof(
  commentString.map((value): CommentVariant => ({ kind: 'string', value })),
  fc.constant<CommentVariant>({ kind: 'omitted' }),
  fc.constant<CommentVariant>({ kind: 'null' })
);

// Field asing yang harus diabaikan validator, termasuk identifier pengguna (Req 4.3)
const foreignFields = fc.record(
  {
    user_id: fc.integer({ min: 1, max: 100000 }),
    id: fc.integer({ min: 1, max: 100000 }),
    created_at: fc.string({ maxLength: 20 }),
    role: fc.constantFrom('admin', 'user')
  },
  { requiredKeys: [] }
);

const validPayload = fc
  .record({
    rating: fc.integer({ min: 1, max: 10 }),
    media_type: fc.constantFrom('movie' as const, 'tv' as const),
    media_id: fc.integer({ min: 1, max: MEDIA_ID_MAX }),
    comment: commentVariant,
    extras: foreignFields
  })
  .map(({ rating, media_type, media_id, comment, extras }) => {
    const body: Record<string, unknown> = { ...extras, rating, media_type, media_id };

    if (comment.kind === 'string') {
      body.comment = comment.value;
    } else if (comment.kind === 'null') {
      body.comment = null;
    }

    const expectedComment =
      comment.kind === 'string' && comment.value.trim().length > 0 ? comment.value.trim() : null;

    return { body, rating, media_type, media_id, expectedComment };
  });

describe('validateCreateReviewPayload', () => {
  // Feature: movie-rating-review, Property 1: Payload sah selalu diterima dan diteruskan apa adanya
  /**
   * **Validates: Requirements 3.1**
   */
  it('menerima payload sah dan meneruskan nilainya apa adanya', () => {
    fc.assert(
      fc.property(validPayload, ({ body, rating, media_type, media_id, expectedComment }) => {
        const result = validateCreateReviewPayload(body);

        expect(result.valid).toBe(true);
        if (!result.valid) {
          return;
        }

        expect(result.value.rating).toBe(rating);
        expect(result.value.media_type).toBe(media_type);
        expect(result.value.media_id).toBe(media_id);
        expect(result.value.comment).toBe(expectedComment);

        if (result.value.comment !== null) {
          expect(result.value.comment.length).toBeLessThanOrEqual(COMMENT_MAX_LENGTH);
        }

        // Field asing tidak pernah diteruskan ke Review_Model
        expect(Object.keys(result.value).sort()).toEqual([
          'comment',
          'media_id',
          'media_type',
          'rating'
        ]);
      }),
      { numRuns: 200 }
    );
  });
});

// Masukan komentar mencakup tiga bentuk sah: string apa pun, null, atau tidak disertakan
const whitespaceOnly = fc
  .array(fc.constantFrom(...WHITESPACE), { minLength: 1, maxLength: 8 })
  .map((chars) => chars.join(''));

const commentInput: fc.Arbitrary<string | null | undefined> = fc.oneof(
  fc.string(),
  commentString,
  whitespaceOnly,
  fc.constant(null),
  fc.constant(undefined)
);

describe('normalizeComment', () => {
  // Feature: movie-rating-review, Property 3: Normalisasi komentar memangkas ujung dan mengubah komentar kosong menjadi null
  /**
   * **Validates: Requirements 3.6, 3.7**
   */
  it('memangkas ujung, menghasilkan null untuk komentar kosong, dan bersifat idempoten', () => {
    fc.assert(
      fc.property(commentInput, (input) => {
        const result = normalizeComment(input);

        // Tidak pernah berawalan atau berakhiran spasi, tab, maupun baris baru (Req 3.6)
        if (result !== null) {
          expect(result.length).toBeGreaterThan(0);
          expect(/^\s/.test(result)).toBe(false);
          expect(/\s$/.test(result)).toBe(false);
          expect(WHITESPACE).not.toContain(result[0]);
          expect(WHITESPACE).not.toContain(result[result.length - 1]);
        }

        // null tepat ketika masukan absen, null, atau seluruhnya whitespace (Req 3.7)
        const shouldBeNull =
          input === undefined || input === null || /^\s*$/.test(input);
        expect(result === null).toBe(shouldBeNull);

        // Idempoten: menormalisasi hasil kembali menghasilkan nilai yang sama
        expect(normalizeComment(result)).toBe(result);
      }),
      { numRuns: 300 }
    );
  });
});

// ---------------------------------------------------------------------------
// Parsing parameter query (Property 8)
// ---------------------------------------------------------------------------

// Pola bilangan bulat yang sama dengan yang diterima parser
const INTEGER_TEXT = /^[+-]?\d+$/;

// Nilai mentah beserta status kehadirannya pada objek query
interface FieldInput {
  present: boolean;
  raw: unknown;
}

// Tiga perlakuan parser terhadap parameter numerik opsional
type NumericCase =
  | { kind: 'absent'; input: FieldInput }
  | { kind: 'valid'; input: FieldInput; expected: number }
  | { kind: 'invalid'; input: FieldInput };

// Angka pada query bisa datang sebagai string (Express) maupun number (pemanggil internal)
function asRaw(value: number, asString: boolean): unknown {
  return asString ? String(value) : value;
}

// Tidak disertakan atau string kosong adalah dua bentuk "absen" menurut Req 7.4
const absentInput: fc.Arbitrary<FieldInput> = fc.oneof(
  fc.constant<FieldInput>({ present: false, raw: undefined }),
  fc.constant<FieldInput>({ present: true, raw: '' })
);

// Nilai tidak sah yang tidak bergantung pada rentang: bukan bilangan bulat sama sekali.
// `null` tidak disertakan di sini karena parameter query yang tidak disertakan diwakili
// oleh ketiadaan key maupun string kosong (Req 7.4), bukan oleh nilai null.
const nonIntegerRaws: fc.Arbitrary<unknown> = fc.oneof(
  fc.constant<unknown>(true),
  fc.constant<unknown>(false),
  fc.constant<unknown>({}),
  fc.constant<unknown>([1]),
  fc.constant<unknown>(Number.NaN),
  fc.constant<unknown>(Number.POSITIVE_INFINITY),
  fc
    .string({ minLength: 1, maxLength: 12 })
    .filter((text) => text.trim() !== '' && !INTEGER_TEXT.test(text.trim()))
    .map((text): unknown => text)
);

function numericCase(min: number, max: number): fc.Arbitrary<NumericCase> {
  const valid = fc
    .tuple(fc.integer({ min, max }), fc.boolean())
    .map(([value, asString]): NumericCase => ({
      kind: 'valid',
      input: { present: true, raw: asRaw(value, asString) },
      expected: value
    }));

  // Di luar rentang: lebih kecil dari batas bawah (termasuk negatif) atau lebih besar dari batas atas
  const outOfRange = fc
    .tuple(
      fc.oneof(fc.integer({ min: min - 1000, max: min - 1 }), fc.integer({ min: max + 1, max: max + 1000 })),
      fc.boolean()
    )
    .map(([value, asString]): unknown => asRaw(value, asString));

  // Pecahan, baik sebagai string maupun number
  const fractional = fc
    .tuple(fc.integer({ min, max }), fc.integer({ min: 1, max: 9 }), fc.boolean())
    .map(([value, decimal, asString]): unknown =>
      asString ? `${value}.${decimal}` : value + decimal / 10
    );

  const invalid = fc
    .oneof(outOfRange, fractional, nonIntegerRaws)
    .map((raw): NumericCase => ({ kind: 'invalid', input: { present: true, raw } }));

  return fc.oneof(
    absentInput.map((input): NumericCase => ({ kind: 'absent', input })),
    valid,
    invalid
  );
}

const limitCase = numericCase(LIMIT_MIN, LIMIT_MAX);
const offsetCase = numericCase(0, OFFSET_MAX);

// Bagian media yang selalu sah agar kegagalan limit/offset terisolasi
const validMediaFields = fc
  .tuple(fc.constantFrom('movie' as const, 'tv' as const), fc.integer({ min: 1, max: MEDIA_ID_MAX }), fc.boolean())
  .map(([mediaType, mediaId, asString]) => ({
    fields: { media_type: mediaType, media_id: asRaw(mediaId, asString) } as Record<string, unknown>,
    mediaType,
    mediaId
  }));

function applyField(query: Record<string, unknown>, field: string, input: FieldInput): void {
  if (input.present) {
    query[field] = input.raw;
  }
}

describe('validateListParams', () => {
  // Feature: movie-rating-review, Property 8: Parsing parameter query menerapkan nilai bawaan dan menolak nilai di luar rentang
  /**
   * **Validates: Requirements 7.4, 7.6**
   */
  it('menerapkan nilai bawaan saat parameter absen dan menolak nilai di luar rentang per parameter', () => {
    fc.assert(
      fc.property(validMediaFields, limitCase, offsetCase, (media, limit, offset) => {
        const query: Record<string, unknown> = { ...media.fields };
        applyField(query, 'limit', limit.input);
        applyField(query, 'offset', offset.input);

        const result = validateListParams(query);

        const invalidFields = [
          ...(limit.kind === 'invalid' ? ['limit'] : []),
          ...(offset.kind === 'invalid' ? ['offset'] : [])
        ];

        if (invalidFields.length === 0) {
          // Nilai bawaan 10 dan 0 tepat ketika parameter absen atau string kosong (Req 7.4)
          expect(result.valid).toBe(true);
          if (!result.valid) {
            return;
          }

          expect(result.value.limit).toBe(limit.kind === 'valid' ? limit.expected : DEFAULT_LIMIT);
          expect(result.value.offset).toBe(offset.kind === 'valid' ? offset.expected : DEFAULT_OFFSET);
          expect(result.value.media_type).toBe(media.mediaType);
          expect(result.value.media_id).toBe(media.mediaId);
          expect(Object.keys(result.value).sort()).toEqual([
            'limit',
            'media_id',
            'media_type',
            'offset'
          ]);
          return;
        }

        // Kegagalan menyebut tepat parameter yang tidak sah walaupun parameter lain sah (Req 7.6)
        expect(result.valid).toBe(false);
        if (result.valid) {
          return;
        }

        expect(result.errors.map((error) => error.field).sort()).toEqual([...invalidFields].sort());
        for (const error of result.errors) {
          expect(error.message).toContain(error.field);
        }

        // Hasil gagal tidak pernah membawa nilai daftar review
        expect('value' in result).toBe(false);
      }),
      { numRuns: 300 }
    );
  });
});

// media_type hanya sah untuk dua nilai dengan pembandingan peka huruf besar-kecil
const invalidMediaTypeRaws: fc.Arbitrary<unknown> = fc.oneof(
  fc.constantFrom<unknown[]>('Movie', 'MOVIE', 'Tv', 'TV', 'film', 'series', 'movies', 'movie ', ''),
  fc.integer().map((value): unknown => value),
  fc.constant<unknown>(null),
  fc.constant<unknown>(true),
  fc.constant<unknown>({}),
  fc.constant<unknown>(['movie']),
  fc.string().filter((text) => text !== 'movie' && text !== 'tv').map((text): unknown => text)
);

interface MediaTypeCase {
  valid: boolean;
  input: FieldInput;
  expected?: MediaType;
}

const mediaTypeCase: fc.Arbitrary<MediaTypeCase> = fc.oneof(
  fc
    .constantFrom('movie' as const, 'tv' as const)
    .map((mediaType): MediaTypeCase => ({
      valid: true,
      input: { present: true, raw: mediaType },
      expected: mediaType
    })),
  fc.constant<MediaTypeCase>({ valid: false, input: { present: false, raw: undefined } }),
  invalidMediaTypeRaws.map((raw): MediaTypeCase => ({ valid: false, input: { present: true, raw } }))
);

const invalidMediaIdRaws: fc.Arbitrary<unknown> = fc.oneof(
  fc
    .tuple(
      fc.oneof(fc.integer({ min: -1000, max: 0 }), fc.integer({ min: MEDIA_ID_MAX + 1, max: MEDIA_ID_MAX + 1000 })),
      fc.boolean()
    )
    .map(([value, asString]): unknown => asRaw(value, asString)),
  fc
    .tuple(fc.integer({ min: 1, max: 1000 }), fc.integer({ min: 1, max: 9 }))
    .map(([value, decimal]): unknown => `${value}.${decimal}`),
  nonIntegerRaws,
  // media_id wajib, sehingga null maupun ketiadaan nilai sama-sama tidak sah (Req 6.6)
  fc.constant<unknown>(null)
);

interface MediaIdCase {
  valid: boolean;
  input: FieldInput;
  expected?: number;
}

const mediaIdCase: fc.Arbitrary<MediaIdCase> = fc.oneof(
  fc
    .tuple(fc.integer({ min: 1, max: MEDIA_ID_MAX }), fc.boolean())
    .map(([mediaId, asString]): MediaIdCase => ({
      valid: true,
      input: { present: true, raw: asRaw(mediaId, asString) },
      expected: mediaId
    })),
  fc.constant<MediaIdCase>({ valid: false, input: { present: false, raw: undefined } }),
  invalidMediaIdRaws.map((raw): MediaIdCase => ({ valid: false, input: { present: true, raw } }))
);

describe('validateMediaParams', () => {
  // Feature: movie-rating-review, Property 8: Parsing parameter query menerapkan nilai bawaan dan menolak nilai di luar rentang
  /**
   * **Validates: Requirements 6.6**
   */
  it('menolak media_type atau media_id tidak sah dengan menyebut field tersebut tanpa nilai ringkasan', () => {
    fc.assert(
      fc.property(mediaTypeCase, mediaIdCase, (mediaType, mediaId) => {
        const query: Record<string, unknown> = {};
        applyField(query, 'media_type', mediaType.input);
        applyField(query, 'media_id', mediaId.input);

        const result = validateMediaParams(query);

        const invalidFields = [
          ...(mediaType.valid ? [] : ['media_type']),
          ...(mediaId.valid ? [] : ['media_id'])
        ];

        if (invalidFields.length === 0) {
          expect(result.valid).toBe(true);
          if (!result.valid) {
            return;
          }

          expect(result.value.media_type).toBe(mediaType.expected);
          expect(result.value.media_id).toBe(mediaId.expected);
          return;
        }

        expect(result.valid).toBe(false);
        if (result.valid) {
          return;
        }

        expect(result.errors.map((error) => error.field).sort()).toEqual([...invalidFields].sort());
        for (const error of result.errors) {
          expect(error.message).toContain(error.field);
        }

        // Tidak ada nilai media yang diteruskan sehingga ringkasan tidak dapat dihitung (Req 6.6)
        expect('value' in result).toBe(false);
      }),
      { numRuns: 300 }
    );
  });
});
