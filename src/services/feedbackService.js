import { api } from '@/lib/api';
import { API_PATHS, API_DEFAULTS } from '@/lib/constants';

export const feedbackService = {
  create: (formData) => api.upload(API_PATHS.FEEDBACK.CREATE, formData),

  getMyFeedback: async (params = {}) => {
    try {
      const {
        page = API_DEFAULTS.PAGINATION_PAGE,
        limit = API_DEFAULTS.PAGINATION_LIMIT,
        status,
      } = params;
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', limit);
      if (status && status !== 'all') {
        queryParams.append('status', status);
      }
      const queryString = queryParams.toString();
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

  getPending: (params = {}) => {
    const { page = API_DEFAULTS.PAGINATION_PAGE, limit = API_DEFAULTS.PAGINATION_LIMIT } = params;
    const q = new URLSearchParams({ page, limit }).toString();
    return api.get(`${API_PATHS.FEEDBACK.PENDING}?${q}`);
  },

  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.orderId) queryParams.append('orderId', params.orderId);
      const queryString = queryParams.toString();
      const endpoint = queryString
        ? `${API_PATHS.FEEDBACK.ALL}?${queryString}`
        : API_PATHS.FEEDBACK.ALL;
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to fetch all feedback:', error);
      return { feedback: [], total: 0 };
    }
  },

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

  getById: (feedbackId) => api.get(API_PATHS.FEEDBACK.BY_ID(feedbackId)),

  respond: (feedbackId, data) => {
    if (data instanceof FormData) {
      return api.upload(API_PATHS.FEEDBACK.RESPOND(feedbackId), data);
    } else {
      return api.post(API_PATHS.FEEDBACK.RESPOND(feedbackId), { response: data });
    }
  },

  updateStatus: (feedbackId, status) =>
    api.patch(API_PATHS.FEEDBACK.STATUS(feedbackId), { status }),

  getByOrder: (orderId) => api.get(API_PATHS.FEEDBACK.BY_ORDER(orderId)),

  delete: (feedbackId) => api.delete(API_PATHS.FEEDBACK.BY_ID(feedbackId)),
};
