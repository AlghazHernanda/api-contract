import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMoviesDropdownOpen, setIsMoviesDropdownOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsMoviesDropdownOpen(false);
  };

  const toggleMoviesDropdown = () => {
    setIsMoviesDropdownOpen(prev => !prev);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
    closeMenu();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      closeMenu();
    }
  };

  return (
    <>
      <header className="nb-header">
        <div className="nb-bar">
          {/* Logo */}
          <a href="/" className="nb-logo" onClick={closeMenu}>
            <span className="nb-logo-icon">🎬</span>
            <span className="nb-logo-text">Auth API Demo</span>
          </a>

          {/* Desktop nav */}
          <nav className="nb-nav-desktop">
            <a href="/" className="nb-link">Home</a>

            <div className="nb-dropdown">
              <button className="nb-link nb-dropdown-btn">
                Movies <span className="nb-caret">▾</span>
              </button>
              <div className="nb-dropdown-menu">
                <a href="/now-playing">Now Playing</a>
                <a href="/airing-today">Airing Today</a>
              </div>
            </div>

            {!isAuthenticated ? (
              <>
                <a href="/register" className="nb-link">Register</a>
                <a href="/login" className="nb-link nb-link-cta">Login</a>
              </>
            ) : (
              <>
                <a href="/profile" className="nb-link">Profile</a>
                <a href="/logout" className="nb-link" onClick={handleLogout}>Logout</a>
              </>
            )}
          </nav>

          {/* Desktop search */}
          <form className="nb-search-desktop" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" aria-label="Search">🔍</button>
          </form>

          {/* Mobile hamburger */}
          <button
            className="nb-burger"
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            <span className={`nb-burger-line ${isMenuOpen ? 'nb-l1-open' : ''}`}></span>
            <span className={`nb-burger-line ${isMenuOpen ? 'nb-l2-open' : ''}`}></span>
            <span className={`nb-burger-line ${isMenuOpen ? 'nb-l3-open' : ''}`}></span>
          </button>
        </div>

        {/* Mobile drawer */}
        <div className={`nb-drawer ${isMenuOpen ? 'nb-drawer-open' : ''}`}>
          <form className="nb-search-mobile" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <nav className="nb-nav-mobile">
            <a href="/" onClick={closeMenu}>
              <span className="nb-m-icon">🏠</span> Home
            </a>

            <button className="nb-m-dropdown-btn" onClick={toggleMoviesDropdown}>
              <span><span className="nb-m-icon">🎥</span> Movies</span>
              <span className={`nb-m-caret ${isMoviesDropdownOpen ? 'nb-m-caret-open' : ''}`}>▾</span>
            </button>
            <div className={`nb-m-submenu ${isMoviesDropdownOpen ? 'nb-m-submenu-open' : ''}`}>
              <a href="/now-playing" onClick={closeMenu}>Now Playing</a>
              <a href="/airing-today" onClick={closeMenu}>Airing Today</a>
            </div>

            {!isAuthenticated ? (
              <>
                <a href="/register" onClick={closeMenu}>
                  <span className="nb-m-icon">📝</span> Register
                </a>
                <a href="/login" onClick={closeMenu}>
                  <span className="nb-m-icon">🔑</span> Login
                </a>
              </>
            ) : (
              <>
                <a href="/profile" onClick={closeMenu}>
                  <span className="nb-m-icon">👤</span> Profile
                </a>
                <a href="/logout" onClick={handleLogout}>
                  <span className="nb-m-icon">🚪</span> Logout
                </a>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Backdrop when drawer open */}
      {isMenuOpen && <div className="nb-backdrop" onClick={closeMenu}></div>}

      <style>{navbarStyles}</style>
    </>
  );
};

