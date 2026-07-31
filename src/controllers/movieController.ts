import { ModifyMovieTypes, ModifyNowPlayingListTypes, ModifySearchListTypes, MovieCreditTypes } from '../types/modifyMovie';
import dotenv from 'dotenv';
import axios from 'axios';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import sql from '../utils/database';


dotenv.config();

//test
const THEMOVIDB_API_KEY = process.env.THEMOVIDB_API_KEY;
const THEMOVIDB_BASE_URL = process.env.THEMOVIDB_BASE_URL || 'https://api.themoviedb.org/3';

export function modifyMovieResponse(originalData: any): ModifyMovieTypes {
  return {
    id: originalData.id,
    title: originalData.title,
    overview: originalData.overview,
    release_date: originalData.release_date,
    poster_path: originalData.poster_path,
    budget: originalData.budget,
    revenue: originalData.revenue,
    vote_average: originalData.vote_average,
    backdrop_path: originalData.backdrop_path,
    homepage: originalData.homepage,
    tagline: originalData.tagline
  };
}

export function modifyNowPlayingListResponse(originalData: any): ModifyNowPlayingListTypes {
  return {
    id: originalData.id,
    title: originalData.title,
    popularity: originalData.popularity,
    poster_path: originalData.poster_path,
    backdrop_path: originalData.backdrop_path,
    release_date: originalData.release_date
  };
}

export function modifySearchListResponse(originalData: any): ModifySearchListTypes {
  return {
    id: originalData.id,
    title: originalData.title,
    popularity: originalData.popularity,
    poster_path: originalData.poster_path,
    backdrop_path: originalData.backdrop_path,
    media_type: originalData.media_type
  };
}

// Function to modify movie credit response
export function modifyMovieCreditResponse(originalData: any): MovieCreditTypes {
  return {
    id: originalData.id,
    cast: originalData.cast.map((castMember: any) => ({
      id: castMember.id,
      cast_id: castMember.cast_id,
      character: castMember.character,
      name: castMember.name,
      profile_path: castMember.profile_path,
      gender: castMember.gender,
      known_for_department: castMember.known_for_department
    }))
  };
}

// Function to save movie data to database
// rawResponseData adalah data asli dari themoviedb untuk di simpan pada aggregator_response
async function saveMovieToDatabase(movieData: ModifyMovieTypes, rawResponseData: any): Promise<void> {
  try {
    // Check if movie already exists
    const existingMovies = await sql`
      SELECT id, favorite FROM movies WHERE id = ${movieData.id}
    `;

    if (existingMovies.length > 0) {
      const currentFavorite = existingMovies[0].favorite || 0;
      const newFavorite = currentFavorite + 1;

      console.log(`DEBUG: Movie ${movieData.id} exists. Current favorite: ${currentFavorite}`);

      // Update existing movie and increment favorite count
      await sql`
        UPDATE movies 
        SET title = ${movieData.title}, 
            budget = ${movieData.budget}, 
            revenue = ${movieData.revenue}, 
            favorite = favorite + 1, 
            aggregator_response = ${JSON.stringify(rawResponseData)}::jsonb
        WHERE id = ${movieData.id}
      `;
      console.log(`Movie with ID ${movieData.id} updated. Favorite count: ${currentFavorite} → ${newFavorite}`);
    } else {
      console.log(`DEBUG: Movie ${movieData.id} is new. Setting favorite to 1`);

      // Insert new movie with favorite count = 1
      await sql`
        INSERT INTO movies (id, title, budget, revenue, favorite, aggregator_response)
        VALUES (${movieData.id}, ${movieData.title}, ${movieData.budget}, ${movieData.revenue}, 1, ${JSON.stringify(rawResponseData)}::jsonb)
      `;
      console.log(`Movie with ID ${movieData.id} saved to database. Initial favorite count: 1`);
    }
  } catch (error) {
    console.error('Error saving movie to database:', error);
    throw error;
  }
}

export const modifyMovieResponseHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const movieId = req.params.id;

    // Hit third-party API
    const response = await axios.get(`${THEMOVIDB_BASE_URL}/movie/${movieId}`, {
      headers: {
        'Authorization': `Bearer ${THEMOVIDB_API_KEY}`,
        'accept': 'application/json'
      }
    });

    // Modifikasi response
    const modifiedData = modifyMovieResponse(response.data);

    // Save to database
    try {
      //response.data adalah data asli dari themoviedb untuk di simpan pada aggregator_response
      await saveMovieToDatabase(modifiedData, response.data);
    } catch (dbError) {
      console.error('Failed to save movie to database:', dbError);
      // Continue with response even if DB save fails
    }

    res.status(200).json({
      requestId: randomUUID(), // generate unique request ID
      data: modifiedData
    });
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ error: 'Failed to fetch movie data' });
  }
}

export const modifyNowPlayingListResponseHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Hit third-party API now playing
    const response = await axios.get(`${THEMOVIDB_BASE_URL}/movie/now_playing`, {
      headers: {
        'Authorization': `Bearer ${THEMOVIDB_API_KEY}`,
        'accept': 'application/json'
      }
    });

    // Modifikasi response
    const modifiedList = response.data.results.map((movie: any) => modifyNowPlayingListResponse(movie));

    res.status(200).json({
      requestId: randomUUID(), // generate unique request ID
      data: modifiedList
    });
  } catch (error) {
    console.error('Error fetching now playing movies:', error);
    res.status(500).json({ error: 'Failed to fetch now playing movies' });
  }
}

// Function to get favorite movies from database
export const getFavoriteMoviesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get movies ordered by favorite count (descending) and deleted_at is null
    const favoriteMovies = await sql`
      SELECT id, title, budget, revenue, favorite, created_at, updated_at 
      FROM movies 
      WHERE deleted_at IS NULL 
      ORDER BY favorite DESC, created_at DESC
    `;

    res.status(200).json({
      requestId: randomUUID(),
      data: favoriteMovies,
      count: favoriteMovies.length
    });
  } catch (error) {
    console.error('Error fetching favorite movies:', error);
    res.status(500).json({ error: 'Failed to fetch favorite movies' });
  }
}

export const getSearchMoviesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.query as string;
    const page = parseInt(req.query.page as string) || 1;

    // Hit third-party API search
    const response = await axios.get(`${THEMOVIDB_BASE_URL}/search/multi`, {
      headers: {
        'Authorization': `Bearer ${THEMOVIDB_API_KEY}`,
        'accept': 'application/json'
      },
      params: {
        query: query,
        page: page
      }
    });

    // Modifikasi response
    const modifiedList = response.data.results.map((movie: any) => modifySearchListResponse(movie));

    res.status(200).json({
      requestId: randomUUID(),
      data: modifiedList
    });
  } catch (error) {
    console.error('Error fetching search movies:', error);
    res.status(500).json({ error: 'Failed to fetch search movies' });
  }
}

export const modifyMovieCreditResponseHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const movieId = req.params.id;
    const response = await axios.get(`${THEMOVIDB_BASE_URL}/movie/${movieId}/credits`, {
      headers: {
        'Authorization': `Bearer ${THEMOVIDB_API_KEY}`,
        'accept': 'application/json'
      }
    });

    const modifiedData = modifyMovieCreditResponse(response.data);
    console.log(modifiedData);


    res.status(200).json({
      requestId: randomUUID(),
      data: modifiedData
    });
  } catch (error) {
    console.error('Error fetching movie credits:', error);
    res.status(500).json({ error: 'Failed to fetch movie credits' });
  }
}
