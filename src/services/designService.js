import { api } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';

console.log('🔧 designService: api imported', api ? '✅' : '❌');

export const designService = {
  upload: (orderId, formData) => {
    console.log('📤 Uploading design for order:', orderId);
    return api.upload(API_PATHS.DESIGN.UPLOAD(orderId), formData);
  },

  update: (designId, formData) => {
    console.log('📝 Updating design:', designId);
    return api.upload(API_PATHS.DESIGN.UPDATE(designId), formData);
  },

  delete: (designId) => {
    console.log('🗑️ Deleting design:', designId);
    return api.delete(API_PATHS.DESIGN.DELETE(designId));
  },

  approve: (designId) => {
    console.log('✅ Approving design:', designId);
    return api.put(API_PATHS.DESIGN.APPROVE(designId));
  },

  getById: (designId) => {
    console.log('🔍 Getting design by ID:', designId);
    return api.get(API_PATHS.DESIGN.BY_ID(designId));
  },

  getByUser: (userId) => {
    console.log('🔍 Getting designs by user:', userId);
    return api.get(API_PATHS.DESIGN.BY_USER(userId));
  },

  getByOrder: (orderId) => {
    console.log('🔍 Getting designs by order:', orderId);
    return api.get(API_PATHS.DESIGN.BY_ORDER(orderId));
  },

  getByProduct: (productId) => {
    console.log('🔍 Getting designs by product:', productId);
    return api.get(API_PATHS.DESIGN.BY_PRODUCT(productId));
  },

  getAll: async (params = {}) => {
    try {
      console.log('🔍 designService.getAll called with params:', params);
      if (!api) {
        console.error('❌ api is undefined in designService');
        return {
          success: false,
          data: [],
          total: 0,
          page: params.page || 1,
          limit: params.limit || 10,
          pages: 0,
        };
      }
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      const queryString = queryParams.toString();
      const endpoint = queryString
        ? `${API_PATHS.DESIGN.ALL}?${queryString}`
        : API_PATHS.DESIGN.ALL;
      console.log('🔍 Fetching designs from endpoint:', endpoint);
      const response = await api.get(endpoint);
      console.log('✅ Designs response:', response);
      return response;
    } catch (error) {
      console.error('❌ Design service getAll error:', error);
      if (error.message === 'Design not found' || error.status === 400) {
        console.log('📭 No designs found, returning empty array');
        return {
          success: true,
          data: [],
          total: 0,
          page: params.page || 1,
          limit: params.limit || 10,
          pages: 0,
        };
      }
      if (error.status === 404) {
        console.log('📭 No designs found (404), returning empty array');
        return {
          success: true,
          data: [],
          total: 0,
          page: params.page || 1,
          limit: params.limit || 10,
          pages: 0,
        };
      }
      return {
        success: false,
        data: [],
        total: 0,
        page: params.page || 1,
        limit: params.limit || 10,
        pages: 0,
      };
    }
  },

  filter: async (params = {}) => {
    try {
      console.log('🔍 Filtering designs with params:', params);
      if (!api) {
        console.error('❌ api is undefined in designService');
        return { success: false, data: [], count: 0 };
      }
      const queryParams = new URLSearchParams();
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.orderId) queryParams.append('orderId', params.orderId);
      if (params.productId) queryParams.append('productId', params.productId);
      if (params.uploadedBy) queryParams.append('uploadedBy', params.uploadedBy);
      if (params.isApproved !== undefined) queryParams.append('isApproved', params.isApproved);
      if (params.minVersion) queryParams.append('minVersion', params.minVersion);
      if (params.maxVersion) queryParams.append('maxVersion', params.maxVersion);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      const queryString = queryParams.toString();
      const endpoint = queryString
        ? `${API_PATHS.DESIGN.FILTER}?${queryString}`
        : API_PATHS.DESIGN.FILTER;
      const response = await api.get(endpoint);
      console.log('✅ Filter response:', response);
      return response;
    } catch (error) {
      console.error('❌ Filter designs error:', error);
      if (error.message === 'Design not found' || error.status === 400) {
        return { success: true, data: [], count: 0 };
      }
      if (error.status === 404) {
        return { success: true, data: [], count: 0 };
      }
      return { success: false, data: [], count: 0 };
    }
  },
};

console.log('✅ designService loaded');
