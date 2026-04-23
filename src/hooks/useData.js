import useSWR from 'swr';
import { api } from '@/lib/api';

const fetcher = async (url) => {
  const response = await api.get(url);
  return response;
};

export const useData = (url, options = {}) => {
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
    ...options,
  });

  return {
    data,
    isLoading,
    isError: error,
    mutate,
  };
};

export const useCollections = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = query ? `/collections?${query}` : '/collections';
  return useData(url);
};

export const useProducts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = query ? `/products?${query}` : '/products';
  return useData(url);
};

export const useOrders = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const url = query ? `/orders/my-orders?${query}` : '/orders/my-orders';
  return useData(url);
};
