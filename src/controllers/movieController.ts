import { ModifyMovieTypes } from '../types/modifyMovie';
import dotenv from 'dotenv';
import axios from 'axios';
import { Request, Response } from 'express';


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
    revenue: originalData.revenue,
    custom_fields: {
      rating: Math.floor(Math.random() * 10) + 1,
      genre: "Modified Genre",
      language: "ID"
    }
  };
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
    
    res.json(modifiedData);
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ error: 'Failed to fetch movie data' });
  }
}
