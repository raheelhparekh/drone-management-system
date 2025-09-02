import { create } from 'zustand';
import axiosInstance from '../api/axios';

const API_URL = '/analytics/';

export const useAnalyticsStore = create((set) => ({
  analytics: null,
  missionAnalytics: null,
  fleetAnalytics: null,
  liveMissions: [],
  isLoading: false,
  error: null,

  // Fetch dashboard analytics
  fetchDashboardAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(API_URL + 'dashboard');
      set({ analytics: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch analytics';
      set({ error: message, isLoading: false });
      console.error('Analytics fetch error:', error);
    }
  },

  // Fetch mission analytics
  fetchMissionAnalytics: async (timeRange = '30') => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`${API_URL}missions?timeRange=${timeRange}`);
      set({ missionAnalytics: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch mission analytics';
      set({ error: message, isLoading: false });
      console.error('Mission analytics fetch error:', error);
    }
  },

  // Fetch fleet analytics
  fetchFleetAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(API_URL + 'fleet');
      set({ fleetAnalytics: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch fleet analytics';
      set({ error: message, isLoading: false });
      console.error('Fleet analytics fetch error:', error);
    }
  },

  // Fetch live mission data
  fetchLiveMissions: async () => {
    try {
      const response = await axiosInstance.get(API_URL + 'live');
      set({ liveMissions: response.data });
      return response.data;
    } catch (error) {
      console.error('Live missions fetch error:', error);
    }
  },

  // Clear analytics data
  clearAnalytics: () => {
    set({
      analytics: null,
      missionAnalytics: null,
      fleetAnalytics: null,
      liveMissions: [],
      error: null
    });
  },

  // Update live mission data (for real-time updates)
  updateLiveMission: (missionData) => {
    set((state) => ({
      liveMissions: state.liveMissions.map(mission =>
        mission.id === missionData.id ? { ...mission, ...missionData } : mission
      )
    }));
  },

  // Add new live mission
  addLiveMission: (missionData) => {
    set((state) => ({
      liveMissions: [...state.liveMissions, missionData]
    }));
  },

  // Remove live mission
  removeLiveMission: (missionId) => {
    set((state) => ({
      liveMissions: state.liveMissions.filter(mission => mission.id !== missionId)
    }));
  }
}));
