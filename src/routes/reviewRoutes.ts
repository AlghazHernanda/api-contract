import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  upsertReviewHandler,
  getMyReviewHandler,
  getRatingSummaryHandler,
  getReviewListHandler,
  deleteMyReviewHandler,
  deleteReviewByIdHandler
} from '../controllers/reviewController';

const router = Router();

// Endpoint publik (baca): response identik dengan maupun tanpa header Authorization (Req 4.4)
router.get('/summary', getRatingSummaryHandler);
router.get('/', getReviewListHandler);

// Endpoint terproteksi: authenticateToken dijalankan sebelum handler (Req 4.1)
router.get('/me', authenticateToken, getMyReviewHandler);
router.post('/', authenticateToken, upsertReviewHandler);
router.delete('/', authenticateToken, deleteMyReviewHandler);
// '/summary' dan '/me' terdaftar lebih dulu agar tidak tertangkap route parameter '/:id'
router.delete('/:id', authenticateToken, deleteReviewByIdHandler);

export default router;
