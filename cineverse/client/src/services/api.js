import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cv_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const streamxApi = {
  getVideos: (params) => api.get('/videos', { params }),
  getVideo: (id) => api.get(`/videos/${id}`),
  likeVideo: (id) => api.post(`/videos/${id}/like`),
  updateWatchHistory: (payload) => api.post('/videos/watch-history', payload),

  getReels: () => api.get('/reels'),
  likeReel: (id) => api.post(`/reels/${id}/like`),
  addReelView: (id) => api.post(`/reels/${id}/view`),
  getMovieReels: () => api.get('/movie-reels'),

  getRecommendations: () => api.get('/recommendations'),

  getDiscussions: (params) => api.get('/discussions', { params }),
  createDiscussion: (payload) => api.post('/discussions', payload),
  likeDiscussion: (id) => api.post(`/discussions/${id}/like`),
  commentDiscussion: (id, text) => api.post(`/discussions/${id}/comment`, { text }),
  reportDiscussion: (id, reason) => api.post(`/discussions/${id}/report`, { reason }),
  deleteDiscussionAsAdmin: (id) => api.delete(`/discussions/${id}/admin`),

  getNotifications: () => api.get('/notifications'),
  getUnreadNotificationsCount: () => api.get('/notifications/unread-count'),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/notifications/mark-all-read'),

  createCheckout: (plan) => api.post('/subscriptions/create-checkout', { plan }),
  verifyPayment: (sessionId) => api.post('/subscriptions/verify-payment', { sessionId }),
  getMySubscription: () => api.get('/subscriptions/my-subscription'),
  cancelSubscription: () => api.post('/subscriptions/cancel')
};

export default api;
