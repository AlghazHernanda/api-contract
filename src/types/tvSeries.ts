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