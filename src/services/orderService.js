import { api } from "@/lib/api";
import { API_PATHS, API_DEFAULTS } from "@/lib/constants";

export const orderService = {
  create: (data) => api.post(API_PATHS.ORDERS.CREATE, data),

  getMyOrders: (params = {}) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(q ? `${API_PATHS.ORDERS.MY_ORDERS}?${q}` : API_PATHS.ORDERS.MY_ORDERS);
  },

  getById: (id) => api.get(API_PATHS.ORDERS.BY_ID(id)),

  update: (id, data) => api.put(API_PATHS.ORDERS.BY_ID(id), data),

  delete: (id) => api.delete(API_PATHS.ORDERS.BY_ID(id)),

  updateStatus: (id, status) =>
    api.patch(API_PATHS.ORDERS.STATUS(id), { status }),

  superAdminCreate: (customerId, data) =>
    api.post(API_PATHS.ORDERS.SUPERADMIN_CREATE(customerId), data),

  getAll: (params = {}) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(q ? `${API_PATHS.ORDERS.LIST}?${q}` : API_PATHS.ORDERS.LIST);
  },

  filter: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(q ? `${API_PATHS.ORDERS.FILTER}?${q}` : API_PATHS.ORDERS.FILTER);
  },

  getNeedingInvoice: (params = {}) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(q ? `${API_PATHS.ORDERS.NEEDING_INVOICE}?${q}` : API_PATHS.ORDERS.NEEDING_INVOICE);
  },

  searchByOrderNumber: (orderNumber) =>
    api.get(API_PATHS.ORDERS.SEARCH(orderNumber)),
};
