import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Service pramuat dan simpan dimock agar komponen diuji tanpa jaringan (Req 8.1, 10.1)
vi.mock('../services/reviewService', () => ({
  getMyReview: vi.fn(),
  saveReview: vi.fn(),
  deleteMyReview: vi.fn()
}))

import RatingModal, {
  CREATE_ACTION_LABEL,
  UPDATE_ACTION_LABEL,
  PRELOAD_FAILED_MESSAGE,
  PRELOAD_RETRY_LABEL,
  SAVE_SUCCESS_MESSAGE,
  SAVE_GENERIC_ERROR_MESSAGE,
  SAVE_AUTH_ERROR_MESSAGE,
  SAVE_EXHAUSTED_MESSAGE,
  SAVE_RETRY_LABEL,
  DELETE_ACTION_LABEL,
  DELETE_CONFIRM_LABEL,
  DELETE_CANCEL_LABEL,
  DELETE_SUCCESS_MESSAGE,
  DELETE_FAILED_MESSAGE,
  MAX_SAVE_RETRIES,
  MAX_NOTIFICATION_ITEMS,
  AUTO_CLOSE_DELAY_MS
} from './RatingModal'
import { getMyReview, saveReview, deleteMyReview } from '../services/reviewService'
import { TITLE_MAX_LENGTH, TRUNCATION_INDICATOR, COMMENT_MAX_LENGTH } from '../utils/reviewFormat'

const renderModal = (props = {}) =>
  render(<RatingModal isOpen mediaType="movie" mediaId={42} title="Inception" {...props} />)

// Menunggu pramuat selesai sebelum berinteraksi dengan form (Req 8.5)
const openModal = async (props = {}) => {
  const utils = renderModal(props)
  await waitFor(() =>
    expect(screen.queryByTestId('rating-modal-preload-indicator')).not.toBeInTheDocument()
  )
  return utils
}

const getStars = () => screen.getAllByRole('button', { name: /^Beri rating \d+ dari 10$/ })

const getSelectedFlags = () => getStars().map((star) => star.dataset.selected === 'true')

const getSaveButton = () => screen.getByTestId('rating-modal-save')

const getErrorMessages = () =>
  screen.queryAllByTestId('rating-modal-notification-error').map((item) => item.textContent)

// Menetapkan rating lalu menekan tombol simpan
const submitRating = (value) => {
  fireEvent.click(getStars()[value - 1])
  fireEvent.click(getSaveButton())
}

