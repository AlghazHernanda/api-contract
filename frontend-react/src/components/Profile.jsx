import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get profile');
        }

        setProfileData(data.user);
      } catch (err) {
        setError(err.message);
        if (err.message.includes('token') || err.message.includes('authentication')) {
          setTimeout(() => {
            logout();
            navigate('/login');
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, navigate, logout]);

  const handleLogout = () => {
    logout();
    navigate('/login');
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
                <li><a href="/register">Register</a></li>
                <li><a href="/login">Login</a></li>
                <li><a href="/profile">Profile</a></li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="container">
          <div className="profile-card">
            <div className="spinner"></div>
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
                <li><a href="/register">Register</a></li>
                <li><a href="/login">Login</a></li>
                <li><a href="/profile">Profile</a></li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="container">
          <div className="profile-card">
            <h2>User Profile</h2>
            <div className="alert alert-error">{error}</div>
          </div>
        </main>
      </>
    );
  }

  const displayUser = profileData || user;

  return (
    <>
      <header>
        <div className="container">
          <div className="logo">Auth API Demo</div>
          <nav>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/register">Register</a></li>
              <li><a href="/login">Login</a></li>
              <li><a href="/profile">Profile</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="container">
        <div className="profile-card">
          <h2>User Profile</h2>
          
          <div className="profile-header">
            <div className="profile-avatar">
              {displayUser?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <h2>{displayUser?.username}</h2>
              <p>{displayUser?.email}</p>
            </div>
          </div>
          
          <div className="profile-details">
            <div className="detail-item">
              <h3>Username</h3>
              <p>{displayUser?.username}</p>
            </div>
            <div className="detail-item">
              <h3>Email</h3>
              <p>{displayUser?.email}</p>
            </div>
            <div className="detail-item">
              <h3>Phone</h3>
              <p>{displayUser?.phone || 'Not provided'}</p>
            </div>
            <div className="detail-item">
              <h3>User ID</h3>
              <p>{displayUser?.id}</p>
            </div>
            <div className="detail-item">
              <h3>Account Created</h3>
              <p>{displayUser?.createdAt ? new Date(displayUser.createdAt).toLocaleDateString() : 'Unknown'}</p>
            </div>
          </div>
          
          <div style={{ marginTop: '30px', textAlign: 'center' }}>
            <button 
              onClick={handleLogout} 
              className="btn btn-danger" 
              style={{ maxWidth: '200px' }}
            >
              Logout
            </button>
          </div>
        </div>
      </main>
    </>
  );
};

export default Profile;