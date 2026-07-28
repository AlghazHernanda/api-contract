import React, { useState, useEffect } from 'react';
import { getNowPlayingMovies, getPosterUrl, formatDate } from '../services/movieService';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const NowPlaying = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await getNowPlayingMovies();
        setMovies(response.data || []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch now playing movies. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const navigate = useNavigate();

  const handleMovieClick = (movie) => {
    navigate(`/movie/${movie.id}`);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="np-page">
          <div className="np-loading-card">
            <div className="np-spinner"></div>
            <h3>Loading Movies</h3>
            <p>Fetching the latest now playing movies...</p>
          </div>
        </main>
        <style>{npStyles}</style>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="np-page">
          <div className="np-error-card">
            <div className="np-error-icon">⚠️</div>
            <h2>Error</h2>
            <p>{error}</p>
            <button className="np-retry-btn" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        </main>
        <style>{npStyles}</style>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="np-page">
        <h1 className="np-title">Now Playing Movies</h1>

        {movies.length === 0 ? (
          <div className="np-error-card">
            <h2>No Movies Available</h2>
            <p>There are currently no movies playing in theaters.</p>
          </div>
        ) : (
          <div className="np-grid">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="np-card"
                onClick={() => handleMovieClick(movie)}
              >
                <div className="np-card-poster">
                  <img src={getPosterUrl(movie.poster_path)} alt={movie.title} />
                  <div className="np-card-overlay">
                    <span className="np-card-view">View Details</span>
                  </div>
                </div>
                <div className="np-card-info">
                  <h3>{movie.title}</h3>
                  <div className="np-card-meta">
                    <span className="np-card-date">{formatDate(movie.release_date)}</span>
                    <span className="np-card-pop">⭐ {Math.round(movie.popularity)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <style>{npStyles}</style>
    </>
  );
};

const npStyles = `
  .np-page {
    min-height: calc(100vh - 70px);
    padding: 2rem 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6b8dd6 100%);
    background-size: 200% 200%;
    animation: npGradient 12s ease infinite;
  }

  @keyframes npGradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .np-title {
    text-align: center;
    color: #fff;
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 2rem;
    text-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }

  .np-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1.2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .np-card {
    background: #fff;
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  .np-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 35px rgba(0, 0, 0, 0.35);
  }

  .np-card-poster {
    position: relative;
    padding-bottom: 150%;
    overflow: hidden;
  }

  .np-card-poster img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .np-card:hover .np-card-poster img {
    transform: scale(1.05);
  }

  .np-card-overlay {
    position: absolute;
    inset: 0;
    background: rgba(26, 26, 46, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .np-card:hover .np-card-overlay {
    opacity: 1;
  }

  .np-card-view {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
    padding: 0.6rem 1.2rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .np-card-info {
    padding: 0.9rem;
  }

  .np-card-info h3 {
    margin: 0 0 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: #1a1a2e;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .np-card-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.3rem;
  }

  .np-card-date {
    font-size: 0.75rem;
    color: #888;
  }

  .np-card-pop {
    font-size: 0.72rem;
    color: #667eea;
    font-weight: 600;
    background: rgba(102, 126, 234, 0.1);
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
  }

  /* Loading & Error */
  .np-loading-card, .np-error-card {
    background: #fff;
    border-radius: 20px;
    padding: 4rem 2rem;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    max-width: 420px;
    margin: 3rem auto 0;
  }

  .np-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #eef0f6;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: npSpin 0.8s linear infinite;
    margin: 0 auto 1.5rem;
  }

  @keyframes npSpin {
    to { transform: rotate(360deg); }
  }

  .np-loading-card h3, .np-error-card h2 {
    color: #1a1a2e;
    margin: 0 0 0.5rem;
  }

  .np-loading-card p, .np-error-card p {
    color: #888;
    margin: 0 0 1.5rem;
    font-size: 0.9rem;
  }

  .np-error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .np-retry-btn {
    padding: 0.7rem 1.8rem;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
  }

  .np-retry-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .np-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
    }

    .np-title {
      font-size: 1.6rem;
    }
  }

  @media (max-width: 480px) {
    .np-page {
      padding: 1.5rem 0.75rem;
    }

    .np-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.8rem;
    }

    .np-title {
      font-size: 1.4rem;
      margin-bottom: 1.5rem;
    }

    .np-card-info {
      padding: 0.7rem;
    }

    .np-card-info h3 {
      font-size: 0.82rem;
    }
  }
`;

export default NowPlaying;
