import React, { useState, useEffect } from 'react';
import { getNowPlayingMovies, getPosterUrl, getBackdropUrl, formatDate } from '../services/movieService';

const NowPlaying = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);

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

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
  };

  const closeModal = () => {
    setSelectedMovie(null);
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
            <p style={{ marginLeft: '1rem' }}>Loading movies...</p>
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
        <h1 style={{ marginBottom: '2rem', textAlign: 'center' }}>Now Playing Movies</h1>
      
      {movies.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>No Movies Available</h2>
          <p>There are currently no movies playing in theaters.</p>
        </div>
      ) : (
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

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <div 
          className="modal-overlay"
          onClick={closeModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}
          >
            <button 
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                zIndex: 1001
              }}
            >
              ×
            </button>
            
            <div style={{ position: 'relative', paddingBottom: '40%' }}>
              <img 
                src={getBackdropUrl(selectedMovie.backdrop_path)} 
                alt={selectedMovie.title}
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
            
            <div style={{ padding: '2rem' }}>
              <h2 style={{ margin: '0 0 1rem 0' }}>{selectedMovie.title}</h2>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <p><strong>Release Date:</strong> {formatDate(selectedMovie.release_date)}</p>
                <p><strong>Popularity:</strong> {Math.round(selectedMovie.popularity)}</p>
              </div>
              <p><strong>Movie ID:</strong> {selectedMovie.id}</p>
            </div>
          </div>
        </div>
      )}
      </main>
    </>
  );
};

export default NowPlaying;