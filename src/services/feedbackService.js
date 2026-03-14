import { api } from "@/lib/api";
import { API_PATHS, API_DEFAULTS } from "@/lib/constants";

export const feedbackService = {
  // Create new feedback
  create: (formData) => api.upload(API_PATHS.FEEDBACK.CREATE, formData),

  // Get current user's feedback (customer)
  getMyFeedback: (params = {}) => {
    const { page = API_DEFAULTS.PAGINATION_PAGE, limit = API_DEFAULTS.PAGINATION_LIMIT } = params;
    const q = new URLSearchParams({ page, limit }).toString();
    return api.get(`${API_PATHS.FEEDBACK.USER_LIST}?${q}`);
  },

  // Get pending feedback (admin only)
  getPending: (params = {}) => {
    const { page = API_DEFAULTS.PAGINATION_PAGE, limit = API_DEFAULTS.PAGINATION_LIMIT } = params;
    const q = new URLSearchParams({ page, limit }).toString();
    return api.get(`${API_PATHS.FEEDBACK.PENDING}?${q}`);
  },

  // NEW: Get all feedback with pagination and filters
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

  // NEW: Advanced filtering
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
 // Admin respond to feedback - supports both text and file attachments
respond: async (feedbackId, data) => {
  // If data is FormData (with files), use upload, otherwise use regular post
  if (data instanceof FormData) {
    return api.upload(`/feedback/${feedbackId}/respond`, data);
  } else {
    // Simple text response
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