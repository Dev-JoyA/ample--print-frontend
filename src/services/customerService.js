import { api } from "@/lib/api";

// Helper to get current user ID from token
const getCurrentUserId = () => {
  try {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
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
  // Get user profile - FIXED for your actual API response
  getUserProfile: async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.warn('No user ID found in token');
        return { name: 'Customer', email: '' };
      }

      // Fetch user from backend
      const response = await api.get(`/users/${userId}`);
      
      console.log('API response:', response);
      
      // Extract user data - your API returns { user: { ... } }
      const userData = response?.user || response?.data?.user || response;
      
      console.log('Extracted userData:', userData);
      
      if (!userData) {
        console.error('No user data in response:', response);
        throw new Error('No user data received');
      }

      // The user ID is in the 'user' field (string) not '_id'
      const userIdFromData = userData.user || userData._id || userData.id;
      
      if (!userIdFromData) {
        console.error('No user ID in userData:', userData);
        throw new Error('No user ID in response');
      }

      // Construct name from firstName and lastName
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
        isActive: userData.isActive !== undefined ? userData.isActive : true
      };

    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      
      // Fallback to token data
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
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
            isActive: true
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
        isActive: true
      };
    }
  },

  // Get customer dashboard stats
  getDashboardStats: async () => {
    try {
      // Fetch orders
      let orders = [];
      let activeOrders = [];
      let designsForApproval = [];
      let completedOrders = [];
      
      try {
        const ordersResponse = await api.get('/orders/my-orders?limit=100');
        console.log('Orders response:', ordersResponse);
        
        // Handle different response structures
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
        
        activeOrders = orders.filter(o => 
          !['Delivered', 'Cancelled', 'Completed'].includes(o?.status)
        );
        
        designsForApproval = orders.filter(o => 
          o?.status === 'DesignUploaded' || o?.status === 'UnderReview'
        );
        
        completedOrders = orders.filter(o => 
          ['Delivered', 'Completed'].includes(o?.status)
        );
      } catch (orderError) {
        console.warn('Could not fetch orders:', orderError);
      }

      // Fetch invoices
      let pendingInvoices = [];
      try {
        const invoicesResponse = await api.get('/invoices/my-invoices?limit=100');
        console.log('Invoices response:', invoicesResponse);
        
        // Handle different response structures
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
        
        pendingInvoices = invoices.filter(i => 
          i?.status === 'Sent' || i?.status === 'Pending' || i?.status === 'PartPayment'
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
        unpaidInvoices: pendingInvoices.slice(0, 5)
      };
      
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      return {
        activeOrders: 0,
        pendingInvoices: 0,
        designsForApproval: 0,
        completedOrders: 0,
        recentOrders: [],
        unpaidInvoices: []
      };
    }
  },

  // Get recent orders
  getRecentOrders: async (limit = 5) => {
    try {
      const response = await api.get(`/orders/my-orders?limit=${limit}`);
      // Handle different response structures
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

  // Get pending invoices
  getPendingInvoices: async (limit = 5) => {
    try {
      const response = await api.get(`/invoices/my-invoices?limit=${limit}`);
      // Handle different response structures
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

  // Get single order by ID
  getOrderById: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch order:', error);
      throw error;
    }
  },

  // Get single invoice by ID
  getInvoiceById: async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/id/${invoiceId}`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      
      const response = await api.put(`/users/${userId}/profile`, profileData);
      return response.data || response;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  },

  // Get order tracking information
  getOrderTracking: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/tracking`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch tracking:', error);
      throw error;
    }
  },

  // Get customer notifications
  getNotifications: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = queryParams ? `/notifications?${queryParams}` : '/notifications';
      const response = await api.get(endpoint);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  },

  // Mark notification as read
  markNotificationRead: async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`, {});
      return response.data || response;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  },

  // Get customer addresses
  getAddresses: async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      
      const response = await api.get(`/users/${userId}/address`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      return [];
    }
  },

  // Add new address
  addAddress: async (addressData) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      
      const response = await api.post(`/users/${userId}/address`, addressData);
      return response.data || response;
    } catch (error) {
      console.error('Failed to add address:', error);
      throw error;
    }
  },

  // Update address
  updateAddress: async (addressId, addressData) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      
      const response = await api.put(`/users/${userId}/address/${addressId}`, addressData);
      return response.data || response;
    } catch (error) {
      console.error('Failed to update address:', error);
      throw error;
    }
  },

  // Delete address
  deleteAddress: async (addressId) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      
      const response = await api.delete(`/users/${userId}/address/${addressId}`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to delete address:', error);
      throw error;
    }
  },

  // Get payment methods
  getPaymentMethods: async () => {
    try {
      const response = await api.get('/payments/methods');
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      return [];
    }
  },

  // Add payment method
  addPaymentMethod: async (paymentData) => {
    try {
      const response = await api.post('/payments/methods', paymentData);
      return response.data || response;
    } catch (error) {
      console.error('Failed to add payment method:', error);
      throw error;
    }
  },

  // Delete payment method
  deletePaymentMethod: async (methodId) => {
    try {
      const response = await api.delete(`/payments/methods/${methodId}`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to delete payment method:', error);
      throw error;
    }
  },

  // Get transaction history
  getTransactions: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = queryParams ? `/payments/my-transactions?${queryParams}` : '/payments/my-transactions';
      const response = await api.get(endpoint);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      return [];
    }
  },

  // Download invoice PDF
  downloadInvoice: async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/pdf`, {
        fetchOpts: { responseType: 'blob' }
      });
      return response;
    } catch (error) {
      console.error('Failed to download invoice:', error);
      throw error;
    }
  },

  // Get customer support tickets
  getSupportTickets: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = queryParams ? `/support/tickets?${queryParams}` : '/support/tickets';
      const response = await api.get(endpoint);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch support tickets:', error);
      return [];
    }
  },

  // Create support ticket
  createSupportTicket: async (ticketData) => {
    try {
      const response = await api.post('/support/tickets', ticketData);
      return response.data || response;
    } catch (error) {
      console.error('Failed to create support ticket:', error);
      throw error;
    }
  },

  // Get ticket messages
  getTicketMessages: async (ticketId) => {
    try {
      const response = await api.get(`/support/tickets/${ticketId}/messages`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch ticket messages:', error);
      return [];
    }
  },

  // Reply to ticket
  replyToTicket: async (ticketId, message) => {
    try {
      const response = await api.post(`/support/tickets/${ticketId}/reply`, { message });
      return response.data || response;
    } catch (error) {
      console.error('Failed to reply to ticket:', error);
      throw error;
    }
  },

  // Get wishlist
  getWishlist: async () => {
    try {
      const response = await api.get('/wishlist');
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      return [];
    }
  },

  // Add to wishlist
  addToWishlist: async (productId) => {
    try {
      const response = await api.post('/wishlist', { productId });
      return response.data || response;
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      throw error;
    }
  },

  // Remove from wishlist
  removeFromWishlist: async (productId) => {
    try {
      const response = await api.delete(`/wishlist/${productId}`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      throw error;
    }
  },

  // Check if product is in wishlist
  isInWishlist: async (productId) => {
    try {
      const wishlist = await customerService.getWishlist();
      return wishlist.some(item => item.productId === productId || item.productId._id === productId);
    } catch (error) {
      console.error('Failed to check wishlist:', error);
      return false;
    }
  },

  // Get customer reviews
  getReviews: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = queryParams ? `/reviews?${queryParams}` : '/reviews';
      const response = await api.get(endpoint);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      return [];
    }
  },

  // Submit review
  submitReview: async (productId, reviewData) => {
    try {
      const response = await api.post(`/reviews/${productId}`, reviewData);
      return response.data || response;
    } catch (error) {
      console.error('Failed to submit review:', error);
      throw error;
    }
  },

  // Update review
  updateReview: async (reviewId, reviewData) => {
    try {
      const response = await api.put(`/reviews/${reviewId}`, reviewData);
      return response.data || response;
    } catch (error) {
      console.error('Failed to update review:', error);
      throw error;
    }
  },

  // Delete review
  deleteReview: async (reviewId) => {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to delete review:', error);
      throw error;
    }
  },

  // Get customer settings
  getSettings: async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      
      const response = await api.get(`/users/${userId}/settings`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      return {};
    }
  },

  // Update customer settings
  updateSettings: async (settingsData) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');
      
      const response = await api.put(`/users/${userId}/settings`, settingsData);
      return response.data || response;
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  },

  // Get order history with filters
  getOrderHistory: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = queryParams ? `/orders/my-orders?${queryParams}` : '/orders/my-orders';
      const response = await api.get(endpoint);
      
      // Handle different response structures
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

  // Track order by order number
  trackOrderByNumber: async (orderNumber) => {
    try {
      const response = await api.get(`/orders/track/${orderNumber}`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to track order:', error);
      throw error;
    }
  },

  // Get customer metrics
  getMetrics: async () => {
    try {
      const orders = await customerService.getOrderHistory({ limit: 1000 });
      
      const totalSpent = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const totalOrders = orders.length;
      const completedOrders = orders.filter(o => o.status === 'Delivered' || o.status === 'Completed').length;
      const pendingOrders = orders.filter(o => o.status !== 'Delivered' && o.status !== 'Completed' && o.status !== 'Cancelled').length;
      
      return {
        totalSpent,
        totalOrders,
        completedOrders,
        pendingOrders,
        averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
      };
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      return {
        totalSpent: 0,
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        averageOrderValue: 0
      };
    }
  },

  getBriefsByOrderAndProduct: async (orderId, productId) => {
    console.log(`📋 Fetching briefs for order ${orderId}, product ${productId}`);
    try {
      const response = await api.get(API_PATHS.CUSTOMER_BRIEFS.BY_ORDER_PRODUCT(orderId, productId));
      console.log("✅ Briefs fetched:", response);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch briefs:", error);
      return { data: null };
    }
  },
};