const createDeferred = () => {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

// Error bertanda seperti yang dilempar reviewService (Req 10.3, 10.4, 10.5, 10.7, 10.9)
const httpError = (status, message, extra = {}) =>
  Object.assign(new Error(message), { name: 'ReviewServiceError', status, kind: 'http', ...extra })

const transportError = (kind, message) =>
  Object.assign(new Error(message), { name: 'ReviewServiceError', status: null, kind })

beforeEach(() => {
  getMyReview.mockReset()
  getMyReview.mockResolvedValue({ data: null })
  saveReview.mockReset()
  saveReview.mockResolvedValue({ data: { id: 1, rating: 5, comment: null } })
  deleteMyReview.mockReset()
  deleteMyReview.mockResolvedValue({ data: { deleted: true } })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('RatingModal - struktur kontrol bintang dan kolom komentar', () => {
  it('menampilkan tepat 10 kontrol bintang bernilai 1..10 urut naik (Req 2.1)', async () => {
    await openModal()

    const stars = getStars()
    expect(stars).toHaveLength(10)
    expect(stars.map((star) => Number(star.dataset.ratingValue))).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    ])
  })

  it('menampilkan penanda tanpa angka dan tombol simpan nonaktif saat rating belum dipilih (Req 2.5, 2.9)', async () => {
    await openModal()

    const value = screen.getByTestId('rating-modal-value')
    expect(value).toHaveTextContent('Rating belum dipilih')
    expect(value.textContent).not.toMatch(/\d/)
    expect(screen.getByRole('button', { name: CREATE_ACTION_LABEL })).toBeDisabled()
  })

  it('menandai bintang 1..N terpilih, menampilkan N/10, dan mengaktifkan tombol simpan (Req 2.2, 2.3, 2.4, 2.10)', async () => {
    await openModal()

    fireEvent.click(getStars()[6]) // bintang ke-7

    expect(getSelectedFlags()).toEqual([
      true, true, true, true, true, true, true, false, false, false
    ])
    expect(screen.getByTestId('rating-modal-value')).toHaveTextContent('7/10')
    expect(screen.getByRole('button', { name: CREATE_ACTION_LABEL })).not.toBeDisabled()
  })

  it('menetapkan satu nilai rating aktif dan menggantikan pilihan sebelumnya (Req 2.2)', async () => {
    await openModal()

    fireEvent.click(getStars()[8]) // 9
    fireEvent.click(getStars()[2]) // 3

    expect(screen.getByTestId('rating-modal-value')).toHaveTextContent('3/10')
    expect(getStars().filter((star) => star.dataset.selected === 'true')).toHaveLength(3)
  })

  it('memperbarui pencacah karakter pada setiap perubahan komentar (Req 2.6, 2.8)', async () => {
    await openModal()

    const textarea = screen.getByLabelText('Komentar (opsional)')
    expect(screen.getByTestId('rating-modal-counter')).toHaveTextContent(`0/${COMMENT_MAX_LENGTH}`)

    fireEvent.change(textarea, { target: { value: 'Film bagus' } })
    expect(textarea).toHaveValue('Film bagus')
    expect(screen.getByTestId('rating-modal-counter')).toHaveTextContent(`10/${COMMENT_MAX_LENGTH}`)
    expect(screen.queryByTestId('rating-modal-limit-notice')).not.toBeInTheDocument()
  })

  it('mempertahankan 1000 karakter pertama dan menampilkan penanda batas (Req 2.7)', async () => {
    await openModal()

    const textarea = screen.getByLabelText('Komentar (opsional)')
    fireEvent.change(textarea, { target: { value: 'a'.repeat(COMMENT_MAX_LENGTH + 25) } })

    expect(textarea.value).toHaveLength(COMMENT_MAX_LENGTH)
    expect(screen.getByTestId('rating-modal-counter')).toHaveTextContent(
      `${COMMENT_MAX_LENGTH}/${COMMENT_MAX_LENGTH}`
    )
    expect(screen.getByTestId('rating-modal-limit-notice')).toBeInTheDocument()
  })

  it('menampilkan judul Media_Item melalui formatTitle (Req 1.4)', async () => {
    const longTitle = 'x'.repeat(TITLE_MAX_LENGTH + 30)
    const { container } = await openModal({ title: longTitle })

    const heading = container.querySelector('.rating-modal-title')
    expect(heading.textContent).toBe(`${'x'.repeat(TITLE_MAX_LENGTH)}${TRUNCATION_INDICATOR}`)
  })

  it('tidak merender apa pun ketika modal tertutup', () => {
    const { container } = render(
      <RatingModal isOpen={false} mediaType="tv" mediaId={7} title="Loki" />
    )

    expect(container).toBeEmptyDOMElement()
    expect(getMyReview).not.toHaveBeenCalled()
  })
})

describe('RatingModal - pramuat review sendiri', () => {
  it('mengirim tepat satu permintaan pramuat dengan media_type dan media_id aktif (Req 8.1)', async () => {
    await openModal({ mediaType: 'tv', mediaId: 99 })

    expect(getMyReview).toHaveBeenCalledTimes(1)
    expect(getMyReview).toHaveBeenCalledWith('tv', 99)
  })

  it('menonaktifkan 10 kontrol bintang, kolom komentar, dan tombol simpan selama pramuat (Req 8.5)', () => {
    getMyReview.mockReturnValue(new Promise(() => {}))
    renderModal()

    expect(screen.getByTestId('rating-modal-preload-indicator')).toBeInTheDocument()
    const stars = getStars()
    expect(stars).toHaveLength(10)
    stars.forEach((star) => expect(star).toBeDisabled())
    expect(screen.getByLabelText('Komentar (opsional)')).toBeDisabled()
    expect(screen.getByRole('button', { name: CREATE_ACTION_LABEL })).toBeDisabled()
  })

  it('memetakan respons berisi review ke rating aktif, komentar, pencacah, dan label pembaruan (Req 8.2, 8.7)', async () => {
    getMyReview.mockResolvedValue({ data: { id: 5, rating: 7, comment: 'Bagus sekali' } })

    await openModal()

    expect(getSelectedFlags()).toEqual([
      true, true, true, true, true, true, true, false, false, false
    ])
    expect(screen.getByTestId('rating-modal-value')).toHaveTextContent('7/10')
    expect(screen.getByLabelText('Komentar (opsional)')).toHaveValue('Bagus sekali')
    expect(screen.getByTestId('rating-modal-counter')).toHaveTextContent(
      `12/${COMMENT_MAX_LENGTH}`
    )

    const saveButton = screen.getByRole('button', { name: UPDATE_ACTION_LABEL })
    expect(saveButton).not.toBeDisabled()
    expect(saveButton.dataset.actionMode).toBe('update')
  })

  it('menampilkan kolom komentar kosong dengan pencacah 0 saat komentar tersimpan null (Req 8.8)', async () => {
    getMyReview.mockResolvedValue({ data: { id: 5, rating: 4, comment: null } })

    await openModal()

    expect(screen.getByLabelText('Komentar (opsional)')).toHaveValue('')
    expect(screen.getByTestId('rating-modal-counter')).toHaveTextContent(`0/${COMMENT_MAX_LENGTH}`)
    expect(screen.getByTestId('rating-modal-value')).toHaveTextContent('4/10')
    expect(screen.getByRole('button', { name: UPDATE_ACTION_LABEL })).toBeInTheDocument()
  })

  it('memetakan respons data null ke form kosong berlabel aksi pembuatan (Req 8.3)', async () => {
    getMyReview.mockResolvedValue({ data: null })

    await openModal()

    expect(getSelectedFlags().every((selected) => selected === false)).toBe(true)
    expect(screen.getByLabelText('Komentar (opsional)')).toHaveValue('')
    const saveButton = screen.getByRole('button', { name: CREATE_ACTION_LABEL })
    expect(saveButton).toBeDisabled()
    expect(saveButton.dataset.actionMode).toBe('create')
    expect(screen.queryByTestId('rating-modal-preload-error')).not.toBeInTheDocument()
  })

  it('menampilkan form kosong mode pembuatan, pesan gagal, dan aksi ulangi saat pramuat gagal (Req 8.6)', async () => {
    const timeoutError = new Error('Permintaan rating melewati batas waktu')
    timeoutError.kind = 'timeout'
    getMyReview.mockRejectedValue(timeoutError)

    await openModal()

    expect(screen.getByTestId('rating-modal-preload-error')).toHaveTextContent(
      PRELOAD_FAILED_MESSAGE
    )
    expect(getSelectedFlags().every((selected) => selected === false)).toBe(true)
    expect(screen.getByLabelText('Komentar (opsional)')).toHaveValue('')
    expect(screen.getByLabelText('Komentar (opsional)')).not.toBeDisabled()
    const saveButton = screen.getByRole('button', { name: CREATE_ACTION_LABEL })
    expect(saveButton).toBeDisabled()
    expect(saveButton.dataset.actionMode).toBe('create')
    expect(screen.getByRole('button', { name: PRELOAD_RETRY_LABEL })).toBeInTheDocument()
  })

  it('mengirim satu permintaan pramuat baru saat aksi ulangi dipilih (Req 8.6)', async () => {
    getMyReview.mockRejectedValueOnce(new Error('gagal jaringan'))

    await openModal()
    expect(getMyReview).toHaveBeenCalledTimes(1)

    getMyReview.mockResolvedValueOnce({ data: { id: 8, rating: 2, comment: 'Lumayan' } })
    fireEvent.click(screen.getByRole('button', { name: PRELOAD_RETRY_LABEL }))

    await waitFor(() =>
      expect(screen.getByTestId('rating-modal-value')).toHaveTextContent('2/10')
    )
    expect(getMyReview).toHaveBeenCalledTimes(2)
    expect(screen.getByLabelText('Komentar (opsional)')).toHaveValue('Lumayan')
    expect(screen.queryByTestId('rating-modal-preload-error')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: PRELOAD_RETRY_LABEL })).not.toBeInTheDocument()
  })
})

