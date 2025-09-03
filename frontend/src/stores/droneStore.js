import { create } from 'zustand';
import axiosInstance from '../api/axios';
import socketService from '../services/socketService';

const API_URL = '/drones/';

export const useDroneStore = create((set) => ({
  drones: [],
  isLoading: false,
  error: null,
  realTimeStatus: {
    isConnected: false,
    lastUpdate: null,
    activeUpdates: 0
  },

  // Setup real-time connection
  initializeRealTime: () => {
    const handleDroneUpdate = (data) => {
      console.log('Drone update received:', data);
      
      set((state) => ({
        realTimeStatus: {
          ...state.realTimeStatus,
          lastUpdate: data.timestamp,
          activeUpdates: state.realTimeStatus.activeUpdates + 1
        }
      }));

      // Update specific drone in the list
      set((state) => ({
        drones: state.drones.map((drone) =>
          drone._id === data.droneId 
            ? { 
                ...drone, 
                batteryLevel: data.batteryLevel, // Match backend field name
                location: data.location,
                status: data.status,
                telemetry: data.telemetry
              }
            : drone
        ),
      }));
    };

    socketService.onDroneUpdate(handleDroneUpdate);
    
    // Update connection status
    set((state) => ({
      realTimeStatus: {
        ...state.realTimeStatus,
        isConnected: socketService.getConnectionStatus().isConnected
      }
    }));
  },

  fetchDrones: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(API_URL);
      set({ drones: response.data, isLoading: false });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch drones';
      set({ error: message, isLoading: false });
    }
  },

  createDrone: async (droneData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post(API_URL, droneData);
      set((state) => ({
        drones: [...state.drones, response.data],
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create drone';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  updateDrone: async (id, updateData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.put(API_URL + id, updateData);
      set((state) => ({
        drones: state.drones.map((drone) =>
          drone._id === id ? response.data : drone
        ),
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update drone';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  deleteDrone: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axiosInstance.delete(API_URL + id);
      set((state) => ({
        drones: state.drones.filter((drone) => drone._id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete drone';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },
}));