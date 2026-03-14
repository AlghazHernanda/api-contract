import { Router } from 'express';
import { modifyTvSeriesCreditResponseHandler, tvSeriesDetailResponseHandler, tvSeriesListResponseHandler } from '../controllers/tvSeriesController';

const router = Router();

router.get('/airing_today', tvSeriesListResponseHandler)
router.get('/detail/:id', tvSeriesDetailResponseHandler);
router.get('/detail/:id/credits', modifyTvSeriesCreditResponseHandler);

export default router;