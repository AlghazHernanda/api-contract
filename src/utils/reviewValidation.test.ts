import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { COMMENT_MAX_LENGTH, MEDIA_ID_MAX, validateCreateReviewPayload } from './reviewValidation';

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