const navbarStyles = `
  .nb-header {
    position: sticky;
    top: 0;
    z-index: 1000;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .nb-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0.75rem 1.25rem;
  }

  /* Logo */
  .nb-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: #fff;
    font-weight: 700;
    font-size: 1.15rem;
    flex-shrink: 0;
    letter-spacing: 0.3px;
  }

  .nb-logo-icon {
    font-size: 1.3rem;
  }

  /* Desktop nav */
  .nb-nav-desktop {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    flex: 1;
    justify-content: center;
  }

  .nb-link {
    color: rgba(255, 255, 255, 0.85);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    padding: 0.5rem 0.85rem;
    border-radius: 8px;
    transition: all 0.2s ease;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
  }

  .nb-link:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }

  .nb-link-cta {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
  }

  .nb-link-cta:hover {
    background: linear-gradient(135deg, #7b8ff0, #8659b5);
  }

  /* Desktop dropdown */
  .nb-dropdown {
    position: relative;
  }

  .nb-dropdown-btn {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .nb-caret {
    font-size: 0.7rem;
    opacity: 0.8;
  }

  .nb-dropdown-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    min-width: 170px;
    background: #1e2a4a;
    border-radius: 10px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0.4rem;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-6px);
    transition: all 0.2s ease;
  }

  .nb-dropdown:hover .nb-dropdown-menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .nb-dropdown-menu a {
    display: block;
    padding: 0.6rem 0.8rem;
    color: rgba(255, 255, 255, 0.85);
    text-decoration: none;
    font-size: 0.87rem;
    border-radius: 7px;
    transition: all 0.15s ease;
  }

  .nb-dropdown-menu a:hover {
    background: rgba(102, 126, 234, 0.25);
    color: #fff;
  }

  /* Desktop search */
  .nb-search-desktop {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .nb-search-desktop input {
    width: 170px;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 0.85rem;
    transition: all 0.25s ease;
  }

  .nb-search-desktop input::placeholder {
    color: rgba(255, 255, 255, 0.55);
  }

  .nb-search-desktop input:focus {
    outline: none;
    width: 200px;
    background: rgba(255, 255, 255, 0.16);
    border-color: #667eea;
  }

  .nb-search-desktop button {
    padding: 0.5rem 0.7rem;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s ease;
  }

  .nb-search-desktop button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  /* Hamburger */
  .nb-burger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 42px;
    height: 42px;
    padding: 0;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    cursor: pointer;
    align-items: center;
    flex-shrink: 0;
  }

  .nb-burger-line {
    display: block;
    width: 20px;
    height: 2px;
    background: #fff;
    border-radius: 2px;
    transition: all 0.3s ease;
  }

  .nb-l1-open { transform: translateY(7px) rotate(45deg); }
  .nb-l2-open { opacity: 0; }
  .nb-l3-open { transform: translateY(-7px) rotate(-45deg); }

  /* Mobile drawer */
  .nb-drawer {
    display: none;
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.35s ease;
    background: #16213e;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .nb-drawer-open {
    max-height: 520px;
  }

  .nb-search-mobile {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .nb-search-mobile input {
    flex: 1;
    padding: 0.7rem 0.9rem;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 16px;
  }

  .nb-search-mobile input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .nb-search-mobile input:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.15);
  }

  .nb-search-mobile button {
    padding: 0.7rem 1.1rem;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: #fff;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }

  .nb-nav-mobile {
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0 1rem;
  }

  .nb-nav-mobile a,
  .nb-m-dropdown-btn {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.9rem 1.25rem;
    color: rgba(255, 255, 255, 0.88);
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 500;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    text-align: left;
    width: 100%;
    transition: background 0.2s ease;
  }

  .nb-m-dropdown-btn {
    justify-content: space-between;
  }

  .nb-m-dropdown-btn > span:first-child {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .nb-nav-mobile a:active,
  .nb-nav-mobile a:hover,
  .nb-m-dropdown-btn:hover {
    background: rgba(102, 126, 234, 0.15);
  }

  .nb-m-icon {
    font-size: 1rem;
    width: 20px;
    text-align: center;
  }

  .nb-m-caret {
    font-size: 0.8rem;
    transition: transform 0.25s ease;
  }

  .nb-m-caret-open {
    transform: rotate(180deg);
  }

  .nb-m-submenu {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.25s ease;
    background: rgba(0, 0, 0, 0.25);
  }

  .nb-m-submenu-open {
    max-height: 120px;
  }

  .nb-m-submenu a {
    padding-left: 3.1rem;
    font-size: 0.88rem;
    color: rgba(255, 255, 255, 0.75);
  }

  /* Backdrop */
  .nb-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  /* ===== Mobile / Tablet ===== */
  @media (max-width: 900px) {
    .nb-nav-desktop,
    .nb-search-desktop {
      display: none;
    }

    .nb-burger {
      display: flex;
    }

    .nb-drawer {
      display: block;
    }

    .nb-backdrop {
      display: block;
    }

    .nb-bar {
      padding: 0.7rem 1rem;
    }
  }

  @media (max-width: 400px) {
    .nb-logo-text {
      font-size: 0.95rem;
    }

    .nb-logo-icon {
      font-size: 1.1rem;
    }
  }
`;

export default Navbar;
