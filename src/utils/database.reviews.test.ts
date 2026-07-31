import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import sql, { initializeDatabase } from './database';

/**
 * Integration test skema dan idempotensi migrasi tabel `reviews`.
 * Requirements: 3.8, 9.5, 11.5, 11.6, 11.7, 11.9, 11.10
 *
 * Test ini membutuhkan Database (Supabase PostgreSQL) yang dapat dijangkau
 * melalui DATABASE_URL. Bila database tidak dapat dijangkau, seluruh suite
 * dilewati alih-alih gagal, karena semantik yang diuji (CHECK constraint,
 * UNIQUE constraint, trigger, ON DELETE CASCADE) hanya ada pada PostgreSQL nyata.
 *
 * Data uji memakai pengguna berawalan `rev_it_` dan dibersihkan pada afterAll.
 */

const CONNECT_PROBE_TIMEOUT_MS = 15000;
const TEST_USER_PREFIX = 'rev_it_';

async function isDatabaseReachable(): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      sql`SELECT 1 as ok`,
      new Promise((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('probe timeout')), CONNECT_PROBE_TIMEOUT_MS);
      })
    ]);
    return true;
  } catch (error) {
    console.warn(
      'Skipping reviews migration integration tests, database is not reachable:',
      error instanceof Error ? error.message : error
    );
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const databaseReachable = await isDatabaseReachable();

interface SchemaSnapshot {
  tables: string[];
  uniqueConstraints: { name: string; columns: string[] }[];
  checkConstraints: string[];
  indexes: string[];
  triggers: { name: string; timing: string; event: string }[];
  timestampDefaults: { column: string; default: string | null }[];
}

async function snapshotReviewsSchema(): Promise<SchemaSnapshot> {
  const tables = await sql<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reviews'
  `;

  const uniqueConstraints = await sql<{ conname: string; cols: string[] }[]>`
    SELECT conname,
      (
        SELECT array_agg(attname ORDER BY attname)
        FROM pg_attribute
        WHERE attrelid = conrelid AND attnum = ANY (conkey)
      ) AS cols
    FROM pg_constraint
    WHERE conrelid = 'public.reviews'::regclass AND contype = 'u'
    ORDER BY conname
  `;

  const checkConstraints = await sql<{ conname: string }[]>`
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.reviews'::regclass AND contype = 'c'
    ORDER BY conname
  `;

  const indexes = await sql<{ indexname: string }[]>`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'reviews'
    ORDER BY indexname
  `;

  const triggers = await sql<{ trigger_name: string; action_timing: string; event_manipulation: string }[]>`
    SELECT DISTINCT trigger_name, action_timing, event_manipulation
    FROM information_schema.triggers
    WHERE event_object_schema = 'public' AND event_object_table = 'reviews'
    ORDER BY trigger_name
  `;

  const defaults = await sql<{ column_name: string; column_default: string | null }[]>`
    SELECT column_name, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reviews'
      AND column_name IN ('created_at', 'updated_at')
    ORDER BY column_name
  `;

  return {
    tables: tables.map((row) => row.table_name),
    uniqueConstraints: uniqueConstraints.map((row) => ({ name: row.conname, columns: row.cols })),
    checkConstraints: checkConstraints.map((row) => row.conname),
    indexes: indexes.map((row) => row.indexname),
    triggers: triggers.map((row) => ({
      name: row.trigger_name,
      timing: row.action_timing,
      event: row.event_manipulation
    })),
    timestampDefaults: defaults.map((row) => ({ column: row.column_name, default: row.column_default }))
  };
}

async function createTestUser(label: string): Promise<number> {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const username = `${TEST_USER_PREFIX}${label}_${suffix}`.slice(0, 50);
  const rows = await sql<{ id: number }[]>`
    INSERT INTO users (username, email, password)
    VALUES (${username}, ${`${username}@example.test`}, ${'not-a-real-password'})
    RETURNING id
  `;
  return rows[0].id;
}

describe.runIf(databaseReachable)('migrasi tabel reviews pada initializeDatabase', () => {
  beforeAll(async () => {
    await initializeDatabase();
  }, 120000);

  afterAll(async () => {
    await sql`DELETE FROM users WHERE username LIKE ${`${TEST_USER_PREFIX}%`}`;
    await sql.end({ timeout: 5 });
  }, 60000);

  it('membuat tabel, unique constraint, default timestamp, index, dan trigger', async () => {
    const snapshot = await snapshotReviewsSchema();

    // Req 11.5 - tabel dan unique constraint pada (user_id, media_type, media_id)
    expect(snapshot.tables).toEqual(['reviews']);
    expect(snapshot.uniqueConstraints).toHaveLength(1);
    expect(snapshot.uniqueConstraints[0].columns.slice().sort()).toEqual([
      'media_id',
      'media_type',
      'user_id'
    ]);

    // Req 11.5 - default waktu saat ini pada created_at dan updated_at
    expect(snapshot.timestampDefaults).toHaveLength(2);
    for (const column of snapshot.timestampDefaults) {
      expect(column.default ?? '').toMatch(/now\(\)/i);
    }

    // Req 3.8 - batasan tingkat tabel untuk rating (dan media_type, media_id)
    expect(snapshot.checkConstraints).toContain('reviews_rating_check');

    // Req 11.6 - index pendukung query per item media
    expect(snapshot.indexes).toContain('idx_reviews_media');

    // Req 11.7 - trigger BEFORE UPDATE pemelihara updated_at
    const updatedAtTriggers = snapshot.triggers.filter((t) => t.name === 'update_reviews_updated_at');
    expect(updatedAtTriggers).toHaveLength(1);
    expect(updatedAtTriggers[0].timing).toBe('BEFORE');
    expect(updatedAtTriggers[0].event).toBe('UPDATE');
  }, 60000);

  it('menjalankan initializeDatabase 3 kali tanpa error, tanpa duplikat objek, dan data review tetap utuh', async () => {
    const userId = await createTestUser('idem');
    const inserted = await sql<
      { id: number; rating: number; comment: string | null; created_at: Date; updated_at: Date }[]
    >`
      INSERT INTO reviews (user_id, media_type, media_id, rating, comment)
      VALUES (${userId}, ${'movie'}, ${550}, ${8}, ${'review sebelum migrasi ulang'})
      RETURNING id, rating, comment, created_at, updated_at
    `;
    const before = inserted[0];
    const schemaBefore = await snapshotReviewsSchema();

    // Req 11.9 - tiga pemanggilan berturut-turut harus selesai tanpa error
    for (let run = 0; run < 3; run += 1) {
      await expect(initializeDatabase()).resolves.toBeUndefined();
    }

    const schemaAfter = await snapshotReviewsSchema();
    expect(schemaAfter).toEqual(schemaBefore);
    expect(schemaAfter.uniqueConstraints).toHaveLength(1);
    expect(schemaAfter.indexes.filter((name) => name === 'idx_reviews_media')).toHaveLength(1);
    expect(schemaAfter.triggers.filter((t) => t.name === 'update_reviews_updated_at')).toHaveLength(1);

    const after = await sql<
      { id: number; rating: number; comment: string | null; created_at: Date; updated_at: Date }[]
    >`
      SELECT id, rating, comment, created_at, updated_at FROM reviews WHERE id = ${before.id}
    `;
    expect(after).toHaveLength(1);
    expect(after[0].rating).toBe(before.rating);
    expect(after[0].comment).toBe(before.comment);
    expect(after[0].created_at.getTime()).toBe(before.created_at.getTime());
    expect(after[0].updated_at.getTime()).toBe(before.updated_at.getTime());
  }, 180000);

  it('menolak rating 0, 11, dan desimal tanpa mengubah isi tabel', async () => {
    const userId = await createTestUser('rating');
    await sql`
      INSERT INTO reviews (user_id, media_type, media_id, rating, comment)
      VALUES (${userId}, ${'movie'}, ${603}, ${5}, ${'baris pembanding'})
    `;

    const countRows = async (): Promise<number> => {
      const rows = await sql<{ total: number }[]>`
        SELECT COUNT(*)::int AS total FROM reviews WHERE user_id = ${userId}
      `;
      return rows[0].total;
    };
    const snapshotRows = async () =>
      sql<{ media_id: number; rating: number; comment: string | null }[]>`
        SELECT media_id, rating, comment FROM reviews WHERE user_id = ${userId} ORDER BY media_id
      `;

    const totalBefore = await countRows();
    const rowsBefore = await snapshotRows();

    // Req 3.8 - rating di luar rentang 1..10 dan rating bukan bilangan bulat ditolak Database
    for (const invalidRating of [0, 11, 7.5]) {
      await expect(
        sql`
          INSERT INTO reviews (user_id, media_type, media_id, rating, comment)
          VALUES (${userId}, ${'movie'}, ${700 + Math.floor(invalidRating * 10)}, ${invalidRating}, ${null})
        `
      ).rejects.toBeTruthy();
    }

    expect(await countRows()).toBe(totalBefore);
    expect(await snapshotRows()).toEqual(rowsBefore);
  }, 60000);

  it('menghapus review movie dan tv milik pengguna saat baris users dihapus', async () => {
    const userId = await createTestUser('cascade');
    const otherUserId = await createTestUser('keep');

    await sql`
      INSERT INTO reviews (user_id, media_type, media_id, rating, comment)
      VALUES
        (${userId}, ${'movie'}, ${1241982}, ${9}, ${'review film'}),
        (${userId}, ${'tv'}, ${1399}, ${7}, ${null}),
        (${otherUserId}, ${'movie'}, ${1241982}, ${6}, ${'review pengguna lain'})
    `;

    const before = await sql<{ total: number }[]>`
      SELECT COUNT(*)::int AS total FROM reviews WHERE user_id = ${userId}
    `;
    expect(before[0].total).toBe(2);

    // Req 9.5 - ON DELETE CASCADE menghapus review movie maupun tv milik pengguna
    await sql`DELETE FROM users WHERE id = ${userId}`;

    const after = await sql<{ total: number }[]>`
      SELECT COUNT(*)::int AS total FROM reviews WHERE user_id = ${userId}
    `;
    expect(after[0].total).toBe(0);

    const survivors = await sql<{ total: number }[]>`
      SELECT COUNT(*)::int AS total FROM reviews WHERE user_id = ${otherUserId}
    `;
    expect(survivors[0].total).toBe(1);
  }, 60000);
});
