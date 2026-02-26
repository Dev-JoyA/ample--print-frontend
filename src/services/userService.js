import { api } from "@/lib/api";
import { API_PATHS } from "@/lib/constants";

export const userService = {
  getAll: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return api.get(q ? `${API_PATHS.USERS.LIST}?${q}` : API_PATHS.USERS.LIST);
  },

  getById: (userId) => api.get(API_PATHS.USERS.BY_ID(userId)),

  getAddress: (userId) => api.get(API_PATHS.USERS.ADDRESS(userId)),

  updateProfile: (userId, data) =>
    api.put(API_PATHS.USERS.PROFILE(userId), data),

  deleteUser: (userId) => api.delete(API_PATHS.USERS.BY_ID(userId)),

  changeRole: (userId, role) =>
    api.patch(API_PATHS.USERS.ROLE(userId), { role }),

  toggleActiveness: (userId) =>
    api.patch(API_PATHS.USERS.ACTIVENESS(userId)),
};
