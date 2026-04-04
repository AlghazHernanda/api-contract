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
    //gaada token, silahkan login
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    //fetch profile data
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


  //logout
  const handleLogout = () => {
    logout();
    navigate('/login');
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
                Loading Profile
              </h3>
              
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1rem',
                margin: 0,
                maxWidth: '300px',
                lineHeight: '1.5'
              }}>
                Please wait while we fetch your profile information...
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
      <Navbar />

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