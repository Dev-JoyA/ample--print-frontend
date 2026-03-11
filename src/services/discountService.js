import { api } from "@/lib/api";

export const discountService = {
  // Get all active discounts
  getAllActive: async () => {
    try {
      console.log("📋 Fetching active discounts...");
      const response = await api.get("/discounts/active");
      console.log("✅ Discounts fetched:", response);
      
      // Handle different response structures
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

  // Get all discounts (with optional filters)
  getAll: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.active !== undefined) queryParams.append('active', params.active);
      if (params.type) queryParams.append('type', params.type);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/discounts?${queryString}` : '/discounts';
      
      const response = await api.get(endpoint);
      
      // Handle different response structures
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

  // Get discount by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/discounts/${id}`);
      return response?.data || response;
    } catch (error) {
      console.error(`❌ Failed to fetch discount ${id}:`, error);
      throw error;
    }
  },

  // Create new discount
  create: async (data) => {
    try {
      console.log("📝 Creating discount:", data);
      const response = await api.post("/discounts", data);
      console.log("✅ Discount created:", response);
      return response?.data || response;
    } catch (error) {
      console.error("❌ Failed to create discount:", error);
      throw error;
    }
  },

  // Update discount
  update: async (id, data) => {
    try {
      console.log(`📝 Updating discount ${id}:`, data);
      const response = await api.put(`/discounts/${id}`, data);
      console.log("✅ Discount updated:", response);
      return response?.data || response;
    } catch (error) {
      console.error(`❌ Failed to update discount ${id}:`, error);
      throw error;
    }
  },

  // Toggle discount active status
  toggleActive: async (id) => {
    try {
      console.log(`🔄 Toggling discount ${id} active status`);
      const response = await api.patch(`/discounts/${id}/toggle`);
      console.log("✅ Discount toggled:", response);
      return response?.data || response;
    } catch (error) {
      console.error(`❌ Failed to toggle discount ${id}:`, error);
      throw error;
    }
  },

  // Delete discount
  delete: async (id) => {
    try {
      console.log(`🗑️ Deleting discount ${id}`);
      const response = await api.delete(`/discounts/${id}`);
      console.log("✅ Discount deleted:", response);
      return response;
    } catch (error) {
      console.error(`❌ Failed to delete discount ${id}:`, error);
      throw error;
    }
  },

  // Validate discount code
  validateCode: async (code, amount) => {
    try {
      console.log(`🔍 Validating discount code: ${code}`);
      const response = await api.post("/discounts/validate", { code, amount });
      return response?.data || response;
    } catch (error) {
      console.error("❌ Failed to validate discount:", error);
      throw error;
    }
  }
};