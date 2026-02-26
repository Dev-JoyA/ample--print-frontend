import { api } from "@/lib/api";
import { API_PATHS, API_DEFAULTS } from "@/lib/constants";

export const customerBriefService = {
  submit: (orderId, productId, formData) =>
    api.upload(API_PATHS.CUSTOMER_BRIEFS.SUBMIT(orderId, productId), formData),

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

  getAdminBriefs: (params = {}) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(q ? `${API_PATHS.CUSTOMER_BRIEFS.ADMIN_BRIEFS}?${q}` : API_PATHS.CUSTOMER_BRIEFS.ADMIN_BRIEFS);
  },

  getByOrderAndProduct: (orderId, productId) =>
    api.get(API_PATHS.CUSTOMER_BRIEFS.BY_ORDER_PRODUCT(orderId, productId)),

  getById: (briefId) => api.get(API_PATHS.CUSTOMER_BRIEFS.BY_ID(briefId)),

  getStatus: (orderId, productId) =>
    api.get(API_PATHS.CUSTOMER_BRIEFS.STATUS(orderId, productId)),

  filter: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(q ? `${API_PATHS.CUSTOMER_BRIEFS.FILTER}?${q}` : API_PATHS.CUSTOMER_BRIEFS.FILTER);
  },

  delete: (briefId) => api.delete(API_PATHS.CUSTOMER_BRIEFS.DELETE(briefId)),
};