describe('RatingModal - alur simpan', () => {
  it('mengirim payload rating dan komentar aktif ke Rating_API (Req 10.1)', async () => {
    await openModal({ mediaType: 'tv', mediaId: 77 })

    fireEvent.change(screen.getByLabelText('Komentar (opsional)'), {
      target: { value: 'Serial favorit' }
    })
    submitRating(8)

    await waitFor(() => expect(saveReview).toHaveBeenCalledTimes(1))
    expect(saveReview).toHaveBeenCalledWith({
      mediaType: 'tv',
      mediaId: 77,
      rating: 8,
      comment: 'Serial favorit'
    })
  })

  it('menonaktifkan tombol simpan dan aksi hapus serta menampilkan indikator selama proses (Req 10.1)', async () => {
    getMyReview.mockResolvedValue({ data: { id: 3, rating: 6, comment: 'Oke' } })
    const pending = createDeferred()
    saveReview.mockReturnValue(pending.promise)

    await openModal()
    expect(screen.getByTestId('rating-modal-delete')).not.toBeDisabled()

    fireEvent.click(getSaveButton())

    expect(screen.getByTestId('rating-modal-save-indicator')).toBeInTheDocument()
    expect(getSaveButton()).toBeDisabled()
    expect(screen.getByTestId('rating-modal-delete')).toBeDisabled()
    expect(screen.getByTestId('rating-modal-delete')).toHaveTextContent(DELETE_ACTION_LABEL)

    await act(async () => {
      pending.resolve({ data: { id: 3 } })
    })
  })

  it('mengabaikan penekanan tombol simpan berikutnya sehingga hanya satu permintaan aktif (Req 10.1)', async () => {
    const pending = createDeferred()
    saveReview.mockReturnValue(pending.promise)

    await openModal()
    submitRating(5)
    fireEvent.click(getSaveButton())
    fireEvent.click(getSaveButton())

    expect(saveReview).toHaveBeenCalledTimes(1)

    await act(async () => {
      pending.resolve({ data: { id: 1 } })
    })
  })

  it('menampilkan notifikasi keberhasilan dan menutup modal otomatis di bawah 2 detik (Req 10.2)', async () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    const onSave = vi.fn()

    renderModal({ onClose, onSave })
    // Menyelesaikan pramuat tanpa waitFor karena timer sedang dipalsukan
    await act(async () => {})

    submitRating(9)
    await act(async () => {})

    expect(screen.getByTestId('rating-modal-notification-success')).toHaveTextContent(
      SAVE_SUCCESS_MESSAGE
    )
    expect(screen.queryByTestId('rating-modal-save-indicator')).not.toBeInTheDocument()
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()

    expect(AUTO_CLOSE_DELAY_MS).toBeLessThanOrEqual(2000)
    act(() => {
      vi.advanceTimersByTime(AUTO_CLOSE_DELAY_MS)
    })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('mempertahankan form, menampilkan pesan field error, dan mengaktifkan simpan pada status 400 (Req 10.3)', async () => {
    saveReview.mockRejectedValue(httpError(400, 'rating harus bilangan bulat 1 sampai 10'))

    await openModal()
    fireEvent.change(screen.getByLabelText('Komentar (opsional)'), {
      target: { value: 'Komentar dipertahankan' }
    })
    submitRating(4)

    await waitFor(() => expect(getErrorMessages().length).toBeGreaterThan(0))

    expect(getErrorMessages()).toContain('rating harus bilangan bulat 1 sampai 10')
    expect(screen.getByTestId('rating-modal-value')).toHaveTextContent('4/10')
    expect(screen.getByLabelText('Komentar (opsional)')).toHaveValue('Komentar dipertahankan')
    expect(getSaveButton()).not.toBeDisabled()
    expect(screen.queryByTestId('rating-modal-save-retry')).not.toBeInTheDocument()
  })

  it('menampilkan pesan umum saat body kesalahan tidak memuat field error (Req 10.4)', async () => {
    saveReview.mockRejectedValue(
      httpError(422, 'Terjadi kesalahan saat memproses permintaan rating')
    )

    await openModal()
    submitRating(3)

    await waitFor(() => expect(getErrorMessages()).toContain(SAVE_GENERIC_ERROR_MESSAGE))
    expect(screen.getByTestId('rating-modal-value')).toHaveTextContent('3/10')
  })

  it('menampilkan pesan login beserta tautan /login dan menonaktifkan simpan pada status 401 (Req 10.7)', async () => {
    saveReview.mockRejectedValue(httpError(401, 'Token tidak valid'))

    await openModal()
    fireEvent.change(screen.getByLabelText('Komentar (opsional)'), {
      target: { value: 'Tetap ada' }
    })
    submitRating(10)

    await waitFor(() =>
      expect(screen.getByTestId('rating-modal-notification-error')).toHaveTextContent(
        SAVE_AUTH_ERROR_MESSAGE
      )
    )

    expect(screen.getByTestId('rating-modal-login-link')).toHaveAttribute('href', '/login')
    expect(getSaveButton()).toBeDisabled()
    expect(screen.getByTestId('rating-modal-value')).toHaveTextContent('10/10')
    expect(screen.getByLabelText('Komentar (opsional)')).toHaveValue('Tetap ada')
    expect(screen.queryByTestId('rating-modal-save-retry')).not.toBeInTheDocument()
  })

  it('menyediakan aksi kirim ulang pada status 500 dan batas waktu 10 detik (Req 10.5, 10.9)', async () => {
    saveReview.mockRejectedValueOnce(httpError(500, 'Terjadi kesalahan pada server'))

    await openModal()
    submitRating(6)

    await waitFor(() =>
      expect(screen.getByTestId('rating-modal-save-retry')).toHaveTextContent(SAVE_RETRY_LABEL)
    )
    expect(getErrorMessages()).toContain(SAVE_GENERIC_ERROR_MESSAGE)
    expect(screen.getByTestId('rating-modal-value')).toHaveTextContent('6/10')
  })

  it('mengirim ulang payload identik dan membersihkan pesan sebelumnya (Req 10.10)', async () => {
    saveReview.mockRejectedValueOnce(
      transportError('timeout', 'Permintaan rating melewati batas waktu')
    )

    await openModal({ mediaId: 12 })
    fireEvent.change(screen.getByLabelText('Komentar (opsional)'), {
      target: { value: 'Payload identik' }
    })
    submitRating(7)

    await waitFor(() => expect(screen.getByTestId('rating-modal-save-retry')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('rating-modal-save-retry'))

    await waitFor(() => expect(saveReview).toHaveBeenCalledTimes(2))
    expect(saveReview.mock.calls[1][0]).toEqual(saveReview.mock.calls[0][0])
    expect(saveReview.mock.calls[1][0]).toEqual({
      mediaType: 'movie',
      mediaId: 12,
      rating: 7,
      comment: 'Payload identik'
    })

    await waitFor(() =>
      expect(screen.getByTestId('rating-modal-notification-success')).toBeInTheDocument()
    )
    expect(getErrorMessages()).toHaveLength(0)
  })

  it('menyembunyikan aksi kirim ulang dan menampilkan pesan coba kembali nanti setelah 3 kegagalan berturut-turut (Req 10.11)', async () => {
    saveReview.mockRejectedValue(
      transportError('network', 'Permintaan rating gagal karena masalah koneksi')
    )

    await openModal()
    submitRating(5)

    for (let attempt = 0; attempt < MAX_SAVE_RETRIES; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop
      await waitFor(() => expect(screen.getByTestId('rating-modal-save-retry')).toBeInTheDocument())
      fireEvent.click(screen.getByTestId('rating-modal-save-retry'))
    }

    await waitFor(() => expect(getErrorMessages()).toContain(SAVE_EXHAUSTED_MESSAGE))

    expect(saveReview).toHaveBeenCalledTimes(MAX_SAVE_RETRIES + 1)
    expect(screen.queryByTestId('rating-modal-save-retry')).not.toBeInTheDocument()
    expect(screen.getByTestId('rating-modal-value')).toHaveTextContent('5/10')
  })

  it('membatasi area notifikasi pada 5 butir (Req 10.8)', async () => {
    saveReview.mockRejectedValue(
      httpError(400, 'Data rating tidak sah', {
        details: [
          { field: 'rating', message: 'rating tidak sah' },
          { field: 'media_id', message: 'media_id tidak sah' },
          { field: 'media_type', message: 'media_type tidak sah' },
          { field: 'comment', message: 'comment terlalu panjang' },
          { field: 'limit', message: 'limit tidak sah' },
          { field: 'offset', message: 'offset tidak sah' }
        ]
      })
    )

    await openModal()
    submitRating(2)

    await waitFor(() => expect(getErrorMessages().length).toBeGreaterThan(0))
    expect(getErrorMessages()).toHaveLength(MAX_NOTIFICATION_ITEMS)
  })
})

describe('RatingModal - alur hapus rating', () => {
  const openWithExistingReview = (props = {}) => {
    getMyReview.mockResolvedValue({ data: { id: 21, rating: 6, comment: 'Perlu ditinjau' } })
    return openModal(props)
  }

  it('menyembunyikan aksi hapus saat review pengguna belum ada (Req 9.1)', async () => {
    await openModal()

    expect(screen.queryByTestId('rating-modal-delete')).not.toBeInTheDocument()
  })

  it('menampilkan aksi hapus dalam keadaan aktif saat review pengguna ada (Req 9.1)', async () => {
    await openWithExistingReview()

    const deleteButton = screen.getByTestId('rating-modal-delete')
    expect(deleteButton).toHaveTextContent(DELETE_ACTION_LABEL)
    expect(deleteButton).not.toBeDisabled()
  })

  it('menampilkan konfirmasi dengan aksi konfirmasi dan batal tanpa mengirim permintaan hapus (Req 9.6)', async () => {
    await openWithExistingReview()

    fireEvent.click(screen.getByTestId('rating-modal-delete'))

    expect(screen.getByTestId('rating-modal-delete-confirm')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: DELETE_CONFIRM_LABEL })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: DELETE_CANCEL_LABEL })).toBeInTheDocument()
    expect(deleteMyReview).not.toHaveBeenCalled()
  })

  it('menutup konfirmasi pada aksi batal tanpa permintaan hapus dan mempertahankan rating serta komentar (Req 9.7)', async () => {
    await openWithExistingReview()

    fireEvent.change(screen.getByLabelText('Komentar (opsional)'), {
      target: { value: 'Komentar terjaga' }
    })
    fireEvent.click(getStars()[7]) // rating 8
    fireEvent.click(screen.getByTestId('rating-modal-delete'))
    fireEvent.click(screen.getByTestId('rating-modal-delete-confirm-no'))

    expect(screen.queryByTestId('rating-modal-delete-confirm')).not.toBeInTheDocument()
    expect(deleteMyReview).not.toHaveBeenCalled()
    expect(screen.getByTestId('rating-modal-value')).toHaveTextContent('8/10')
    expect(screen.getByLabelText('Komentar (opsional)')).toHaveValue('Komentar terjaga')
    expect(screen.getByTestId('rating-modal-delete')).not.toBeDisabled()
  })

  it('mengirim permintaan hapus pada konfirmasi dan mengembalikan form kosong berlabel aksi pembuatan (Req 9.2, 9.4)', async () => {
    const onDelete = vi.fn()
    await openWithExistingReview({ mediaType: 'tv', mediaId: 55, onDelete })

    fireEvent.click(screen.getByTestId('rating-modal-delete'))
    fireEvent.click(screen.getByTestId('rating-modal-delete-confirm-yes'))

    await waitFor(() => expect(deleteMyReview).toHaveBeenCalledTimes(1))
    expect(deleteMyReview).toHaveBeenCalledWith('tv', 55)

    await waitFor(() =>
      expect(screen.queryByTestId('rating-modal-delete')).not.toBeInTheDocument()
    )

    expect(getSelectedFlags().every((selected) => selected === false)).toBe(true)
    expect(screen.getByLabelText('Komentar (opsional)')).toHaveValue('')
    expect(screen.getByTestId('rating-modal-counter')).toHaveTextContent(`0/${COMMENT_MAX_LENGTH}`)
    const saveButton = getSaveButton()
    expect(saveButton).toHaveTextContent(CREATE_ACTION_LABEL)
    expect(saveButton.dataset.actionMode).toBe('create')
    expect(saveButton).toBeDisabled()
    expect(screen.getByTestId('rating-modal-notification-success')).toHaveTextContent(
      DELETE_SUCCESS_MESSAGE
    )
    expect(screen.queryByTestId('rating-modal-delete-confirm')).not.toBeInTheDocument()
    // Detail_Page diberi tahu agar ringkasan dan daftar review dimuat ulang (Req 9.4)
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete.mock.calls[0][0]).toEqual({ mediaType: 'tv', mediaId: 55 })
  })

  it('mempertahankan aksi hapus aktif beserta rating dan komentar saat permintaan hapus gagal (Req 9.8)', async () => {
    deleteMyReview.mockRejectedValue(httpError(500, 'Terjadi kesalahan pada server'))

    await openWithExistingReview()

    fireEvent.change(screen.getByLabelText('Komentar (opsional)'), {
      target: { value: 'Masih tersimpan' }
    })
    fireEvent.click(screen.getByTestId('rating-modal-delete'))
    fireEvent.click(screen.getByTestId('rating-modal-delete-confirm-yes'))

    await waitFor(() => expect(getErrorMessages()).toContain(DELETE_FAILED_MESSAGE))

    const deleteButton = screen.getByTestId('rating-modal-delete')
    expect(deleteButton).toBeInTheDocument()
    expect(deleteButton).not.toBeDisabled()
    expect(screen.getByTestId('rating-modal-value')).toHaveTextContent('6/10')
    expect(screen.getByLabelText('Komentar (opsional)')).toHaveValue('Masih tersimpan')
    expect(getSaveButton()).toHaveTextContent(UPDATE_ACTION_LABEL)
    expect(screen.queryByTestId('rating-modal-delete-confirm')).not.toBeInTheDocument()
  })

  it('mengabaikan penekanan konfirmasi berikutnya sehingga hanya satu permintaan hapus aktif (Req 9.6)', async () => {
    const pending = createDeferred()
    deleteMyReview.mockReturnValue(pending.promise)

    await openWithExistingReview()

    fireEvent.click(screen.getByTestId('rating-modal-delete'))
    fireEvent.click(screen.getByTestId('rating-modal-delete-confirm-yes'))
    fireEvent.click(screen.getByTestId('rating-modal-delete-confirm-yes'))

    expect(deleteMyReview).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('rating-modal-delete-indicator')).toBeInTheDocument()
    expect(getSaveButton()).toBeDisabled()

    await act(async () => {
      pending.resolve({ data: { deleted: true } })
    })
  })
})

