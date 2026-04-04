import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token, isAuthenticated: true, loading: false });
  },

  googleLogin: async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadUser: async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, isAuthenticated: true });
    } catch (err) {
      console.log(err)
      localStorage.removeItem('token');
      set({ isAuthenticated: false });
    }
  }
}));