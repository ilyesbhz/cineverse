import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LandingPage from './LandingPage';
import HomePage from './HomePage';
import MoviePage from './MoviePage';
import BrowsePage from './BrowsePage';
import AuthPage from './AuthPage';
import WatchlistPage from './WatchlistPage';
import ReelsPage from './ReelsPage';
import DiscussionsPage from './DiscussionsPage';
import PricingPage from './PricingPage';
import ProfilePage from './ProfilePage';
import AdminDashboard from './AdminDashboard';
import Navbar from '../components/Navbar';
import AdminRoute from '../components/AdminRoute';
import '../components/index.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Loading...</p></div>;
  return user ? children : <Navigate to="/auth" />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/home" /> : <LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/home" element={<PrivateRoute><Navbar /><HomePage /></PrivateRoute>} />
      <Route path="/browse" element={<PrivateRoute><Navbar /><BrowsePage /></PrivateRoute>} />
      <Route path="/movie/:id" element={<PrivateRoute><Navbar /><MoviePage /></PrivateRoute>} />
      <Route path="/watchlist" element={<PrivateRoute><Navbar /><WatchlistPage /></PrivateRoute>} />
      <Route path="/reels" element={<PrivateRoute><Navbar /><ReelsPage /></PrivateRoute>} />
      <Route path="/discussions" element={<PrivateRoute><Navbar /><DiscussionsPage /></PrivateRoute>} />
      <Route path="/pricing" element={<PrivateRoute><Navbar /><PricingPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Navbar /><ProfilePage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AdminRoute><Navbar /><AdminDashboard /></AdminRoute></PrivateRoute>} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}