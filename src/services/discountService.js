import { api } from "@/lib/api";
import { API_PATHS } from "@/lib/constants";

export const discountService = {
  getAllActive: async () => {
    try {
      console.log("📋 Fetching active discounts...");
      const response = await api.get(API_PATHS.DISCOUNTS.ACTIVE);
      console.log("✅ Discounts fetched:", response);
      if (response?.discounts) {
        return { discounts: response.discounts };
      } else if (response?.data?.discounts) {
        return { discounts: response.data.discounts };
      } else if (Array.isArray(response)) {
        return { discounts: response };
      }
      return { discounts: [] };
    } catch (error) {
      console.error("❌ Failed to fetch discounts:", error);
      return { discounts: [] };
    }
  },

  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.active !== undefined) queryParams.append('active', params.active);
      if (params.type) queryParams.append('type', params.type);
      const queryString = queryParams.toString();
      const endpoint = queryString ? `${API_PATHS.DISCOUNTS.LIST}?${queryString}` : API_PATHS.DISCOUNTS.LIST;
      const response = await api.get(endpoint);
      if (response?.discounts) {
        return { discounts: response.discounts };
      } else if (response?.data?.discounts) {
        return { discounts: response.data.discounts };
      } else if (Array.isArray(response)) {
        return { discounts: response };
      }
      return { discounts: [] };
    } catch (error) {
      console.error("❌ Failed to fetch discounts:", error);
      return { discounts: [] };
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(API_PATHS.DISCOUNTS.BY_ID(id));
      return response?.data || response;
    } catch (error) {
      console.error(`❌ Failed to fetch discount ${id}:`, error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      console.log("📝 Creating discount:", data);
      const response = await api.post(API_PATHS.DISCOUNTS.CREATE, data);
      console.log("✅ Discount created:", response);
      return response?.data || response;
    } catch (error) {
      console.error("❌ Failed to create discount:", error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      console.log(`📝 Updating discount ${id}:`, data);
      const response = await api.put(API_PATHS.DISCOUNTS.UPDATE(id), data);
      console.log("✅ Discount updated:", response);
      return response?.data || response;
    } catch (error) {
      console.error(`❌ Failed to update discount ${id}:`, error);
      throw error;
    }
  },

  toggleActive: async (id) => {
    try {
      console.log(`🔄 Toggling discount ${id} active status`);
      const response = await api.patch(API_PATHS.DISCOUNTS.TOGGLE(id));
      console.log("✅ Discount toggled:", response);
      return response?.data || response;
    } catch (error) {
      console.error(`❌ Failed to toggle discount ${id}:`, error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      console.log(`🗑️ Deleting discount ${id}`);
      const response = await api.delete(API_PATHS.DISCOUNTS.DELETE(id));
      console.log("✅ Discount deleted:", response);
      return response;
    } catch (error) {
      console.error(`❌ Failed to delete discount ${id}:`, error);
      throw error;
    }
  },

  validateCode: async (code, amount) => {
    try {
      console.log(`🔍 Validating discount code: ${code}`);
      const response = await api.post(API_PATHS.DISCOUNTS.VALIDATE, { code, amount });
      return response?.data || response;
    } catch (error) {
      console.error("❌ Failed to validate discount:", error);
      throw error;
    }
  }
};