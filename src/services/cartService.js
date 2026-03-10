import { api } from "@/lib/api";
import { API_PATHS } from "@/lib/constants";

export const cartService = {
  // Get user's active orders (not completed/delivered)
  getActiveOrders: async () => {
    try {
      // Use your existing order service's getMyOrders method
      const response = await api.get(API_PATHS.ORDERS.MY_ORDERS);
      
      // Filter for orders that are not completed or delivered
      const activeOrders = response?.order?.filter(order => 
        order.status !== 'Completed' && 
        order.status !== 'Delivered' && 
        order.status !== 'Cancelled'
      ) || [];
      
      return activeOrders;
    } catch (error) {
      console.error('Failed to fetch active orders:', error);
      return [];
    }
  },

  // Get cart count (number of active orders)
  getCartCount: async () => {
    try {
      const activeOrders = await cartService.getActiveOrders();
      return activeOrders.length;
    } catch (error) {
      console.error('Failed to get cart count:', error);
      return 0;
    }
  }
};