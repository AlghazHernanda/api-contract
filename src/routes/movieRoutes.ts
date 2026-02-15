import { Router } from 'express';
import { modifyMovieResponseHandler } from '../controllers/movieController';

const router = Router();

router.get('/movie_core/:id', modifyMovieResponseHandler);

export default router;