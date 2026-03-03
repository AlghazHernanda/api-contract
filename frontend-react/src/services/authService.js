const API_BASE_URL = '/api/auth';

// Helper function to get auth token
const getToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to set auth token
const setToken = (token) => {
  localStorage.setItem('authToken', token);
};

// Helper function to remove auth token
const removeToken = () => {
  localStorage.removeItem('authToken');
};

// Register user
// export const register = async (userData) => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/register`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(userData),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.error || 'Registration failed');
//     }

//     return data;
//   } catch (error) {
//     throw error;
//   }
// };

// Login user
// export const login = async (credentials) => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/login`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(credentials),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//       throw new Error(data.error || 'Login failed');
//     }

//     return data;
//   } catch (error) {
//     throw error;
//   }
// };

// Get user profile
export const getProfile = async () => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get profile');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Authentication helpers
export const authService = {
  getToken,
  setToken,
  removeToken,
  isAuthenticated: () => !!getToken(),
};