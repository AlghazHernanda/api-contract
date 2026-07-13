import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3 || formData.username.length > 50) {
      newErrors.username = 'Username must be between 3 and 50 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]+$/.test(formData.phone)) {
      newErrors.phone = 'Phone number can only contain numbers';
    } else if (formData.phone.length < 10 || formData.phone.length > 15) {
      newErrors.phone = 'Phone number must be between 10 and 15 digits';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain lowercase, uppercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      navigate('/profile');
    } catch (err) {
      setErrors({ general: err.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="reg-page">
        <div className="reg-card">
          {/* Left side - branding panel */}
          <div className="reg-hero">
            <div className="reg-hero-content">
              <div className="reg-hero-icon">🚀</div>
              <h1>Join Us Today</h1>
              <p>Create an account to unlock all features. Explore movies, save favorites, and personalize your experience.</p>
              <div className="reg-hero-features">
                <div className="reg-feature-item">
                  <span>🎬</span> Explore latest movies & TV series
                </div>
                <div className="reg-feature-item">
                  <span>⭐</span> Save your favorite films
                </div>
                <div className="reg-feature-item">
                  <span>🔍</span> Search and discover content
                </div>
              </div>
            </div>
            <div className="reg-hero-glow reg-hero-glow-1"></div>
            <div className="reg-hero-glow reg-hero-glow-2"></div>
          </div>

          {/* Right side - form panel */}
          <div className="reg-form-panel">
            <div className="reg-form-inner">
              <h2>Create Account</h2>
              <p className="reg-subtitle">Fill in the details to get started</p>

              {errors.general && <div className="reg-alert">{errors.general}</div>}

              <form onSubmit={handleSubmit}>
                <div className="reg-field">
                  <label htmlFor="username">Username</label>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon">👤</span>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      placeholder="3-50 characters"
                      autoComplete="username"
                    />
                  </div>
                  {errors.username && <span className="reg-field-error">{errors.username}</span>}
                </div>

                <div className="reg-field">
                  <label htmlFor="email">Email</label>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon">✉️</span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Your email address"
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <span className="reg-field-error">{errors.email}</span>}
                </div>

                <div className="reg-field">
                  <label htmlFor="phone">Phone Number</label>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon">📱</span>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="10-15 digits"
                      autoComplete="tel"
                    />
                  </div>
                  {errors.phone && <span className="reg-field-error">{errors.phone}</span>}
                </div>

                <div className="reg-field">
                  <label htmlFor="password">Password</label>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon">🔒</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Min 6 chars, upper + lower + number"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="reg-toggle-password"
                      onClick={() => setShowPassword(prev => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.password && <span className="reg-field-error">{errors.password}</span>}
                </div>

                <div className="reg-field">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="reg-input-wrap">
                    <span className="reg-input-icon">🔐</span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="reg-toggle-password"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.confirmPassword && <span className="reg-field-error">{errors.confirmPassword}</span>}
                </div>

                <button type="submit" className="reg-btn" disabled={loading}>
                  {loading ? (
                    <span className="reg-btn-loading">
                      <span className="reg-spinner"></span>
                      Creating account...
                    </span>
                  ) : 'Create Account'}
                </button>
              </form>

              <div className="reg-footer">
                <p>Already have an account? <a href="/login">Login here</a></p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .reg-page {
          min-height: calc(100vh - 70px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6b8dd6 100%);
          background-size: 200% 200%;
          animation: regGradient 12s ease infinite;
        }

        @keyframes regGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .reg-card {
          display: flex;
          width: 100%;
          max-width: 960px;
          background: #fff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3);
        }

        /* Hero side */
        .reg-hero {
          flex: 0 0 360px;
          position: relative;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          color: #fff;
          padding: 3rem 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .reg-hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
        }

        .reg-hero-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .reg-hero h1 {
          font-size: 1.8rem;
          margin-bottom: 0.8rem;
          font-weight: 700;
        }

        .reg-hero p {
          font-size: 0.9rem;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.75);
          margin-bottom: 1.5rem;
        }

        .reg-hero-features {
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }

        .reg-feature-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.85);
          padding: 0.5rem 0.8rem;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .reg-hero-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.4;
        }

        .reg-hero-glow-1 {
          width: 180px;
          height: 180px;
          background: #64b5f6;
          top: -40px;
          right: -40px;
        }

        .reg-hero-glow-2 {
          width: 200px;
          height: 200px;
          background: #764ba2;
          bottom: -60px;
          left: -50px;
        }

        /* Form side */
        .reg-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 2.5rem;
          overflow-y: auto;
          max-height: 90vh;
        }

        .reg-form-inner {
          width: 100%;
          max-width: 380px;
        }

        .reg-form-inner h2 {
          font-size: 1.7rem;
          color: #1a1a2e;
          margin-bottom: 0.3rem;
          font-weight: 700;
        }

        .reg-subtitle {
          color: #888;
          font-size: 0.88rem;
          margin-bottom: 1.5rem;
        }

        .reg-alert {
          background: #fdecea;
          color: #b71c1c;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.85rem;
          margin-bottom: 1rem;
          border-left: 4px solid #e53935;
        }

        .reg-field {
          margin-bottom: 1rem;
        }

        .reg-field label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: #444;
          margin-bottom: 0.4rem;
        }

        .reg-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .reg-input-icon {
          position: absolute;
          left: 0.85rem;
          font-size: 0.9rem;
          pointer-events: none;
          opacity: 0.7;
        }

        .reg-input-wrap input {
          width: 100%;
          padding: 0.75rem 0.85rem 0.75rem 2.5rem;
          border: 2px solid #e6e6ef;
          border-radius: 10px;
          font-size: 0.9rem;
          background: #f7f8fc;
          color: #1a1a2e;
          transition: all 0.25s ease;
          -webkit-appearance: none;
          appearance: none;
        }

        .reg-input-wrap input::placeholder {
          color: #aaa;
          font-size: 0.82rem;
        }

        .reg-input-wrap input:focus {
          outline: none;
          border-color: #667eea;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
        }

        .reg-toggle-password {
          position: absolute;
          right: 0.6rem;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.95rem;
          padding: 0.25rem;
          line-height: 1;
          opacity: 0.8;
          transition: opacity 0.2s ease;
        }

        .reg-toggle-password:hover {
          opacity: 1;
        }

        .reg-field-error {
          display: block;
          font-size: 0.75rem;
          color: #e53935;
          margin-top: 0.35rem;
          padding-left: 0.2rem;
        }

        .reg-btn {
          width: 100%;
          padding: 0.85rem;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          margin-top: 0.5rem;
        }

        .reg-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .reg-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .reg-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .reg-btn-loading {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .reg-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: regSpin 0.7s linear infinite;
        }

        @keyframes regSpin {
          to { transform: rotate(360deg); }
        }

        .reg-footer {
          margin-top: 1.3rem;
          text-align: center;
          font-size: 0.85rem;
          color: #666;
        }

        .reg-footer a {
          color: #667eea;
          font-weight: 600;
          text-decoration: none;
        }

        .reg-footer a:hover {
          text-decoration: underline;
        }

        /* Tablet */
        @media (max-width: 768px) {
          .reg-hero {
            display: none;
          }

          .reg-card {
            max-width: 460px;
          }

          .reg-form-panel {
            padding: 2rem 2rem;
            max-height: none;
          }
        }

        /* Mobile */
        @media (max-width: 480px) {
          .reg-page {
            padding: 1rem 0.75rem;
            align-items: flex-start;
          }

          .reg-card {
            border-radius: 18px;
          }

          .reg-form-panel {
            padding: 1.8rem 1.3rem;
          }

          .reg-form-inner h2 {
            font-size: 1.4rem;
          }

          .reg-input-wrap input {
            font-size: 16px;
          }
        }
      `}</style>
    </>
  );
};

export default Register;
