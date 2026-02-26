import { api } from "@/lib/api";
import { API_PATHS } from "@/lib/constants";

export const designService = {
  upload: (productId, formData) =>
    api.upload(API_PATHS.DESIGN.UPLOAD(productId), formData),

  update: (designId, formData) =>
    api.put(API_PATHS.DESIGN.UPDATE(designId), formData),

  delete: (designId) => api.delete(API_PATHS.DESIGN.DELETE(designId)),

  approve: (designId) => api.put(API_PATHS.DESIGN.APPROVE(designId)),

  getById: (designId) => api.get(API_PATHS.DESIGN.BY_ID(designId)),

  getByUser: (userId) => api.get(API_PATHS.DESIGN.BY_USER(userId)),

  getByOrder: (orderId) => api.get(API_PATHS.DESIGN.BY_ORDER(orderId)),

  getByProduct: (productId) => api.get(API_PATHS.DESIGN.BY_PRODUCT(productId)),

  getAll: (params = {}) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(q ? `${API_PATHS.DESIGN.ALL}?${q}` : API_PATHS.DESIGN.ALL);
  },

  filter: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(q ? `${API_PATHS.DESIGN.FILTER}?${q}` : API_PATHS.DESIGN.FILTER);
  },
};
