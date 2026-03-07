import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ //formData: Object menyimpan email & password input
    email: '',
    password: ''
  });
  const [error, setError] = useState(''); //error: String untuk menampilkan error message
  const [loading, setLoading] = useState(false); //loading: Boolean untuk loading state
  
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
          <h2>Login</h2>
          
          {error && <div className="alert alert-error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
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
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
            
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p>Don't have an account? <a href="/register">Register here</a></p>
          </div>
        </div>
      </main>
    </>
  );
};

export default Login;