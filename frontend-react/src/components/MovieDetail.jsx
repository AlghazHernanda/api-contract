import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovieDetails, getMovieCredits, getPosterUrl, getBackdropUrl, getProfileUrl, formatDate } from '../services/movieService';
import Navbar from './Navbar';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const castScrollRef = React.useRef(null);

  const scrollCastLeft = () => {
    if (castScrollRef.current) {
      castScrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollCastRight = () => {
    if (castScrollRef.current) {
      castScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);
        const [movieResponse, creditsResponse] = await Promise.all([
          getMovieDetails(id),
          getMovieCredits(id)
        ]);
        setMovie(movieResponse.data);
        setCredits(creditsResponse.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch movie details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMovieData();
    }
  }, [id]);

  const goBack = () => {
    navigate('/now-playing');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="md-page">
          <div className="md-loading-card">
            <div className="md-loading-spinner"></div>
            <h3>Loading Movie Details</h3>
            <p>Fetching the latest movie information...</p>
          </div>
        </main>
        <style>{movieDetailStyles}</style>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="md-page">
          <div className="md-error-card">
            <div className="md-error-icon">⚠️</div>
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button className="md-back-btn" onClick={goBack}>← Back to Movies</button>
          </div>
        </main>
        <style>{movieDetailStyles}</style>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="md-page">
        <div className="md-container">
          <button className="md-back-btn md-back-btn-top" onClick={goBack}>
            ← Back to Movies
          </button>

          {movie && (
            <div className="md-card">
              {/* Backdrop */}
              <div className="md-backdrop">
                <img src={getBackdropUrl(movie.backdrop_path)} alt={movie.title} />
                <div className="md-backdrop-overlay"></div>
                <div className="md-backdrop-title">
                  <h1>{movie.title}</h1>
                  {movie.tagline && <p className="md-tagline">"{movie.tagline}"</p>}
                </div>
              </div>

              {/* Content */}
              <div className="md-content">
                {/* Poster */}
                <div className="md-poster">
                  <img src={getPosterUrl(movie.poster_path)} alt={movie.title} />
                </div>

                {/* Details */}
                <div className="md-details">
                  {movie.overview && (
                    <div className="md-overview">
                      <div className="md-section-head">
                        <span className="md-section-icon">📄</span>
                        <h2>Overview</h2>
                      </div>
                      <p>&ldquo;{movie.overview}&rdquo;</p>
                    </div>
                  )}

                  <div className="md-info-grid">
                    {movie.release_date && (
                      <div className="md-info-item">
                        <span className="md-info-label">Release Date</span>
                        <span className="md-info-value">{formatDate(movie.release_date)}</span>
                      </div>
                    )}
                    {movie.popularity != null && (
                      <div className="md-info-item">
                        <span className="md-info-label">Popularity</span>
                        <span className="md-info-value">{Math.round(movie.popularity)}</span>
                      </div>
                    )}
                    {movie.budget > 0 && (
                      <div className="md-info-item">
                        <span className="md-info-label">Budget</span>
                        <span className="md-info-value">${movie.budget.toLocaleString()}</span>
                      </div>
                    )}
                    {movie.revenue > 0 && (
                      <div className="md-info-item">
                        <span className="md-info-label">Revenue</span>
                        <span className="md-info-value">${movie.revenue.toLocaleString()}</span>
                      </div>
                    )}
                    {movie.homepage && movie.homepage.trim() !== '' && (
                      <div className="md-info-item md-info-full">
                        <span className="md-info-label">Homepage</span>
                        <a href={movie.homepage} target="_blank" rel="noopener noreferrer" className="md-info-link">
                          {movie.homepage}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cast */}
          {credits && credits.cast && credits.cast.length > 0 && (
            <div className="md-cast-card">
              <div className="md-cast-head">
                <span className="md-section-icon md-section-icon-dark">👥</span>
                <h2>Cast</h2>
              </div>

              <div className="md-cast-slider-wrap">
                <button className="md-scroll-btn md-scroll-left" onClick={scrollCastLeft} aria-label="Scroll left">
                  ‹
                </button>
                <button className="md-scroll-btn md-scroll-right" onClick={scrollCastRight} aria-label="Scroll right">
                  ›
                </button>

                <div className="md-cast-scroll" ref={castScrollRef}>
                  {credits.cast.map((castMember) => (
                    <div key={castMember.id} className="md-cast-item">
                      <img src={getProfileUrl(castMember.profile_path)} alt={castMember.name} />
                      <h4>{castMember.name}</h4>
                      <p>{castMember.character}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md-cast-count">
                Total {credits.cast.length} cast members
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{movieDetailStyles}</style>
    </>
  );
};

const movieDetailStyles = `
  .md-page {
    min-height: calc(100vh - 70px);
    padding: 2rem 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6b8dd6 100%);
    background-size: 200% 200%;
    animation: mdGradient 12s ease infinite;
  }

  @keyframes mdGradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .md-container {
    max-width: 1000px;
    margin: 0 auto;
  }

  /* Back button */
  .md-back-btn {
    padding: 0.7rem 1.5rem;
    border: none;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.25);
  }

  .md-back-btn:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
  }

  .md-back-btn-top {
    margin-bottom: 1.2rem;
  }

  /* Main card */
  .md-card {
    background: #fff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  }

  /* Backdrop */
  .md-backdrop {
    position: relative;
    height: 400px;
  }

  .md-backdrop img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .md-backdrop-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 75%;
    background: linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 45%, transparent 100%);
  }

  .md-backdrop-title {
    position: absolute;
    bottom: 2rem;
    left: 2rem;
    right: 2rem;
    color: #fff;
    z-index: 2;
  }

  .md-backdrop-title h1 {
    margin: 0 0 0.5rem;
    font-size: 2.5rem;
    font-weight: 700;
    text-shadow: 2px 2px 8px rgba(0,0,0,0.6);
    line-height: 1.2;
  }

  .md-tagline {
    font-style: italic;
    font-size: 1.15rem;
    margin: 0;
    opacity: 0.9;
    text-shadow: 1px 1px 4px rgba(0,0,0,0.6);
  }

  /* Content */
  .md-content {
    padding: 2rem;
    display: flex;
    gap: 2rem;
  }

  .md-poster {
    flex: 0 0 260px;
  }

  .md-poster img {
    width: 100%;
    border-radius: 14px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
    border: 4px solid #fff;
    margin-top: -80px;
    position: relative;
    z-index: 3;
  }

  .md-details {
    flex: 1;
    min-width: 0;
  }

  /* Overview */
  .md-overview {
    margin-bottom: 1.5rem;
    background: #f7f8fc;
    border-radius: 14px;
    padding: 1.5rem;
    border-left: 4px solid #667eea;
  }

  .md-section-head {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    margin-bottom: 1rem;
  }

  .md-section-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(102, 126, 234, 0.12);
    border-radius: 10px;
    font-size: 1.1rem;
  }

  .md-section-icon-dark {
    background: rgba(255, 255, 255, 0.15);
  }

  .md-section-head h2 {
    margin: 0;
    font-size: 1.4rem;
    color: #1a1a2e;
    font-weight: 700;
  }

  .md-overview p {
    line-height: 1.8;
    font-size: 1rem;
    color: #495057;
    margin: 0;
    text-align: justify;
  }

  /* Info grid */
  .md-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .md-info-item {
    background: #f7f8fc;
    padding: 1.1rem;
    border-radius: 12px;
    border: 1px solid #eef0f6;
    display: flex;
    flex-direction: column;
    transition: all 0.2s ease;
  }

  .md-info-item:hover {
    background: #f0f2ff;
    border-color: #d8dbf5;
    transform: translateY(-1px);
  }

  .md-info-full {
    grid-column: 1 / -1;
  }

  .md-info-label {
    font-size: 0.72rem;
    color: #667eea;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 700;
    margin-bottom: 0.4rem;
  }

  .md-info-value {
    font-size: 1.05rem;
    font-weight: 600;
    color: #212529;
  }

  .md-info-link {
    color: #667eea;
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 500;
    word-break: break-all;
  }

  .md-info-link:hover {
    text-decoration: underline;
  }

  /* Cast */
  .md-cast-card {
    margin-top: 2rem;
    background: #fff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  }

  .md-cast-head {
    padding: 1.3rem 2rem;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }

  .md-cast-head h2 {
    margin: 0;
    font-size: 1.4rem;
    color: #fff;
    font-weight: 700;
  }

  .md-cast-slider-wrap {
    position: relative;
    padding: 1.5rem 1rem;
  }

  .md-scroll-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border: none;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    z-index: 10;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
    transition: all 0.25s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .md-scroll-btn:hover {
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
  }

  .md-scroll-left { left: 4px; }
  .md-scroll-right { right: 4px; }

  .md-cast-scroll {
    display: flex;
    gap: 1.2rem;
    overflow-x: auto;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding: 0.5rem 2.5rem;
  }

  .md-cast-scroll::-webkit-scrollbar {
    display: none;
  }

  .md-cast-item {
    flex: 0 0 140px;
    text-align: center;
    background: #f7f8fc;
    border-radius: 12px;
    padding: 0.6rem;
    border: 1px solid #eef0f6;
    transition: all 0.25s ease;
    cursor: pointer;
  }

  .md-cast-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }

  .md-cast-item img {
    width: 100%;
    height: 190px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 0.6rem;
    border: 2px solid #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  .md-cast-item h4 {
    margin: 0 0 0.2rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: #1a1a2e;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .md-cast-item p {
    margin: 0;
    font-size: 0.8rem;
    color: #667eea;
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .md-cast-count {
    text-align: center;
    margin: 0 2rem 1.5rem;
    padding: 0.7rem;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 10px;
    color: #667eea;
    font-size: 0.85rem;
    font-weight: 600;
  }

  /* Loading */
  .md-loading-card, .md-error-card {
    background: #fff;
    border-radius: 20px;
    padding: 4rem 2rem;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    max-width: 450px;
    margin: 3rem auto 0;
  }

  .md-loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #eef0f6;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: mdSpin 0.8s linear infinite;
    margin: 0 auto 1.5rem;
  }

  @keyframes mdSpin {
    to { transform: rotate(360deg); }
  }

  .md-loading-card h3, .md-error-card h2 {
    color: #1a1a2e;
    margin: 0 0 0.5rem;
  }

  .md-loading-card p, .md-error-card p {
    color: #888;
    margin: 0 0 1.5rem;
    font-size: 0.9rem;
  }

  .md-error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  /* Tablet */
  @media (max-width: 768px) {
    .md-backdrop {
      height: 260px;
    }

    .md-backdrop-title {
      left: 1.2rem;
      right: 1.2rem;
      bottom: 1.2rem;
    }

    .md-backdrop-title h1 {
      font-size: 1.7rem;
    }

    .md-tagline {
      font-size: 1rem;
    }

    .md-content {
      flex-direction: column;
      padding: 1.5rem;
      gap: 1rem;
    }

    .md-poster {
      flex: none;
      max-width: 180px;
      margin: -70px auto 0;
    }

    .md-poster img {
      margin-top: 0;
    }
  }

  @media (max-width: 480px) {
    .md-page {
      padding: 1rem 0.75rem;
    }

    .md-backdrop {
      height: 200px;
    }

    .md-backdrop-title h1 {
      font-size: 1.4rem;
    }

    .md-content {
      padding: 1.2rem;
    }

    .md-info-grid {
      grid-template-columns: 1fr;
    }

    .md-cast-head, .md-cast-count {
      margin-left: 1rem;
      margin-right: 1rem;
    }

    .md-cast-scroll {
      padding: 0.5rem 1rem;
    }
  }
`;

export default MovieDetail;
