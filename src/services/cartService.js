import { api } from "@/lib/api";
import { API_PATHS } from "@/lib/constants";

export const cartService = {
  getActiveOrders: async () => {
    try {
      const response = await api.get(API_PATHS.CART.ACTIVE_ORDERS);
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