export interface tvSeriesListTypes {
  id: number;
  name: string;
  popularity: number;
  poster_path?: string;
  backdrop_path?: string;
  first_air_date?: string;
}

export interface tvSeriesDetailTypes {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string;
  backdrop_path: string;
  homepage?: string;
  tagline?: string;
}

export interface tvSeriesCreditTypes {
  cast: Array<{
    id: number;
    credit_id: number;
    character: string;
    name: string;
    profile_path: string;
    gender: number;
    known_for_department: string;
  }>;
}