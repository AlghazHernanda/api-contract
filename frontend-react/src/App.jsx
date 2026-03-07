import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Lazy load components for better performance
const Home = React.lazy(() => import('./components/Home'));
const Login = React.lazy(() => import('./components/Login'));
const Register = React.lazy(() => import('./components/Register'));
const Profile = React.lazy(() => import('./components/Profile'));
const NowPlaying = React.lazy(() => import('./components/NowPlaying'));
const MovieDetail = React.lazy(() => import('./components/MovieDetail'));

// Loading component
const LoadingSpinner = () => (
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
    <main className="container">
      <div className="card">
        <div className="spinner"></div>
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>Loading...</p>
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
          <Route path="/movie/:id" element={<MovieDetail />} />
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