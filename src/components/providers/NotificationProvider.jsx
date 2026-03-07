'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '@/services/socketService';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketInitialized = useRef(false);

  useEffect(() => {
    // Get user info from cookie
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
    
    if (token && !socketInitialized.current) {
      socketInitialized.current = true;
      
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const userRole = decoded?.role;
        
        console.log('Initializing socket connection for role:', userRole);
        
        // Connect to socket
        socketService.connect(token, userRole);
        
        // Check connection status
        setIsConnected(socketService.isConnected());

        // Set up event listeners with proper cleanup
        const handleNewOrder = (data) => {
          console.log('New order notification received:', data);
          addNotification({
            id: `order-${data.orderId}-${Date.now()}`,
            type: 'new-order',
            title: 'New Order',
            message: data.message || `New order #${data.orderNumber} created`,
            data,
            timestamp: new Date(),
            read: false,
            link: `/dashboards/${userRole?.toLowerCase()}-dashboard/orders/${data.orderId}`
          });
        };

        const handleNewBrief = (data) => {
          console.log('New brief notification received:', data);
          addNotification({
            id: `brief-${data.briefId}-${Date.now()}`,
            type: 'new-brief',
            title: 'New Customer Brief',
            message: data.message || `New customization request for order #${data.orderNumber}`,
            data,
            timestamp: new Date(),
            read: false,
            link: `/dashboards/${userRole?.toLowerCase()}-dashboard/customer-briefs/${data.briefId}`
          });
        };

        const handleDesignUploaded = (data) => {
          console.log('Design uploaded notification received:', data);
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
          console.log('Order status update received:', data);
          addNotification({
            id: `status-${data.orderId}-${Date.now()}`,
            type: 'status-update',
            title: 'Order Status Updated',
            message: `Order #${data.orderNumber} is now ${data.status}`,
            data,
            timestamp: new Date(),
            read: false,
            link: `/dashboards/${userRole?.toLowerCase()}-dashboard/orders/${data.orderId}`
          });
        };

        // Register listeners based on user role
        if (userRole === 'Admin' || userRole === 'SuperAdmin') {
          socketService.on('new-order', handleNewOrder);
          socketService.on('new-customer-brief', handleNewBrief);
          socketService.on('order-ready-for-shipping', handleOrderStatusUpdate);
        }

        if (userRole === 'Customer') {
          socketService.on('designUploaded', handleDesignUploaded);
          socketService.on('admin-brief-response', handleNewBrief);
          socketService.on('order-status-updated', handleOrderStatusUpdate);
        }

        // Cleanup
        return () => {
          console.log('Cleaning up socket listeners');
          if (userRole === 'Admin' || userRole === 'SuperAdmin') {
            socketService.off('new-order', handleNewOrder);
            socketService.off('new-customer-brief', handleNewBrief);
            socketService.off('order-ready-for-shipping', handleOrderStatusUpdate);
          }
          if (userRole === 'Customer') {
            socketService.off('designUploaded', handleDesignUploaded);
            socketService.off('admin-brief-response', handleNewBrief);
            socketService.off('order-status-updated', handleOrderStatusUpdate);
          }
          socketService.disconnect();
          socketInitialized.current = false;
        };
      } catch (e) {
        console.error('Failed to decode token or setup socket:', e);
        socketInitialized.current = false;
      }
    }
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => {
      // Avoid duplicate notifications
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      return [notification, ...prev];
    });
    setUnreadCount(prev => prev + 1);
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      const newNotifications = prev.filter(n => n.id !== notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return newNotifications;
    });
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isConnected,
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