import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getMyReview, saveReview, deleteMyReview } from '../services/reviewService';
import { clampComment, countCharacters, formatTitle, COMMENT_MAX_LENGTH } from '../utils/reviewFormat';

// Nilai rating yang tersedia: tepat 10 kontrol bintang, urut naik 1..10 (Req 2.1)
const RATING_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Penanda saat nilai rating aktif belum ditetapkan, tanpa angka rating apa pun (Req 2.5)
const RATING_UNSET_LABEL = 'Rating belum dipilih';

// Status pramuat review milik pengguna sendiri (Req 8.1, 8.5, 8.6)
export const PRELOAD_LOADING = 'loading';
export const PRELOAD_READY = 'ready';
export const PRELOAD_FAILED = 'failed';

// Label aksi: pembuatan saat review sendiri belum ada, pembaruan saat sudah ada (Req 8.2, 8.3)
export const CREATE_ACTION_LABEL = 'Simpan rating';
export const UPDATE_ACTION_LABEL = 'Perbarui rating';

// Pesan dan aksi saat pramuat gagal, termasuk batas waktu 10 detik (Req 8.6)
export const PRELOAD_FAILED_MESSAGE = 'Gagal memuat rating tersimpan';
export const PRELOAD_RETRY_LABEL = 'Ulangi pramuat rating';
const PRELOAD_LOADING_MESSAGE = 'Memuat rating tersimpan';

// Status permintaan simpan (Req 10.1, 10.2, 10.3)
export const SAVE_IDLE = 'idle';
export const SAVE_IN_PROGRESS = 'saving';
export const SAVE_SUCCEEDED = 'saved';
export const SAVE_FAILED = 'failed';

// Pesan alur simpan
export const SAVE_SUCCESS_MESSAGE = 'Rating berhasil disimpan';
export const SAVE_GENERIC_ERROR_MESSAGE = 'Gagal menyimpan rating';
export const SAVE_AUTH_ERROR_MESSAGE =
  'Sesi login berakhir, silakan login kembali untuk menyimpan rating';
export const SAVE_EXHAUSTED_MESSAGE =
  'Penyimpanan rating masih gagal, silakan coba kembali nanti';
export const SAVE_RETRY_LABEL = 'Kirim ulang rating';
export const LOGIN_LINK_LABEL = 'Halaman login';
export const DELETE_ACTION_LABEL = 'Hapus rating';
const SAVING_INDICATOR_MESSAGE = 'Menyimpan rating';

// Status alur hapus rating (Req 9.1, 9.6, 9.7, 9.8)
export const DELETE_IDLE = 'idle';
export const DELETE_CONFIRMING = 'confirming';
export const DELETE_IN_PROGRESS = 'deleting';
export const DELETE_FAILED = 'failed';

// Permintaan konfirmasi hapus beserta aksi konfirmasi dan aksi batal (Req 9.6, 9.7)
export const DELETE_CONFIRM_QUESTION = 'Hapus rating yang tersimpan untuk judul ini?';
export const DELETE_CONFIRM_LABEL = 'Konfirmasi hapus rating';
export const DELETE_CANCEL_LABEL = 'Batalkan hapus rating';
export const DELETE_SUCCESS_MESSAGE = 'Rating berhasil dihapus';
export const DELETE_FAILED_MESSAGE = 'Gagal menghapus rating';
const DELETING_INDICATOR_MESSAGE = 'Menghapus rating';

// Batas kirim ulang berturut-turut untuk satu percobaan simpan (Req 10.10, 10.11)
export const MAX_SAVE_RETRIES = 3;
// Jumlah maksimal butir pada satu area notifikasi (Req 10.8)
export const MAX_NOTIFICATION_ITEMS = 5;
// Penutupan otomatis setelah notifikasi keberhasilan, di bawah batas 2 detik (Req 10.2)
export const AUTO_CLOSE_DELAY_MS = 1500;

// Mengubah entri `details` dari body kesalahan menjadi teks butir notifikasi (Req 10.8)
const toDetailMessage = (detail) => {
  if (typeof detail === 'string') {
    return detail;
  }
  if (detail && typeof detail.message === 'string') {
    return detail.message;
  }
  return null;
};

/**
 * Memetakan kegagalan simpan ke butir notifikasi, ketersediaan aksi kirim ulang,
 * dan penonaktifan tombol simpan.
 * - 401 → pesan login kembali beserta tautan `/login`, tombol simpan nonaktif (Req 10.7)
 * - 400–499 selain 401 → pesan dari field `error`, tanpa aksi kirim ulang (Req 10.3)
 * - 500–599, jaringan, dan batas waktu 10 detik → pesan umum + aksi kirim ulang (Req 10.5, 10.9)
 * - body tanpa field `error`/bukan JSON → pesan umum penyimpanan gagal (Req 10.4)
 */
