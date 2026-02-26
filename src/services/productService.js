import { api } from "@/lib/api";
import { API_PATHS, API_DEFAULTS } from "@/lib/constants";

export const productService = {
  getList: (params = {}) => {
    const { page = API_DEFAULTS.PAGINATION_PAGE, limit = API_DEFAULTS.PAGINATION_LIMIT, ...rest } = params;
    const q = new URLSearchParams({ page, limit, ...rest }).toString();
    return api.get(q ? `${API_PATHS.PRODUCTS.LIST}?${q}` : API_PATHS.PRODUCTS.LIST);
  },

  getById: (id) => api.get(API_PATHS.PRODUCTS.BY_ID(id)),

  filter: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(q ? `${API_PATHS.PRODUCTS.FILTER}?${q}` : API_PATHS.PRODUCTS.FILTER);
  },

  searchByName: (name, params = {}) => {
    const q = new URLSearchParams({ name, ...params }).toString();
    return api.get(`${API_PATHS.PRODUCTS.SEARCH_BY_NAME}?${q}`);
  },

  update: (id, formData) =>
    api.upload(API_PATHS.PRODUCTS.UPDATE(id), formData),

  delete: (id) => api.delete(API_PATHS.PRODUCTS.DELETE(id)),
};
