export interface ModifyMovieTypes {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  budget: number;
  revenue: number;
  backdrop_path?: string;
  homepage?: string;
  tagline?: string;

  // custom_fields: {
  //   rating: number;
  //   genre: string;
  //   language: string;
  // };
}

//interface untuk list now playing
export interface ModifyNowPlayingListTypes {
  id: number;
  title: string;
  popularity: number;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
}

export interface ModifySearchListTypes {
  id: number;
  title: string;
  popularity: number;
  poster_path?: string;
  backdrop_path?: string;
  media_type?: string;
}

export interface MovieCreditTypes {
  id: number;
  cast: Array<{
    id: number;
    cast_id: number;
    character: string;
    name: string;
    profile_path: string;
    gender: number;
    known_for_department: string;
  }>;
}