describe('RatingModal - jalur penutupan modal', () => {
  // Pembungkus yang mengendalikan `isOpen` agar penutupan dan pembukaan ulang dapat diuji
  const ControlledModal = ({ trigger = true, ...props }) => {
    const [isOpen, setIsOpen] = React.useState(true)
    const triggerRef = React.useRef(null)

    return (
      <div>
        {trigger && (
          <button type="button" ref={triggerRef} onClick={() => setIsOpen(true)}>
            Beri rating Inception
          </button>
        )}
        <RatingModal
          isOpen={isOpen}
          mediaType="movie"
          mediaId={42}
          title="Inception"
          triggerRef={trigger ? triggerRef : undefined}
          onClose={() => setIsOpen(false)}
          {...props}
        />
      </div>
    )
  }

  const renderControlled = async (props = {}) => {
    const utils = render(<ControlledModal {...props} />)
    await waitFor(() =>
      expect(screen.queryByTestId('rating-modal-preload-indicator')).not.toBeInTheDocument()
    )
    return utils
  }

  const getCloseButton = () => screen.getByRole('button', { name: 'Tutup form rating' })

  const pressEscape = () => fireEvent.keyDown(document, { key: 'Escape' })

  it('menyembunyikan modal dan membuang masukan yang belum dikirim pada tombol tutup (Req 1.5)', async () => {
    await renderControlled()

    fireEvent.click(getStars()[6]) // rating 7
    fireEvent.change(screen.getByLabelText('Komentar (opsional)'), {
      target: { value: 'Belum dikirim' }
    })

    fireEvent.click(getCloseButton())

    expect(screen.queryByTestId('rating-modal-dialog')).not.toBeInTheDocument()
    expect(saveReview).not.toHaveBeenCalled()
  })

  it('menutup modal pada tombol Escape dengan perilaku identik tombol tutup (Req 1.9)', async () => {
    await renderControlled()

    fireEvent.click(getStars()[3]) // rating 4
    pressEscape()

    expect(screen.queryByTestId('rating-modal-dialog')).not.toBeInTheDocument()
    expect(saveReview).not.toHaveBeenCalled()
  })

  it('menampilkan form sesuai hasil pramuat saat modal dibuka kembali (Req 1.5)', async () => {
    getMyReview.mockResolvedValue({ data: { id: 7, rating: 6, comment: 'Tersimpan' } })

    await renderControlled()

    fireEvent.click(getStars()[9]) // rating 10, belum dikirim
    fireEvent.change(screen.getByLabelText('Komentar (opsional)'), {
      target: { value: 'Perubahan yang dibuang' }
    })

    pressEscape()
    expect(screen.queryByTestId('rating-modal-dialog')).not.toBeInTheDocument()

    // Membuka kembali modal melalui Rating_Trigger
    fireEvent.click(screen.getByRole('button', { name: 'Beri rating Inception' }))
    await waitFor(() =>
      expect(screen.queryByTestId('rating-modal-preload-indicator')).not.toBeInTheDocument()
    )

    expect(screen.getByTestId('rating-modal-value')).toHaveTextContent('6/10')
    expect(screen.getByLabelText('Komentar (opsional)')).toHaveValue('Tersimpan')
  })

  it('tidak meminta ulang data pada penutupan dan meminta pramuat tepat sekali per pembukaan (Req 1.5)', async () => {
    await renderControlled()

    expect(getMyReview).toHaveBeenCalledTimes(1)

    fireEvent.click(getCloseButton())
    expect(getMyReview).toHaveBeenCalledTimes(1)

    pressEscape()
    expect(getMyReview).toHaveBeenCalledTimes(1)
    expect(saveReview).not.toHaveBeenCalled()
    expect(deleteMyReview).not.toHaveBeenCalled()
  })

  it('mengembalikan fokus keyboard ke Rating_Trigger pada kedua jalur penutupan (Req 1.9)', async () => {
    await renderControlled()

    const trigger = screen.getByRole('button', { name: 'Beri rating Inception' })

    fireEvent.click(getCloseButton())
    expect(document.activeElement).toBe(trigger)

    fireEvent.click(trigger)
    await waitFor(() =>
      expect(screen.queryByTestId('rating-modal-preload-indicator')).not.toBeInTheDocument()
    )
    // Fokus dipindahkan ke dalam dialog saat modal dibuka
    expect(screen.getByTestId('rating-modal-dialog')).toContainElement(document.activeElement)

    pressEscape()
    expect(document.activeElement).toBe(trigger)
  })

  it('memanggil onClose tepat satu kali pada masing-masing jalur penutupan (Req 1.5, 1.9)', async () => {
    const onClose = vi.fn()
    render(<RatingModal isOpen mediaType="movie" mediaId={42} title="Inception" onClose={onClose} />)
    await waitFor(() =>
      expect(screen.queryByTestId('rating-modal-preload-indicator')).not.toBeInTheDocument()
    )

    fireEvent.click(getCloseButton())
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)

    // Tombol lain tidak menutup modal
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
