import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Bersihkan DOM antar test agar setiap test berjalan pada kondisi bersih
afterEach(() => {
  cleanup()
})
