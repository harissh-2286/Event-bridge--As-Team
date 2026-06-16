import axios from 'axios';

// Create axios instance
// In production: VITE_API_BASE_URL = https://your-app.onrender.com
// In development: falls back to '/api' which Vite proxies to localhost:8080
const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore if session is already expired
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile/update', profileData);
    return response.data;
  },
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  }
};

// Events endpoints
export const eventService = {
  getAll: async () => {
    const response = await api.get('/events');
    return response.data;
  },
  getUpcoming: async () => {
    const response = await api.get('/events/upcoming');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },
  create: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },
  update: async (id, eventData) => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },
  cancel: async (id) => {
    const response = await api.put(`/events/${id}/cancel`);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },
  getByOrganizer: async (organizerId) => {
    const response = await api.get(`/events/organizer/${organizerId}`);
    return response.data;
  },
  search: async (query) => {
    const response = await api.get(`/events/search?query=${query}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/events/stats');
    return response.data;
  }
};

// Registrations endpoints
export const registrationService = {
  registerIndividual: async (eventId) => {
    const response = await api.post(`/registrations/individual/${eventId}`);
    return response.data;
  },
  registerTeam: async (eventId, teamData) => {
    const response = await api.post(`/registrations/team/${eventId}`, teamData);
    return response.data;
  },
  updateStatus: async (regId, status) => {
    const response = await api.put(`/registrations/status/${regId}?status=${status}`);
    return response.data;
  },
  updatePaymentStatus: async (regId, paymentStatus) => {
    const response = await api.put(`/registrations/payment/${regId}?paymentStatus=${paymentStatus}`);
    return response.data;
  },
  getByUser: async (userId) => {
    const response = await api.get(`/registrations/user/${userId}`);
    return response.data;
  },
  getByEvent: async (eventId) => {
    const response = await api.get(`/registrations/event/${eventId}`);
    return response.data;
  },
  cancel: async (regId) => {
    const response = await api.delete(`/registrations/cancel/${regId}`);
    return response.data;
  }
};

// OD endpoints
export const odService = {
  getFacultyRequests: async () => {
    const response = await api.get('/od/faculty');
    return response.data;
  },
  getStudentRequests: async () => {
    const response = await api.get('/od/student');
    return response.data;
  },
  updateStatus: async (odId, status) => {
    const response = await api.put(`/od/status/${odId}?status=${status}`);
    return response.data;
  },
  downloadPdfUrl: (odId) => {
    const token = localStorage.getItem('token');
    return `${BASE_URL}/od/download/${odId}?access_token=${token}`;
  },
  downloadPdf: async (odId) => {
    const response = await api.get(`/od/download/${odId}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

// Chat endpoints
export const chatService = {
  getHistory: async (partnerId) => {
    const response = await api.get(`/chat/history/${partnerId}`);
    return response.data;
  },
  getPartners: async () => {
    const response = await api.get('/chat/partners');
    return response.data;
  },
  sendMessage: async (receiverId, content) => {
    const response = await api.post('/chat/send', { receiverId, content });
    return response.data;
  },
  getChattableUsers: async () => {
    const response = await api.get('/chat/users');
    return response.data;
  }
};

// Announcements endpoints
export const announcementService = {
  getAll: async () => {
    const response = await api.get('/announcements');
    return response.data;
  },
  create: async (annData) => {
    const response = await api.post('/announcements', annData);
    return response.data;
  },
  getByEvent: async (eventId) => {
    const response = await api.get(`/announcements/event/${eventId}`);
    return response.data;
  },
  getUserAnnouncements: async () => {
    const response = await api.get('/announcements/user');
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  }
};

// Notifications endpoints
export const notificationService = {
  getUserNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/read/${id}`);
    return response.data;
  },
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};

// Admin endpoints
export const adminService = {
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  }
};

export default api;
