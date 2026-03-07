import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMovieDetails, getPosterUrl, getBackdropUrl, formatDate } from '../services/movieService';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const response = await getMovieDetails(id);
        setMovie(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch movie details. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMovieDetails();
    }
  }, [id]);

  const goBack = () => {
    navigate('/now-playing');
  };

  if (loading) {
    return (
      <>
        <header>
          <div className="container">
            <div className="logo">Auth API Demo</div>
            <nav>
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/now-playing">Now Playing</a></li>
                <li><a href="/register">Register</a></li>
                <li><a href="/login">Login</a></li>
                <li><a href="/profile">Profile</a></li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="container" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <div className="spinner"></div>
            <p style={{ marginLeft: '1rem' }}>Loading movie details...</p>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <header>
          <div className="container">
            <div className="logo">Auth API Demo</div>
            <nav>
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/now-playing">Now Playing</a></li>
                <li><a href="/register">Register</a></li>
                <li><a href="/login">Login</a></li>
                <li><a href="/profile">Profile</a></li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="container" style={{ padding: '2rem' }}>
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Error</h2>
            <p>{error}</p>
            <button 
              className="btn btn-primary" 
              onClick={goBack}
              style={{ marginTop: '1rem' }}
            >
              Back to Movies
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <header>
        <div className="container">
          <div className="logo">Auth API Demo</div>
          <nav>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/now-playing">Now Playing</a></li>
              <li><a href="/register">Register</a></li>
              <li><a href="/login">Login</a></li>
              <li><a href="/profile">Profile</a></li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="container" style={{ padding: '2rem' }}>
        <button 
          className="btn btn-secondary" 
          onClick={goBack}
          style={{ marginBottom: '1rem' }}
        >
          ← Back to Movies
        </button>
        
        {movie && (
          <div className="movie-detail-card" style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
            border: '1px solid #eaeaea'
          }}>
            {/* Backdrop Image with Gradient Overlay */}
            <div style={{ position: 'relative', height: '400px' }}>
              <img
                src={getBackdropUrl(movie.backdrop_path)}
                alt={movie.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '70%',
                background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 40%, transparent 100%)'
              }}></div>
              
              {/* Movie Title and Tagline Overlay */}
              <div style={{
                position: 'absolute',
                bottom: '2rem',
                left: '2rem',
                right: '2rem',
                color: '#fff',
                zIndex: 2
              }}>
                <h1 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                }}>{movie.title}</h1>
                {movie.tagline && (
                  <p style={{
                    fontStyle: 'italic',
                    fontSize: '1.2rem',
                    margin: 0,
                    opacity: 0.9,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                  }}>
                    "{movie.tagline}"
                  </p>
                )}
              </div>
            </div>
            
            {/* Content Section */}
            <div style={{ padding: '2rem', display: 'flex', gap: '2rem' }}>
              {/* Poster Image */}
              <div style={{ flex: '0 0 300px' }}>
                <img
                  src={getPosterUrl(movie.poster_path)}
                  alt={movie.title}
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                    border: '4px solid #fff'
                  }}
                />
              </div>
              
              {/* Movie Details */}
              <div style={{ flex: '1' }}>
                {/* Overview Section */}
                {movie.overview && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{
                      margin: '0 0 1rem 0',
                      fontSize: '1.5rem',
                      color: '#333',
                      borderBottom: '2px solid #f0f0f0',
                      paddingBottom: '0.5rem'
                    }}>Overview</h2>
                    <p style={{
                      lineHeight: '1.7',
                      fontSize: '1.05rem',
                      color: '#555'
                    }}>{movie.overview}</p>
                  </div>
                )}
                
                {/* Movie Info Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {movie.release_date && (
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '1.2rem',
                      borderRadius: '10px',
                      border: '1px solid #e9ecef'
                    }}>
                      <h3 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '0.9rem',
                        color: '#6c757d',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Release Date</h3>
                      <p style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#212529'
                      }}>{formatDate(movie.release_date)}</p>
                    </div>
                  )}
                  
                  {movie.popularity && (
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '1.2rem',
                      borderRadius: '10px',
                      border: '1px solid #e9ecef'
                    }}>
                      <h3 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '0.9rem',
                        color: '#6c757d',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Popularity</h3>
                      <p style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#212529'
                      }}>{Math.round(movie.popularity)}</p>
                    </div>
                  )}
                  
                  {movie.budget && (
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '1.2rem',
                      borderRadius: '10px',
                      border: '1px solid #e9ecef'
                    }}>
                      <h3 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '0.9rem',
                        color: '#6c757d',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Budget</h3>
                      <p style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#212529'
                      }}>${movie.budget.toLocaleString()}</p>
                    </div>
                  )}
                  
                  {movie.revenue && (
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '1.2rem',
                      borderRadius: '10px',
                      border: '1px solid #e9ecef'
                    }}>
                      <h3 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '0.9rem',
                        color: '#6c757d',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Revenue</h3>
                      <p style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#212529'
                      }}>${movie.revenue.toLocaleString()}</p>
                    </div>
                  )}
                  
                  {movie.homepage && (
                    <div style={{
                      gridColumn: 'span 2',
                      backgroundColor: '#f8f9fa',
                      padding: '1.2rem',
                      borderRadius: '10px',
                      border: '1px solid #e9ecef'
                    }}>
                      <h3 style={{
                        margin: '0 0 0.5rem 0',
                        fontSize: '0.9rem',
                        color: '#6c757d',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>Homepage</h3>
                      <a
                        href={movie.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: '#007bff',
                          textDecoration: 'none',
                          fontSize: '1.1rem',
                          fontWeight: '500',
                          wordBreak: 'break-all'
                        }}
                        onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                      >
                        {movie.homepage}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default MovieDetail;