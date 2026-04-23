import { api } from '@/lib/api';
import { API_PATHS } from '@/lib/constants';

export const bankAccountService = {
  getActive: async () => {
    const response = await api.get(API_PATHS.BANK_ACCOUNTS.ACTIVE);
    return response;
  },
  list: async () => {
    const response = await api.get(API_PATHS.BANK_ACCOUNTS.LIST);
    return response;
  },
  create: async (data) => {
    const response = await api.post(API_PATHS.BANK_ACCOUNTS.CREATE, data);
    return response;
  },
  setActive: async (id) => {
    const response = await api.patch(API_PATHS.BANK_ACCOUNTS.SET_ACTIVE(id), {});
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(API_PATHS.BANK_ACCOUNTS.DELETE(id));
    return response;
  },
};
