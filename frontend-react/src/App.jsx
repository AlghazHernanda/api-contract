import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';

// Lazy load components for better performance
const Home = React.lazy(() => import('./components/Home'));
const Login = React.lazy(() => import('./components/Login'));
const Register = React.lazy(() => import('./components/Register'));
const Profile = React.lazy(() => import('./components/Profile'));
const NowPlaying = React.lazy(() => import('./components/NowPlaying'));
const MovieDetail = React.lazy(() => import('./components/MovieDetail'));
const SearchMovies = React.lazy(() => import('./components/SearchMovies'));
const AiringToday = React.lazy(() => import('./components/AiringToday'));
const TvSeriesDetail = React.lazy(() => import('./components/TvSeriesDetail'));

// Loading component
const LoadingSpinner = () => (
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
            Loading
          </h3>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '1rem',
            margin: 0,
            maxWidth: '300px',
            lineHeight: '1.5'
          }}>
            Please wait while we prepare the application for you...
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

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return !isAuthenticated ? children : <Navigate to="/profile" replace />;
};

function AppRoutes() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/now-playing" element={<NowPlaying />} />
          <Route path="/search" element={<SearchMovies />} />
          <Route path="/airing-today" element={<AiringToday />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/tv/:id" element={<TvSeriesDetail />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;