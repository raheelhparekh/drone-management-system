/* eslint-disable no-unused-vars */
import { create } from 'zustand';
import axiosInstance from '../api/axios';

const API_URL = '/users/';

const getInitialUser = () => {
  const user = localStorage.getItem('user');
  if (user && user !== 'undefined') {
    return JSON.parse(user);
  }
  return null;
};

export const useAuthStore = create((set) => ({
  user: getInitialUser(),
  isLoading: false,
  error: null,
  
  getMe: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosInstance.get(API_URL + 'profile');
      const user = response.data;
      set({ user, isLoading: false });
      return user;
    } catch (error) {
      // Do not update state on error to prevent infinite re-renders.
      set({ isLoading: false });
      return null;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post(API_URL, userData);
      const user = response.data;
      set({ user, isLoading: false });
      return user;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  login: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.post(API_URL + 'login', userData);
      const user = response.data;
      set({ user, isLoading: false });
      return user;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));
