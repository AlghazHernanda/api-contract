import { Router } from 'express';
import { tvSeriesListResponseHandler } from '../controllers/tvSeriesController';

const router = Router();

router.get('/airing_today', tvSeriesListResponseHandler)

export default router;