const classifySaveFailure = (error) => {
  const status = error && typeof error.status === 'number' ? error.status : null;
  const detailMessage =
    error && typeof error.message === 'string' && error.message.length > 0 ? error.message : null;
  const fieldDetails =
    error && Array.isArray(error.details) ? error.details.map(toDetailMessage).filter(Boolean) : [];

  if (status === 401) {
    return {
      messages: [{ message: SAVE_AUTH_ERROR_MESSAGE, loginLink: true }],
      canRetry: false,
      authExpired: true,
    };
  }

  const messages = [{ message: SAVE_GENERIC_ERROR_MESSAGE }];

  if (detailMessage && detailMessage !== SAVE_GENERIC_ERROR_MESSAGE) {
    messages.push({ message: detailMessage });
  }

  fieldDetails.forEach((message) => {
    messages.push({ message });
  });

  // Tanpa status berarti jaringan terputus atau batas waktu 10 detik terlewati
  const canRetry = status === null || status >= 500;

  return { messages, canRetry, authExpired: false };
};

// Rating hasil pramuat hanya diterima bila berupa bilangan bulat 1..10 (Req 8.2)
const normalizePreloadedRating = (value) => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > RATING_VALUES.length) {
    return null;
  }
  return numeric;
};

/**
 * Rating_Modal: form penilaian 1..10 beserta komentar untuk satu Media_Item.
 *
 * Struktur dasar (task 11.1): kontrol bintang, teks nilai rating, kolom komentar
 * dengan pencacah karakter, tombol simpan yang nonaktif hingga rating ditetapkan.
 * Pramuat review sendiri (task 11.3): tepat satu permintaan saat modal dibuka,
 * form nonaktif selama proses, pemetaan respons ke rating/komentar/label aksi, dan
 * penanganan kegagalan beserta aksi ulangi.
 * Alur simpan (task 11.5): paling banyak satu permintaan aktif, indikator proses pada
 * area tombol, penutupan otomatis pada sukses, penanganan kegagalan per kelas, dan
 * kirim ulang berpayload identik dengan batas tiga percobaan.
 * Alur hapus (task 11.9): aksi hapus aktif hanya ketika review sendiri ada, permintaan
 * konfirmasi menahan permintaan hapus sampai dikonfirmasi, sukses mengembalikan form ke
 * mode pembuatan, dan kegagalan mempertahankan aksi hapus beserta isi form.
 * Jalur penutupan (task 11.11): tombol tutup dan tombol Escape berperilaku identik, yaitu
 * membuang masukan yang belum dikirim, memanggil `onClose` tanpa memicu permintaan ulang
 * data detail Media_Item, dan mengembalikan fokus keyboard ke Rating_Trigger.
 */
