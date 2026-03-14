import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTVSeriesDetails, getPosterUrl, getBackdropUrl, formatDate } from '../services/movieService';
import Navbar from './Navbar';

const TvSeriesDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tvSeries, setTvSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchTVSeriesData = async () => {
      try {
        setLoading(true);
        const response = await getTVSeriesDetails(id);
        setTvSeries(response.data);
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
                Loading TV Series Details
              </h3>
              
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1rem',
                margin: 0,
                maxWidth: '300px',
                lineHeight: '1.5'
              }}>
                Please wait while we fetch the latest TV series information for you...
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
                ← Back to TV Series
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
          ← Back to TV Series
        </button>
        
        {tvSeries && (
          <div className="tv-series-detail-card" style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
            border: '1px solid #eaeaea'
          }}>
            {/* Backdrop Image with Gradient Overlay */}
            <div style={{ position: 'relative', height: '400px' }}>
              <img
                src={getBackdropUrl(tvSeries.backdrop_path)}
                alt={tvSeries.name}
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
              
              {/* TV Series Title and Tagline Overlay */}
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
                }}>{tvSeries.name}</h1>
                {tvSeries.tagline && (
                  <p style={{
                    fontStyle: 'italic',
                    fontSize: windowWidth <= 768 ? '1rem' : '1.2rem',
                    margin: 0,
                    opacity: 0.9,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                  }}>
                    "{tvSeries.tagline}"
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
                  src={getPosterUrl(tvSeries.poster_path)}
                  alt={tvSeries.name}
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                    border: '4px solid #fff'
                  }}
                />
              </div>
              
              {/* TV Series Details */}
              <div style={{ flex: '1' }}>
                {/* Overview Section */}
                {tvSeries.overview && (
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
                          <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                          <polyline points="17 2 12 7 7 2"></polyline>
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
                      {tvSeries.overview}
                      <span style={{
                        color: '#64b5f6',
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        lineHeight: '1.8'
                      }}>&rdquo;</span>
                    </p>
                  </div>
                )}
                
                {/* TV Series Info Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.5rem'
                }}>
                  {tvSeries.first_air_date && (
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
                      }}>First Air Date</h3>
                      <p style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: '#212529'
                      }}>{formatDate(tvSeries.first_air_date)}</p>
                    </div>
                  )}
                  
                  {tvSeries.popularity && (
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
                      }}>{Math.round(tvSeries.popularity)}</p>
                    </div>
                  )}
                  
                  {tvSeries.homepage !== undefined && tvSeries.homepage !== null && tvSeries.homepage.trim() !== '' && (
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
                        href={tvSeries.homepage}
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
                        {tvSeries.homepage}
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

export default TvSeriesDetail;
