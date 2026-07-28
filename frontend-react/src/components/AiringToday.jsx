import React, { useState, useEffect } from 'react';
import { getAiringTodayTVSeries, getPosterUrl, formatDate } from '../services/movieService';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const AiringToday = () => {
  const [tvSeries, setTvSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTVSeries = async () => {
      try {
        setLoading(true);
        const response = await getAiringTodayTVSeries();
        setTvSeries(response.data || []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch TV series airing today. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTVSeries();
  }, []);

  const navigate = useNavigate();

  const handleSeriesClick = (series) => {
    navigate(`/tv/${series.id}`);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="at-page">
          <div className="at-loading-card">
            <div className="at-spinner"></div>
            <h3>Loading TV Series</h3>
            <p>Fetching today's airing TV series...</p>
          </div>
        </main>
        <style>{atStyles}</style>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="at-page">
          <div className="at-error-card">
            <div className="at-error-icon">⚠️</div>
            <h2>Error</h2>
            <p>{error}</p>
            <button className="at-retry-btn" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        </main>
        <style>{atStyles}</style>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="at-page">
        <h1 className="at-title">TV Series Airing Today</h1>

        {tvSeries.length === 0 ? (
          <div className="at-error-card">
            <h2>No TV Series Available</h2>
            <p>There are currently no TV series airing today.</p>
          </div>
        ) : (
          <div className="at-grid">
            {tvSeries.map((series) => (
              <div
                key={series.id}
                className="at-card"
                onClick={() => handleSeriesClick(series)}
              >
                <div className="at-card-poster">
                  <img src={getPosterUrl(series.poster_path)} alt={series.name} />
                  <div className="at-card-overlay">
                    <span className="at-card-view">View Details</span>
                  </div>
                </div>
                <div className="at-card-info">
                  <h3>{series.name}</h3>
                  <div className="at-card-meta">
                    <span className="at-card-date">{formatDate(series.first_air_date)}</span>
                    <span className="at-card-pop">⭐ {Math.round(series.popularity)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <style>{atStyles}</style>
    </>
  );
};

const atStyles = `
  .at-page {
    min-height: calc(100vh - 70px);
    padding: 2rem 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6b8dd6 100%);
    background-size: 200% 200%;
    animation: atGradient 12s ease infinite;
  }

  @keyframes atGradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .at-title {
    text-align: center;
    color: #fff;
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 2rem;
    text-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }

  .at-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1.2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .at-card {
    background: #fff;
    border-radius: 14px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  .at-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 35px rgba(0, 0, 0, 0.35);
  }

  .at-card-poster {
    position: relative;
    padding-bottom: 150%;
    overflow: hidden;
  }

  .at-card-poster img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .at-card:hover .at-card-poster img {
    transform: scale(1.05);
  }

  .at-card-overlay {
    position: absolute;
    inset: 0;
    background: rgba(26, 26, 46, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .at-card:hover .at-card-overlay {
    opacity: 1;
  }

  .at-card-view {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
    padding: 0.6rem 1.2rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.3px;
  }

  .at-card-info {
    padding: 0.9rem;
  }

  .at-card-info h3 {
    margin: 0 0 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: #1a1a2e;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .at-card-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.3rem;
  }

  .at-card-date {
    font-size: 0.75rem;
    color: #888;
  }

  .at-card-pop {
    font-size: 0.72rem;
    color: #667eea;
    font-weight: 600;
    background: rgba(102, 126, 234, 0.1);
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
  }

  /* Loading & Error */
  .at-loading-card, .at-error-card {
    background: #fff;
    border-radius: 20px;
    padding: 4rem 2rem;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    max-width: 420px;
    margin: 3rem auto 0;
  }

  .at-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #eef0f6;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: atSpin 0.8s linear infinite;
    margin: 0 auto 1.5rem;
  }

  @keyframes atSpin {
    to { transform: rotate(360deg); }
  }

  .at-loading-card h3, .at-error-card h2 {
    color: #1a1a2e;
    margin: 0 0 0.5rem;
  }

  .at-loading-card p, .at-error-card p {
    color: #888;
    margin: 0 0 1.5rem;
    font-size: 0.9rem;
  }

  .at-error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .at-retry-btn {
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

  .at-retry-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .at-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
    }

    .at-title {
      font-size: 1.6rem;
    }
  }

  @media (max-width: 480px) {
    .at-page {
      padding: 1.5rem 0.75rem;
    }

    .at-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.8rem;
    }

    .at-title {
      font-size: 1.4rem;
      margin-bottom: 1.5rem;
    }

    .at-card-info {
      padding: 0.7rem;
    }

    .at-card-info h3 {
      font-size: 0.82rem;
    }
  }
`;

export default AiringToday;
