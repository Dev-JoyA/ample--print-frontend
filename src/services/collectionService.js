import { api } from '@/lib/api';
import { API_PATHS, API_DEFAULTS } from '@/lib/constants';

export const collectionService = {
  getAll: (params = {}) => {
    const {
      page = API_DEFAULTS.PAGINATION_PAGE,
      limit = API_DEFAULTS.PAGINATION_LIMIT,
      ...rest
    } = params;
    const q = new URLSearchParams({ page, limit, ...rest }).toString();
    return api.get(q ? `${API_PATHS.COLLECTIONS.LIST}?${q}` : API_PATHS.COLLECTIONS.LIST);
  },

  getById: (id) => api.get(API_PATHS.COLLECTIONS.BY_ID(id)),

  create: (data) => api.post(API_PATHS.COLLECTIONS.LIST, data),

  update: (id, data) => api.put(API_PATHS.COLLECTIONS.BY_ID(id), data),

  delete: (id) => api.delete(API_PATHS.COLLECTIONS.BY_ID(id)),

  getCollectionProducts: (collectionId, params = {}) => {
    const { page = API_DEFAULTS.PAGINATION_PAGE, limit = API_DEFAULTS.PAGINATION_LIMIT } = params;
    const q = new URLSearchParams({ page, limit }).toString();
    return api.get(
      q
        ? `${API_PATHS.COLLECTIONS.ALL_PRODUCTS(collectionId)}?${q}`
        : API_PATHS.COLLECTIONS.ALL_PRODUCTS(collectionId)
    );
  },

  createProduct: (collectionId, formData) =>
    api.upload(API_PATHS.COLLECTIONS.CREATE_PRODUCT(collectionId), formData),
};
