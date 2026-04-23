import { api } from '@/lib/api';
import { API_PATHS, API_DEFAULTS } from '@/lib/constants';

export const productService = {
  // Get all products
  getList: (params = {}) => {
    const {
      page = API_DEFAULTS.PAGINATION_PAGE,
      limit = API_DEFAULTS.PAGINATION_LIMIT,
      ...rest
    } = params;
    const q = new URLSearchParams({ page, limit, ...rest }).toString();
    return api.get(q ? `${API_PATHS.PRODUCTS.LIST}?${q}` : API_PATHS.PRODUCTS.LIST);
  },

  // Get product by ID
  getById: (id) => api.get(API_PATHS.PRODUCTS.BY_ID(id)),

  // Filter products
  filter: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(q ? `${API_PATHS.PRODUCTS.FILTER}?${q}` : API_PATHS.PRODUCTS.FILTER);
  },

  // Search products by name
  searchByName: (name, params = {}) => {
    const q = new URLSearchParams({ name, ...params }).toString();
    return api.get(`${API_PATHS.PRODUCTS.SEARCH_BY_NAME}?${q}`);
  },

  // Create product in collection
  create: async (collectionId, formData) => {
    try {
      console.log('Creating product in collection:', collectionId);
      const response = await api.upload(
        API_PATHS.COLLECTIONS.CREATE_PRODUCT(collectionId),
        formData
      );
      return response;
    } catch (error) {
      console.error('Product creation failed:', error);
      throw error;
    }
  },

  // Update product
  update: (id, formData) => api.upload(API_PATHS.PRODUCTS.UPDATE(id), formData),

  // Delete product
  delete: (id) => api.delete(API_PATHS.PRODUCTS.DELETE(id)),
};
