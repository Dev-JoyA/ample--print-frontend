import { api } from "@/lib/api";
import { API_PATHS } from "@/lib/constants";

const getToken = () => {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
};

const API_BASE_URL =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001/api/v1"
    : "http://localhost:4001/api/v1";

export const invoiceService = {
  createShippingInvoice: async (orderId, shippingId, data) => {
    try {
      const response = await api.post(API_PATHS.INVOICES.CREATE_SHIPPING(orderId, shippingId), data);
      return response;
    } catch (error) {
      console.error('Failed to create shipping invoice:', error);
      throw error;
    }
  },

  update: async (invoiceId, data) => {
    try {
      console.log(`Updating invoice ${invoiceId} with:`, data);
      const response = await api.put(API_PATHS.INVOICES.UPDATE(invoiceId), data);
      return response;
    } catch (error) {
      console.error('Failed to update invoice:', error);
      throw error;
    }
  },

  delete: async (invoiceId) => {
    try {
      const response = await api.delete(API_PATHS.INVOICES.DELETE(invoiceId));
      return response;
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      throw error;
    }
  },

  getByNumber: async (invoiceNumber) => {
    try {
      const response = await api.get(API_PATHS.INVOICES.BY_NUMBER(invoiceNumber));
      return response;
    } catch (error) {
      console.error('Failed to fetch invoice by number:', error);
      throw error;
    }
  },

  getByOrderId: async (orderId) => {
    try {
      const response = await api.get(API_PATHS.INVOICES.BY_ORDER_ID(orderId));
      return response;
    } catch (error) {
      console.error('Failed to fetch invoice by order:', error);
      throw error;
    }
  },

  getByOrderNumber: async (orderNumber) => {
    try {
      const response = await api.get(API_PATHS.INVOICES.BY_ORDER_NUMBER(orderNumber));
      return response;
    } catch (error) {
      console.error('Failed to fetch invoice by order number:', error);
      throw error;
    }
  },

  getMyInvoices: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      const queryString = queryParams.toString();
      const endpoint = queryString ? `${API_PATHS.INVOICES.MY_INVOICES}?${queryString}` : API_PATHS.INVOICES.MY_INVOICES;
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to fetch user invoices:', error);
      return { invoices: [], total: 0 };
    }
  },

  filter: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      const queryString = queryParams.toString();
      const endpoint = queryString ? `${API_PATHS.INVOICES.FILTER}?${queryString}` : API_PATHS.INVOICES.FILTER;
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to filter invoices:', error);
      return { invoices: [], total: 0 };
    }
  },

  getOrdersReadyForInvoice: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      const queryString = queryParams.toString();
      const endpoint = queryString ? `${API_PATHS.ORDERS.READY_FOR_INVOICE}?${queryString}` : API_PATHS.ORDERS.READY_FOR_INVOICE;
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to fetch orders ready for invoice:', error);
      return { orders: [], total: 0 };
    }
  },

  getOrderWithBriefs: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/with-briefs`);
      return response;
    } catch (error) {
      console.error('Failed to fetch order with briefs:', error);
      throw error;
    }
  },

  createForOrder: async (orderId, data) => {
    try {
      const response = await api.post(API_PATHS.INVOICES.CREATE_FOR_ORDER(orderId), data);
      return response;
    } catch (error) {
      console.error('Failed to create invoice:', error);
      throw error;
    }
  },

  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      const queryString = queryParams.toString();
      const endpoint = queryString ? `${API_PATHS.INVOICES.ALL}?${queryString}` : API_PATHS.INVOICES.ALL;
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      return { invoices: [], total: 0 };
    }
  },

  getById: async (invoiceId) => {
    try {
      const response = await api.get(API_PATHS.INVOICES.BY_ID(invoiceId));
      return response;
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      throw error;
    }
  },

  send: async (invoiceId) => {
    try {
      const response = await api.post(API_PATHS.INVOICES.SEND(invoiceId));
      return response;
    } catch (error) {
      console.error('Failed to send invoice:', error);
      throw error;
    }
  },

  downloadInvoice: async (invoiceId) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_PATHS.INVOICES.PDF(invoiceId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }
      return await response.blob();
    } catch (error) {
      console.error('Failed to download invoice:', error);
      throw error;
    }
  },
};