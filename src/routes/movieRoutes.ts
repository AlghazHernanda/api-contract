import { Router } from 'express';
import { modifyMovieResponseHandler, modifyNowPlayingListResponseHandler } from '../controllers/movieController';

const router = Router();

router.get('/detail/:id', modifyMovieResponseHandler);
router.get('/now_playing', modifyNowPlayingListResponseHandler);

export default router;