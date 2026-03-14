import dotenv from 'dotenv';
import { tvSeriesCreditTypes, tvSeriesDetailTypes, tvSeriesListTypes } from '../types/tvSeries';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { MovieCreditTypes } from '../types/modifyMovie';
dotenv.config();

//get env key
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

export function modifyTvSeriesCreditResponse(originalData: any): tvSeriesCreditTypes {
    return {
        cast: originalData.cast.map((castMember: any) => ({
            id: castMember.id,
            credit_id: castMember.credit_id,
            character: castMember.character,
            name: castMember.name,
            profile_path: castMember.profile_path,
            gender: castMember.gender,
            known_for_department: castMember.known_for_department
        }))
    };
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

export const modifyTvSeriesCreditResponseHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const tvSeriesId = req.params.id;
        const response = await axios.get(`${THEMOVIDB_BASE_URL}/tv/${tvSeriesId}/credits`, {
            headers: {
                'Authorization': `Bearer ${THEMOVIDB_API_KEY}`,
                'accept': 'application/json'
            }
        });

        const modifiedData = modifyTvSeriesCreditResponse(response.data);
        console.log(modifiedData);


        res.status(200).json({
            requestId: randomUUID(),
            data: modifiedData
        });
    } catch (error) {
        console.error('Error fetching TV series credits:', error);
        res.status(500).json({ error: 'Failed to fetch TV series credits' });
    }
}
