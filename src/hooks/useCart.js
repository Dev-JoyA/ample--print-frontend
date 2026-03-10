'use client';

import { useState, useEffect } from 'react';
import { cartService } from '@/services/cartService';
import { useAuth } from '@/app/lib/auth';

export function useCart() {
  const [cartCount, setCartCount] = useState(0);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user?.role === 'Customer') {
      fetchCartData();
    } else {
      setCartCount(0);
      setActiveOrders([]);
    }
  }, [isAuthenticated, user]);

  const fetchCartData = async () => {
    try {
      setLoading(true);
      const orders = await cartService.getActiveOrders();
      setActiveOrders(orders);
      setCartCount(orders.length);
    } catch (error) {
      console.error('Failed to fetch cart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = () => {
    fetchCartData();
  };

  return {
    cartCount,
    activeOrders,
    loading,
    refreshCart
  };
}