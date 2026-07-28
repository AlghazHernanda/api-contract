import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTVSeriesDetails, getTVSeriesCredits, getPosterUrl, getBackdropUrl, getProfileUrl, formatDate } from '../services/movieService';
import Navbar from './Navbar';

const TvSeriesDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tvSeries, setTvSeries] = useState(null);
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
    const fetchTVSeriesData = async () => {
      try {
        setLoading(true);
        const [tvSeriesResponse, creditsResponse] = await Promise.all([
          getTVSeriesDetails(id),
          getTVSeriesCredits(id)
        ]);
        setTvSeries(tvSeriesResponse.data);
        setCredits(creditsResponse.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch TV series details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTVSeriesData();
    }
  }, [id]);

  const goBack = () => {
    navigate('/airing-today');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="td-page">
          <div className="td-loading-card">
            <div className="td-spinner"></div>
            <h3>Loading TV Series Details</h3>
            <p>Fetching the latest information...</p>
          </div>
        </main>
        <style>{tvDetailStyles}</style>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="td-page">
          <div className="td-error-card">
            <div className="td-error-icon">⚠️</div>
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button className="td-back-btn" onClick={goBack}>← Back to TV Series</button>
          </div>
        </main>
        <style>{tvDetailStyles}</style>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="td-page">
        <div className="td-container">
          <button className="td-back-btn td-back-btn-top" onClick={goBack}>
            ← Back to TV Series
          </button>

          {tvSeries && (
            <div className="td-card">
              {/* Backdrop */}
              <div className="td-backdrop">
                <img src={getBackdropUrl(tvSeries.backdrop_path)} alt={tvSeries.name} />
                <div className="td-backdrop-overlay"></div>
                <div className="td-backdrop-title">
                  <h1>{tvSeries.name}</h1>
                  {tvSeries.tagline && <p className="td-tagline">"{tvSeries.tagline}"</p>}
                </div>
              </div>

              {/* Content */}
              <div className="td-content">
                <div className="td-poster">
                  <img src={getPosterUrl(tvSeries.poster_path)} alt={tvSeries.name} />
                </div>

                <div className="td-details">
                  {tvSeries.overview && (
                    <div className="td-overview">
                      <div className="td-section-head">
                        <span className="td-section-icon">📄</span>
                        <h2>Overview</h2>
                      </div>
                      <p>&ldquo;{tvSeries.overview}&rdquo;</p>
                    </div>
                  )}

                  <div className="td-info-grid">
                    {tvSeries.first_air_date && (
                      <div className="td-info-item">
                        <span className="td-info-label">First Air Date</span>
                        <span className="td-info-value">{formatDate(tvSeries.first_air_date)}</span>
                      </div>
                    )}
                    {tvSeries.popularity != null && (
                      <div className="td-info-item">
                        <span className="td-info-label">Popularity</span>
                        <span className="td-info-value">{Math.round(tvSeries.popularity)}</span>
                      </div>
                    )}
                    {tvSeries.homepage && tvSeries.homepage.trim() !== '' && (
                      <div className="td-info-item td-info-full">
                        <span className="td-info-label">Homepage</span>
                        <a href={tvSeries.homepage} target="_blank" rel="noopener noreferrer" className="td-info-link">
                          {tvSeries.homepage}
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
            <div className="td-cast-card">
              <div className="td-cast-head">
                <span className="td-section-icon td-section-icon-dark">👥</span>
                <h2>Cast</h2>
              </div>

              <div className="td-cast-slider-wrap">
                <button className="td-scroll-btn td-scroll-left" onClick={scrollCastLeft} aria-label="Scroll left">
                  ‹
                </button>
                <button className="td-scroll-btn td-scroll-right" onClick={scrollCastRight} aria-label="Scroll right">
                  ›
                </button>

                <div className="td-cast-scroll" ref={castScrollRef}>
                  {credits.cast.map((castMember, index) => (
                    <div key={castMember.credit_id || `${castMember.id}-${index}`} className="td-cast-item">
                      <img src={getProfileUrl(castMember.profile_path)} alt={castMember.name} />
                      <h4>{castMember.name}</h4>
                      <p>{castMember.character}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="td-cast-count">
                Total {credits.cast.length} cast members
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{tvDetailStyles}</style>
    </>
  );
};

const tvDetailStyles = `
  .td-page {
    min-height: calc(100vh - 70px);
    padding: 2rem 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6b8dd6 100%);
    background-size: 200% 200%;
    animation: tdGradient 12s ease infinite;
  }

  @keyframes tdGradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .td-container {
    max-width: 1000px;
    margin: 0 auto;
  }

  /* Back button */
  .td-back-btn {
    padding: 0.7rem 1.5rem;
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

  .td-back-btn:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
  }

  .td-back-btn-top {
    margin-bottom: 1.2rem;
  }

  /* Main card */
  .td-card {
    background: #fff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  }

  /* Backdrop */
  .td-backdrop {
    position: relative;
    height: 400px;
  }

  .td-backdrop img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .td-backdrop-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 75%;
    background: linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 45%, transparent 100%);
  }

  .td-backdrop-title {
    position: absolute;
    bottom: 2rem;
    left: 2rem;
    right: 2rem;
    color: #fff;
    z-index: 2;
    /* Align text with the details column so the overlapping poster never covers it */
    padding-left: calc(260px + 2rem);
  }

  .td-backdrop-title h1 {
    margin: 0 0 0.5rem;
    font-size: 2.5rem;
    font-weight: 700;
    text-shadow: 2px 2px 8px rgba(0,0,0,0.6);
    line-height: 1.2;
  }

  .td-tagline {
    font-style: italic;
    font-size: 1.15rem;
    margin: 0;
    opacity: 0.9;
    text-shadow: 1px 1px 4px rgba(0,0,0,0.6);
  }

  /* Content */
  .td-content {
    padding: 2rem;
    display: flex;
    gap: 2rem;
  }

  .td-poster {
    flex: 0 0 260px;
  }

  .td-poster img {
    width: 100%;
    border-radius: 14px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
    border: 4px solid #fff;
    margin-top: -80px;
    position: relative;
    z-index: 3;
  }

  .td-details {
    flex: 1;
    min-width: 0;
  }

  /* Overview */
  .td-overview {
    margin-bottom: 1.5rem;
    background: #f7f8fc;
    border-radius: 14px;
    padding: 1.5rem;
    border-left: 4px solid #667eea;
  }

  .td-section-head {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    margin-bottom: 1rem;
  }

  .td-section-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(102, 126, 234, 0.12);
    border-radius: 10px;
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .td-section-icon-dark {
    background: rgba(255, 255, 255, 0.15);
  }

  .td-section-head h2 {
    margin: 0;
    font-size: 1.4rem;
    color: #1a1a2e;
    font-weight: 700;
  }

  .td-overview p {
    line-height: 1.8;
    font-size: 1rem;
    color: #495057;
    margin: 0;
    text-align: justify;
  }

  /* Info grid */
  .td-info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .td-info-item {
    background: #f7f8fc;
    padding: 1.1rem;
    border-radius: 12px;
    border: 1px solid #eef0f6;
    display: flex;
    flex-direction: column;
    transition: all 0.2s ease;
  }

  .td-info-item:hover {
    background: #f0f2ff;
    border-color: #d8dbf5;
    transform: translateY(-1px);
  }

  .td-info-full {
    grid-column: 1 / -1;
  }

  .td-info-label {
    font-size: 0.72rem;
    color: #667eea;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 700;
    margin-bottom: 0.4rem;
  }

  .td-info-value {
    font-size: 1.05rem;
    font-weight: 600;
    color: #212529;
  }

  .td-info-link {
    color: #667eea;
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 500;
    word-break: break-all;
  }

  .td-info-link:hover {
    text-decoration: underline;
  }

  /* Cast */
  .td-cast-card {
    margin-top: 2rem;
    background: #fff;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  }

  .td-cast-head {
    padding: 1.3rem 2rem;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }

  .td-cast-head h2 {
    margin: 0;
    font-size: 1.4rem;
    color: #fff;
    font-weight: 700;
  }

  .td-cast-slider-wrap {
    position: relative;
    padding: 1.5rem 1rem;
  }

  .td-scroll-btn {
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

  .td-scroll-btn:hover {
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
  }

  .td-scroll-left { left: 4px; }
  .td-scroll-right { right: 4px; }

  .td-cast-scroll {
    display: flex;
    gap: 1.2rem;
    overflow-x: auto;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding: 0.5rem 2.5rem;
  }

  .td-cast-scroll::-webkit-scrollbar {
    display: none;
  }

  .td-cast-item {
    flex: 0 0 140px;
    text-align: center;
    background: #f7f8fc;
    border-radius: 12px;
    padding: 0.6rem;
    border: 1px solid #eef0f6;
    transition: all 0.25s ease;
    cursor: pointer;
  }

  .td-cast-item:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }

  .td-cast-item img {
    width: 100%;
    height: 190px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 0.6rem;
    border: 2px solid #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  .td-cast-item h4 {
    margin: 0 0 0.2rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: #1a1a2e;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .td-cast-item p {
    margin: 0;
    font-size: 0.8rem;
    color: #667eea;
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .td-cast-count {
    text-align: center;
    margin: 0 2rem 1.5rem;
    padding: 0.7rem;
    background: rgba(102, 126, 234, 0.1);
    border-radius: 10px;
    color: #667eea;
    font-size: 0.85rem;
    font-weight: 600;
  }

  /* Loading & Error */
  .td-loading-card, .td-error-card {
    background: #fff;
    border-radius: 20px;
    padding: 4rem 2rem;
    text-align: center;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    max-width: 450px;
    margin: 3rem auto 0;
  }

  .td-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #eef0f6;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: tdSpin 0.8s linear infinite;
    margin: 0 auto 1.5rem;
  }

  @keyframes tdSpin {
    to { transform: rotate(360deg); }
  }

  .td-loading-card h3, .td-error-card h2 {
    color: #1a1a2e;
    margin: 0 0 0.5rem;
  }

  .td-loading-card p, .td-error-card p {
    color: #888;
    margin: 0 0 1.5rem;
    font-size: 0.9rem;
  }

  .td-error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  /* Tablet */
  @media (max-width: 900px) {
    .td-backdrop {
      height: 260px;
    }

    .td-backdrop-title {
      left: 1.2rem;
      right: 1.2rem;
      bottom: 1.2rem;
      /* Poster is stacked below on mobile, so text can span full width */
      padding-left: 0;
    }

    .td-backdrop-title h1 {
      font-size: 1.6rem;
    }

    .td-tagline {
      font-size: 0.95rem;
    }

    /* Stack: poster in flow so it never covers the title */
    .td-content {
      flex-direction: column;
      padding: 1.5rem;
      gap: 1.2rem;
      align-items: center;
    }

    .td-poster {
      flex: none;
      width: 100%;
      max-width: 200px;
    }

    .td-poster img {
      margin-top: 0;
    }

    .td-details {
      width: 100%;
    }

    .td-scroll-btn {
      width: 38px;
      height: 38px;
      font-size: 1.3rem;
    }

    .td-cast-scroll {
      padding: 0.5rem 1.5rem;
    }
  }

  @media (max-width: 480px) {
    .td-page {
      padding: 1rem 0.75rem;
    }

    .td-backdrop {
      height: 190px;
    }

    .td-backdrop-title h1 {
      font-size: 1.25rem;
      margin-bottom: 0.3rem;
    }

    .td-tagline {
      font-size: 0.85rem;
    }

    .td-content {
      padding: 1.2rem 1rem;
    }

    .td-poster {
      max-width: 165px;
    }

    .td-overview {
      padding: 1.1rem;
    }

    .td-section-head h2 {
      font-size: 1.15rem;
    }

    .td-overview p {
      font-size: 0.92rem;
      line-height: 1.7;
      text-align: left;
    }

    .td-info-grid {
      grid-template-columns: 1fr;
      gap: 0.7rem;
    }

    .td-info-item {
      padding: 0.9rem;
    }

    .td-info-value {
      font-size: 0.98rem;
    }

    .td-info-link {
      font-size: 0.85rem;
    }

    .td-cast-head {
      padding: 1.1rem 1.2rem;
    }

    .td-cast-head h2 {
      font-size: 1.2rem;
    }

    .td-cast-slider-wrap {
      padding: 1.2rem 0.5rem;
    }

    .td-cast-scroll {
      padding: 0.5rem 0.75rem;
      gap: 0.8rem;
    }

    .td-cast-item {
      flex: 0 0 120px;
    }

    .td-cast-item img {
      height: 165px;
    }

    .td-cast-item h4 {
      font-size: 0.82rem;
    }

    .td-cast-item p {
      font-size: 0.74rem;
    }

    .td-scroll-btn {
      width: 32px;
      height: 32px;
      font-size: 1.1rem;
      opacity: 0.9;
    }

    .td-scroll-left { left: 2px; }
    .td-scroll-right { right: 2px; }

    .td-cast-count {
      margin: 0 1.2rem 1.2rem;
      font-size: 0.8rem;
    }

    .td-back-btn {
      padding: 0.6rem 1.2rem;
      font-size: 0.85rem;
    }
  }
`;

export default TvSeriesDetail;
