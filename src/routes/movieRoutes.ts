import { Router } from 'express';
import { modifyMovieResponseHandler, modifyNowPlayingListResponseHandler, getFavoriteMoviesHandler } from '../controllers/movieController';

const router = Router();

router.get('/detail/:id', modifyMovieResponseHandler);
router.get('/now_playing', modifyNowPlayingListResponseHandler);
router.get('/showFavoriteMovies', getFavoriteMoviesHandler);

export default router;