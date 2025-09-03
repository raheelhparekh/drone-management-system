import { create } from 'zustand';
import axiosInstance from '../api/axios';
import socketService from '../services/socketService';
import toast from 'react-hot-toast';

const API_URL = '/missions/';

export const useMissionStore = create((set, get) => ({
  missions: [],
  isLoading: false,
  error: null,
  realTimeStatus: {
    isConnected: false,
    lastUpdate: null,
    activeUpdates: 0
  },

  // Setup real-time connection
  initializeRealTime: (userId) => {
    socketService.connect(userId);
    
    const handleMissionUpdate = (data) => {
      console.log('Mission update received:', data);
      
      set((state) => ({
        realTimeStatus: {
          ...state.realTimeStatus,
          lastUpdate: data.timestamp,
          activeUpdates: state.realTimeStatus.activeUpdates + 1
        }
      }));

      switch (data.type) {
        case 'mission_update':
        case 'mission_progress':
          set((state) => ({
            missions: state.missions.map((mission) =>
              mission._id === data.mission._id ? data.mission : mission
            ),
          }));
          break;
          
        case 'mission_completed':
          toast.success(`Mission "${data.mission.name}" completed!`);
          set((state) => ({
            missions: state.missions.map((mission) =>
              mission._id === data.mission._id ? data.mission : mission
            ),
          }));
          break;
          
        case 'mission_drone_update':
          // Update mission when its assigned drone changes
          set((state) => ({
            missions: state.missions.map((mission) =>
              mission._id === data.mission._id 
                ? { ...mission, drone: data.drone } // Match backend field name
                : mission
            ),
          }));
          break;
      }
    };

    socketService.onMissionUpdate(handleMissionUpdate);
    
    // Update connection status
    set((state) => ({
      realTimeStatus: {
        ...state.realTimeStatus,
        isConnected: socketService.getConnectionStatus().isConnected
      }
    }));
  },

  // Cleanup real-time connection
  cleanupRealTime: () => {
    socketService.disconnect();
    set((state) => ({
      realTimeStatus: {
        ...state.realTimeStatus,
        isConnected: false
      }
    }));
  },

  fetchMissions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(API_URL);
      set({ missions: response.data, isLoading: false });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch missions';
      set({ error: message, isLoading: false });
    }
  },

  createMission: async (missionData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post(API_URL, missionData);
      set((state) => ({
        missions: [...state.missions, response.data],
        isLoading: false,
      }));
      toast.success('Mission created successfully!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create mission';
      set({ error: message, isLoading: false });
      toast.error(message);
      throw new Error(message);
    }
  },

  updateMission: async (id, updateData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.put(API_URL + id, updateData);
      set((state) => ({
        missions: state.missions.map((mission) =>
          mission._id === id ? response.data : mission
        ),
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update mission';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  deleteMission: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(API_URL + id);
      set((state) => ({
        missions: state.missions.filter((mission) => mission._id !== id),
        isLoading: false,
      }));
      toast.success('Mission deleted successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete mission';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  // Real-time mission simulation
  simulateMission: async (id) => {
    try {
      await axiosInstance.put(`/realtime/missions/${id}/simulate`);
      toast.success('Mission simulation started!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to start simulation';
      toast.error(message);
    }
  },

  // Get real-time status
  getRealTimeStatus: () => get().realTimeStatus,

  // Legacy method for backward compatibility
  setupSocketListener: () => {
    console.warn('setupSocketListener is deprecated. Use initializeRealTime instead.');
  },
}));
