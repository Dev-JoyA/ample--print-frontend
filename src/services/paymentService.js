import { api } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';

export const paymentService = {
  initializePaystack: async (data) => {
    try {
      const response = await api.post(API_PATHS.PAYMENTS.PAYSTACK_INITIALIZE, data);
      return response;
    } catch (error) {
      console.error('Failed to initialize payment:', error);
      throw error;
    }
  },

  verifyPaystack: async (reference) => {
    try {
      const response = await api.get(
        `${API_PATHS.PAYMENTS.PAYSTACK_VERIFY}?reference=${reference}`
      );
      return response;
    } catch (error) {
      console.error('Failed to verify payment:', error);
      throw error;
    }
  },

  uploadBankTransferReceipt: async (formData) => {
    try {
      const response = await api.upload(API_PATHS.PAYMENTS.BANK_TRANSFER_UPLOAD, formData);
      return response;
    } catch (error) {
      console.error('Failed to upload receipt:', error);
      throw error;
    }
  },

  verifyBankTransfer: async (transactionId, data) => {
    try {
      const response = await api.post(API_PATHS.PAYMENTS.BANK_TRANSFER_VERIFY(transactionId), data);
      return response;
    } catch (error) {
      console.error('Failed to verify bank transfer:', error);
      throw error;
    }
  },

  getPendingBankTransfers: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      const queryString = queryParams.toString();
      const endpoint = queryString
        ? `${API_PATHS.PAYMENTS.BANK_TRANSFER_PENDING}?${queryString}`
        : API_PATHS.PAYMENTS.BANK_TRANSFER_PENDING;
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to fetch pending transfers:', error);
      return { transactions: [], total: 0 };
    }
  },

  getByOrder: async (orderId) => {
    try {
      const response = await api.get(API_PATHS.PAYMENTS.BY_ORDER(orderId));
      return response;
    } catch (error) {
      console.error('Failed to fetch order transactions:', error);
      throw error;
    }
  },

  getByInvoice: async (invoiceId) => {
    try {
      const response = await api.get(API_PATHS.PAYMENTS.BY_INVOICE(invoiceId));
      return response;
    } catch (error) {
      console.error('Failed to fetch invoice transactions:', error);
      throw error;
    }
  },

  getMyTransactions: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      const queryString = queryParams.toString();
      const endpoint = queryString
        ? `${API_PATHS.PAYMENTS.MY_TRANSACTIONS}?${queryString}`
        : API_PATHS.PAYMENTS.MY_TRANSACTIONS;
      const response = await api.get(endpoint);
      return response;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      return { transactions: [], total: 0 };
    }
  },
};
