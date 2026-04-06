// frontend/src/store/useAuthStore.js
import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,

  setUser: (userData) => {
    set({ user: userData });
    
    // Auto connect socket with full user info when user logs in
    if (userData?._id && window.socket) {
      window.socket.emit('authenticate', {
        userId: userData._id,
        name: userData.name,
        avatar: userData.avatar,
      });
    }
  },
  // Login with email/password
  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      set({ 
        user: data.user, 
        token: data.token, 
        isAuthenticated: true,
        loading: false 
      });
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  // Google Login
  googleLogin: async (credential) => {
    try {
      const { data } = await api.post('/auth/google', { credential });
      localStorage.setItem('token', data.token);
      set({ 
        user: data.user, 
        token: data.token, 
        isAuthenticated: true 
      });
      return data;
    } catch (err) {
      throw err;
    }
  },

  // Load user on app start
  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const { data } = await api.get('/users/me');
      set({ 
        user: data, 
        isAuthenticated: true 
      });
    } catch (err) {
      localStorage.removeItem('token');
      set({ isAuthenticated: false, user: null });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ 
      user: null, 
      token: null, 
      isAuthenticated: false 
    });
  }
}));