import { api } from "@/lib/api";
import { API_PATHS, API_DEFAULTS } from "@/lib/constants";

export const feedbackService = {
  // Create new feedback
  create: (formData) => api.upload(API_PATHS.FEEDBACK.CREATE, formData),

  // Get current user's feedback (customer) - WITH STATUS FILTER
  getMyFeedback: async (params = {}) => {
    try {
      const { page = API_DEFAULTS.PAGINATION_PAGE, limit = API_DEFAULTS.PAGINATION_LIMIT, status } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      
      // Add status filter if provided
      if (status && status !== 'all') {
        queryParams.append('status', status);
      }
      
      const queryString = queryParams.toString();
      // Use the USER_LIST endpoint which should return only the user's feedback
      const endpoint = `${API_PATHS.FEEDBACK.USER_LIST}?${queryString}`;
      
      console.log('📋 Fetching my feedback with params:', params);
      const response = await api.get(endpoint);
      console.log('✅ My feedback response:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch my feedback:', error);
      return { feedback: [], total: 0 };
    }
  },

  // Get pending feedback (admin only)
  getPending: (params = {}) => {
    const { page = API_DEFAULTS.PAGINATION_PAGE, limit = API_DEFAULTS.PAGINATION_LIMIT } = params;
    const q = new URLSearchParams({ page, limit }).toString();
    return api.get(`${API_PATHS.FEEDBACK.PENDING}?${q}`);
  },

  // Get all feedback with pagination and filters (admin only)
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.orderId) queryParams.append('orderId', params.orderId);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/feedback/all?${queryString}` : '/feedback/all';
      
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to fetch all feedback:', error);
      return { feedback: [], total: 0 };
    }
  },

  // Filter feedback (admin only)
  filter: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.orderId) queryParams.append('orderId', params.orderId);
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/feedback/filter?${queryString}` : '/feedback/filter';
      
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to filter feedback:', error);
      return { feedback: [], total: 0 };
    }
  },

  // Get feedback by ID
  getById: (feedbackId) => api.get(API_PATHS.FEEDBACK.BY_ID(feedbackId)),

  // Admin respond to feedback
  respond: (feedbackId, data) => {
    if (data instanceof FormData) {
      return api.upload(`/feedback/${feedbackId}/respond`, data);
    } else {
      return api.post(`/feedback/${feedbackId}/respond`, { response: data });
    }
  },

  // Update feedback status
  updateStatus: (feedbackId, status) =>
    api.patch(API_PATHS.FEEDBACK.STATUS(feedbackId), { status }),

  // Get feedback by order
  getByOrder: (orderId) => api.get(API_PATHS.FEEDBACK.BY_ORDER(orderId)),

  // Delete feedback (super admin only)
  delete: (feedbackId) => api.delete(API_PATHS.FEEDBACK.BY_ID(feedbackId)),
};