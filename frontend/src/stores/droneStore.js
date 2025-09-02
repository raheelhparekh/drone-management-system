import { create } from 'zustand';
import axiosInstance from '../api/axios';
import socketService from '../services/socketService';
import toast from 'react-hot-toast';

const API_URL = '/drones/';

export const useDroneStore = create((set, get) => ({
  drones: [],
  isLoading: false,
  error: null,
  realTimeStatus: {
    isConnected: false,
    lastUpdate: null,
    activeUpdates: 0
  },

  // Setup real-time connection for drones
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

      switch (data.type) {
        case 'drone_update':
          set((state) => ({
            drones: state.drones.map((drone) =>
              drone._id === data.drone._id ? data.drone : drone
            ),
          }));
          
          // Show toast for critical updates
          if (data.drone.battery < 20) {
            toast.warning(`Drone "${data.drone.name}" battery low: ${data.drone.battery}%`);
          }
          if (data.drone.status === 'error') {
            toast.error(`Drone "${data.drone.name}" encountered an error!`);
          }
          break;
      }
    };

    socketService.onDroneUpdate(handleDroneUpdate);
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
      toast.success('Drone created successfully!');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create drone';
      set({ error: message, isLoading: false });
      toast.error(message);
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
      toast.success('Drone deleted successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete drone';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  // Real-time drone status update
  updateDroneRealTime: async (id, statusData) => {
    try {
      await axiosInstance.put(`/realtime/drones/${id}/status`, statusData);
      // Real-time update will be handled by socket listener
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update drone status';
      toast.error(message);
    }
  },

  // Get real-time status
  getRealTimeStatus: () => get().realTimeStatus,
}));