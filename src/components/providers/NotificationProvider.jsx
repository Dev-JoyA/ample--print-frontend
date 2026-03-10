'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '@/services/socketService';
import { notificationService } from '@/services/notificationService';
import { useToast } from './ToastProvider';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

const STORAGE_KEY = 'ample_print_notifications';

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const socketInitialized = useRef(false);
  const { showToast } = useToast();

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      setIsAuthenticated(!!token);
    };

    checkAuth();
    
    // Check auth on cookie changes (every 5 seconds)
    const interval = setInterval(checkAuth, 5000);
    return () => clearInterval(interval);
  }, []);

  // Load saved notifications from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        const withDates = parsed.map(n => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(withDates);
        
        // Count unread
        const unread = withDates.filter(n => !n.read).length;
        setUnreadCount(unread);
        
        console.log(`Loaded ${withDates.length} saved notifications, ${unread} unread`);
      }
    } catch (error) {
      console.error('Failed to load saved notifications:', error);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }, [notifications]);

 const fetchHistoricalNotifications = useCallback(async () => {
  if (!isAuthenticated) {
    console.log('Not authenticated, skipping notification fetch');
    return;
  }

  try {
    console.log('Fetching historical notifications...');
    const response = await notificationService.getHistory({ limit: 50 });
    
    // Check if response has notifications array (could be empty)
    if (response?.success) {
      const notificationsList = response.notifications || [];
      
      if (notificationsList.length > 0) {
        const withDates = notificationsList.map(n => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        
        setNotifications(prev => {
          // Merge with existing, avoiding duplicates
          const existingIds = new Set(prev.map(n => n.id));
          const newOnes = withDates.filter(n => !existingIds.has(n.id));
          return [...newOnes, ...prev].slice(0, 50);
        });
        
        // Update unread count
        const unread = withDates.filter(n => !n.read).length;
        setUnreadCount(prev => prev + unread);
      } else {
        console.log('No historical notifications found');
      }
    }
  } catch (error) {
    // Don't show error in UI, just log it
    console.log('Notification history not available yet:', error.message);
  }
}, [isAuthenticated]);

  // Setup socket connection and event listeners
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping socket connection');
      return;
    }

    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    if (!token || socketInitialized.current) return;

    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const userRole = decoded?.role;
      const userId = decoded?.id || decoded?.userId;
      
      console.log('Initializing socket connection for role:', userRole, 'userId:', userId);
      
      // Connect to socket with userId
      socketService.connect(token, userRole, userId);

      // Fetch historical notifications after connection
      setTimeout(() => {
        fetchHistoricalNotifications();
      }, 1000);

      // Check connection status periodically
      const interval = setInterval(() => {
        const connected = socketService.isConnected();
        setIsConnected(connected);
      }, 2000);

      // ==================== SOCKET EVENT HANDLERS ====================

      // 1. When order status changes
      const handleOrderStatusUpdate = (data) => {
        console.log('📨 Order status update received:', data);
        
        const notification = {
          id: `status-${data.orderId || data.orderNumber}-${Date.now()}`,
          type: 'status-update',
          title: 'Order Status Updated',
          message: data.message || `Order #${data.orderNumber || data.orderId} is now ${data.status || 'updated'}`,
          data,
          timestamp: new Date(),
          read: false,
          link: data.orderId ? `/orders/${data.orderId}` : '/orders'
        };
        
        addNotification(notification);
        showToast(notification.message, 'info', 6000);
      };

      // 2. When design is uploaded
      const handleDesignUploaded = (data) => {
        console.log('🎨 Design uploaded received:', data);
        
        const notification = {
          id: `design-${data.orderId}-${Date.now()}`,
          type: 'design-uploaded',
          title: 'Design Ready for Review',
          message: data.message || `Design uploaded for order #${data.orderNumber}. Please review and approve.`,
          data,
          timestamp: new Date(),
          read: false,
          link: data.orderId ? `/orders/${data.orderId}` : '/orders'
        };
        
        addNotification(notification);
        showToast(notification.message, 'info', 0);
      };

      // 3. When admin responds to a brief
      const handleAdminBriefResponse = (data) => {
        console.log('📝 Admin brief response received:', data);
        
        const notification = {
          id: `brief-${data.briefId || data.orderId}-${Date.now()}`,
          type: 'brief-response',
          title: 'Response to Your Customization Request',
          message: data.message || `Admin has responded to your customization request for order #${data.orderNumber}`,
          data,
          timestamp: new Date(),
          read: false,
          link: data.briefId ? `/briefs/${data.briefId}` : `/orders/${data.orderId}`
        };
        
        addNotification(notification);
        showToast(notification.message, 'info', 5000);
      };

      // 4. When order is ready for invoice
      const handleOrderReadyForInvoice = (data) => {
        console.log('💰 Order ready for invoice:', data);
        
        const notification = {
          id: `invoice-ready-${data.orderId}-${Date.now()}`,
          type: 'invoice-ready',
          title: 'Order Ready for Invoice',
          message: data.message || `Your order #${data.orderNumber} is ready for invoicing.`,
          data,
          timestamp: new Date(),
          read: false,
          link: data.orderId ? `/orders/${data.orderId}` : '/orders'
        };
        
        addNotification(notification);
        showToast(notification.message, 'success', 5000);
      };

      // 5. When feedback is responded to
      const handleFeedbackResponse = (data) => {
        console.log('💬 Feedback response received:', data);
        
        const notification = {
          id: `feedback-${data.feedbackId || data.orderId}-${Date.now()}`,
          type: 'feedback-response',
          title: 'Feedback Response',
          message: data.message || `Response to your feedback for order #${data.orderNumber}`,
          data,
          timestamp: new Date(),
          read: false,
          link: data.orderId ? `/orders/${data.orderId}` : '/orders'
        };
        
        addNotification(notification);
        showToast(notification.message, 'info', 5000);
      };

      // 6. When a brief is deleted
      const handleBriefDeleted = (data) => {
        console.log('🗑️ Brief deleted received:', data);
        
        const notification = {
          id: `brief-deleted-${data.briefId || data.orderId}-${Date.now()}`,
          type: 'brief-deleted',
          title: 'Brief Deleted',
          message: data.message || `A brief was deleted from order #${data.orderNumber}`,
          data,
          timestamp: new Date(),
          read: false,
          link: data.orderId ? `/orders/${data.orderId}` : '/orders'
        };
        
        addNotification(notification);
        showToast(notification.message, 'warning', 5000);
      };

      // ==================== REGISTER ALL LISTENERS ====================
      console.log('Registering socket listeners...');
      
      socketService.on('order-status-updated', handleOrderStatusUpdate);
      socketService.on('designUploaded', handleDesignUploaded);
      socketService.on('admin-brief-response', handleAdminBriefResponse);
      socketService.on('order-ready-for-invoice', handleOrderReadyForInvoice);
      socketService.on('feedback-response', handleFeedbackResponse);
      socketService.on('brief-deleted', handleBriefDeleted);

      socketInitialized.current = true;

      // ==================== CLEANUP ====================
      return () => {
        console.log('Cleaning up socket listeners');
        socketService.off('order-status-updated', handleOrderStatusUpdate);
        socketService.off('designUploaded', handleDesignUploaded);
        socketService.off('admin-brief-response', handleAdminBriefResponse);
        socketService.off('order-ready-for-invoice', handleOrderReadyForInvoice);
        socketService.off('feedback-response', handleFeedbackResponse);
        socketService.off('brief-deleted', handleBriefDeleted);
        clearInterval(interval);
        socketService.disconnect();
        socketInitialized.current = false;
      };
    } catch (e) {
      console.error('Failed to decode token or setup socket:', e);
      socketInitialized.current = false;
    }
  }, [isAuthenticated, showToast, fetchHistoricalNotifications]);

  // Add a new notification
  const addNotification = useCallback((notification) => {
    console.log('Adding notification:', notification);
    setNotifications(prev => {
      // Avoid duplicates (within 10 seconds)
      const isDuplicate = prev.some(
        n => n.type === notification.type && 
             n.data?.orderId === notification.data?.orderId &&
             n.data?.briefId === notification.data?.briefId &&
             Math.abs(new Date(n.timestamp) - new Date(notification.timestamp)) < 10000
      );
      
      if (isDuplicate) {
        console.log('Duplicate notification prevented:', notification);
        return prev;
      }
      
      const newNotifications = [notification, ...prev];
      // Keep only last 50 notifications to prevent storage overflow
      return newNotifications.slice(0, 50);
    });
    setUnreadCount(prev => prev + 1);
  }, []);

  // Mark a single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback(async () => {
    try {
      await notificationService.clearAll();
      setNotifications([]);
      setUnreadCount(0);
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }, []);

  // Remove a single notification
  const removeNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        const newNotifications = prev.filter(n => n.id !== notificationId);
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return newNotifications;
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isConnected,
      isAuthenticated,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      removeNotification,
      fetchHistoricalNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};