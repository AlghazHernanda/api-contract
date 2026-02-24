import { Router } from 'express';
import { tvSeriesDetailResponseHandler, tvSeriesListResponseHandler } from '../controllers/tvSeriesController';

const router = Router();

router.get('/airing_today', tvSeriesListResponseHandler)
router.get('/detail/:id', tvSeriesDetailResponseHandler);

export default router;