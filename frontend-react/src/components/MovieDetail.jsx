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
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const castScrollRef = React.useRef(null);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll functions for cast slider
  const scrollCastLeft = () => {
    if (castScrollRef.current) {
      castScrollRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  //scrollCastRight untuk menggeser slider cast ke kanan dengan efek smooth
  const scrollCastRight = () => {
    if (castScrollRef.current) {
      castScrollRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

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
      <main className="container" style={{ padding: windowWidth <= 768 ? '1rem' : '2rem' }}>
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
                  fontSize: windowWidth <= 768 ? '1.8rem' : '2.5rem',
                  fontWeight: '700',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  lineHeight: '1.2'
                }}>{movie.title}</h1>
                {movie.tagline && (
                  <p style={{
                    fontStyle: 'italic',
                    fontSize: windowWidth <= 768 ? '1rem' : '1.2rem',
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
            <div style={{
              padding: windowWidth <= 768 ? '1rem' : '2rem',
              display: 'flex',
              gap: '2rem',
              flexDirection: windowWidth <= 768 ? 'column' : 'row'
            }}>
              {/* Poster Image */}
              <div style={{
                flex: windowWidth <= 768 ? '1' : '0 0 300px',
                maxWidth: windowWidth <= 768 ? '200px' : 'none',
                margin: windowWidth <= 768 ? '0 auto 2rem' : '0'
              }}>
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
                  <div style={{
                    marginBottom: '2rem',
                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Decorative elements */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '4px',
                      height: '100%',
                      background: 'linear-gradient(to bottom, #64b5f6, #42a5f5)'
                    }}></div>
                    
                    {/* Section header with icon */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: 'rgba(100, 181, 246, 0.15)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64b5f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                          <line x1="16" y1="13" x2="8" y2="13"></line>
                          <line x1="16" y1="17" x2="8" y2="17"></line>
                          <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                      </div>
                      
                      <h2 style={{
                        margin: 0,
                        fontSize: '1.5rem',
                        color: '#2c3e50',
                        fontWeight: '700',
                        letterSpacing: '-0.02em'
                      }}>Overview</h2>
                    </div>
                    
                    {/* Overview text with enhanced typography */}
                    <p style={{
                      lineHeight: '1.8',
                      fontSize: '1.05rem',
                      color: '#495057',
                      textAlign: 'justify',
                      textIndent: '1.5em',
                      position: 'relative',
                      paddingLeft: '1rem'
                    }}>
                      <span style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        color: '#64b5f6',
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        lineHeight: '1.8'
                      }}>&ldquo;</span>
                      {movie.overview}
                      <span style={{
                        color: '#64b5f6',
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        lineHeight: '1.8'
                      }}>&rdquo;</span>
                    </p>
                  </div>
                )}
                
                {/* Movie Info Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
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
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            position: 'relative'
          }}>
            {/* Section header with gradient background */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              position: 'relative',
              overflow: 'hidden'
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
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                position: 'relative',
                zIndex: 10
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: 'rgba(100, 181, 246, 0.2)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64b5f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                
                <h2 style={{
                  margin: 0,
                  fontSize: '1.5rem',
                  color: 'white',
                  fontWeight: '700',
                  letterSpacing: '0.5px'
                }}>Cast</h2>
              </div>
            </div>
            
            {/* Enhanced slider container */}
            <div style={{
              padding: '2rem 1.5rem',
              position: 'relative'
            }}>
              {/* Scroll indicators */}
              <button
                onClick={scrollCastLeft}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '50px',
                  height: '50px',
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                  border: '2px solid rgba(100, 181, 246, 0.3)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #0f3460 0%, #16213e 50%, #1a1a2e 100%)';
                  e.target.style.transform = 'translateY(-50%) scale(1.1)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
                  e.target.style.transform = 'translateY(-50%) scale(1)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64b5f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6"></path>
                  </svg>
                </div>
              </button>
              
              <button
                onClick={scrollCastRight}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '50px',
                  height: '50px',
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                  border: '2px solid rgba(100, 181, 246, 0.3)',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #0f3460 0%, #16213e 50%, #1a1a2e 100%)';
                  e.target.style.transform = 'translateY(-50%) scale(1.1)';
                  e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
                  e.target.style.transform = 'translateY(-50%) scale(1)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64b5f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"></path>
                  </svg>
                </div>
              </button>
              
              {/* Scrollable cast container */}
              <div
                ref={castScrollRef}
                style={{
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  padding: '0.5rem 0'
                }}
                onScroll={(e) => {
                  const scrollPercentage = (e.target.scrollLeft / (e.target.scrollWidth - e.target.clientWidth)) * 100;
                  // You can use this for progress indicators if needed
                }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                
                <div style={{
                  display: 'flex',
                  gap: '1.5rem',
                  paddingBottom: '1rem'
                }}>
                  {credits.cast.map((castMember, index) => (
                    <div key={castMember.id} style={{
                      flex: '0 0 140px',
                      textAlign: 'center',
                      opacity: index >= 10 ? 0.7 : 1,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      borderRadius: '12px',
                      padding: '0.5rem',
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.08)';
                      e.currentTarget.style.opacity = index >= 10 ? 0.7 : 1;
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
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                          border: '2px solid #fff'
                        }}
                      />
                      <h4 style={{
                        margin: '0 0 0.25rem 0',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#2c3e50',
                        lineHeight: '1.3',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>{castMember.name}</h4>
                      <p style={{
                        margin: 0,
                        fontSize: '0.85rem',
                        color: '#64b5f6',
                        fontStyle: 'italic',
                        fontWeight: '500',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                      }}>{castMember.character}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Cast count indicator */}
              <div style={{
                textAlign: 'center',
                marginTop: '1.5rem',
                padding: '0.75rem',
                background: 'rgba(100, 181, 246, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(100, 181, 246, 0.2)'
              }}>
                <p style={{
                  margin: 0,
                  color: '#64b5f6',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Showing {Math.min(credits.cast.length, 10)} of {credits.cast.length} cast members
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default MovieDetail;