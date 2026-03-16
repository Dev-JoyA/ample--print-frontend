import { api } from "@/lib/api";

export const shippingService = {
  // Get shipping by order ID (Customer & Admin)
  getByOrderId: async (orderId) => {
    try {
      console.log('📋 Fetching shipping for order:', orderId);
      const response = await api.get(`/shipping/order/${orderId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch shipping:', error);
      return { data: null };
    }
  },

  // Get shipping by ID (Customer & Admin)
  getById: async (shippingId) => {
    try {
      console.log('📋 Fetching shipping by ID:', shippingId);
      const response = await api.get(`/shipping/${shippingId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch shipping:', error);
      throw error;
    }
  },

  // Admin: Create shipping record
  create: async (orderId, data) => {
    try {
      console.log('📦 Creating shipping for order:', orderId, data);
      const response = await api.post(`/shipping/order/${orderId}`, data);
      return response;
    } catch (error) {
      console.error('Failed to create shipping:', error);
      throw error;
    }
  },

  // Admin: Update tracking information
  updateTracking: async (shippingId, data) => {
    try {
      console.log('📦 Updating tracking for shipping:', shippingId, data);
      const response = await api.put(`/shipping/${shippingId}/tracking`, data);
      return response;
    } catch (error) {
      console.error('Failed to update tracking:', error);
      throw error;
    }
  },

  // Admin: Update shipping status
  updateStatus: async (shippingId, status) => {
    try {
      console.log('📦 Updating shipping status:', shippingId, status);
      const response = await api.patch(`/shipping/${shippingId}/status`, { status });
      return response;
    } catch (error) {
      console.error('Failed to update shipping status:', error);
      throw error;
    }
  },

  // Admin: Get all shipping records (paginated)
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/shipping/all?${queryString}` : '/shipping/all';
      
      const response = await api.get(endpoint);
      
      // Handle different response structures
      const shippingData = response?.data || response?.shipping || [];
      const total = response?.total || shippingData.length;
      
      return { 
        data: shippingData, 
        total,
        page: response?.page || params.page || 1,
        limit: response?.limit || params.limit || 10
      };
    } catch (error) {
      console.error('Failed to fetch shipping records:', error);
      return { data: [], total: 0 };
    }
  },

  // Admin: Filter shipping records
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
      const endpoint = queryString ? `/shipping/filter?${queryString}` : '/shipping/filter';
      
      const response = await api.get(endpoint);
      
      const shippingData = response?.data || response?.shipping || [];
      const total = response?.total || shippingData.length;
      
      return { data: shippingData, total };
    } catch (error) {
      console.error('Failed to filter shipping:', error);
      return { data: [], total: 0 };
    }
  },

  // Admin: Get shipping needing invoice
  getNeedingInvoice: async () => {
    try {
      console.log('📋 Fetching shipping needing invoice');
      const response = await api.get('/shipping/needing-invoice');
      
      const shippingData = response?.data || [];
      return { data: shippingData, count: shippingData.length };
    } catch (error) {
      console.error('Failed to fetch shipping needing invoice:', error);
      return { data: [], count: 0 };
    }
  },

  // Admin: Get pending shipping
  getPending: async () => {
    try {
      console.log('📋 Fetching pending shipping');
      const response = await api.get('/shipping/pending');
      
      const shippingData = response?.data || [];
      return { data: shippingData, count: shippingData.length };
    } catch (error) {
      console.error('Failed to fetch pending shipping:', error);
      return { data: [], count: 0 };
    }
  },
};