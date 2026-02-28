import dotenv from 'dotenv';
import { tvSeriesDetailTypes, tvSeriesListTypes } from '../types/tvSeries';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
dotenv.config();

const THEMOVIDB_API_KEY = process.env.THEMOVIDB_API_KEY;
const THEMOVIDB_BASE_URL = process.env.THEMOVIDB_BASE_URL || 'https://api.themoviedb.org/3';

//mapping data for list tv
export function modifyTvSeriesListResponse(originalData: any): tvSeriesListTypes {
    return {
        id: originalData.id,
        name: originalData.name,
        popularity: originalData.popularity,
        poster_path: originalData.poster_path,
        backdrop_path: originalData.backdrop_path,
        first_air_date: originalData.first_air_date
    };
}

//mapping data
export function modifyTvSeriesDetailResponse(originalData: any): tvSeriesDetailTypes {
    return {
        id: originalData.id,
        name: originalData.name,
        overview: originalData.overview,
        first_air_date: originalData.first_air_date,
        poster_path: originalData.poster_path,
        backdrop_path: originalData.backdrop_path,
        homepage: originalData.homepage,
        tagline: originalData.tagline
    }
}

//wrapper tvSeries list
export const tvSeriesListResponseHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const response = await axios.get(`${THEMOVIDB_BASE_URL}/tv/airing_today`, {
            headers: {
                'Authorization': `Bearer ${THEMOVIDB_API_KEY}`,
                'accept': 'application/json'
            }
        });
        const modifiedList = response.data.results.map((tvSeries: any) => modifyTvSeriesListResponse(tvSeries));
        res.status(200).json({
            requestId: randomUUID(),
            data: modifiedList
        });
    }
    catch (error) {
        console.error('Error fetching TV series:', error);
        res.status(500).json({ error: 'Failed to fetch TV series data' });
    }
}

//tv series detail
export const tvSeriesDetailResponseHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const tvSeriesId = req.params.id;
        const response = await axios.get(`${THEMOVIDB_BASE_URL}/tv/${tvSeriesId}`, {
            headers: {
                'Authorization': `Bearer ${THEMOVIDB_API_KEY}`,
                'accept': 'application/json'
            }
        });
        const modifiedData = modifyTvSeriesDetailResponse(response.data);
        res.status(200).json({
            requestId: randomUUID(),
            data: modifiedData
        });
    }
    catch (error) {
        console.error('Error fetching TV series details:', error);
        res.status(500).json({ error: 'Failed to fetch TV series data' });
    }
}
