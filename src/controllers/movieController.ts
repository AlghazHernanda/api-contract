import { ModifyMovieTypes, ModifyNowPlayingListTypes } from '../types/modifyMovie';
import dotenv from 'dotenv';
import axios from 'axios';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';


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
