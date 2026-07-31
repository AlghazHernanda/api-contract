import { describe, it, expect, beforeEach } from 'vitest';
import {
  FakeReviewModel,
  FakeConstraintViolation,
  roundHalfAwayFromZeroOneDecimal,
} from './Review.fake';

/**
 * Unit test bagi fake in-memory ReviewModel (task 5.2).
 * Memastikan semantik yang akan dipakai property test 5.3–5.7 benar sejak awal:
 * unique constraint, timestamp, urutan daftar, agregat, dan penghapusan.
 * Requirements: 5.5, 6.2, 7.3
 */

describe('FakeReviewModel', () => {
  let model: FakeReviewModel;

  beforeEach(() => {
    model = new FakeReviewModel();
    model.registerUsers([
      { id: 1, username: 'budi' },
      { id: 2, username: 'sari' },
    ]);
  });

  it('menyisipkan baris baru dengan created_at sama dengan updated_at', async () => {
    const { review, wasInserted } = await model.upsert(1, {
      media_type: 'movie',
      media_id: 550,
      rating: 9,
      comment: 'Klasik',
    });

    expect(wasInserted).toBe(true);
    expect(review.id).toBe(1);
    expect(review.created_at.getTime()).toBe(review.updated_at.getTime());
    expect(model.countRows()).toBe(1);
    expect(Object.keys(review).sort()).toEqual(
      ['comment', 'created_at', 'id', 'media_id', 'media_type', 'rating', 'updated_at'].sort()
    );
  });

  it('upsert kedua pada kombinasi sama memperbarui baris tanpa menambah baris', async () => {
    const first = await model.upsert(1, {
      media_type: 'movie',
      media_id: 550,
      rating: 9,
      comment: 'Klasik',
    });

    model.advanceClock(60_000);

    const second = await model.upsert(1, {
      media_type: 'movie',
      media_id: 550,
      rating: 4,
      comment: null,
    });

    expect(second.wasInserted).toBe(false);
    expect(model.countRows()).toBe(1);
    expect(second.review.id).toBe(first.review.id);
    expect(second.review.created_at.getTime()).toBe(first.review.created_at.getTime());
    expect(second.review.updated_at.getTime()).toBeGreaterThan(
      first.review.updated_at.getTime()
    );
    expect(second.review.rating).toBe(4);
    expect(second.review.comment).toBeNull();
  });

  it('media_type berbeda pada media_id sama tetap dua baris terpisah', async () => {
    await model.upsert(1, { media_type: 'movie', media_id: 42, rating: 7, comment: null });
    await model.upsert(1, { media_type: 'tv', media_id: 42, rating: 8, comment: null });

    expect(model.countRows()).toBe(2);
  });

  it('menolak rating di luar 1..10 seperti CHECK constraint', async () => {
    await expect(
      model.upsert(1, { media_type: 'movie', media_id: 550, rating: 11, comment: null })
    ).rejects.toBeInstanceOf(FakeConstraintViolation);
    expect(model.countRows()).toBe(0);
  });

  it('getSummary membulatkan rata-rata satu desimal dan null ketika tidak ada baris', async () => {
    expect(await model.getSummary({ media_type: 'movie', media_id: 550 })).toEqual({
      media_type: 'movie',
      media_id: 550,
      average_rating: null,
      review_count: 0,
    });

    await model.upsert(1, { media_type: 'movie', media_id: 550, rating: 9, comment: null });
    await model.upsert(2, { media_type: 'movie', media_id: 550, rating: 8, comment: null });

    const summary = await model.getSummary({ media_type: 'movie', media_id: 550 });
    expect(summary).toEqual({
      media_type: 'movie',
      media_id: 550,
      average_rating: 8.5,
      review_count: 2,
    });
  });

  it('pembulatan setengah menjauh dari nol sesuai ROUND numeric', () => {
    // 25/3 = 8.333…, 26/3 = 8.666…, 17/2 = 8.5, 5/2 = 2.5
    expect(roundHalfAwayFromZeroOneDecimal(25, 3)).toBe(8.3);
    expect(roundHalfAwayFromZeroOneDecimal(26, 3)).toBe(8.7);
    expect(roundHalfAwayFromZeroOneDecimal(17, 2)).toBe(8.5);
    expect(roundHalfAwayFromZeroOneDecimal(5, 2)).toBe(2.5);
    // 2.25 → 2.3 (setengah menjauh dari nol, bukan setengah ke genap)
    expect(roundHalfAwayFromZeroOneDecimal(9, 4)).toBe(2.3);
  });

  it('listByMedia mengurutkan updated_at, created_at, lalu id secara menurun', async () => {
    const base = model.now().getTime();
    model.registerUser(3, 'tono');
    model.seed([
      {
        id: 1,
        user_id: 1,
        media_type: 'movie',
        media_id: 550,
        rating: 7,
        created_at: new Date(base),
        updated_at: new Date(base + 1000),
      },
      {
        id: 2,
        user_id: 2,
        media_type: 'movie',
        media_id: 550,
        rating: 8,
        created_at: new Date(base + 500),
        updated_at: new Date(base + 1000),
      },
      {
        id: 3,
        user_id: 3,
        media_type: 'movie',
        media_id: 550,
        rating: 9,
        created_at: new Date(base),
        updated_at: new Date(base + 2000),
      },
    ]);

    const result = await model.listByMedia({
      media_type: 'movie',
      media_id: 550,
      limit: 10,
      offset: 0,
    });

    expect(result.items.map((item) => item.username)).toEqual(['tono', 'sari', 'budi']);
    expect(result.total).toBe(3);
    expect(Object.keys(result.items[0]).sort()).toEqual([
      'comment',
      'created_at',
      'rating',
      'updated_at',
      'username',
    ]);
  });

  it('total tidak terpengaruh limit/offset dan halaman kosong tetap membawa total', async () => {
    await model.upsert(1, { media_type: 'movie', media_id: 550, rating: 7, comment: null });
    await model.upsert(2, { media_type: 'movie', media_id: 550, rating: 8, comment: null });

    const page = await model.listByMedia({
      media_type: 'movie',
      media_id: 550,
      limit: 1,
      offset: 0,
    });
    expect(page.items).toHaveLength(1);
    expect(page.total).toBe(2);

    const beyond = await model.listByMedia({
      media_type: 'movie',
      media_id: 550,
      limit: 10,
      offset: 99,
    });
    expect(beyond.items).toHaveLength(0);
    expect(beyond.total).toBe(2);
  });

  it('mengecualikan review yang penggunanya tidak terdaftar dari items, bukan dari total', async () => {
    await model.upsert(1, { media_type: 'movie', media_id: 550, rating: 7, comment: null });
    await model.upsert(2, { media_type: 'movie', media_id: 550, rating: 8, comment: null });
    model.removeUser(2);

    const result = await model.listByMedia({
      media_type: 'movie',
      media_id: 550,
      limit: 10,
      offset: 0,
    });

    expect(result.items.map((item) => item.username)).toEqual(['budi']);
    expect(result.total).toBe(2);
  });

  it('deleteByUserAndMedia dan deleteById mengembalikan jumlah baris terhapus', async () => {
    await model.upsert(1, { media_type: 'movie', media_id: 550, rating: 7, comment: null });
    await model.upsert(2, { media_type: 'movie', media_id: 550, rating: 8, comment: null });

    expect(await model.deleteByUserAndMedia(1, { media_type: 'movie', media_id: 550 })).toBe(1);
    expect(await model.deleteByUserAndMedia(1, { media_type: 'movie', media_id: 550 })).toBe(0);

    const owned = await model.findByUserAndMedia(2, { media_type: 'movie', media_id: 550 });
    expect(owned).not.toBeNull();

    // Pemilik berbeda: tidak ada baris terhapus
    expect(await model.deleteById(owned!.id, 1)).toBe(0);
    expect(model.countRows()).toBe(1);
    expect(await model.deleteById(owned!.id, 2)).toBe(1);
    expect(model.countRows()).toBe(0);
  });

  it('findById menyertakan user_id dan reset mengosongkan seluruh state', async () => {
    await model.upsert(1, { media_type: 'tv', media_id: 1399, rating: 8, comment: null });
    const record = await model.findById(1);
    expect(record?.user_id).toBe(1);

    model.reset();
    expect(model.countRows()).toBe(0);
    expect(await model.findById(1)).toBeNull();
    expect(model.now().getTime()).toBe(new FakeReviewModel().now().getTime());
  });
});
