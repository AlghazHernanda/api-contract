export interface ModifyMovieTypes {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string;
  budget: number;
  revenue: number;
  custom_fields: {
    rating: number;
    genre: string;
    language: string;
  };
}