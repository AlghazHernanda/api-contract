import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <>
      <Navbar />

      <main className="container">
        <div className="card">
          <h2>Welcome to Auth API Demo</h2>
          <p>This is a dynamic React frontend demonstration for the authentication API endpoints.</p>
          
          {isAuthenticated && user && (
            <div className="alert alert-success" style={{ margin: '20px 0' }}>
              Welcome back, {user.username}! You are currently logged in.
            </div>
          )}
          
          <h3>Available Features:</h3>
          <ul style={{ margin: '20px 0', paddingLeft: '20px' }}>
            <li><strong>Register:</strong> Create a new user account</li>
            <li><strong>Login:</strong> Authenticate with existing credentials</li>
            <li><strong>Profile:</strong> View user profile information (requires authentication)</li>
          </ul>
          
          <h3>API Endpoints:</h3>
          <ul style={{ margin: '20px 0', paddingLeft: '20px' }}>
            <li><code>POST /api/auth/register</code> - Register a new user</li>
            <li><code>POST /api/auth/login</code> - Login with email and password</li>
            <li><code>GET /api/auth/profile</code> - Get user profile (protected)</li>
          </ul>
          
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            {!isAuthenticated ? (
              <div className="button-group" style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href="/register" className="btn" style={{ textDecoration: 'none', flex: '1', minWidth: '120px' }}>
                  Get Started
                </a>
                <a href="/login" className="btn btn-secondary" style={{ textDecoration: 'none', flex: '1', minWidth: '120px' }}>
                  Login
                </a>
              </div>
            ) : (
              <a href="/profile" className="btn" style={{ textDecoration: 'none', maxWidth: '300px', margin: '0 auto' }}>
                View Profile
              </a>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;