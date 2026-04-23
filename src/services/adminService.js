import { api } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';

export const adminService = {
  createAdmin: async (data) => {
    console.log('👤 Creating admin with data:', data);
    try {
      const response = await api.post(API_PATHS.AUTH.ADMIN_SIGN_UP, {
        firstName: data.firstName,
        lastName: data.lastName,
        userName: data.userName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber,
        address: data.address,
      });
      console.log('✅ Admin created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to create admin:', error);
      throw error;
    }
  },

  deactivateAdmin: async (email) => {
    console.log('🔴 Deactivating admin:', email);
    try {
      const response = await api.post(API_PATHS.AUTH.DEACTIVATE_ADMIN, { email });
      console.log('✅ Admin deactivated:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to deactivate admin:', error);
      throw error;
    }
  },

  reactivateAdmin: async (email) => {
    console.log('🟢 Reactivating admin:', email);
    try {
      const response = await api.post(API_PATHS.AUTH.REACTIVATE_ADMIN, { email });
      console.log('✅ Admin reactivated:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to reactivate admin:', error);
      throw error;
    }
  },

  getAllAdmins: async () => {
    console.log('📋 Fetching all admins');
    try {
      const response = await api.get(API_PATHS.USERS.LIST);
      console.log('✅ Users response:', response);
      let users = [];
      if (response?.users && Array.isArray(response.users)) {
        users = response.users;
      } else if (Array.isArray(response)) {
        users = response;
      }
      console.log('Found', users.length, 'total users');
      const adminUsers = users.filter(
        (user) => user.role === 'Admin' || user.role === 'SuperAdmin'
      );
      console.log('Admin users:', adminUsers);
      return adminUsers;
    } catch (error) {
      console.error(' Failed to fetch admins:', error);
      throw error;
    }
  },
};
