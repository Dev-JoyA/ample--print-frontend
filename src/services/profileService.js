import { api } from "@/lib/api";
import { API_PATHS } from "@/lib/constants";

export const profileService = {
  getMyProfile: async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      if (!token) throw new Error('Not authenticated');
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      const userId = payload.userId || payload.sub || payload.id;
      if (!userId) throw new Error('Could not determine user ID');
      console.log('Fetching profile for user ID:', userId);
      const userEndpoint = API_PATHS.USERS.BY_ID(userId);
      console.log('User endpoint:', userEndpoint);
      const userResponse = await api.get(userEndpoint);
      console.log('User response:', userResponse);
      return userResponse;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      return null;
    }
  },

  updateProfile: async (userId, data) => {
    try {
      const endpoint = API_PATHS.USERS.UPDATE_PROFILE(userId);
      console.log('Update profile endpoint:', endpoint, 'with data:', data);
      const response = await api.put(endpoint, data);
      return response;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  getUserById: async (userId) => {
    try {
      const id = userId?.toString ? userId.toString() : userId;
      console.log('Fetching user with ID:', id);
      const endpoint = API_PATHS.USERS.BY_ID(id);
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return {
        user: {
          firstName: '',
          lastName: '',
          email: ''
        }
      };
    }
  },
};