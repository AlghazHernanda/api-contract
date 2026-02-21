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

export interface ModifyNowPlayingListTypes {
  id: number;
  title: string;
  popularity: number;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
}