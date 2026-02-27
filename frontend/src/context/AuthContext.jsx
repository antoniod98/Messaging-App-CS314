import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// API base URL from environment variables
const API_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:8747';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // configure axios to send cookies with requests
  axios.defaults.withCredentials = true;

  // check if user is authenticated on app load (called once when the app initializes)
  useEffect(() => {
    checkAuth();
  }, []);

  // verify if user has valid session
  const checkAuth = async () => {
    try {
      // check if we have a token in localStorage
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        return;
      }

      // verify token with backend
      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setUser(response.data.user);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  // register a new user
  const register = async (email, password, firstName, lastName) => {
    try {
      setError(null);
      setLoading(true);

      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        firstName,
        lastName,
      });

      if (response.data.success) {
        setUser(response.data.user);
        // store token in localStorage for persistence
        localStorage.setItem('token', response.data.token);
        return { success: true };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // login existing user
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('token', response.data.token);
        return { success: true };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // logout current user
  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('token');
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// custom hook to use auth context
// usage: const { user, login, logout, isAuthenticated } = useAuth();
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
