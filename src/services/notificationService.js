import { api } from "../lib/api";

export const notificationService = {
  // Get notification history with pagination
  getHistory: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.read !== undefined) queryParams.append('read', params.read);
      if (params.type) queryParams.append('type', params.type);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/notifications/history?${queryString}` : '/notifications/history';
      
      const response = await api.get(endpoint);
      console.log('📋 Notifications fetched:', response);
      return response;
    } catch (error) {
      // If 404, return empty success response instead of throwing
      if (error.status === 404) {
        console.log('Notifications endpoint not available yet');
        return { success: true, notifications: [], total: 0, pages: 0 };
      }
      console.error('❌ Failed to fetch notifications:', error);
      throw error;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response;
    } catch (error) {
      if (error.status === 404) {
        return { success: true, count: 0 };
      }
      console.error('❌ Failed to fetch unread count:', error);
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`, {});
      return response;
    } catch (error) {
      if (error.status === 404) {
        console.log('Mark as read endpoint not available');
        return { success: true };
      }
      console.error('❌ Failed to mark notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await api.post('/notifications/mark-all-read', {});
      return response;
    } catch (error) {
      if (error.status === 404) {
        console.log('Mark all as read endpoint not available');
        return { success: true };
      }
      console.error('❌ Failed to mark all as read:', error);
      throw error;
    }
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response;
    } catch (error) {
      if (error.status === 404) {
        console.log('Delete notification endpoint not available');
        return { success: true };
      }
      console.error('❌ Failed to delete notification:', error);
      throw error;
    }
  },

  // Clear all notifications
  clearAll: async () => {
    try {
      const response = await api.delete('/notifications/clear-all');
      return response;
    } catch (error) {
      if (error.status === 404) {
        console.log('Clear all notifications endpoint not available');
        return { success: true };
      }
      console.error('❌ Failed to clear notifications:', error);
      throw error;
    }
  }
};