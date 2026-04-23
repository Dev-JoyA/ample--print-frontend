import { api } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';

const getCurrentUserId = () => {
  try {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1];
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return decoded?.id || decoded?.userId || decoded?.sub;
    }
  } catch (error) {
    console.error('Failed to decode token:', error);
  }
  return null;
};

export const customerService = {
  getUserProfile: async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.warn('No user ID found in token');
        return { name: 'Customer', email: '' };
      }
      const response = await api.get(API_PATHS.USERS.BY_ID(userId));
      console.log('API response:', response);
      const userData = response?.user || response?.data?.user || response;
      console.log('Extracted userData:', userData);
      if (!userData) {
        console.error('No user data in response:', response);
        throw new Error('No user data received');
      }
      const userIdFromData = userData.user || userData._id || userData.id;
      if (!userIdFromData) {
        console.error('No user ID in userData:', userData);
        throw new Error('No user ID in response');
      }
      let displayName = 'Customer';
      if (userData.firstName) {
        displayName = userData.firstName;
        if (userData.lastName) {
          displayName += ` ${userData.lastName}`;
        }
      } else if (userData.email) {
        displayName = userData.email.split('@')[0];
      }
      return {
        id: userIdFromData,
        email: userData.email || '',
        name: displayName,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        userName: userData.userName || '',
        phoneNumber: userData.phoneNumber || '',
        address: userData.address || '',
        role: userData.role || 'Customer',
        isActive: userData.isActive !== undefined ? userData.isActive : true,
      };
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      try {
        const token = document.cookie
          .split('; ')
          .find((row) => row.startsWith('token='))
          ?.split('=')[1];
        if (token) {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          return {
            id: decoded?.id || decoded?.userId || decoded?.sub,
            email: decoded?.email || '',
            name: decoded?.email?.split('@')[0] || 'Customer',
            firstName: '',
            lastName: '',
            userName: '',
            phoneNumber: '',
            address: '',
            role: decoded?.role || 'Customer',
            isActive: true,
          };
        }
      } catch (e) {
        console.error('Failed to decode token for fallback:', e);
      }
      return {
        id: null,
        email: null,
        name: 'Customer',
        firstName: '',
        lastName: '',
        userName: '',
        phoneNumber: '',
        address: '',
        role: 'Customer',
        isActive: true,
      };
    }
  },

  getDashboardStats: async () => {
    try {
      let orders = [];
      let activeOrders = [];
      let designsForApproval = [];
      let completedOrders = [];
      try {
        const ordersResponse = await api.get(API_PATHS.ORDERS.MY_ORDERS);
        console.log('Orders response:', ordersResponse);
        if (ordersResponse?.orders) {
          orders = ordersResponse.orders;
        } else if (ordersResponse?.order) {
          orders = ordersResponse.order;
        } else if (Array.isArray(ordersResponse)) {
          orders = ordersResponse;
        } else if (ordersResponse?.data?.orders) {
          orders = ordersResponse.data.orders;
        } else if (ordersResponse?.data?.order) {
          orders = ordersResponse.data.order;
        }
        activeOrders = orders.filter(
          (o) => !['Delivered', 'Cancelled', 'Completed'].includes(o?.status)
        );
        designsForApproval = orders.filter(
          (o) => o?.status === 'DesignUploaded' || o?.status === 'UnderReview'
        );
        completedOrders = orders.filter((o) => ['Delivered', 'Completed'].includes(o?.status));
      } catch (orderError) {
        console.warn('Could not fetch orders:', orderError);
      }
      let pendingInvoices = [];
      try {
        const invoicesResponse = await api.get(API_PATHS.INVOICES.MY_INVOICES);
        console.log('Invoices response:', invoicesResponse);
        let invoices = [];
        if (invoicesResponse?.invoices) {
          invoices = invoicesResponse.invoices;
        } else if (invoicesResponse?.data?.invoices) {
          invoices = invoicesResponse.data.invoices;
        } else if (invoicesResponse?.data) {
          invoices = invoicesResponse.data;
        } else if (Array.isArray(invoicesResponse)) {
          invoices = invoicesResponse;
        }
        pendingInvoices = invoices.filter(
          (i) => i?.status === 'Sent' || i?.status === 'Pending' || i?.status === 'PartPayment'
        );
      } catch (invoiceError) {
        console.warn('Could not fetch invoices:', invoiceError);
      }
      return {
        activeOrders: activeOrders.length,
        pendingInvoices: pendingInvoices.length,
        designsForApproval: designsForApproval.length,
        completedOrders: completedOrders.length,
        recentOrders: orders.slice(0, 5) || [],
        unpaidInvoices: pendingInvoices.slice(0, 5),
      };
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      return {
        activeOrders: 0,
        pendingInvoices: 0,
        designsForApproval: 0,
        completedOrders: 0,
        recentOrders: [],
        unpaidInvoices: [],
      };
    }
  },

  getRecentOrders: async (limit = 5) => {
    try {
      const response = await api.get(`${API_PATHS.ORDERS.MY_ORDERS}?limit=${limit}`);
      if (response?.orders) return response.orders;
      if (response?.order) return response.order;
      if (response?.data?.orders) return response.data.orders;
      if (response?.data?.order) return response.data.order;
      if (Array.isArray(response)) return response;
      return [];
    } catch (error) {
      console.warn('Failed to fetch recent orders:', error);
      return [];
    }
  },

  getPendingInvoices: async (limit = 5) => {
    try {
      const response = await api.get(`${API_PATHS.INVOICES.MY_INVOICES}?limit=${limit}`);
      if (response?.invoices) return response.invoices;
      if (response?.data?.invoices) return response.data.invoices;
      if (response?.data) return response.data;
      if (Array.isArray(response)) return response;
      return [];
    } catch (error) {
      console.warn('Failed to fetch pending invoices:', error);
      return [];
    }
  },

  getOrderById: async (orderId) => {
    try {
      const response = await api.get(API_PATHS.ORDERS.BY_ID(orderId));
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch order:', error);
      throw error;
    }
  },

  getInvoiceById: async (invoiceId) => {
    try {
      const response = await api.get(API_PATHS.INVOICES.BY_ID(invoiceId));
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      const response = await api.put(API_PATHS.USERS.UPDATE_PROFILE(userId), profileData);
      return response.data || response;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  getOrderTracking: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/tracking`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch tracking:', error);
      throw error;
    }
  },

  getNotifications: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = queryParams
        ? `${API_PATHS.NOTIFICATIONS.HISTORY}?${queryParams}`
        : API_PATHS.NOTIFICATIONS.HISTORY;
      const response = await api.get(endpoint);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  },

  markNotificationRead: async (notificationId) => {
    try {
      const response = await api.patch(API_PATHS.NOTIFICATIONS.MARK_READ(notificationId), {});
      return response.data || response;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  },

  getAddresses: async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      const response = await api.get(API_PATHS.USERS.ADDRESS(userId));
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      return [];
    }
  },

  addAddress: async (addressData) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      const response = await api.post(API_PATHS.USERS.ADDRESS(userId), addressData);
      return response.data || response;
    } catch (error) {
      console.error('Failed to add address:', error);
      throw error;
    }
  },

  updateAddress: async (addressId, addressData) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      const response = await api.put(
        `${API_PATHS.USERS.ADDRESS(userId)}/${addressId}`,
        addressData
      );
      return response.data || response;
    } catch (error) {
      console.error('Failed to update address:', error);
      throw error;
    }
  },

  deleteAddress: async (addressId) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      const response = await api.delete(`${API_PATHS.USERS.ADDRESS(userId)}/${addressId}`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to delete address:', error);
      throw error;
    }
  },

  getPaymentMethods: async () => {
    try {
      const response = await api.get('/payments/methods');
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      return [];
    }
  },

  addPaymentMethod: async (paymentData) => {
    try {
      const response = await api.post('/payments/methods', paymentData);
      return response.data || response;
    } catch (error) {
      console.error('Failed to add payment method:', error);
      throw error;
    }
  },

  deletePaymentMethod: async (methodId) => {
    try {
      const response = await api.delete(`/payments/methods/${methodId}`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      throw error;
    }
  },

  getTransactions: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = queryParams
        ? `${API_PATHS.PAYMENTS.MY_TRANSACTIONS}?${queryParams}`
        : API_PATHS.PAYMENTS.MY_TRANSACTIONS;
      const response = await api.get(endpoint);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      return [];
    }
  },

  downloadInvoice: async (invoiceId) => {
    try {
      const response = await api.get(API_PATHS.INVOICES.PDF(invoiceId), {
        fetchOpts: { responseType: 'blob' },
      });
      return response;
    } catch (error) {
      console.error('Failed to download invoice:', error);
      throw error;
    }
  },

  getOrderHistory: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = queryParams
        ? `${API_PATHS.ORDERS.MY_ORDERS}?${queryParams}`
        : API_PATHS.ORDERS.MY_ORDERS;
      const response = await api.get(endpoint);
      if (response?.orders) return response.orders;
      if (response?.order) return response.order;
      if (response?.data?.orders) return response.data.orders;
      if (response?.data?.order) return response.data.order;
      if (Array.isArray(response)) return response;
      return [];
    } catch (error) {
      console.error('Failed to fetch order history:', error);
      return [];
    }
  },

  trackOrderByNumber: async (orderNumber) => {
    try {
      const response = await api.get(`/orders/track/${orderNumber}`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to track order:', error);
      throw error;
    }
  },

  getMetrics: async () => {
    try {
      const orders = await customerService.getOrderHistory({ limit: 1000 });
      const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const totalOrders = orders.length;
      const completedOrders = orders.filter(
        (o) => o.status === 'Delivered' || o.status === 'Completed'
      ).length;
      const pendingOrders = orders.filter(
        (o) => o.status !== 'Delivered' && o.status !== 'Completed' && o.status !== 'Cancelled'
      ).length;
      return {
        totalSpent,
        totalOrders,
        completedOrders,
        pendingOrders,
        averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
      };
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      return {
        totalSpent: 0,
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        averageOrderValue: 0,
      };
    }
  },

  getBriefsByOrderAndProduct: async (orderId, productId) => {
    console.log(`📋 Fetching briefs for order ${orderId}, product ${productId}`);
    try {
      const response = await api.get(
        API_PATHS.CUSTOMER_BRIEFS.BY_ORDER_PRODUCT(orderId, productId)
      );
      console.log('✅ Briefs fetched:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch briefs:', error);
      return { data: null };
    }
  },
};
