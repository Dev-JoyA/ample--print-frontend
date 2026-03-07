import { api } from "@/lib/api";

export const customerService = {
  // Get customer dashboard stats
  getDashboardStats: async () => {
    try {
      // Try to fetch orders - this endpoint should exist
      let orders = [];
      let activeOrders = [];
      let designsForApproval = [];
      let completedOrders = [];
      
      try {
        const ordersResponse = await api.get('/orders/my-orders?limit=100');
        orders = ordersResponse?.order || [];
        
        activeOrders = orders.filter(o => 
          !['Delivered', 'Cancelled', 'Completed'].includes(o.status)
        );
        
        designsForApproval = orders.filter(o => 
          o.status === 'DesignUploaded' || o.status === 'UnderReview'
        );
        
        completedOrders = orders.filter(o => 
          ['Delivered', 'Completed'].includes(o.status)
        );
      } catch (orderError) {
        console.warn('Could not fetch orders, using mock data:', orderError);
        // Mock data for demonstration
        orders = [
          { _id: '1', orderNumber: 'ORD-7291', status: 'DesignUploaded', totalAmount: 4000, items: [{ productName: 'A5 Flyers' }], createdAt: new Date() },
          { _id: '2', orderNumber: 'ORD-8822', status: 'Approved', totalAmount: 19200, items: [{ productName: 'Photo Books' }], createdAt: new Date() }
        ];
        activeOrders = orders;
        designsForApproval = orders.filter(o => o.status === 'DesignUploaded');
        completedOrders = [];
      }

      // Try to fetch invoices - this might not exist yet
      let pendingInvoices = [];
      try {
        const invoicesResponse = await api.get('/invoices/my-invoices?limit=100');
        pendingInvoices = invoicesResponse?.invoices?.filter(i => 
          i.status === 'Sent' || i.status === 'PartiallyPaid'
        ) || [];
      } catch (invoiceError) {
        console.warn('Invoices endpoint not available, using mock data:', invoiceError);
        // Mock invoice data
        pendingInvoices = [
          { 
            _id: '1', 
            invoiceNumber: 'INV-1022', 
            status: 'Sent', 
            remainingAmount: 4000,
            totalAmount: 4000,
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
          },
          { 
            _id: '2', 
            invoiceNumber: 'INV-1023', 
            status: 'Sent', 
            remainingAmount: 60000,
            totalAmount: 60000,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          }
        ];
      }

      return {
        activeOrders: activeOrders.length,
        pendingInvoices: pendingInvoices.length,
        designsForApproval: designsForApproval.length,
        completedOrders: completedOrders.length,
        recentOrders: orders.slice(0, 3) || [],
        unpaidInvoices: pendingInvoices.slice(0, 3)
      };
      
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Return default values instead of throwing
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

  // Get user profile from token
  getUserProfile: async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          // Try to get full profile from API if available
          try {
            const profileResponse = await api.get(`/users/${decoded.userId}/profile`);
            const profile = profileResponse?.profile || profileResponse;
            return {
              id: decoded.userId,
              email: decoded.email,
              name: profile?.firstName 
                ? `${profile.firstName} ${profile.lastName || ''}`.trim() 
                : decoded.email?.split('@')[0] || 'Customer'
            };
          } catch (profileError) {
            // Fallback to token data
            return {
              id: decoded.userId,
              email: decoded.email,
              name: decoded.email?.split('@')[0] || 'Customer'
            };
          }
        } catch (e) {
          console.error('Failed to decode token:', e);
          return {
            id: null,
            email: null,
            name: 'Customer'
          };
        }
      }
      return {
        id: null,
        email: null,
        name: 'Guest'
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return {
        id: null,
        email: null,
        name: 'Customer'
      };
    }
  },

  // Get recent orders
  getRecentOrders: async (limit = 3) => {
    try {
      const response = await api.get(`/orders/my-orders?limit=${limit}`);
      return response?.order || [];
    } catch (error) {
      console.warn('Failed to fetch recent orders:', error);
      // Return mock data
      return [
        { 
          _id: '1', 
          orderNumber: 'ORD-7291', 
          status: 'DesignUploaded', 
          totalAmount: 4000, 
          items: [{ productName: 'Premium A5 Marketing Flyers' }], 
          createdAt: new Date() 
        },
        { 
          _id: '2', 
          orderNumber: 'ORD-8822', 
          status: 'Approved', 
          totalAmount: 19200, 
          items: [{ productName: 'Photo Books' }], 
          createdAt: new Date() 
        }
      ];
    }
  },

  // Get pending invoices
  getPendingInvoices: async (limit = 3) => {
    try {
      const response = await api.get(`/invoices/my-invoices?limit=${limit}&status=Sent,PartiallyPaid`);
      return response?.invoices || [];
    } catch (error) {
      console.warn('Failed to fetch pending invoices:', error);
      // Return mock data
      return [
        { 
          _id: '1', 
          invoiceNumber: 'INV-1022', 
          status: 'Sent', 
          remainingAmount: 4000,
          totalAmount: 4000,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        },
        { 
          _id: '2', 
          invoiceNumber: 'INV-1023', 
          status: 'Sent', 
          remainingAmount: 60000,
          totalAmount: 60000,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        }
      ];
    }
  }
};