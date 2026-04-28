import { api } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';

export const orderService = {
  create: (data) => api.post(API_PATHS.ORDERS.CREATE, data),

  getMyOrders: (params = {}) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(q ? `${API_PATHS.ORDERS.MY_ORDERS}?${q}` : API_PATHS.ORDERS.MY_ORDERS);
  },

  getById: (id) => api.get(API_PATHS.ORDERS.BY_ID(id)),

  update: (id, data) => api.put(API_PATHS.ORDERS.BY_ID(id), data),

  delete: (id) => api.delete(API_PATHS.ORDERS.BY_ID(id)),

  updateStatus: (id, status) => api.patch(API_PATHS.ORDERS.STATUS(id), { status }),

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
    console.warn('⚠️ getNeedingInvoice is deprecated. Use getOrdersReadyForInvoice instead.');
    const q = new URLSearchParams(params || {}).toString();
    return api.get(
      q ? `${API_PATHS.ORDERS.READY_FOR_INVOICE}?${q}` : API_PATHS.ORDERS.READY_FOR_INVOICE
    );
  },

  getOrdersReadyForInvoice: async (params = {}) => {
    console.log('📋 Fetching orders ready for invoice');
    try {
      const { page = 1, limit = 10, ...rest } = params;
      const q = new URLSearchParams({ page, limit, ...rest }).toString();
      const response = await api.get(
        q ? `${API_PATHS.ORDERS.READY_FOR_INVOICE}?${q}` : API_PATHS.ORDERS.READY_FOR_INVOICE
      );
      console.log('✅ Orders ready for invoice:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch orders ready for invoice:', error);
      return { orders: [], total: 0, page: 1, pages: 0 };
    }
  },

  searchByOrderNumber: async (orderNumber) => {
    console.log(`🔍 Searching for order: ${orderNumber}`);
    try {
      const response = await api.get(API_PATHS.ORDERS.SEARCH(orderNumber));
      console.log('Search response:', response);
      return response;
    } catch (error) {
      if (
        error.status === 404 ||
        (error.status === 400 && error.data?.message === 'Order not found')
      ) {
        console.log('ℹ️ Order not found (expected for fallback)');
        return null;
      }
      console.error('Failed to search order:', error);
      throw error;
    }
  },

  addItemToOrder: (orderId, data) => api.post(API_PATHS.ORDERS.ADD_ITEM(orderId), data),

  getUserActiveOrders: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return api.get(`${API_PATHS.ORDERS.MY_ACTIVE_ORDERS}${q ? `?${q}` : ''}`);
  },
};
