import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMoviesDropdownOpen, setIsMoviesDropdownOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsMoviesDropdownOpen(false);
  };

  const toggleMoviesDropdown = () => {
    setIsMoviesDropdownOpen(!isMoviesDropdownOpen);
  };

  // handle logout
  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
    closeMenu();
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      closeMenu();
    }
  };

  return (
    <header>
      <div className="container">
        <div className="logo">Auth API Demo</div>
        <button 
          className="mobile-menu-toggle" 
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
        <nav className={isMenuOpen ? 'nav-open' : ''}>
          <ul>
            <li><a href="/" onClick={closeMenu}>Home</a></li>
            <li className="dropdown">
              <button 
                className="dropdown-toggle" 
                onClick={toggleMoviesDropdown}
                aria-expanded={isMoviesDropdownOpen}
              >
                Movies {isMoviesDropdownOpen ? '▼' : '▶'}
              </button>
              <ul className={`dropdown-menu ${isMoviesDropdownOpen ? 'show' : ''}`}>
                <li><a href="/now-playing" onClick={closeMenu}>Now Playing</a></li>
                <li><a href="/airing-today" onClick={closeMenu}>Airing Today</a></li>
              </ul>
            </li>
            {!isAuthenticated ? (
              <>
                <li><a href="/register" onClick={closeMenu}>Register</a></li>
                <li><a href="/login" onClick={closeMenu}>Login</a></li>
              </>
            ) : (
              <>
                <li><a href="/profile" onClick={closeMenu}>Profile</a></li>
                <li><a href="/logout" onClick={handleLogout}>Logout</a></li>
              </>
            )}
          </ul>
        </nav>
        <div className="search-container">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">Search</button>
          </form>
        </div>
      </div>
    </header>
  );
};

export default Navbar;