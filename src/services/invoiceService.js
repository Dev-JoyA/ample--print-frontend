import { api } from "@/lib/api";

export const invoiceService = {
  // Create shipping invoice (Admin only)
  createShippingInvoice: async (orderId, shippingId, data) => {
    try {
      const response = await api.post(`/invoices/shipping/order/${orderId}/shipping/${shippingId}`, data);
      return response;
    } catch (error) {
      console.error('Failed to create shipping invoice:', error);
      throw error;
    }
  },

  // Update invoice (draft only)
  update: async (invoiceId, data) => {
    try {
      const response = await api.put(`/invoices/${invoiceId}`, data);
      return response;
    } catch (error) {
      console.error('Failed to update invoice:', error);
      throw error;
    }
  },


  // Delete invoice (draft only, Super Admin only)
  delete: async (invoiceId) => {
    try {
      const response = await api.delete(`/invoices/${invoiceId}`);
      return response;
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      throw error;
    }
  },

  // Get invoice by invoice number
  getByNumber: async (invoiceNumber) => {
    try {
      const response = await api.get(`/invoices/number/${invoiceNumber}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch invoice by number:', error);
      throw error;
    }
  },

  // Get invoice by order ID
  getByOrderId: async (orderId) => {
    try {
      const response = await api.get(`/invoices/order-id/${orderId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch invoice by order:', error);
      throw error;
    }
  },

  // Get invoice by order number
  getByOrderNumber: async (orderNumber) => {
    try {
      const response = await api.get(`/invoices/order-number/${orderNumber}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch invoice by order number:', error);
      throw error;
    }
  },

  // Get user's invoices (Customer only)
  getMyInvoices: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/invoices/my-invoices?${queryString}` : '/invoices/my-invoices';
      
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to fetch user invoices:', error);
      return { invoices: [], total: 0 };
    }
  },

  // Filter invoices (Admin only)
  filter: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/invoices/filter?${queryString}` : '/invoices/filter';
      
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to filter invoices:', error);
      return { invoices: [], total: 0 };
    }
  },
  // Get orders ready for invoice
  getOrdersReadyForInvoice: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/orders/ready-for-invoice?${queryString}` : '/orders/ready-for-invoice';
      
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to fetch orders ready for invoice:', error);
      return { orders: [], total: 0 };
    }
  },

  // Get order details with products and briefs
  getOrderWithBriefs: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/with-briefs`);
      return response;
    } catch (error) {
      console.error('Failed to fetch order with briefs:', error);
      throw error;
    }
  },

  // Create invoice for order
  createForOrder: async (orderId, data) => {
    try {
      const response = await api.post(`/invoices/order/${orderId}`, data);
      return response;
    } catch (error) {
      console.error('Failed to create invoice:', error);
      throw error;
    }
  },

  // Get all invoices
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/invoices/all?${queryString}` : '/invoices/all';
      
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      return { invoices: [], total: 0 };
    }
  },

  // Get invoice by ID
  getById: async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/id/${invoiceId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      throw error;
    }
  },

  // Send invoice to customer
  send: async (invoiceId) => {
    try {
      const response = await api.post(`/invoices/${invoiceId}/send`);
      return response;
    } catch (error) {
      console.error('Failed to send invoice:', error);
      throw error;
    }
  }
};