// Review service for rating & review API calls
// Using relative base URL to leverage Vite proxy configuration
import { authService } from './authService';

const API_BASE_URL = '/api/reviews';
const REQUEST_TIMEOUT_MS = 10000;

const GENERIC_ERROR_MESSAGE = 'Terjadi kesalahan saat memproses permintaan rating';
const TIMEOUT_ERROR_MESSAGE = 'Permintaan rating melewati batas waktu';
const NETWORK_ERROR_MESSAGE = 'Permintaan rating gagal karena masalah koneksi';

// Error bertanda agar pemanggil dapat membedakan kelas kegagalan (Req 10.3, 10.4, 10.5)
const createServiceError = (message, { status = null, kind = 'http' } = {}) => {
  const error = new Error(message);
  error.name = 'ReviewServiceError';
  error.status = status;
  error.kind = kind;
  return error;
};

const buildMediaQuery = (mediaType, mediaId, extraParams = {}) => {
  const params = new URLSearchParams();
  params.set('media_type', String(mediaType));
  params.set('media_id', String(mediaId));

  Object.keys(extraParams).forEach((key) => {
    const value = extraParams[key];
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });

  return params.toString();
};

const buildHeaders = ({ withAuth = false, withBody = false } = {}) => {
  const headers = {};

  if (withBody) {
    headers['Content-Type'] = 'application/json';
  }

  if (withAuth) {
    const token = authService.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

// Membaca body JSON; mengembalikan null bila body kosong atau tidak dapat diurai (Req 10.4)
const readJsonBody = async (response) => {
  try {
    return await response.json();
  } catch (parseError) {
    return null;
  }
};

const request = async (path, { method = 'GET', withAuth = false, body = null } = {}) => {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: buildHeaders({ withAuth, withBody: body !== null }),
      body: body !== null ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (fetchError) {
    if (timedOut || controller.signal.aborted || fetchError.name === 'AbortError') {
      throw createServiceError(TIMEOUT_ERROR_MESSAGE, { kind: 'timeout' });
    }
    throw createServiceError(NETWORK_ERROR_MESSAGE, { kind: 'network' });
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await readJsonBody(response);

  if (!response.ok) {
    const message =
      data && typeof data.error === 'string' && data.error.length > 0
        ? data.error
        : GENERIC_ERROR_MESSAGE;
    const error = createServiceError(message, { status: response.status, kind: 'http' });
    if (data && Array.isArray(data.details)) {
      error.details = data.details;
    }
    throw error;
  }

  return data;
};

// GET /api/reviews/summary — publik
export const getReviewSummary = async (mediaType, mediaId) =>
  request(`/summary?${buildMediaQuery(mediaType, mediaId)}`);

// GET /api/reviews — publik, dengan paginasi
export const getReviews = async (mediaType, mediaId, limit = 10, offset = 0) =>
  request(`?${buildMediaQuery(mediaType, mediaId, { limit, offset })}`);

// GET /api/reviews/me — terproteksi
export const getMyReview = async (mediaType, mediaId) =>
  request(`/me?${buildMediaQuery(mediaType, mediaId)}`, { withAuth: true });

// POST /api/reviews — terproteksi
export const saveReview = async ({ mediaType, mediaId, rating, comment }) =>
  request('', {
    method: 'POST',
    withAuth: true,
    body: {
      media_type: mediaType,
      media_id: mediaId,
      rating,
      comment: comment === undefined ? null : comment,
    },
  });

// DELETE /api/reviews — terproteksi
export const deleteMyReview = async (mediaType, mediaId) =>
  request(`?${buildMediaQuery(mediaType, mediaId)}`, {
    method: 'DELETE',
    withAuth: true,
  });

export const REVIEW_REQUEST_TIMEOUT_MS = REQUEST_TIMEOUT_MS;
