import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('cv_token'));

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => { setToken(null); localStorage.removeItem('cv_token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('cv_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, name: username, email, password });
    localStorage.setItem('cv_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('cv_token');
    setToken(null);
    setUser(null);
  };

  const getHeaders = () => ({ Authorization: `Bearer ${token}` });

  const isAdmin = () => user?.role === 'admin';

  const isFreeUser = () => user?.subscription?.plan === 'free';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, getHeaders, API, isAdmin, isFreeUser }}>
      {children}
    </AuthContext.Provider>
  );
};