const RatingModal = ({
  isOpen = false,
  mediaType,
  mediaId,
  title = '',
  // Ref elemen Rating_Trigger; fokus keyboard dikembalikan ke elemen ini saat modal tertutup (Req 1.9)
  triggerRef,
  onClose,
  onSave,
  onDelete,
}) => {
  // Nilai rating aktif; null berarti belum ditetapkan (Req 2.2, 2.5)
  const [rating, setRating] = useState(null);
  // Isi kolom komentar, selalu dibatasi 1000 karakter (Req 2.6, 2.7)
  const [comment, setComment] = useState('');
  // Penanda batas komentar tercapai akibat pengetikan/penempelan teks (Req 2.7)
  const [commentLimitReached, setCommentLimitReached] = useState(false);
  // Status permintaan pramuat review sendiri (Req 8.5, 8.6)
  const [preloadStatus, setPreloadStatus] = useState(PRELOAD_LOADING);
  // Review_Record hasil pramuat; null berarti pengguna belum pernah menilai item ini (Req 8.3)
  const [existingReview, setExistingReview] = useState(null);
  // Pencacah percobaan pramuat; bertambah saat aksi ulangi dipilih (Req 8.6)
  const [preloadAttempt, setPreloadAttempt] = useState(0);
  // Status permintaan simpan (Req 10.1, 10.2)
  const [saveStatus, setSaveStatus] = useState(SAVE_IDLE);
  // Butir notifikasi hasil percobaan simpan; area notifikasi dibatasi 5 butir (Req 10.8)
  const [saveNotifications, setSaveNotifications] = useState([]);
  // Ketersediaan aksi kirim ulang (Req 10.5, 10.9, 10.11)
  const [canRetrySave, setCanRetrySave] = useState(false);
  // Status 401 menonaktifkan tombol simpan sampai pengguna login kembali (Req 10.7)
  const [authExpired, setAuthExpired] = useState(false);
  // Status alur hapus: konfirmasi tertunda, permintaan berjalan, atau gagal (Req 9.6, 9.8)
  const [deleteStatus, setDeleteStatus] = useState(DELETE_IDLE);
  // Butir notifikasi hasil percobaan hapus (Req 9.8, 10.8)
  const [deleteNotifications, setDeleteNotifications] = useState([]);

  // Penjaga sinkron agar penekanan tombol simpan berikutnya diabaikan (Req 10.1)
  const savingRef = useRef(false);
  // Payload percobaan simpan aktif; kirim ulang memakai nilai identik (Req 10.10)
  const payloadRef = useRef(null);
  // Jumlah kirim ulang yang sudah terpakai untuk satu percobaan simpan (Req 10.10)
  const retriesUsedRef = useRef(0);
  // Penjaga sinkron agar paling banyak satu permintaan hapus aktif (Req 9.6)
  const deletingRef = useRef(false);
  const closeTimerRef = useRef(null);
  const mountedRef = useRef(true);
  // Elemen dialog, dipakai untuk memindahkan fokus keyboard ke dalam modal saat dibuka
  const dialogRef = useRef(null);
  // Cadangan sasaran pengembalian fokus bila `triggerRef` tidak diberikan (Req 1.9)
  const previousFocusRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, []);

  // Tepat satu permintaan pramuat per pembukaan modal atau per aksi ulangi (Req 8.1)
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    let active = true;

    // Setiap pramuat dimulai dari form kosong agar masukan lama tidak bocor
    setPreloadStatus(PRELOAD_LOADING);
    setRating(null);
    setComment('');
    setCommentLimitReached(false);
    setExistingReview(null);

    // Percobaan simpan sebelumnya tidak ikut terbawa ke pembukaan/pramuat baru
    setSaveStatus(SAVE_IDLE);
    setSaveNotifications([]);
    setCanRetrySave(false);
    setAuthExpired(false);
    savingRef.current = false;
    payloadRef.current = null;
    retriesUsedRef.current = 0;

    // Konfirmasi maupun kegagalan hapus sebelumnya tidak terbawa ke pembukaan/pramuat baru
    setDeleteStatus(DELETE_IDLE);
    setDeleteNotifications([]);
    deletingRef.current = false;

    getMyReview(mediaType, mediaId)
      .then((response) => {
        if (!active) {
          return;
        }

        const review = response && response.data ? response.data : null;

        if (review) {
          // Rating aktif N, kontrol bintang 1..N terpilih, label aksi pembaruan (Req 8.2)
          setRating(normalizePreloadedRating(review.rating));
          // Komentar tersimpan mengisi kolom; null menjadi kolom kosong (Req 8.7, 8.8)
          setComment(clampComment(review.comment));
          setExistingReview(review);
        }

        setPreloadStatus(PRELOAD_READY);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        // Jaringan, status >= 400, atau batas waktu 10 detik → form kosong mode pembuatan (Req 8.6)
        setPreloadStatus(PRELOAD_FAILED);
      });

    return () => {
      active = false;
    };
  }, [isOpen, mediaType, mediaId, preloadAttempt]);

  // Membuang masukan penilaian yang belum dikirim beserta status transien alur simpan/hapus,
  // sehingga pembukaan berikutnya menampilkan form sesuai hasil pramuat (Req 1.5)
  const discardUnsentInput = useCallback(() => {
    setRating(null);
    setComment('');
    setCommentLimitReached(false);
    setSaveStatus(SAVE_IDLE);
    setSaveNotifications([]);
    setCanRetrySave(false);
    setAuthExpired(false);
    setDeleteStatus(DELETE_IDLE);
    setDeleteNotifications([]);
    savingRef.current = false;
    payloadRef.current = null;
    retriesUsedRef.current = 0;
    deletingRef.current = false;
  }, []);

  // Fokus keyboard kembali ke Rating_Trigger; bila ref trigger tidak tersedia, fokus kembali
  // ke elemen yang berfokus sebelum modal dibuka (Req 1.9)
  const restoreTriggerFocus = useCallback(() => {
    const target =
      triggerRef && triggerRef.current ? triggerRef.current : previousFocusRef.current;

    if (target && typeof target.focus === 'function') {
      target.focus();
    }
  }, [triggerRef]);

  /**
   * Satu jalur penutupan untuk tombol tutup, tombol Escape, dan penutupan otomatis setelah
   * simpan berhasil: masukan yang belum dikirim dibuang, fokus keyboard dikembalikan ke
   * Rating_Trigger, dan `onClose` dipanggil tanpa permintaan ulang data detail (Req 1.5, 1.9).
   */
  const closeModal = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    discardUnsentInput();
    restoreTriggerFocus();

    if (typeof onClose === 'function') {
      onClose();
    }
  }, [discardUnsentInput, restoreTriggerFocus, onClose]);

  // Saat modal dibuka: catat elemen berfokus sebelumnya lalu pindahkan fokus ke dalam dialog
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    previousFocusRef.current =
      typeof document !== 'undefined' ? document.activeElement : null;

    const dialog = dialogRef.current;
    if (dialog && typeof dialog.focus === 'function' && !dialog.contains(document.activeElement)) {
      dialog.focus();
    }

    return undefined;
  }, [isOpen]);

  // Tombol Escape memakai jalur penutupan yang identik dengan tombol tutup (Req 1.9)
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape' && event.key !== 'Esc') {
        return;
      }

      event.preventDefault();
      closeModal();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeModal]);

  if (!isOpen) {
    return null;
  }

  const displayTitle = formatTitle(title);
  const characterCount = countCharacters(comment);
  const isRatingSet = rating !== null;
  const isPreloading = preloadStatus === PRELOAD_LOADING;
  const isPreloadFailed = preloadStatus === PRELOAD_FAILED;
  // Label aksi pembaruan hanya ketika review sendiri hasil pramuat ada (Req 8.2, 8.3)
  const actionMode = existingReview ? 'update' : 'create';
  const saveActionLabel = actionMode === 'update' ? UPDATE_ACTION_LABEL : CREATE_ACTION_LABEL;
  const isSaving = saveStatus === SAVE_IN_PROGRESS;
  const isSaved = saveStatus === SAVE_SUCCEEDED;
  const isDeleting = deleteStatus === DELETE_IN_PROGRESS;
  const isConfirmingDelete = deleteStatus === DELETE_CONFIRMING;
  // Tombol simpan nonaktif selama proses simpan/hapus, setelah sukses, dan saat status 401 (Req 10.1, 10.7)
  const isSaveDisabled =
    !isRatingSet || isPreloading || isSaving || isSaved || isDeleting || authExpired;
  // Aksi hapus tampil hanya ketika review sendiri ada (Req 9.1); nonaktif selama proses (Req 10.1)
  const isDeleteVisible = Boolean(existingReview);
  const isDeleteDisabled = isPreloading || isSaving || isSaved || isDeleting || isConfirmingDelete;

  // Satu area notifikasi memuat butir pramuat, simpan, dan hapus, maksimal 5 butir (Req 10.8)
  const notificationItems = [
    ...(isPreloadFailed
      ? [
          {
            id: 'preload-error',
            message: PRELOAD_FAILED_MESSAGE,
            tone: 'error',
            testId: 'rating-modal-preload-error',
          },
        ]
      : []),
    ...saveNotifications,
    ...deleteNotifications,
  ].slice(0, MAX_NOTIFICATION_ITEMS);
  const isSuccessArea =
    notificationItems.length > 0 && notificationItems.every((item) => item.tone === 'success');

  // Memilih kontrol bintang ke-N menggantikan nilai rating aktif sebelumnya (Req 2.2)
  const handleSelectRating = (value) => {
    if (isPreloading) {
      return;
    }

    setRating(value);
  };

  // Pembatasan keras 1000 karakter; karakter berikutnya diabaikan (Req 2.6, 2.7, 2.8)
  const handleCommentChange = (event) => {
    if (isPreloading) {
      return;
    }

    const nextValue = event.target.value;
    const clamped = clampComment(nextValue);

    setComment(clamped);
    setCommentLimitReached(clamped.length >= COMMENT_MAX_LENGTH);
  };

  // Satu eksekusi permintaan simpan, dipakai percobaan pertama maupun kirim ulang
  const runSave = (payload) => {
    savingRef.current = true;
    setSaveStatus(SAVE_IN_PROGRESS);
    // Kirim ulang menghapus pesan kesalahan sebelumnya (Req 10.10)
    setSaveNotifications([]);
    setCanRetrySave(false);

    saveReview(payload)
      .then((response) => {
        savingRef.current = false;

        if (!mountedRef.current) {
          return;
        }

        // Status 200/201: indikator proses berhenti, notifikasi keberhasilan tampil (Req 10.2)
        setSaveStatus(SAVE_SUCCEEDED);
        setSaveNotifications([
          { id: 'save-success', message: SAVE_SUCCESS_MESSAGE, tone: 'success' },
        ]);

        if (typeof onSave === 'function') {
          onSave(payload, response);
        }

        // Penutupan otomatis paling lambat 2 detik setelah notifikasi tampil (Req 10.2)
        closeTimerRef.current = setTimeout(() => {
          closeTimerRef.current = null;
          closeModal();
        }, AUTO_CLOSE_DELAY_MS);
      })
      .catch((error) => {
        savingRef.current = false;

        if (!mountedRef.current) {
          return;
        }

        const classification = classifySaveFailure(error);
        // Batas 3 kirim ulang berturut-turut untuk satu percobaan simpan (Req 10.10, 10.11)
        const isExhausted =
          classification.canRetry && retriesUsedRef.current >= MAX_SAVE_RETRIES;

        const items = classification.messages.map((item, index) => ({
          id: `save-error-${index}`,
          tone: 'error',
          ...item,
        }));

        if (isExhausted) {
          items.push({
            id: 'save-exhausted',
            tone: 'error',
            message: SAVE_EXHAUSTED_MESSAGE,
          });
        }

        // Rating dan komentar tidak diubah, sehingga isi form tetap dipertahankan
        // (Req 10.3, 10.4, 10.5, 10.7, 10.9)
        setSaveStatus(SAVE_FAILED);
        setSaveNotifications(items.slice(0, MAX_NOTIFICATION_ITEMS));
        setCanRetrySave(classification.canRetry && !isExhausted);
        setAuthExpired(classification.authExpired);
      });
  };

  // Tombol simpan hanya dapat ditekan ketika rating sudah ditetapkan (Req 2.9, 2.10, 2.11),
  // pramuat sudah selesai (Req 8.5), dan tidak ada permintaan simpan aktif (Req 10.1)
  const handleSave = () => {
    if (isSaveDisabled || savingRef.current) {
      return;
    }

    const payload = { mediaType, mediaId, rating, comment };
    payloadRef.current = payload;
    retriesUsedRef.current = 0;

    runSave(payload);
  };

  // Kirim ulang memakai payload identik dengan percobaan pertama (Req 10.10)
  const handleRetrySave = () => {
    if (savingRef.current || !canRetrySave || !payloadRef.current) {
      return;
    }

    retriesUsedRef.current += 1;
    runSave(payloadRef.current);
  };

  // Menekan aksi hapus hanya membuka permintaan konfirmasi, tanpa mengirim permintaan (Req 9.6)
  const handleRequestDelete = () => {
    if (isDeleteDisabled || !isDeleteVisible) {
      return;
    }

    setDeleteNotifications([]);
    setDeleteStatus(DELETE_CONFIRMING);
  };

  // Aksi batal menutup konfirmasi tanpa permintaan hapus; rating dan komentar tidak diubah (Req 9.7)
  const handleCancelDelete = () => {
    if (isDeleting) {
      return;
    }

    setDeleteStatus(DELETE_IDLE);
  };

  // Aksi konfirmasi mengirim permintaan hapus untuk kombinasi media aktif (Req 9.2, 9.6)
  const handleConfirmDelete = () => {
    if (deletingRef.current || !isConfirmingDelete) {
      return;
    }

    deletingRef.current = true;
    setDeleteStatus(DELETE_IN_PROGRESS);
    setDeleteNotifications([]);

    deleteMyReview(mediaType, mediaId)
      .then((response) => {
        deletingRef.current = false;

        if (!mountedRef.current) {
          return;
        }

        // Sukses: modal kembali ke form kosong berlabel aksi pembuatan (Req 9.4)
        setDeleteStatus(DELETE_IDLE);
        setExistingReview(null);
        setRating(null);
        setComment('');
        setCommentLimitReached(false);
        setSaveStatus(SAVE_IDLE);
        setSaveNotifications([]);
        setCanRetrySave(false);
        payloadRef.current = null;
        retriesUsedRef.current = 0;
        setDeleteNotifications([
          { id: 'delete-success', tone: 'success', message: DELETE_SUCCESS_MESSAGE },
        ]);

        // Detail_Page memuat ulang Rating_Summary dan daftar review setelah respons 200 (Req 9.4)
        if (typeof onDelete === 'function') {
          onDelete({ mediaType, mediaId }, response);
        }
      })
      .catch((error) => {
        deletingRef.current = false;

        if (!mountedRef.current) {
          return;
        }

        const detailMessage =
          error && typeof error.message === 'string' && error.message.length > 0
            ? error.message
            : null;

        const items = [{ id: 'delete-error', tone: 'error', message: DELETE_FAILED_MESSAGE }];

        if (detailMessage && detailMessage !== DELETE_FAILED_MESSAGE) {
          items.push({ id: 'delete-error-detail', tone: 'error', message: detailMessage });
        }

        // Kegagalan jaringan/500: aksi hapus tetap aktif, rating, komentar, dan
        // Review_Record hasil pramuat dipertahankan (Req 9.8)
        setDeleteStatus(DELETE_FAILED);
        setDeleteNotifications(items.slice(0, MAX_NOTIFICATION_ITEMS));
      });
  };

  // Tombol tutup dan tombol Escape memakai jalur penutupan yang sama (Req 1.5, 1.9)
  const handleClose = closeModal;

  // Aksi ulangi mengirim permintaan pramuat baru untuk kombinasi media yang sama (Req 8.6)
  const handleRetryPreload = () => {
    setPreloadAttempt((attempt) => attempt + 1);
  };

  return (
    <div className="rating-modal-overlay">
      <div
        className="rating-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-modal-title"
        ref={dialogRef}
        tabIndex={-1}
        data-testid="rating-modal-dialog"
      >
        <div className="rating-modal-header">
          {/* Judul Media_Item identik dengan Detail_Page, dipotong bila > 120 karakter (Req 1.4) */}
          <h2 className="rating-modal-title" id="rating-modal-title" title={title}>
            {displayTitle}
          </h2>
          <button
            type="button"
            className="rating-modal-close"
            onClick={handleClose}
            aria-label="Tutup form rating"
          >
            ×
          </button>
        </div>

        <div className="rating-modal-body" data-preload-status={preloadStatus}>
          {/* Indikator proses pada area form selama pramuat berlangsung (Req 8.5) */}
          {isPreloading && (
            <p
              className="rating-modal-preload"
              data-testid="rating-modal-preload-indicator"
              role="status"
            >
              {PRELOAD_LOADING_MESSAGE}…
            </p>
          )}

          <div className="rating-modal-stars-block">
            <span className="rating-modal-label" id="rating-modal-stars-label">
              Rating kamu
            </span>

            {/* Tepat 10 kontrol bintang, urut naik 1..10 (Req 2.1) */}
            <div
              className="rating-modal-stars"
              role="group"
              aria-labelledby="rating-modal-stars-label"
            >
              {RATING_VALUES.map((value) => {
                // Bintang 1..N terpilih, N+1..10 tidak terpilih (Req 2.3)
                const isSelected = isRatingSet && value <= rating;

                return (
                  <button
                    key={value}
                    type="button"
                    className={`rating-modal-star${isSelected ? ' is-selected' : ''}`}
                    onClick={() => handleSelectRating(value)}
                    disabled={isPreloading}
                    aria-pressed={isSelected}
                    aria-label={`Beri rating ${value} dari 10`}
                    data-rating-value={value}
                    data-selected={isSelected ? 'true' : 'false'}
                  >
                    <span aria-hidden="true">{isSelected ? '★' : '☆'}</span>
                  </button>
                );
              })}
            </div>

            {/* Teks `N/10` bila rating aktif ada, penanda tanpa angka bila belum (Req 2.4, 2.5) */}
            <p className="rating-modal-value" data-testid="rating-modal-value" aria-live="polite">
              {isRatingSet ? `${rating}/10` : RATING_UNSET_LABEL}
            </p>
          </div>

          <div className="rating-modal-comment-block">
            <label className="rating-modal-label" htmlFor="rating-modal-comment">
              Komentar (opsional)
            </label>
            {/* Kolom komentar teks bebas 0..1000 karakter (Req 2.6, 2.11) */}
            <textarea
              id="rating-modal-comment"
              className="rating-modal-comment"
              value={comment}
              onChange={handleCommentChange}
              disabled={isPreloading}
              rows={4}
              placeholder="Tulis pendapatmu tentang judul ini"
            />
            {/* Pencacah karakter diperbarui pada setiap perubahan isi (Req 2.8) */}
            <div className="rating-modal-counter-row">
              <span className="rating-modal-counter" data-testid="rating-modal-counter">
                {characterCount}/{COMMENT_MAX_LENGTH} karakter
              </span>
              {commentLimitReached && (
                <span className="rating-modal-counter-limit" data-testid="rating-modal-limit-notice">
                  Batas {COMMENT_MAX_LENGTH} karakter tercapai
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Satu area notifikasi untuk seluruh pesan yang berlaku, maksimal 5 butir (Req 10.8) */}
        {notificationItems.length > 0 && (
          <div
            className="rating-modal-notifications"
            data-testid="rating-modal-notifications"
            role="status"
            aria-live="polite"
          >
            <ul
              className={`rating-modal-notification-list${
                isSuccessArea ? ' is-success' : ''
              }`}
            >
              {notificationItems.map((item) => (
                <li
                  key={item.id}
                  className="rating-modal-notification"
                  data-tone={item.tone}
                  data-testid={item.testId || `rating-modal-notification-${item.tone}`}
                >
                  {item.message}
                  {/* Status 401 disertai tautan ke halaman login (Req 10.7) */}
                  {item.loginLink && (
                    <>
                      {' '}
                      <a
                        className="rating-modal-login-link"
                        href="/login"
                        data-testid="rating-modal-login-link"
                      >
                        {LOGIN_LINK_LABEL}
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Permintaan konfirmasi hapus dengan aksi konfirmasi dan aksi batal (Req 9.6, 9.7) */}
        {(isConfirmingDelete || isDeleting) && (
          <div
            className="rating-modal-delete-confirm"
            data-testid="rating-modal-delete-confirm"
            role="alertdialog"
            aria-label={DELETE_CONFIRM_QUESTION}
          >
            <p className="rating-modal-delete-question">{DELETE_CONFIRM_QUESTION}</p>
            <div className="rating-modal-delete-confirm-actions">
              <button
                type="button"
                className="rating-modal-delete-confirm-yes"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                data-testid="rating-modal-delete-confirm-yes"
              >
                {DELETE_CONFIRM_LABEL}
              </button>
              <button
                type="button"
                className="rating-modal-delete-confirm-no"
                onClick={handleCancelDelete}
                disabled={isDeleting}
                data-testid="rating-modal-delete-confirm-no"
              >
                {DELETE_CANCEL_LABEL}
              </button>
            </div>
            {/* Indikator proses selama permintaan hapus berlangsung */}
            {isDeleting && (
              <span
                className="rating-modal-delete-indicator"
                data-testid="rating-modal-delete-indicator"
                role="status"
              >
                {DELETING_INDICATOR_MESSAGE}…
              </span>
            )}
          </div>
        )}

        <div className="rating-modal-actions">
          {/* Indikator proses pada area tombol simpan (Req 10.1) */}
          {isSaving && (
            <span
              className="rating-modal-save-indicator"
              data-testid="rating-modal-save-indicator"
              role="status"
            >
              {SAVING_INDICATOR_MESSAGE}…
            </span>
          )}

          {isPreloadFailed && (
            <button
              type="button"
              className="rating-modal-retry-preload"
              onClick={handleRetryPreload}
            >
              {PRELOAD_RETRY_LABEL}
            </button>
          )}

          {/* Aksi kirim ulang pada kegagalan jaringan, batas waktu, dan 500–599 (Req 10.5, 10.9) */}
          {canRetrySave && (
            <button
              type="button"
              className="rating-modal-retry-save"
              onClick={handleRetrySave}
              data-testid="rating-modal-save-retry"
            >
              {SAVE_RETRY_LABEL}
            </button>
          )}

          {isDeleteVisible && (
            <button
              type="button"
              className="rating-modal-delete"
              onClick={handleRequestDelete}
              disabled={isDeleteDisabled}
              data-testid="rating-modal-delete"
              data-delete-status={deleteStatus}
            >
              {DELETE_ACTION_LABEL}
            </button>
          )}

          <button
            type="button"
            className="rating-modal-save"
            onClick={handleSave}
            disabled={isSaveDisabled}
            data-testid="rating-modal-save"
            data-action-mode={actionMode}
            data-save-status={saveStatus}
          >
            {saveActionLabel}
          </button>
        </div>
      </div>

      <style>{`
        .rating-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 12, 24, 0.65);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 1rem;
          z-index: 1000;
        }

        .rating-modal {
          width: 100%;
          max-width: 520px;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
          overflow: hidden;
        }

        .rating-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: #fff;
        }

        .rating-modal-title {
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.4;
          margin: 0;
          word-break: break-word;
        }

        .rating-modal-close {
          background: rgba(255, 255, 255, 0.12);
          border: none;
          color: #fff;
          font-size: 1.4rem;
          line-height: 1;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          flex-shrink: 0;
        }

        .rating-modal-close:hover {
          background: rgba(255, 255, 255, 0.24);
        }

        .rating-modal-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .rating-modal-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #444;
          margin-bottom: 0.6rem;
        }

        .rating-modal-stars {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .rating-modal-star {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.6rem;
          line-height: 1;
          padding: 0.15rem 0.2rem;
          color: #c9ccd8;
          transition: transform 0.15s ease, color 0.15s ease;
        }

        .rating-modal-star.is-selected {
          color: #f5a623;
        }

        .rating-modal-star:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .rating-modal-star:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .rating-modal-value {
          margin: 0.6rem 0 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #1a1a2e;
        }

        .rating-modal-comment {
          width: 100%;
          padding: 0.8rem 0.9rem;
          border: 2px solid #e6e6ef;
          border-radius: 12px;
          font-size: 0.95rem;
          font-family: inherit;
          background: #f7f8fc;
          color: #1a1a2e;
          resize: vertical;
        }

        .rating-modal-comment:focus {
          outline: none;
          border-color: #667eea;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
        }

        .rating-modal-comment:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .rating-modal-counter-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-top: 0.45rem;
          font-size: 0.8rem;
          color: #777;
        }

        .rating-modal-counter-limit {
          color: #b71c1c;
          font-weight: 600;
        }

        .rating-modal-preload {
          margin: 0;
          padding: 0.65rem 0.9rem;
          border-radius: 10px;
          background: #eef1ff;
          color: #3b4bb8;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .rating-modal-notifications {
          padding: 0 1.5rem;
        }

        .rating-modal-notification-list {
          list-style: disc;
          margin: 0;
          padding: 0.75rem 0.75rem 0.75rem 1.6rem;
          border-radius: 10px;
          background: #fdecea;
          color: #b71c1c;
          font-size: 0.85rem;
        }

        .rating-modal-notification-list.is-success {
          background: #e8f5e9;
          color: #1b5e20;
        }

        .rating-modal-login-link {
          color: inherit;
          font-weight: 700;
          text-decoration: underline;
        }

        .rating-modal-save-indicator {
          margin-right: auto;
          font-size: 0.85rem;
          font-weight: 600;
          color: #3b4bb8;
        }

        .rating-modal-delete {
          padding: 0.7rem 1.1rem;
          border: 2px solid #e57373;
          border-radius: 12px;
          background: #fff;
          color: #b71c1c;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
        }

        .rating-modal-delete:hover:not(:disabled) {
          background: #fdecea;
        }

        .rating-modal-delete:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .rating-modal-retry-save {
          padding: 0.7rem 1.1rem;
          border: 2px solid #f5a623;
          border-radius: 12px;
          background: #fff;
          color: #a06000;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
        }

        .rating-modal-retry-save:hover {
          background: #fff6e5;
        }

        .rating-modal-retry-preload {
          padding: 0.7rem 1.1rem;
          border: 2px solid #667eea;
          border-radius: 12px;
          background: #fff;
          color: #4b57c4;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
        }

        .rating-modal-retry-preload:hover {
          background: #eef1ff;
        }

        .rating-modal-delete-confirm {
          margin: 0 1.5rem;
          padding: 0.9rem 1rem;
          border: 2px solid #e57373;
          border-radius: 12px;
          background: #fff8f7;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.75rem;
        }

        .rating-modal-delete-question {
          margin: 0;
          flex: 1 1 100%;
          font-size: 0.9rem;
          font-weight: 600;
          color: #b71c1c;
        }

        .rating-modal-delete-confirm-actions {
          display: flex;
          gap: 0.5rem;
        }

        .rating-modal-delete-confirm-yes,
        .rating-modal-delete-confirm-no {
          padding: 0.55rem 0.9rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }

        .rating-modal-delete-confirm-yes {
          border: none;
          background: #b71c1c;
          color: #fff;
        }

        .rating-modal-delete-confirm-no {
          border: 2px solid #c9ccd8;
          background: #fff;
          color: #444;
        }

        .rating-modal-delete-confirm-yes:disabled,
        .rating-modal-delete-confirm-no:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .rating-modal-delete-indicator {
          font-size: 0.85rem;
          font-weight: 600;
          color: #b71c1c;
        }

        .rating-modal-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.75rem;
          padding: 1rem 1.5rem 1.5rem;
        }

        .rating-modal-save {
          padding: 0.75rem 1.4rem;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .rating-modal-save:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .rating-modal-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .rating-modal-star {
            font-size: 1.4rem;
          }

          .rating-modal-actions {
            padding: 1rem 1.15rem 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default RatingModal;
