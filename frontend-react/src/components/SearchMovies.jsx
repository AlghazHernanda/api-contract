import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchMovies, getPosterUrl, formatDate } from '../services/movieService';
import Navbar from './Navbar';

const SearchMovies = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  
  const query = searchParams.get('query') || '';
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMovies = async () => {
      if (!query) {
        setMovies([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await searchMovies(query, currentPage);
        // API response format: { requestId, data: [...] }
        setMovies(response.data || []);
        // Note: API doesn't provide pagination info in the response
        // Setting default values for pagination
        setTotalPages(1);
        setTotalResults(response.data ? response.data.length : 0);
        setError(null);
      } catch (err) {
        setError('Failed to fetch search results. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [query, currentPage]);

  const handleMovieClick = (movie) => {
    navigate(`/movie/${movie.id}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSearchParams({ query, page });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const searchQuery = e.target.search.value.trim();
    if (searchQuery) {
      setSearchParams({ query: searchQuery, page: 1 });
      setCurrentPage(1);
    }
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
                Searching Movies
              </h3>
              
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1rem',
                margin: 0,
                maxWidth: '300px',
                lineHeight: '1.5'
              }}>
                Please wait while we search for "{query}"...
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
        <main className="container" style={{ padding: '2rem' }}>
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Error</h2>
            <p>{error}</p>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
              style={{ marginTop: '1rem' }}
            >
              Try Again
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container" style={{ padding: '2rem' }}>
        {/* Search form */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <form onSubmit={handleSearchSubmit}>
            <div className="form-group" style={{ marginBottom: '0' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  name="search"
                  defaultValue={query}
                  placeholder="Search for movies..."
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn" style={{ width: 'auto', padding: '0 20px' }}>
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Search results header */}
        {query && (
          <div style={{
            marginBottom: '2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
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
            
            <div style={{ position: 'relative', zIndex: 10 }}>
              {/* Search icon */}
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: 'rgba(100, 181, 246, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                border: '2px solid rgba(100, 181, 246, 0.3)'
              }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#64b5f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              
              <h1 style={{
                marginBottom: '0.5rem',
                fontSize: '2rem',
                fontWeight: '700',
                color: 'white',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                letterSpacing: '0.5px'
              }}>
                Search Results for "{query}"
              </h1>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '1.1rem',
                margin: 0,
                fontWeight: '500'
              }}>
                {totalResults > 0 ? `Found ${totalResults} results` : 'No results found'}
              </p>
            </div>
          </div>
        )}

        {/* No query message */}
        {!query && (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>Search Movies</h2>
            <p>Enter a movie title in the search box above to find movies.</p>
          </div>
        )}

        {/* Movie results */}
        {query && movies.length === 0 && !loading && (
          <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
            <h2>No Results Found</h2>
            <p>No movies found matching your search query.</p>
          </div>
        )}

        {query && movies.length > 0 && (
          <div className="movie-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {movies.map((movie) => (
              <div 
                key={movie.id} 
                className="movie-card"
                onClick={() => handleMovieClick(movie)}
                style={{
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  backgroundColor: '#fff'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ position: 'relative', paddingBottom: '150%' }}>
                  <img 
                    src={getPosterUrl(movie.poster_path)} 
                    alt={movie.title}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ 
                    margin: '0 0 0.5rem 0', 
                    fontSize: '1rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {movie.title}
                  </h3>
                  <p style={{ 
                    margin: '0', 
                    color: '#666', 
                    fontSize: '0.875rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{formatDate(movie.release_date)}</span>
                    <span style={{ 
                      backgroundColor: '#f0f0f0', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      fontSize: '0.75rem'
                    }}>
                      Popularity: {Math.round(movie.popularity)}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Note: Pagination is disabled as the API doesn't support it in the current format */}
        {query && totalResults > 0 && (
          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
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
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {/* Results icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64b5f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11H3v2h6v-2zm0-4H3v2h6V7zm0 8H3v2h6v-2zm12-8h-6v2h6V7zm0 4h-6v2h6v-2zm0 4h-6v2h6v-2z"/>
              </svg>
              
              <p style={{
                margin: 0,
                color: '#495057',
                fontSize: '1rem',
                fontWeight: '600'
              }}>
                Showing all <span style={{ color: '#64b5f6', fontWeight: '700' }}>{totalResults}</span> results
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default SearchMovies;