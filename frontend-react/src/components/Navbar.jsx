import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/login');
    closeMenu();
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
            <li><a href="/now-playing" onClick={closeMenu}>Now Playing</a></li>
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
      </div>
    </header>
  );
};

export default Navbar;