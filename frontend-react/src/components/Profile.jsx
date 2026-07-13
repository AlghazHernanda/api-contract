import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';

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
        <Navbar />
        <main className="prof-page">
          <div className="prof-loading-card">
            <div className="prof-loading-spinner"></div>
            <h3>Loading Profile</h3>
            <p>Fetching your information...</p>
          </div>
        </main>
        <style>{profileStyles}</style>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="prof-page">
          <div className="prof-card">
            <div className="prof-alert">{error}</div>
          </div>
        </main>
        <style>{profileStyles}</style>
      </>
    );
  }

  const displayUser = profileData || user;

  return (
    <>
      <Navbar />

      <main className="prof-page">
        <div className="prof-card">
          {/* Cover / Banner */}
          <div className="prof-banner">
            <div className="prof-banner-glow prof-glow-1"></div>
            <div className="prof-banner-glow prof-glow-2"></div>
          </div>

          {/* Avatar */}
          <div className="prof-avatar-wrap">
            <div className="prof-avatar">
              {displayUser?.username?.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* User main info */}
          <div className="prof-main-info">
            <h1>{displayUser?.username}</h1>
            <p className="prof-email">{displayUser?.email}</p>
          </div>

          {/* Details grid */}
          <div className="prof-details-grid">
            <div className="prof-detail-item">
              <div className="prof-detail-icon">👤</div>
              <div className="prof-detail-content">
                <span className="prof-detail-label">Username</span>
                <span className="prof-detail-value">{displayUser?.username}</span>
              </div>
            </div>

            <div className="prof-detail-item">
              <div className="prof-detail-icon">✉️</div>
              <div className="prof-detail-content">
                <span className="prof-detail-label">Email</span>
                <span className="prof-detail-value">{displayUser?.email}</span>
              </div>
            </div>

            <div className="prof-detail-item">
              <div className="prof-detail-icon">📱</div>
              <div className="prof-detail-content">
                <span className="prof-detail-label">Phone</span>
                <span className="prof-detail-value">{displayUser?.phone || 'Not provided'}</span>
              </div>
            </div>

            <div className="prof-detail-item">
              <div className="prof-detail-icon">🆔</div>
              <div className="prof-detail-content">
                <span className="prof-detail-label">User ID</span>
                <span className="prof-detail-value">{displayUser?.id}</span>
              </div>
            </div>

            <div className="prof-detail-item">
              <div className="prof-detail-icon">📅</div>
              <div className="prof-detail-content">
                <span className="prof-detail-label">Account Created</span>
                <span className="prof-detail-value">
                  {displayUser?.created_at
                    ? new Date(displayUser.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Logout button */}
          <div className="prof-actions">
            <button onClick={handleLogout} className="prof-logout-btn">
              Logout
            </button>
          </div>
        </div>
      </main>

      <style>{profileStyles}</style>
    </>
  );
};

const profileStyles = `
  .prof-page {
    min-height: calc(100vh - 70px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 3rem 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6b8dd6 100%);
    background-size: 200% 200%;
    animation: profGradient 12s ease infinite;
  }

  @keyframes profGradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .prof-card {
    width: 100%;
    max-width: 600px;
    background: #fff;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
    position: relative;
  }

  /* Banner */
  .prof-banner {
    height: 140px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    position: relative;
    overflow: hidden;
  }

  .prof-banner-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(50px);
    opacity: 0.4;
  }

  .prof-glow-1 {
    width: 200px;
    height: 200px;
    background: #64b5f6;
    top: -60px;
    right: -30px;
  }

  .prof-glow-2 {
    width: 160px;
    height: 160px;
    background: #764ba2;
    bottom: -50px;
    left: -20px;
  }

  /* Avatar */
  .prof-avatar-wrap {
    display: flex;
    justify-content: center;
    margin-top: -50px;
    position: relative;
    z-index: 2;
  }

  .prof-avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    font-weight: 700;
    border: 5px solid #fff;
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  /* Main info */
  .prof-main-info {
    text-align: center;
    padding: 1rem 2rem 0;
  }

  .prof-main-info h1 {
    font-size: 1.6rem;
    color: #1a1a2e;
    margin: 0.5rem 0 0.2rem;
    font-weight: 700;
  }

  .prof-email {
    color: #888;
    font-size: 0.9rem;
    margin: 0;
  }

  /* Details grid */
  .prof-details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.8rem;
    padding: 1.5rem 2rem;
  }

  .prof-detail-item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem;
    background: #f7f8fc;
    border-radius: 12px;
    border: 1px solid #eef0f6;
    transition: all 0.2s ease;
  }

  .prof-detail-item:hover {
    background: #f0f2ff;
    border-color: #d8dbf5;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
  }

  .prof-detail-icon {
    font-size: 1.4rem;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    flex-shrink: 0;
  }

  .prof-detail-content {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .prof-detail-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #667eea;
    margin-bottom: 0.15rem;
  }

  .prof-detail-value {
    font-size: 0.9rem;
    color: #333;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Actions */
  .prof-actions {
    padding: 0.5rem 2rem 2rem;
    text-align: center;
  }

  .prof-logout-btn {
    padding: 0.75rem 2.5rem;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #ef5350, #d32f2f);
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
  }

  .prof-logout-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(211, 47, 47, 0.4);
  }

  .prof-logout-btn:active {
    transform: translateY(0);
  }

  /* Loading card */
  .prof-loading-card {
    background: #fff;
    border-radius: 24px;
    padding: 4rem 2rem;
    text-align: center;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    width: 100%;
  }

  .prof-loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #eef0f6;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: profSpin 0.8s linear infinite;
    margin: 0 auto 1.5rem;
  }

  @keyframes profSpin {
    to { transform: rotate(360deg); }
  }

  .prof-loading-card h3 {
    color: #1a1a2e;
    margin: 0 0 0.5rem;
    font-size: 1.2rem;
  }

  .prof-loading-card p {
    color: #888;
    margin: 0;
    font-size: 0.9rem;
  }

  /* Alert */
  .prof-alert {
    background: #fdecea;
    color: #b71c1c;
    padding: 1rem;
    border-radius: 12px;
    margin: 2rem;
    border-left: 4px solid #e53935;
    font-size: 0.9rem;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .prof-page {
      padding: 2rem 1rem;
      align-items: flex-start;
    }

    .prof-card {
      border-radius: 20px;
    }

    .prof-banner {
      height: 110px;
    }

    .prof-details-grid {
      grid-template-columns: 1fr;
      padding: 1.2rem 1.5rem;
    }

    .prof-main-info {
      padding: 0.8rem 1.5rem 0;
    }

    .prof-actions {
      padding: 0.5rem 1.5rem 1.5rem;
    }
  }

  @media (max-width: 480px) {
    .prof-page {
      padding: 1rem 0.75rem;
    }

    .prof-card {
      border-radius: 16px;
    }

    .prof-avatar {
      width: 85px;
      height: 85px;
      font-size: 2rem;
    }

    .prof-avatar-wrap {
      margin-top: -42px;
    }

    .prof-main-info h1 {
      font-size: 1.3rem;
    }

    .prof-details-grid {
      padding: 1rem;
      gap: 0.6rem;
    }

    .prof-detail-item {
      padding: 0.8rem;
    }
  }
`;

export default Profile;
