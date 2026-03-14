import { api } from "@/lib/api";
import { API_PATHS } from "@/lib/constants";

// Check if api is properly imported
console.log("🔧 designService: api imported", api ? "✅" : "❌");

export const designService = {
  // Upload design for an order
  // POST /api/v1/design/orders/:orderId
  upload: (orderId, formData) => {
    console.log("📤 Uploading design for order:", orderId);
    // The endpoint is /design/orders/:orderId
    return api.upload(`/design/orders/${orderId}`, formData);
  },

  // Update existing design
  // PUT /api/v1/design/update/:designId
  update: (designId, formData) => {
    console.log("📝 Updating design:", designId);
    return api.upload(`/design/update/${designId}`, formData);
  },

  // Delete design
  // DELETE /api/v1/design/delete/:designId
  delete: (designId) => {
    console.log("🗑️ Deleting design:", designId);
    return api.delete(`/design/delete/${designId}`);
  },

  // Approve design
  // PUT /api/v1/design/:designId/approve
  approve: (designId) => {
    console.log("✅ Approving design:", designId);
    return api.put(`/design/${designId}/approve`);
  },

  // Get design by ID
  // GET /api/v1/design/:designId
  getById: (designId) => {
    console.log("🔍 Getting design by ID:", designId);
    return api.get(`/design/${designId}`);
  },

  // Get designs by user ID
  // GET /api/v1/design/users/:userId
  getByUser: (userId) => {
    console.log("🔍 Getting designs by user:", userId);
    return api.get(`/design/users/${userId}`);
  },

  // Get designs by order ID
  // GET /api/v1/design/orders/:orderId
  getByOrder: (orderId) => {
    console.log("🔍 Getting designs by order:", orderId);
    return api.get(`/design/orders/${orderId}`);
  },

  // Get designs by product ID
  // GET /api/v1/design/products/:productId
  getByProduct: (productId) => {
    console.log("🔍 Getting designs by product:", productId);
    return api.get(`/design/products/${productId}`);
  },

  // Get all designs with pagination
  // GET /api/v1/design/all?page=1&limit=10
  getAll: async (params = {}) => {
    try {
      console.log("🔍 designService.getAll called with params:", params);
      
      if (!api) {
        console.error("❌ api is undefined in designService");
        return { 
          success: false, 
          data: [], 
          total: 0, 
          page: params.page || 1, 
          limit: params.limit || 10, 
          pages: 0 
        };
      }

      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/design/all?${queryString}` : '/design/all';
      
      console.log("🔍 Fetching designs from endpoint:", endpoint);
      
      const response = await api.get(endpoint);
      console.log("✅ Designs response:", response);
      
      return response;
    } catch (error) {
      console.error("❌ Design service getAll error:", error);
      
      // Handle "Design not found" error message
      if (error.message === "Design not found" || error.status === 400) {
        console.log("📭 No designs found, returning empty array");
        return { 
          success: true, 
          data: [], 
          total: 0, 
          page: params.page || 1, 
          limit: params.limit || 10, 
          pages: 0 
        };
      }
      
      // Handle 404 Not Found
      if (error.status === 404) {
        console.log("📭 No designs found (404), returning empty array");
        return { 
          success: true, 
          data: [], 
          total: 0, 
          page: params.page || 1, 
          limit: params.limit || 10, 
          pages: 0 
        };
      }
      
      // For other errors, return empty structure
      return { 
        success: false, 
        data: [], 
        total: 0, 
        page: params.page || 1, 
        limit: params.limit || 10, 
        pages: 0 
      };
    }
  },

  // Filter designs
  // GET /api/v1/design/filter?userId=&orderId=&isApproved=
  filter: async (params = {}) => {
    try {
      console.log("🔍 Filtering designs with params:", params);
      
      if (!api) {
        console.error("❌ api is undefined in designService");
        return { success: false, data: [], count: 0 };
      }

      const queryParams = new URLSearchParams();
      
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.orderId) queryParams.append('orderId', params.orderId);
      if (params.productId) queryParams.append('productId', params.productId);
      if (params.uploadedBy) queryParams.append('uploadedBy', params.uploadedBy);
      if (params.isApproved !== undefined) queryParams.append('isApproved', params.isApproved);
      if (params.minVersion) queryParams.append('minVersion', params.minVersion);
      if (params.maxVersion) queryParams.append('maxVersion', params.maxVersion);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `/design/filter?${queryString}` : '/design/filter';
      
      const response = await api.get(endpoint);
      console.log("✅ Filter response:", response);
      
      return response;
    } catch (error) {
      console.error("❌ Filter designs error:", error);
      
      if (error.message === "Design not found" || error.status === 400) {
        return { success: true, data: [], count: 0 };
      }
      
      if (error.status === 404) {
        return { success: true, data: [], count: 0 };
      }
      
      return { success: false, data: [], count: 0 };
    }
  },

  getByUser: (userId) => {
  console.log("🔍 Getting designs by user:", userId);
  return api.get(`/design/users/${userId}`);
},
};

console.log("✅ designService loaded");