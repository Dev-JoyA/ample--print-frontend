import { api } from "@/lib/api";
import { API_PATHS, API_DEFAULTS } from "@/lib/constants";

export const customerBriefService = {
  submit: (orderId, productId, data) => {
    console.log(`📋 Submitting brief for order ${orderId}, product ${productId}:`, data);
    const formData = new FormData();
    if (data.description) formData.append('description', data.description);
    if (data.image) formData.append('image', data.image);
    if (data.voiceNote) formData.append('voiceNote', data.voiceNote);
    if (data.video) formData.append('video', data.video);
    if (data.logo) formData.append('logo', data.logo);
    return api.upload(API_PATHS.CUSTOMER_BRIEFS.SUBMIT(orderId, productId), formData);
  },

  update: (orderId, productId, formData) =>
    api.put(API_PATHS.CUSTOMER_BRIEFS.UPDATE(orderId, productId), formData),

  getMyBriefs: (params = {}) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(q ? `${API_PATHS.CUSTOMER_BRIEFS.MY_BRIEFS}?${q}` : API_PATHS.CUSTOMER_BRIEFS.MY_BRIEFS);
  },

  adminRespond: (orderId, productId, formData) =>
    api.upload(API_PATHS.CUSTOMER_BRIEFS.ADMIN_RESPOND(orderId, productId), formData),

  adminUpdateRespond: (orderId, productId, formData) =>
    api.put(API_PATHS.CUSTOMER_BRIEFS.ADMIN_RESPOND(orderId, productId), formData),

  getAdminBriefs: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.hasFiles) queryParams.append('hasFiles', params.hasFiles);
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      if (params.hasResponded !== undefined) queryParams.append('hasResponded', params.hasResponded);
      const queryString = queryParams.toString();
      const endpoint = queryString ? `${API_PATHS.CUSTOMER_BRIEFS.ADMIN_BRIEFS}?${queryString}` : API_PATHS.CUSTOMER_BRIEFS.ADMIN_BRIEFS;
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to fetch admin briefs:', error);
      return { briefs: [], total: 0 };
    }
  },

  getByOrderAndProduct: (orderId, productId) => {
    if (!orderId || !productId) {
      console.error('Order ID and Product ID are required');
      return Promise.reject(new Error('Order ID and Product ID are required'));
    }
    console.log(`📋 Fetching briefs for order ${orderId}, product ${productId}`);
    return api.get(API_PATHS.CUSTOMER_BRIEFS.BY_ORDER_PRODUCT(orderId, productId));
  },

  getById: (briefId) => {
    if (!briefId) {
      throw new Error('Brief ID is required');
    }
    return api.get(API_PATHS.CUSTOMER_BRIEFS.BY_ID(briefId));
  },

  getStatus: (orderId, productId) =>
    api.get(API_PATHS.CUSTOMER_BRIEFS.STATUS(orderId, productId)),

  filter: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(q ? `${API_PATHS.CUSTOMER_BRIEFS.FILTER}?${q}` : API_PATHS.CUSTOMER_BRIEFS.FILTER);
  },

  delete: (briefId) => api.delete(API_PATHS.CUSTOMER_BRIEFS.DELETE(briefId)),

  markAsViewed: (briefId) => {
    if (!briefId) {
      throw new Error('Brief ID is required');
    }
    return api.patch(API_PATHS.CUSTOMER_BRIEFS.MARK_AS_VIEWED(briefId), {});
  },

  getOrderBriefStatus: (orderId) => {
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    return api.get(API_PATHS.CUSTOMER_BRIEFS.ORDER_STATUS(orderId));
  },

  getAllBriefsByOrderId: (orderId) => {
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    return api.get(API_PATHS.CUSTOMER_BRIEFS.ORDER_ALL(orderId));
  },
};