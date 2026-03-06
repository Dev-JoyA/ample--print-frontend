'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { socketService } from '@/services/socketService';
import { useAuth } from '@/app/lib/auth';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to socket
      socketService.connect(user.token, user.role);

      // Set up event listeners
      const handleNewOrder = (data) => {
        addNotification({
          id: `order-${data.orderId}-${Date.now()}`,
          type: 'new-order',
          title: 'New Order',
          message: data.message || `New order #${data.orderNumber} created`,
          data,
          timestamp: new Date(),
          read: false,
          link: `/dashboards/${user.role?.toLowerCase()}-dashboard/orders/${data.orderId}`
        });
      };

      const handleNewBrief = (data) => {
        addNotification({
          id: `brief-${data.briefId}-${Date.now()}`,
          type: 'new-brief',
          title: 'New Customer Brief',
          message: data.message || `New customization request for order #${data.orderNumber}`,
          data,
          timestamp: new Date(),
          read: false,
          link: `/dashboards/${user.role?.toLowerCase()}-dashboard/customer-briefs/${data.briefId}`
        });
      };

      const handleDesignUploaded = (data) => {
        addNotification({
          id: `design-${data.orderId}-${Date.now()}`,
          type: 'design-uploaded',
          title: 'Design Uploaded',
          message: `Design uploaded for order #${data.orderNumber}`,
          data,
          timestamp: new Date(),
          read: false,
          link: `/dashboards/customer-dashboard/orders/${data.orderId}`
        });
      };

      const handleOrderStatusUpdate = (data) => {
        addNotification({
          id: `status-${data.orderId}-${Date.now()}`,
          type: 'status-update',
          title: 'Order Status Updated',
          message: `Order #${data.orderNumber} is now ${data.status}`,
          data,
          timestamp: new Date(),
          read: false,
          link: `/dashboards/${user.role?.toLowerCase()}-dashboard/orders/${data.orderId}`
        });
      };

      // Register listeners based on user role
      if (user.role === 'Admin' || user.role === 'SuperAdmin') {
        socketService.on('new-order', handleNewOrder);
        socketService.on('new-customer-brief', handleNewBrief);
        socketService.on('order-ready-for-shipping', handleOrderStatusUpdate);
      }

      if (user.role === 'Customer') {
        socketService.on('designUploaded', handleDesignUploaded);
        socketService.on('admin-brief-response', handleNewBrief);
        socketService.on('order-status-updated', handleOrderStatusUpdate);
      }

      // Cleanup
      return () => {
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const removeNotification = (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      removeNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};