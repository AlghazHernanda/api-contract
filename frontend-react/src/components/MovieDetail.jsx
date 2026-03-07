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

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);
        
        // Fetch movie details and credits in parallel
        const [movieResponse, creditsResponse] = await Promise.all([
          getMovieDetails(id),
          getMovieCredits(id)
        ]);
        
        setMovie(movieResponse.data);
        setCredits(creditsResponse.data);
        // console.log('Movie data:', movieResponse.data);
        // console.log('Budget:', movieResponse.data.budget);
        // console.log('Revenue:', movieResponse.data.revenue);
        // console.log('Homepage:', movieResponse.data.homepage);
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
        <main className="container" style={{ padding: '2rem', minHeight: '80vh' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '60vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {/* Animated background elements */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 80%, rgba(100, 181, 246, 0.1) 0%, transparent 50%)',
            }}></div>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 80% 20%, rgba(100, 181, 246, 0.1) 0%, transparent 50%)',
            }}></div>
            
            {/* Loading content */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              padding: '2rem',
              textAlign: 'center'
            }}>
              {/* Enhanced spinner */}
              <div style={{
                width: '60px',
                height: '60px',
                position: 'relative',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: '4px solid rgba(255, 255, 255, 0.1)',
                  borderTop: '4px solid #64b5f6',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  border: '4px solid transparent',
                  borderBottom: '4px solid rgba(100, 181, 246, 0.3)',
                  animation: 'spin 1.5s linear infinite reverse'
                }}></div>
              </div>
              
              {/* Loading text with animation */}
              <h3 style={{
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: '600',
                margin: '0 0 1rem 0',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                letterSpacing: '0.5px'
              }}>
                Loading Movie Details
              </h3>
              
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1rem',
                margin: 0,
                maxWidth: '300px',
                lineHeight: '1.5'
              }}>
                Please wait while we fetch the latest movie information for you...
              </p>
              
              {/* Loading dots animation */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginTop: '1.5rem'
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#64b5f6',
                  animation: 'pulse 1.4s ease-in-out infinite both'
                }}></div>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#64b5f6',
                  animation: 'pulse 1.4s ease-in-out infinite both',
                  animationDelay: '0.2s'
                }}></div>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#64b5f6',
                  animation: 'pulse 1.4s ease-in-out infinite both',
                  animationDelay: '0.4s'
                }}></div>
              </div>
            </div>
            
            {/* Add keyframes for animations */}
            <style jsx>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              
              @keyframes pulse {
                0%, 80%, 100% {
                  transform: scale(0);
                  opacity: 0.5;
                }
                40% {
                  transform: scale(1);
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="container" style={{ padding: '2rem', minHeight: '80vh' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            padding: '3rem',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {/* Animated background elements */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 80%, rgba(220, 53, 69, 0.1) 0%, transparent 50%)',
            }}></div>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 80% 20%, rgba(220, 53, 69, 0.1) 0%, transparent 50%)',
            }}></div>
            
            <div style={{ position: 'relative', zIndex: 10 }}>
              {/* Error icon */}
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: 'rgba(220, 53, 69, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 2rem',
                border: '2px solid rgba(220, 53, 69, 0.3)'
              }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
              
              {/* Error title and message */}
              <h2 style={{
                color: 'white',
                fontSize: '2rem',
                fontWeight: '700',
                margin: '0 0 1rem 0',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                letterSpacing: '0.5px'
              }}>
                Oops! Something went wrong
              </h2>
              
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '1.1rem',
                margin: '0 0 2rem 0',
                lineHeight: '1.5',
                maxWidth: '400px'
              }}>
                {error}
              </p>
              
              <button
                className="btn btn-primary"
                onClick={goBack}
                style={{
                  marginTop: '2rem',
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  color: 'white',
                  fontWeight: '600',
                  padding: '0.75rem 2rem',
                  fontSize: '1rem'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
                }}
              >
                ← Back to Movies
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: '2rem' }}>
        <button
          className="btn btn-secondary"
          onClick={goBack}
          style={{
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'linear-gradient(135deg, #0f3460 0%, #16213e 50%, #1a1a2e 100%)';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
          }}
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
                  
                  {movie.budget !== undefined && movie.budget !== null && movie.budget > 0 && (
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
                  
                  {movie.revenue !== undefined && movie.revenue !== null && movie.revenue > 0 && (
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
                  
                  {movie.homepage !== undefined && movie.homepage !== null && movie.homepage.trim() !== '' && (
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
        
        {/* Cast Section */}
        {credits && credits.cast && credits.cast.length > 0 && (
          <div style={{ 
            marginTop: '2rem',
            backgroundColor: '#fff',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
            border: '1px solid #eaeaea'
          }}>
            <div style={{ 
              padding: '1.5rem 2rem', 
              borderBottom: '1px solid #eaeaea',
              backgroundColor: '#f8f9fa'
            }}>
              <h2 style={{ 
                margin: 0, 
                fontSize: '1.5rem',
                color: '#333'
              }}>Cast</h2>
            </div>
            
            <div style={{ 
              padding: '1.5rem',
              overflowX: 'auto'
            }}>
              <div style={{ 
                display: 'flex',
                gap: '1.5rem',
                paddingBottom: '1rem'
              }}>
                {credits.cast.slice(0, 10).map((castMember) => (
                  <div key={castMember.id} style={{ 
                    flex: '0 0 140px',
                    textAlign: 'center'
                  }}>
                    <img 
                      src={getProfileUrl(castMember.profile_path)} 
                      alt={castMember.name}
                      style={{
                        width: '140px',
                        height: '210px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        marginBottom: '0.75rem',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <h4 style={{ 
                      margin: '0 0 0.25rem 0', 
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      color: '#333',
                      lineHeight: '1.3'
                    }}>{castMember.name}</h4>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.85rem',
                      color: '#666',
                      fontStyle: 'italic'
                    }}>{castMember.character}</p>
                  </div>
                ))}
              </div>
              {credits.cast.length > 10 && (
                <div style={{ 
                  textAlign: 'center',
                  marginTop: '1rem',
                  color: '#666',
                  fontSize: '0.9rem'
                }}>
                  and {credits.cast.length - 10} more cast members
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default MovieDetail;