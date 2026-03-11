import { api } from "@/lib/api";
import { API_PATHS } from "@/lib/constants";

export const profileService = {
  // Get current user's profile
  getMyProfile: async () => {
    try {
      // Get token and decode to get user ID
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      if (!token) throw new Error('Not authenticated');
      
      // Decode JWT to get user ID
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      const userId = payload.userId || payload.sub || payload.id;
      
      if (!userId) throw new Error('Could not determine user ID');
      
      console.log('Fetching profile for user ID:', userId);
      
      // Use BY_ID to get user with profile info (from your getAllUsers response format)
      const userEndpoint = API_PATHS.USERS.BY_ID(userId);
      console.log('User endpoint:', userEndpoint);
      
      const userResponse = await api.get(userEndpoint);
      console.log('User response:', userResponse);
      
      // The response format from your backend: { user: { user: id, email, role, isActive, firstName, lastName, userName, phoneNumber, address } }
      return userResponse;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      return null;
    }
  },

  // Update profile
  updateProfile: async (userId, data) => {
    try {
      // Use UPDATE_PROFILE endpoint
      const endpoint = API_PATHS.USERS.UPDATE_PROFILE(userId);
      console.log('Update profile endpoint:', endpoint, 'with data:', data);
      
      const response = await api.put(endpoint, data);
      return response;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  // Get user by ID
getUserById: async (userId) => {
  try {
    // Ensure userId is a string
    const id = userId?.toString ? userId.toString() : userId;
    console.log('Fetching user with ID:', id);
    
    const endpoint = API_PATHS.USERS.BY_ID(id);
    const response = await api.get(endpoint);
    return response;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    // Return a fallback structure instead of throwing
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