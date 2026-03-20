import { api } from "../lib/api";
import { API_PATHS } from "../lib/constants";

export const notificationService = {
  getHistory: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.read !== undefined) queryParams.append('read', params.read);
      if (params.type) queryParams.append('type', params.type);
      const queryString = queryParams.toString();
      const endpoint = queryString ? `${API_PATHS.NOTIFICATIONS.HISTORY}?${queryString}` : API_PATHS.NOTIFICATIONS.HISTORY;
      const response = await api.get(endpoint);
      console.log('📋 Notifications fetched:', response);
      return response;
    } catch (error) {
      if (error.status === 404) {
        console.log('Notifications endpoint not available yet');
        return { success: true, notifications: [], total: 0, pages: 0 };
      }
      console.error('❌ Failed to fetch notifications:', error);
      throw error;
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await api.get(API_PATHS.NOTIFICATIONS.UNREAD_COUNT);
      return response;
    } catch (error) {
      if (error.status === 404) {
        return { success: true, count: 0 };
      }
      console.error('❌ Failed to fetch unread count:', error);
      throw error;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await api.patch(API_PATHS.NOTIFICATIONS.MARK_READ(notificationId), {});
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

  markAllAsRead: async () => {
    try {
      const response = await api.post(API_PATHS.NOTIFICATIONS.MARK_ALL_READ, {});
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

  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(API_PATHS.NOTIFICATIONS.DELETE(notificationId));
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

  clearAll: async () => {
    try {
      const response = await api.delete(API_PATHS.NOTIFICATIONS.CLEAR_ALL);
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