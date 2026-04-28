import { api } from '@/lib/api';

const BASE = '/customer-briefs';

const PATHS = {
  SUBMIT: (orderId, productId) => `${BASE}/customer/orders/${orderId}/products/${productId}/brief`,
  REPLY: (orderId, productId) => `${BASE}/customer/orders/${orderId}/products/${productId}/reply`,
  MY_BRIEFS: `${BASE}/customer/briefs`,
  PENDING_RESPONSES: `${BASE}/customer/briefs/pending-responses`,
  ADMIN_RESPOND: (orderId, productId) =>
    `${BASE}/admin/orders/${orderId}/products/${productId}/respond`,
  ADMIN_BRIEFS: `${BASE}/admin/briefs`,
  ADMIN_MARK_VIEWED: (briefId) => `${BASE}/admin/briefs/${briefId}/mark-viewed`,
  BY_ORDER_PRODUCT: (orderId, productId) =>
    `${BASE}/briefs/orders/${orderId}/products/${productId}`,
  BY_ID: (briefId) => `${BASE}/briefs/${briefId}`,
  MARK_AS_VIEWED: (briefId) => `${BASE}/briefs/${briefId}/view`,
  MARK_AS_COMPLETE: (briefId) => `${BASE}/briefs/${briefId}/complete`,
  STATUS: (orderId, productId) => `${BASE}/briefs/status/${orderId}/${productId}`,
  ORDER_STATUS: (orderId) => `${BASE}/briefs/order/${orderId}/status`,
  ORDER_ALL: (orderId) => `${BASE}/briefs/order/${orderId}/all`,
  DELETE: (briefId) => `${BASE}/briefs/${briefId}`,
};

export const customerBriefService = {
  submit: (orderId, productId, formData) => {
    console.log(`📋 Submitting brief for order ${orderId}, product ${productId}`);
    return api.upload(PATHS.SUBMIT(orderId, productId), formData);
  },

  replyToAdmin: (orderId, productId, formData) => {
    console.log(`📋 Replying to admin for order ${orderId}, product ${productId}`);
    return api.upload(PATHS.REPLY(orderId, productId), formData);
  },

  getMyBriefs: (params = {}) => {
    const q = new URLSearchParams(params || {}).toString();
    const url = q ? `${PATHS.MY_BRIEFS}?${q}` : PATHS.MY_BRIEFS;
    return api.get(url);
  },

  getPendingResponses: (limit = 10) => {
    return api.get(`${PATHS.PENDING_RESPONSES}?limit=${limit}`);
  },

  adminRespond: (orderId, productId, formData) =>
    api.upload(PATHS.ADMIN_RESPOND(orderId, productId), formData),

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
      if (params.hasResponded !== undefined)
        queryParams.append('hasResponded', params.hasResponded);

      const qs = queryParams.toString();
      const url = qs ? `${PATHS.ADMIN_BRIEFS}?${qs}` : PATHS.ADMIN_BRIEFS;
      return await api.get(url);
    } catch (error) {
      console.error('Failed to fetch admin briefs:', error);
      return { briefs: [], total: 0 };
    }
  },

  markAsViewedByAdmin: (briefId) => {
    if (!briefId) throw new Error('Brief ID is required');
    return api.patch(PATHS.ADMIN_MARK_VIEWED(briefId), {});
  },

  getByOrderAndProduct: (orderId, productId) => {
    if (!orderId || !productId) {
      return Promise.reject(new Error('Order ID and Product ID are required'));
    }
    console.log(`📋 Fetching conversation for order ${orderId}, product ${productId}`);
    return api.get(PATHS.BY_ORDER_PRODUCT(orderId, productId));
  },

  getById: (briefId) => {
    if (!briefId) throw new Error('Brief ID is required');
    return api.get(PATHS.BY_ID(briefId));
  },

  markAsViewed: (briefId) => {
    if (!briefId) throw new Error('Brief ID is required');
    return api.patch(PATHS.MARK_AS_VIEWED(briefId), {});
  },

  markAsComplete: (briefId) => {
    if (!briefId) throw new Error('Brief ID is required');
    return api.patch(PATHS.MARK_AS_COMPLETE(briefId), {});
  },

  getStatus: (orderId, productId) => api.get(PATHS.STATUS(orderId, productId)),

  getOrderBriefStatus: (orderId) => {
    if (!orderId) throw new Error('Order ID is required');
    return api.get(PATHS.ORDER_STATUS(orderId));
  },

  getAllBriefsByOrderId: (orderId) => {
    if (!orderId) throw new Error('Order ID is required');
    return api.get(PATHS.ORDER_ALL(orderId));
  },

  delete: (briefId) => api.delete(PATHS.DELETE(briefId)),
};
