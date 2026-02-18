import { ModifyMovieTypes, ModifyNowPlayingListTypes } from '../types/modifyMovie';
import dotenv from 'dotenv';
import axios from 'axios';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { pool } from '../utils/database';


dotenv.config();

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
    revenue: originalData.revenue
    // custom_fields: {
    //   rating: Math.floor(Math.random() * 10) + 1,
    //   genre: "Modified Genre",
    //   language: "ID"
    // }
  };
}

export function modifyNowPlayingListResponse(originalData: any): ModifyNowPlayingListTypes {
  return {
    id: originalData.id,
    title: originalData.title,
    popularity: originalData.popularity
  };
}

// Function to save movie data to database
async function saveMovieToDatabase(movieData: ModifyMovieTypes): Promise<void> {
  try {
    const connection = await pool.getConnection();
    
    // Check if movie already exists
    const [existingMovies] = await connection.query(
      'SELECT id FROM movies WHERE id = ?',
      [movieData.id]
    );
    
    if (Array.isArray(existingMovies) && existingMovies.length > 0) {
      // Update existing movie
      await connection.query(
        'UPDATE movies SET title = ?, budget = ?, revenue = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [movieData.title, movieData.budget, movieData.revenue, movieData.id]
      );
      console.log(`Movie with ID ${movieData.id} updated in database`);
    } else {
      // Insert new movie
      await connection.query(
        'INSERT INTO movies (id, title, budget, revenue) VALUES (?, ?, ?, ?)',
        [movieData.id, movieData.title, movieData.budget, movieData.revenue]
      );
      console.log(`Movie with ID ${movieData.id} saved to database`);
    }
    
    connection.release();
  } catch (error) {
    console.error('Error saving movie to database:', error);
    throw error;
  }
}

export const modifyMovieResponseHandler= async (req: Request, res: Response): Promise<void> => {
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
      await saveMovieToDatabase(modifiedData);
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
