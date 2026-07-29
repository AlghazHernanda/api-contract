import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

describe('konfigurasi test runner frontend', () => {
  it('menjalankan environment jsdom', () => {
    expect(typeof document).toBe('object')
  })

  it('merender komponen React 17 dan memuat matcher jest-dom', () => {
    render(<button type="button">Beri rating</button>)
    expect(screen.getByRole('button', { name: 'Beri rating' })).toBeInTheDocument()
  })

  it('menjalankan fast-check', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (rating) => rating >= 1 && rating <= 10),
      { numRuns: 100 }
    )
  })
})
