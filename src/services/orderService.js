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

  // DEPRECATED: Use getOrdersReadyForInvoice instead
  // Keeping for backward compatibility
  getNeedingInvoice: (params = {}) => {
    console.warn("⚠️ getNeedingInvoice is deprecated. Use getOrdersReadyForInvoice instead.");
    const q = new URLSearchParams(params || {}).toString();
    // Both point to the same endpoint now
    return api.get(q ? `${API_PATHS.ORDERS.READY_FOR_INVOICE}?${q}` : API_PATHS.ORDERS.READY_FOR_INVOICE);
  },

  // RECOMMENDED: Use this method for orders ready for invoice
  getOrdersReadyForInvoice: async (params = {}) => {
    console.log("📋 Fetching orders ready for invoice");
    try {
      const q = new URLSearchParams(params || {}).toString();
      const response = await api.get(q ? `${API_PATHS.ORDERS.READY_FOR_INVOICE}?${q}` : API_PATHS.ORDERS.READY_FOR_INVOICE);
      console.log("✅ Orders ready for invoice:", response);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch orders ready for invoice:", error);
      // Return empty result instead of throwing
      return { orders: [], total: 0 };
    }
  },

 searchByOrderNumber: async (orderNumber) => {
  console.log(`🔍 Searching for order: ${orderNumber}`);
  try {
    const response = await api.get(`/orders/search/${orderNumber}`);
    console.log('Search response:', response);
    return response;
  } catch (error) {
    // If it's a "not found" error, return null instead of throwing
    if (error.status === 404 || 
        (error.status === 400 && error.data?.message === "Order not found")) {
      console.log('ℹ️ Order not found (expected for fallback)');
      return null; // Return null instead of throwing
    }
    
    // For other errors, still throw
    console.error('Failed to search order:', error);
    throw error;
  }
},

  addItemToOrder: (orderId, data) => 
    api.post(`/orders/${orderId}/items`, data),

  getUserActiveOrders: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`/orders/my-active-orders${q ? `?${q}` : ''}`);
  },    
};