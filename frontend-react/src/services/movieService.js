// Movie service for handling movie-related API calls
// Using relative path to leverage Vite proxy configuration
const API_BASE_URL = '/api';

// Fetch now playing movies
export const getNowPlayingMovies = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/movie_core/now_playing`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching now playing movies:', error);
    throw error;
  }
};

// Get movie poster URL
export const getPosterUrl = (posterPath, size = 'w500') => {
  if (!posterPath) return 'https://via.placeholder.com/500x750?text=No+Poster';
  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
};

// Get backdrop URL
export const getBackdropUrl = (backdropPath, size = 'w1280') => {
  if (!backdropPath) return 'https://via.placeholder.com/1280x720?text=No+Backdrop';
  return `https://image.tmdb.org/t/p/${size}${backdropPath}`;
};

// Fetch movie details
export const getMovieDetails = async (movieId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/movie_core/detail/${movieId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching movie details:', error);
    throw error;
  }
};

// Format release date
export const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};