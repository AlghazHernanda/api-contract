import { describe, it, expect } from 'vitest'
import {
  COMMENT_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  TRUNCATION_INDICATOR,
  clampComment,
  countCharacters,
  formatTitle,
  formatAverageRating
} from './reviewFormat'

describe('clampComment', () => {
  it('mengembalikan komentar apa adanya pada panjang 0, 1, dan 1000 karakter', () => {
    expect(clampComment('')).toBe('')
    expect(clampComment('a')).toBe('a')

    const atLimit = 'x'.repeat(COMMENT_MAX_LENGTH)
    expect(clampComment(atLimit)).toBe(atLimit)
  })

  it('memangkas komentar lebih dari 1000 karakter menjadi 1000 karakter pertama', () => {
    const overLimit = `${'a'.repeat(COMMENT_MAX_LENGTH)}bcd`
    const result = clampComment(overLimit)

    expect(result).toHaveLength(COMMENT_MAX_LENGTH)
    expect(result).toBe(overLimit.slice(0, COMMENT_MAX_LENGTH))
  })

  it('memperlakukan nilai bukan string sebagai komentar kosong', () => {
    expect(clampComment(null)).toBe('')
    expect(clampComment(undefined)).toBe('')
    expect(clampComment(42)).toBe('')
  })
})

describe('countCharacters', () => {
  it('mengembalikan panjang nilai setelah pembatasan', () => {
    expect(countCharacters('')).toBe(0)
    expect(countCharacters('halo')).toBe(4)
    expect(countCharacters('z'.repeat(COMMENT_MAX_LENGTH + 250))).toBe(COMMENT_MAX_LENGTH)
    expect(countCharacters(null)).toBe(0)
  })
})

describe('formatTitle', () => {
  it('mengembalikan judul identik hingga 120 karakter', () => {
    const atLimit = 'j'.repeat(TITLE_MAX_LENGTH)

    expect(formatTitle('Fight Club')).toBe('Fight Club')
    expect(formatTitle(atLimit)).toBe(atLimit)
  })

  it('memotong judul lebih dari 120 karakter dan menambahkan indikator', () => {
    const longTitle = 'k'.repeat(TITLE_MAX_LENGTH + 5)

    expect(formatTitle(longTitle)).toBe(
      `${longTitle.slice(0, TITLE_MAX_LENGTH)}${TRUNCATION_INDICATOR}`
    )
  })

  it('mengembalikan string kosong untuk judul bukan string', () => {
    expect(formatTitle(null)).toBe('')
    expect(formatTitle(undefined)).toBe('')
  })
})

describe('formatAverageRating', () => {
  it('memformat rata-rata dalam format N,N/10', () => {
    expect(formatAverageRating(8.7)).toBe('8,7/10')
    expect(formatAverageRating(9)).toBe('9,0/10')
    expect(formatAverageRating(10)).toBe('10,0/10')
    expect(formatAverageRating(1)).toBe('1,0/10')
  })

  it('menerima nilai numerik berbentuk string dari response API', () => {
    expect(formatAverageRating('7.5')).toBe('7,5/10')
  })

  it('mengembalikan null ketika rata-rata tidak tersedia', () => {
    expect(formatAverageRating(null)).toBeNull()
    expect(formatAverageRating(undefined)).toBeNull()
    expect(formatAverageRating('')).toBeNull()
    expect(formatAverageRating('bukan angka')).toBeNull()
  })
})
