import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';

const Login = () => {
  const [formData, setFormData] = useState({ //formData: Object menyimpan email & password input
    email: '',
    password: ''
  });
  const [error, setError] = useState(''); //error: String untuk menampilkan error message
  const [loading, setLoading] = useState(false); //loading: Boolean untuk loading state
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  //Purpose: Update form data saat user mengetik
  const handleChange = (e) => {
    const { name, value } = e.target; //e.target Element yang trigger event
    setFormData(prev => ({
      ...prev, //Spread operator untuk mempertahankan nilai sebelumnya
      [name]: value //[name]: value: Dynamic property assignment
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); //Mencegah form refresh
    setError(''); //Clear error sebelumnya
    setLoading(true); // Tampilkan loading state

    try {
      await login(formData);
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="login-page">
        <div className="login-card">
          {/* Left side - branding panel (hidden on mobile) */}
          <div className="login-hero">
            <div className="login-hero-content">
              <div className="login-hero-icon">🎬</div>
              <h1>Welcome Back</h1>
              <p>Sign in to explore the latest movies and TV series. Discover, search, and keep track of your favorites.</p>
            </div>
            <div className="login-hero-glow login-hero-glow-1"></div>
            <div className="login-hero-glow login-hero-glow-2"></div>
          </div>

          {/* Right side - form panel */}
          <div className="login-form-panel">
            <div className="login-form-inner">
              <h2>Login</h2>
              <p className="login-subtitle">Enter your credentials to continue</p>

              {error && <div className="login-alert">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="login-field">
                  <label htmlFor="email">Email</label>
                  <div className="login-input-wrap">
                    <span className="login-input-icon">✉️</span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email address"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label htmlFor="password">Password</label>
                  <div className="login-input-wrap">
                    <span className="login-input-icon">🔒</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="login-toggle-password"
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? (
                    <span className="login-btn-loading">
                      <span className="login-spinner"></span>
                      Logging in...
                    </span>
                  ) : 'Login'}
                </button>
              </form>

              <div className="login-footer">
                <p>Don't have an account? <a href="/register">Register here</a></p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .login-page {
          min-height: calc(100vh - 70px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6b8dd6 100%);
          background-size: 200% 200%;
          animation: gradientShift 12s ease infinite;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .login-card {
          display: flex;
          width: 100%;
          max-width: 900px;
          min-height: 520px;
          background: #fff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
        }

        /* Hero / branding side */
        .login-hero {
          flex: 1;
          position: relative;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          color: #fff;
          padding: 3rem 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .login-hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
        }

        .login-hero-icon {
          font-size: 3.5rem;
          margin-bottom: 1rem;
        }

        .login-hero h1 {
          font-size: 2rem;
          margin-bottom: 1rem;
          font-weight: 700;
          line-height: 1.2;
        }

        .login-hero p {
          font-size: 0.95rem;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.75);
        }

        .login-hero-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.5;
        }

        .login-hero-glow-1 {
          width: 200px;
          height: 200px;
          background: #64b5f6;
          top: -50px;
          left: -50px;
        }

        .login-hero-glow-2 {
          width: 250px;
          height: 250px;
          background: #764ba2;
          bottom: -80px;
          right: -60px;
        }

        /* Form side */
        .login-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2.5rem;
        }

        .login-form-inner {
          width: 100%;
          max-width: 340px;
        }

        .login-form-inner h2 {
          font-size: 1.8rem;
          color: #1a1a2e;
          margin-bottom: 0.4rem;
          font-weight: 700;
        }

        .login-subtitle {
          color: #888;
          font-size: 0.9rem;
          margin-bottom: 1.8rem;
        }

        .login-alert {
          background: #fdecea;
          color: #b71c1c;
          padding: 0.8rem 1rem;
          border-radius: 10px;
          font-size: 0.875rem;
          margin-bottom: 1.2rem;
          border-left: 4px solid #e53935;
        }

        .login-field {
          margin-bottom: 1.2rem;
        }

        .login-field label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: #444;
          margin-bottom: 0.5rem;
        }

        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 0.9rem;
          font-size: 0.95rem;
          pointer-events: none;
          opacity: 0.7;
        }

        .login-input-wrap input {
          width: 100%;
          padding: 0.85rem 0.9rem 0.85rem 2.6rem;
          border: 2px solid #e6e6ef;
          border-radius: 12px;
          font-size: 0.95rem;
          background: #f7f8fc;
          color: #1a1a2e;
          transition: all 0.25s ease;
          -webkit-appearance: none;
          appearance: none;
        }

        .login-input-wrap input::placeholder {
          color: #aaa;
        }

        .login-input-wrap input:focus {
          outline: none;
          border-color: #667eea;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
        }

        .login-toggle-password {
          position: absolute;
          right: 0.6rem;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          padding: 0.3rem;
          line-height: 1;
          opacity: 0.8;
          transition: opacity 0.2s ease;
        }

        .login-toggle-password:hover {
          opacity: 1;
        }

        .login-btn {
          width: 100%;
          padding: 0.9rem;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          margin-top: 0.5rem;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-btn-loading {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .login-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: loginSpin 0.7s linear infinite;
        }

        @keyframes loginSpin {
          to { transform: rotate(360deg); }
        }

        .login-footer {
          margin-top: 1.5rem;
          text-align: center;
          font-size: 0.875rem;
          color: #666;
        }

        .login-footer a {
          color: #667eea;
          font-weight: 600;
          text-decoration: none;
        }

        .login-footer a:hover {
          text-decoration: underline;
        }

        /* Tablet & Mobile */
        @media (max-width: 768px) {
          .login-hero {
            display: none;
          }

          .login-card {
            max-width: 420px;
            min-height: auto;
          }

          .login-form-panel {
            padding: 2.5rem 2rem;
          }
        }

        @media (max-width: 480px) {
          .login-page {
            padding: 1rem 0.75rem;
          }

          .login-card {
            border-radius: 18px;
          }

          .login-form-panel {
            padding: 2rem 1.5rem;
          }

          .login-form-inner h2 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </>
  );
};

export default Login;
