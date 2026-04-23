import { api } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';

export const shippingService = {
  getByOrderId: async (orderId) => {
    try {
      console.log('📋 Fetching shipping for order:', orderId);
      const response = await api.get(API_PATHS.SHIPPING.BY_ORDER(orderId));
      return response;
    } catch (error) {
      console.error('Failed to fetch shipping:', error);
      return { data: null };
    }
  },

  getById: async (shippingId) => {
    try {
      console.log('📋 Fetching shipping by ID:', shippingId);
      const response = await api.get(API_PATHS.SHIPPING.BY_ID(shippingId));
      return response;
    } catch (error) {
      console.error('Failed to fetch shipping:', error);
      throw error;
    }
  },

  create: async (orderId, data) => {
    try {
      console.log('📦 Creating shipping for order:', orderId, data);
      const response = await api.post(API_PATHS.SHIPPING.CREATE(orderId), data);
      return response;
    } catch (error) {
      console.error('Failed to create shipping:', error);
      throw error;
    }
  },

  updateTracking: async (shippingId, data) => {
    try {
      console.log('📦 Updating tracking for shipping:', shippingId, data);
      const response = await api.put(API_PATHS.SHIPPING.UPDATE_TRACKING(shippingId), data);
      return response;
    } catch (error) {
      console.error('Failed to update tracking:', error);
      throw error;
    }
  },

  updateStatus: async (shippingId, status) => {
    try {
      console.log('📦 Updating shipping status:', shippingId, status);
      const response = await api.patch(API_PATHS.SHIPPING.UPDATE_STATUS(shippingId), { status });
      return response;
    } catch (error) {
      console.error('Failed to update shipping status:', error);
      throw error;
    }
  },

  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      const queryString = queryParams.toString();
      const endpoint = queryString
        ? `${API_PATHS.SHIPPING.ALL}?${queryString}`
        : API_PATHS.SHIPPING.ALL;
      const response = await api.get(endpoint);
      const shippingData = response?.data || response?.shipping || [];
      const total = response?.total || shippingData.length;
      return {
        data: shippingData,
        total,
        page: response?.page || params.page || 1,
        limit: response?.limit || params.limit || 10,
      };
    } catch (error) {
      console.error('Failed to fetch shipping records:', error);
      return { data: [], total: 0 };
    }
  },

  filter: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.method) queryParams.append('method', params.method);
      if (params.orderId) queryParams.append('orderId', params.orderId);
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.isPaid !== undefined) queryParams.append('isPaid', params.isPaid);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      const queryString = queryParams.toString();
      const endpoint = queryString
        ? `${API_PATHS.SHIPPING.FILTER}?${queryString}`
        : API_PATHS.SHIPPING.FILTER;
      const response = await api.get(endpoint);
      const shippingData = response?.data || response?.shipping || [];
      const total = response?.total || shippingData.length;
      return { data: shippingData, total };
    } catch (error) {
      console.error('Failed to filter shipping:', error);
      return { data: [], total: 0 };
    }
  },

  getNeedingInvoice: async () => {
    try {
      console.log('📋 Fetching shipping needing invoice');
      const response = await api.get(API_PATHS.SHIPPING.NEEDING_INVOICE);
      const shippingData = response?.data || [];
      return { data: shippingData, count: shippingData.length };
    } catch (error) {
      console.error('Failed to fetch shipping needing invoice:', error);
      return { data: [], count: 0 };
    }
  },

  getPending: async () => {
    try {
      console.log('📋 Fetching pending shipping');
      const response = await api.get(API_PATHS.SHIPPING.PENDING);
      const shippingData = response?.data || [];
      return { data: shippingData, count: shippingData.length };
    } catch (error) {
      console.error('Failed to fetch pending shipping:', error);
      return { data: [], count: 0 };
    }
  },
};
