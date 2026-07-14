// src/store/useAuthStore.js
import { create } from 'zustand';
import api from '../lib/api';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  socket: null,                    // ← New: Store socket instance
  isSocketConnected: false,

  // Initialize Socket with better handling
  initializeSocket: () => {
    const currentSocket = get().socket;
    if (currentSocket) return currentSocket;

    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
      set({ isSocketConnected: true });

      const user = get().user;
      if (user?._id) {
        socket.emit('authenticate', {
          userId: user._id,
          name: user.name,
          avatar: user.avatar,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      set({ isSocketConnected: false });
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });

    set({ socket });
    return socket;
  },

  // Login with improved socket handling
  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });

      localStorage.setItem('token', data.token);

      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        loading: false,
      });

      // Initialize socket after successful login
      const socket = get().initializeSocket();

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
        isAuthenticated: true,
      });

      get().initializeSocket(); // Start socket after Google login

      return data;
    } catch (err) {
      throw err;
    }
  },

  // Load user on app start + socket
  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const { data } = await api.get('/users/me');

      set({
        user: data,
        isAuthenticated: true,
      });

      // Initialize socket when user is loaded
      get().initializeSocket();

    } catch (err) {
      console.error('Failed to load user:', err);
      localStorage.removeItem('token');
      set({ isAuthenticated: false, user: null, socket: null });
    }
  },

  // Logout with proper socket cleanup
  logout: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
    }

    localStorage.removeItem('token');

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      socket: null,
      isSocketConnected: false,
    });
  },

  // Clear socket on unmount / page change (optional helper)
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, isSocketConnected: false });
    }
  },
}));