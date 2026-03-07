import { Router } from 'express';
import { modifyMovieResponseHandler, modifyNowPlayingListResponseHandler, getFavoriteMoviesHandler, getSearchMoviesHandler } from '../controllers/movieController';

const router = Router();

router.get('/detail/:id', modifyMovieResponseHandler);
router.get('/now_playing', modifyNowPlayingListResponseHandler);
router.get('/showFavoriteMovies', getFavoriteMoviesHandler);
router.get('/search', getSearchMoviesHandler);

export default router;