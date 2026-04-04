import { create } from 'zustand';
import api from '../lib/api';

export const useFeedStore = create((set) => ({
  activities: [],
  suggestedUsers: [],
  loading: false,

  loadFeed: async () => {
    set({ loading: true });
    const { data } = await api.get('/feed');
    set({ 
      activities: data.activities,
      suggestedUsers: data.suggestedUsers,
      loading: false 
    });
  },

  likeActivity: async (activityId) => {
    await api.post(`/activities/${activityId}/like`);
    // Optimistic update can be added here
  }
}));