import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  //Initial state: User null, loading true
  const [user, setUser] = useState(null); //user: Menyimpan data user yang sudah login
  const [loading, setLoading] = useState(true); //loading: Loading state untuk async operations

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (authService.isAuthenticated()) { //authService.isAuthenticated(): Cek token di localStorage
        try {
          const response = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${authService.getToken()}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            authService.removeToken();
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          authService.removeToken();
        }
      }
      setLoading(false); //setLoading(false): Selesai loading state
    };

    checkAuthStatus(); 
  }, []); //[] dependency: Hanya jalan sekali saat mount

  const login = async (credentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      authService.setToken(data.token);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      authService.setToken(data.token);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.removeToken();
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};