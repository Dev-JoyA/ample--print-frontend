import { api } from "@/lib/api";

export const paymentService = {
  // Initialize Paystack payment (Customer only)
  initializePaystack: async (data) => {
    try {
      const response = await api.post('/payments/paystack/initialize', data);
      return response;
    } catch (error) {
      console.error('Failed to initialize payment:', error);
      throw error;
    }
  },

  // Verify Paystack payment
  verifyPaystack: async (reference) => {
    try {
      const response = await api.get(`/payments/paystack/verify?reference=${reference}`);
      return response;
    } catch (error) {
      console.error('Failed to verify payment:', error);
      throw error;
    }
  },

  // Upload bank transfer receipt (Customer only)
  uploadBankTransferReceipt: async (formData) => {
    try {
      const response = await api.upload('/payments/bank-transfer/upload-receipt', formData);
      return response;
    } catch (error) {
      console.error('Failed to upload receipt:', error);
      throw error;
    }
  },

  // Verify bank transfer (Super Admin only)
  verifyBankTransfer: async (transactionId, data) => {
    try {
      const response = await api.post(`/payments/bank-transfer/verify/${transactionId}`, data);
      return response;
    } catch (error) {
      console.error('Failed to verify bank transfer:', error);
      throw error;
    }
  },

  // Get pending bank transfers (Super Admin only)
  getPendingBankTransfers: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/payments/bank-transfer/pending?${queryString}` : '/payments/bank-transfer/pending';
      
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to fetch pending transfers:', error);
      return { transactions: [], total: 0 };
    }
  },

  // Get transactions by order
  getByOrder: async (orderId) => {
    try {
      const response = await api.get(`/payments/order/${orderId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch order transactions:', error);
      throw error;
    }
  },

  // Get transactions by invoice
  getByInvoice: async (invoiceId) => {
    try {
      const response = await api.get(`/payments/invoice/${invoiceId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch invoice transactions:', error);
      throw error;
    }
  },

  // Get current user's transactions (Customer only)
  getMyTransactions: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/payments/my-transactions?${queryString}` : '/payments/my-transactions';
      
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      return { transactions: [], total: 0 };
    }
  }
};