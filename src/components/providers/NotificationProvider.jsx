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
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const socketInitialized = useRef(false);
  const { showToast } = useToast();

  // Check authentication status and get user info
  useEffect(() => {
    const checkAuth = () => {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          setUserRole(decoded?.role?.toLowerCase());
          setUserId(decoded?.userId || decoded?.id);
        } catch (e) {
          console.error('Failed to decode token:', e);
        }
      }
      
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
        const withDates = parsed.map(n => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(withDates);
        const unread = withDates.filter(n => !n.read).length;
        setUnreadCount(unread);
        console.log(`Loaded ${withDates.length} saved notifications, ${unread} unread`);
      }
    } catch (error) {
      console.error('Failed to load saved notifications:', error);
    }
  }, []);

  // Save notifications to localStorage
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
      
      if (response?.success) {
        const notificationsList = response.notifications || [];
        
        if (notificationsList.length > 0) {
          const transformedNotifications = notificationsList.map(n => ({
            id: n.id || n._id,
            _id: n._id,
            type: n.type || 'general',
            title: n.title || 'Notification',
            message: n.message || '',
            data: n.data || {},
            timestamp: new Date(n.timestamp || n.createdAt || Date.now()),
            read: n.read || false,
            link: n.link || n.data?.link || '/'
          }));
          
          setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const newOnes = transformedNotifications.filter(n => !existingIds.has(n.id));
            return [...newOnes, ...prev].slice(0, 50);
          });
          
          const unread = transformedNotifications.filter(n => !n.read).length;
          setUnreadCount(prev => prev + unread);
        }
      }
    } catch (error) {
      console.log('Notification history not available yet:', error.message);
    }
  }, [isAuthenticated]);

  // Add a new notification
  const addNotification = useCallback((notification) => {
    console.log('Adding notification:', notification);
    
    const clientId = notification.clientId || `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setNotifications(prev => {
      const isDuplicate = prev.some(
        n => (n._id && n._id === notification._id) || 
             (n.clientId === clientId)
      );
      
      if (isDuplicate) {
        console.log('Duplicate notification prevented:', notification);
        return prev;
      }
      
      const newNotification = {
        ...notification,
        clientId,
        _id: notification._id || clientId,
        id: notification.id || notification._id || clientId
      };
      
      const newNotifications = [newNotification, ...prev];
      return newNotifications.slice(0, 50);
    });
    setUnreadCount(prev => prev + 1);
  }, []);

  // Mark a single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(notificationId);
      
      if (!isValidObjectId) {
        console.log('Skipping API call for client-generated notification:', notificationId);
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId || n._id === notificationId || n.clientId === notificationId) 
            ? { ...n, read: true } 
            : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }
      
      await notificationService.markAsRead(notificationId);
      
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId || n._id === notificationId) 
          ? { ...n, read: true } 
          : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId || n._id === notificationId || n.clientId === notificationId) 
          ? { ...n, read: true } 
          : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
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
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
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
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(notificationId);
      
      if (!isValidObjectId) {
        console.log('Skipping API call for client-generated notification deletion:', notificationId);
        setNotifications(prev => {
          const notification = prev.find(n => n.id === notificationId || n._id === notificationId || n.clientId === notificationId);
          const newNotifications = prev.filter(n => n.id !== notificationId && n._id !== notificationId && n.clientId !== notificationId);
          if (notification && !notification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
          return newNotifications;
        });
        return;
      }
      
      await notificationService.deleteNotification(notificationId);
      
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId || n._id === notificationId);
        const newNotifications = prev.filter(n => n.id !== notificationId && n._id !== notificationId);
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return newNotifications;
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  // ==================== CUSTOMER EVENT HANDLERS ====================
  
  const handleInvoiceCreated = useCallback((data) => {
    console.log('💰 Invoice created for customer:', data);
    const notification = {
      id: `invoice-created-${data.invoiceId || data.orderId}-${Date.now()}`,
      type: 'invoice-created',
      title: 'Invoice Created',
      message: data.message || `Invoice #${data.invoiceNumber || ''} created for your order #${data.orderNumber}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.invoiceId ? `/dashboards/customer/invoices/${data.invoiceId}` : '/invoices'
    };
    addNotification(notification);
    showToast(notification.message, 'success', 5000);
  }, [addNotification, showToast]);

  const handleInvoiceUpdated = useCallback((data) => {
    console.log('💰 Invoice updated for customer:', data);
    const notification = {
      id: `invoice-updated-${data.invoiceId || data.orderId}-${Date.now()}`,
      type: 'invoice-updated',
      title: 'Invoice Updated',
      message: data.message || `Invoice for your order #${data.orderNumber} has been updated`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.invoiceId ? `/dashboards/customer/invoices/${data.invoiceId}` : '/invoices'
    };
    addNotification(notification);
    showToast(notification.message, 'info', 5000);
  }, [addNotification, showToast]);

  const handleInvoiceSent = useCallback((data) => {
    console.log('💰 Invoice sent to customer:', data);
    const notification = {
      id: `invoice-sent-${data.invoiceId || data.orderId}-${Date.now()}`,
      type: 'invoice-sent',
      title: 'Invoice Sent',
      message: data.message || `Invoice #${data.invoiceNumber || ''} has been sent to you`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.invoiceId ? `/dashboards/customer/invoices/${data.invoiceId}` : '/invoices'
    };
    addNotification(notification);
    showToast(notification.message, 'success', 5000);
  }, [addNotification, showToast]);

  const handleInvoicePaymentUpdated = useCallback((data) => {
    console.log('💰 Invoice payment updated:', data);
    let title = 'Payment Update';
    let toastType = 'info';
    if (data.status === 'Paid') {
      title = 'Invoice Paid';
      toastType = 'success';
    } else if (data.status === 'PartiallyPaid') {
      title = 'Partial Payment Received';
      toastType = 'info';
    }
    const notification = {
      id: `invoice-payment-${data.invoiceId || data.orderId}-${Date.now()}`,
      type: 'invoice-payment-updated',
      title,
      message: data.message || `Payment of ₦${data.amountPaid?.toLocaleString() || ''} received for your order #${data.orderNumber}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.invoiceId ? `/dashboards/customer/invoices/${data.invoiceId}` : '/invoices'
    };
    addNotification(notification);
    showToast(notification.message, toastType, 5000);
  }, [addNotification, showToast]);

  const handleInvoiceDeleted = useCallback((data) => {
    console.log('💰 Invoice deleted:', data);
    const notification = {
      id: `invoice-deleted-${data.invoiceId || data.orderId}-${Date.now()}`,
      type: 'invoice-deleted',
      title: 'Invoice Deleted',
      message: data.message || `Invoice for your order #${data.orderNumber} has been deleted`,
      data,
      timestamp: new Date(),
      read: false,
      link: '/invoices'
    };
    addNotification(notification);
    showToast(notification.message, 'warning', 5000);
  }, [addNotification, showToast]);

  const handleOrderStatusUpdate = useCallback((data) => {
    console.log('🔄 Order status updated:', data);
    const notification = {
      id: `order-status-${data.orderId || data.orderNumber}-${Date.now()}`,
      type: 'order-status-updated',
      title: 'Order Status Updated',
      message: data.message || `Your order #${data.orderNumber} is now ${data.status || 'updated'}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/orders/${data.orderId}` : '/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'info', 6000);
  }, [addNotification, showToast]);

  const handleDesignUploaded = useCallback((data) => {
    console.log('🎨 Design uploaded:', data);
    const notification = {
      id: `design-${data.designId || data.orderId}-${Date.now()}`,
      type: 'design-uploaded',
      title: 'Design Ready for Review',
      message: data.message || `Design for your order #${data.orderNumber} is ready for review`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/orders/${data.orderId}` : '/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'info', 0);
  }, [addNotification, showToast]);

  const handleDesignUpdated = useCallback((data) => {
    console.log('🎨 Design updated:', data);
    const notification = {
      id: `design-updated-${data.designId || data.orderId}-${Date.now()}`,
      type: 'design-updated',
      title: 'Design Updated',
      message: data.message || `Design for your order #${data.orderNumber} has been updated`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/orders/${data.orderId}` : '/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'info', 5000);
  }, [addNotification, showToast]);

  const handleDesignApproved = useCallback((data) => {
    console.log('✅ Design approved:', data);
    const notification = {
      id: `design-approved-${data.designId || data.orderId}-${Date.now()}`,
      type: 'design-approved',
      title: 'Design Approved',
      message: data.message || `Your design for order #${data.orderNumber} has been approved`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/orders/${data.orderId}` : '/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'success', 5000);
  }, [addNotification, showToast]);

  const handleAdminBriefResponse = useCallback((data) => {
    console.log('📝 Admin brief response:', data);
    const notification = {
      id: `brief-response-${data.briefId || data.orderId}-${Date.now()}`,
      type: 'admin-brief-response',
      title: 'Response to Your Brief',
      message: data.message || `Admin responded to your customization request for order #${data.orderNumber}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.briefId ? `/briefs/${data.briefId}` : `/orders/${data.orderId}`
    };
    addNotification(notification);
    showToast(notification.message, 'info', 5000);
  }, [addNotification, showToast]);

  const handleBriefDeleted = useCallback((data) => {
    console.log('🗑️ Brief deleted:', data);
    const notification = {
      id: `brief-deleted-${data.briefId || data.orderId}-${Date.now()}`,
      type: 'brief-deleted',
      title: 'Brief Deleted',
      message: data.message || `A brief for your order #${data.orderNumber} was deleted`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/orders/${data.orderId}` : '/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'warning', 5000);
  }, [addNotification, showToast]);

  const handleFeedbackResponse = useCallback((data) => {
    console.log('💬 Feedback response:', data);
    const notification = {
      id: `feedback-response-${data.feedbackId || data.orderId}-${Date.now()}`,
      type: 'feedback-response',
      title: 'Feedback Response',
      message: data.message || `Admin responded to your feedback for order #${data.orderNumber}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.feedbackId ? `/feedback/${data.feedbackId}` : `/orders/${data.orderId}`
    };
    addNotification(notification);
    showToast(notification.message, 'info', 5000);
  }, [addNotification, showToast]);

  const handleFeedbackStatusUpdated = useCallback((data) => {
    console.log('💬 Feedback status updated:', data);
    const notification = {
      id: `feedback-status-${data.feedbackId || data.orderId}-${Date.now()}`,
      type: 'feedback-status-updated',
      title: 'Feedback Status Updated',
      message: data.message || `Your feedback status changed to ${data.status || 'updated'}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.feedbackId ? `/feedback/${data.feedbackId}` : `/orders/${data.orderId}`
    };
    addNotification(notification);
    showToast(notification.message, 'info', 5000);
  }, [addNotification, showToast]);

  const handleFeedbackDeleted = useCallback((data) => {
    console.log('🗑️ Feedback deleted:', data);
    const notification = {
      id: `feedback-deleted-${data.feedbackId || data.orderId}-${Date.now()}`,
      type: 'feedback-deleted',
      title: 'Feedback Deleted',
      message: data.message || `Feedback for your order #${data.orderNumber} was deleted`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/orders/${data.orderId}` : '/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'warning', 5000);
  }, [addNotification, showToast]);

  const handlePaymentVerified = useCallback((data) => {
    console.log('✅ Payment verified:', data);
    const notification = {
      id: `payment-verified-${data.transactionId || data.orderId}-${Date.now()}`,
      type: 'payment-verified',
      title: 'Payment Verified',
      message: data.message || `Your payment of ₦${data.amount?.toLocaleString() || ''} has been verified`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/orders/${data.orderId}` : '/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'success', 5000);
  }, [addNotification, showToast]);

  const handlePaymentFailed = useCallback((data) => {
    console.log('❌ Payment failed:', data);
    const notification = {
      id: `payment-failed-${data.transactionId || data.orderId}-${Date.now()}`,
      type: 'payment-failed',
      title: 'Payment Failed',
      message: data.message || `Your payment of ₦${data.amount?.toLocaleString() || ''} failed. ${data.reason || ''}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/orders/${data.orderId}` : '/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'error', 5000);
  }, [addNotification, showToast]);

  const handleReceiptUploaded = useCallback((data) => {
    console.log('📎 Receipt uploaded:', data);
    const notification = {
      id: `receipt-uploaded-${data.transactionId || data.orderId}-${Date.now()}`,
      type: 'receipt-uploaded',
      title: 'Receipt Uploaded',
      message: data.message || `Your receipt for order #${data.orderNumber} has been uploaded and is pending verification`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/orders/${data.orderId}` : '/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'info', 5000);
  }, [addNotification, showToast]);

  const handleBankTransferApproved = useCallback((data) => {
    console.log('✅ Bank transfer approved:', data);
    const notification = {
      id: `bank-transfer-approved-${data.transactionId || data.orderId}-${Date.now()}`,
      type: 'bank-transfer-approved',
      title: 'Bank Transfer Approved',
      message: data.message || `Your bank transfer of ₦${data.amount?.toLocaleString() || ''} has been approved`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/orders/${data.orderId}` : '/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'success', 5000);
  }, [addNotification, showToast]);

  const handleBankTransferRejected = useCallback((data) => {
    console.log('❌ Bank transfer rejected:', data);
    const notification = {
      id: `bank-transfer-rejected-${data.transactionId || data.orderId}-${Date.now()}`,
      type: 'bank-transfer-rejected',
      title: 'Bank Transfer Rejected',
      message: data.message || `Your bank transfer of ₦${data.amount?.toLocaleString() || ''} was rejected. ${data.reason || ''}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/orders/${data.orderId}` : '/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'error', 5000);
  }, [addNotification, showToast]);

  const handleShippingCreated = useCallback((data) => {
    console.log('🚚 Shipping created:', data);
    const notification = {
      id: `shipping-created-${data.shippingId || data.orderId}-${Date.now()}`,
      type: 'shipping-created',
      title: 'Shipping Created',
      message: data.message || `Shipping has been set up for your order #${data.orderNumber}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/orders/${data.orderId}` : '/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'info', 5000);
  }, [addNotification, showToast]);

  const handlePickupReady = useCallback((data) => {
    console.log('📦 Pickup ready:', data);
    const notification = {
      id: `pickup-ready-${data.shippingId || data.orderId}-${Date.now()}`,
      type: 'pickup-ready',
      title: 'Order Ready for Pickup',
      message: data.message || `Your order #${data.orderNumber} is ready for pickup`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/orders/${data.orderId}` : '/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'success', 5000);
  }, [addNotification, showToast]);

  const handleTrackingUpdated = useCallback((data) => {
    console.log('📍 Tracking updated:', data);
    const notification = {
      id: `tracking-${data.shippingId || data.orderId}-${Date.now()}`,
      type: 'tracking-updated',
      title: 'Tracking Updated',
      message: data.message || `Tracking #${data.trackingNumber} added for your order #${data.orderNumber}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/orders/${data.orderId}/tracking` : '/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'info', 5000);
  }, [addNotification, showToast]);

  const handleShippingStatusUpdated = useCallback((data) => {
    console.log('🚚 Shipping status updated:', data);
    const notification = {
      id: `shipping-status-${data.shippingId || data.orderId}-${Date.now()}`,
      type: 'shipping-status-updated',
      title: 'Shipping Status Updated',
      message: data.message || `Shipping status for your order #${data.orderNumber} is now ${data.status}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/orders/${data.orderId}` : '/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'info', 5000);
  }, [addNotification, showToast]);

  const handleShippingPaid = useCallback((data) => {
    console.log('💰 Shipping paid:', data);
    const notification = {
      id: `shipping-paid-${data.shippingId || data.orderId}-${Date.now()}`,
      type: 'shipping-paid',
      title: 'Shipping Payment Received',
      message: data.message || `Your shipping payment for order #${data.orderNumber} has been received`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/orders/${data.orderId}` : '/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'success', 5000);
  }, [addNotification, showToast]);

  // ==================== ADMIN EVENT HANDLERS ====================
  
  const handleAdminNewOrder = useCallback((data) => {
    console.log('📦 Admin new order:', data);
    const notification = {
      id: `admin-new-order-${data.orderId || data.orderNumber}-${Date.now()}`,
      type: 'admin-new-order',
      title: 'New Order Received',
      message: data.message || `New order #${data.orderNumber} requires attention`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/dashboards/admin/orders/${data.orderId}` : '/dashboards/admin/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'info', 8000);
  }, [addNotification, showToast]);

  const handleAdminInvoiceCreated = useCallback((data) => {
    console.log('💰 Admin invoice created:', data);
    const notification = {
      id: `admin-invoice-created-${data.invoiceId || data.orderId}-${Date.now()}`,
      type: 'admin-invoice-created',
      title: 'Invoice Created',
      message: data.message || `Invoice #${data.invoiceNumber || ''} created for order #${data.orderNumber}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.invoiceId ? `/dashboards/admin/invoices/${data.invoiceId}` : '/dashboards/admin/invoices'
    };
    addNotification(notification);
    showToast(notification.message, 'success', 5000);
  }, [addNotification, showToast]);

  const handleAdminInvoiceUpdated = useCallback((data) => {
    console.log('💰 Admin invoice updated:', data);
    const notification = {
      id: `admin-invoice-updated-${data.invoiceId || data.orderId}-${Date.now()}`,
      type: 'admin-invoice-updated',
      title: 'Invoice Updated',
      message: data.message || `Invoice for order #${data.orderNumber} was updated`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.invoiceId ? `/dashboards/admin/invoices/${data.invoiceId}` : '/dashboards/admin/invoices'
    };
    addNotification(notification);
    showToast(notification.message, 'info', 5000);
  }, [addNotification, showToast]);

  const handleAdminInvoiceSent = useCallback((data) => {
    console.log('💰 Admin invoice sent:', data);
    const notification = {
      id: `admin-invoice-sent-${data.invoiceId || data.orderId}-${Date.now()}`,
      type: 'admin-invoice-sent',
      title: 'Invoice Sent',
      message: data.message || `Invoice #${data.invoiceNumber || ''} sent to customer for order #${data.orderNumber}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.invoiceId ? `/dashboards/admin/invoices/${data.invoiceId}` : '/dashboards/admin/invoices'
    };
    addNotification(notification);
    showToast(notification.message, 'success', 5000);
  }, [addNotification, showToast]);

  const handleAdminInvoiceDeleted = useCallback((data) => {
    console.log('💰 Admin invoice deleted:', data);
    const notification = {
      id: `admin-invoice-deleted-${data.invoiceId || data.orderId}-${Date.now()}`,
      type: 'admin-invoice-deleted',
      title: 'Invoice Deleted',
      message: data.message || `Invoice for order #${data.orderNumber} was deleted`,
      data,
      timestamp: new Date(),
      read: false,
      link: '/dashboards/admin/invoices'
    };
    addNotification(notification);
    showToast(notification.message, 'warning', 5000);
  }, [addNotification, showToast]);

  const handleAdminPaymentReceived = useCallback((data) => {
    console.log('💰 Admin payment received:', data);
    const notification = {
      id: `admin-payment-${data.transactionId || data.orderId}-${Date.now()}`,
      type: 'admin-payment-received',
      title: 'Payment Received',
      message: data.message || `Payment of ₦${data.amount?.toLocaleString() || ''} received from ${data.customerName || 'customer'}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/dashboards/admin/orders/${data.orderId}` : '/dashboards/admin/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'success', 5000);
  }, [addNotification, showToast]);

  const handleAdminPendingBankTransfer = useCallback((data) => {
    console.log('🏦 Admin pending bank transfer:', data);
    const notification = {
      id: `admin-pending-bank-${data.transactionId || data.orderId}-${Date.now()}`,
      type: 'pending-bank-transfer',
      title: 'Pending Bank Transfer',
      message: data.message || `Bank transfer of ₦${data.amount?.toLocaleString() || ''} from ${data.customerName || 'customer'} requires verification`,
      data,
      timestamp: new Date(),
      read: false,
      link: `/dashboards/super-admin/payment-verification/${data.transactionId}`
    };
    addNotification(notification);
    showToast(notification.message, 'warning', 0);
  }, [addNotification, showToast]);

  const handleAdminDesignUploaded = useCallback((data) => {
    console.log('🎨 Admin design uploaded:', data);
    const notification = {
      id: `admin-design-uploaded-${data.designId || data.orderId}-${Date.now()}`,
      type: 'admin-design-uploaded',
      title: 'Design Uploaded',
      message: data.message || `Design uploaded for order #${data.orderNumber}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/dashboards/admin/orders/${data.orderId}` : '/dashboards/admin/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'info', 5000);
  }, [addNotification, showToast]);

  const handleAdminDesignApproved = useCallback((data) => {
    console.log('✅ Admin design approved:', data);
    const notification = {
      id: `admin-design-approved-${data.designId || data.orderId}-${Date.now()}`,
      type: 'admin-design-approved',
      title: 'Design Approved',
      message: data.message || `Design for order #${data.orderNumber} was approved by customer`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/dashboards/admin/orders/${data.orderId}` : '/dashboards/admin/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'success', 5000);
  }, [addNotification, showToast]);

  const handleAdminBriefResponded = useCallback((data) => {
    console.log('📝 Admin brief responded:', data);
    const notification = {
      id: `admin-brief-responded-${data.briefId || data.orderId}-${Date.now()}`,
      type: 'admin-brief-responded',
      title: 'Brief Response',
      message: data.message || `Admin responded to brief for order #${data.orderNumber}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/dashboards/admin/orders/${data.orderId}` : '/dashboards/admin/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'info', 5000);
  }, [addNotification, showToast]);

  const handleAdminFeedbackResolved = useCallback((data) => {
    console.log('💬 Admin feedback resolved:', data);
    const notification = {
      id: `admin-feedback-resolved-${data.feedbackId || data.orderId}-${Date.now()}`,
      type: 'admin-feedback-resolved',
      title: 'Feedback Resolved',
      message: data.message || `Feedback for order #${data.orderNumber} was resolved`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.feedbackId ? `/dashboards/admin/feedback/${data.feedbackId}` : '/dashboards/admin/feedback'
    };
    addNotification(notification);
    showToast(notification.message, 'success', 5000);
  }, [addNotification, showToast]);

  const handleAdminShippingCreated = useCallback((data) => {
    console.log('🚚 Admin shipping created:', data);
    const notification = {
      id: `admin-shipping-created-${data.shippingId || data.orderId}-${Date.now()}`,
      type: 'admin-shipping-created',
      title: 'Shipping Created',
      message: data.message || `Shipping created for order #${data.orderNumber}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/dashboards/admin/orders/${data.orderId}` : '/dashboards/admin/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'info', 5000);
  }, [addNotification, showToast]);

  const handleAdminTrackingUpdated = useCallback((data) => {
    console.log('📍 Admin tracking updated:', data);
    const notification = {
      id: `admin-tracking-${data.shippingId || data.orderId}-${Date.now()}`,
      type: 'admin-tracking-updated',
      title: 'Tracking Updated',
      message: data.message || `Tracking #${data.trackingNumber} added for order #${data.orderNumber}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/dashboards/admin/orders/${data.orderId}` : '/dashboards/admin/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'info', 5000);
  }, [addNotification, showToast]);

  const handleAdminShippingStatusUpdated = useCallback((data) => {
    console.log('🚚 Admin shipping status updated:', data);
    const notification = {
      id: `admin-shipping-status-${data.shippingId || data.orderId}-${Date.now()}`,
      type: 'admin-shipping-status-updated',
      title: 'Shipping Status Updated',
      message: data.message || `Shipping status for order #${data.orderNumber} changed to ${data.status}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/dashboards/admin/orders/${data.orderId}` : '/dashboards/admin/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'info', 5000);
  }, [addNotification, showToast]);

  const handleAdminShippingPaid = useCallback((data) => {
    console.log('💰 Admin shipping paid:', data);
    const notification = {
      id: `admin-shipping-paid-${data.shippingId || data.orderId}-${Date.now()}`,
      type: 'admin-shipping-paid',
      title: 'Shipping Payment Received',
      message: data.message || `Shipping payment of ₦${data.cost?.toLocaleString() || ''} received for order #${data.orderNumber}`,
      data,
      timestamp: new Date(),
      read: false,
      link: data.orderId ? `/dashboards/admin/orders/${data.orderId}` : '/dashboards/admin/orders'
    };
    addNotification(notification);
    showToast(notification.message, 'success', 5000);
  }, [addNotification, showToast]);

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
      console.log('Initializing socket connection for role:', userRole, 'userId:', userId);
      
      socketService.connect(token, userRole, userId);

      setTimeout(() => {
        fetchHistoricalNotifications();
      }, 1000);

      const interval = setInterval(() => {
        setIsConnected(socketService.isConnected());
      }, 2000);

      // ==================== REGISTER ALL LISTENERS ====================
      console.log('Registering socket listeners...');
      
      // Customer events (user-specific)
      socketService.on('invoice-created', handleInvoiceCreated);
      socketService.on('invoice-updated', handleInvoiceUpdated);
      socketService.on('invoice-sent', handleInvoiceSent);
      socketService.on('invoice-payment-updated', handleInvoicePaymentUpdated);
      socketService.on('invoice-deleted', handleInvoiceDeleted);
      socketService.on('order-status-updated', handleOrderStatusUpdate);
      socketService.on('designUploaded', handleDesignUploaded);
      socketService.on('design-updated', handleDesignUpdated);
      socketService.on('design-approved', handleDesignApproved);
      socketService.on('admin-brief-response', handleAdminBriefResponse);
      socketService.on('brief-deleted', handleBriefDeleted);
      socketService.on('feedback-response', handleFeedbackResponse);
      socketService.on('feedback-status-updated', handleFeedbackStatusUpdated);
      socketService.on('feedback-deleted', handleFeedbackDeleted);
      socketService.on('payment-verified', handlePaymentVerified);
      socketService.on('payment-failed', handlePaymentFailed);
      socketService.on('receipt-uploaded', handleReceiptUploaded);
      socketService.on('bank-transfer-approved', handleBankTransferApproved);
      socketService.on('bank-transfer-rejected', handleBankTransferRejected);
      socketService.on('shipping-created', handleShippingCreated);
      socketService.on('pickup-ready', handlePickupReady);
      socketService.on('tracking-updated', handleTrackingUpdated);
      socketService.on('shipping-status-updated', handleShippingStatusUpdated);
      socketService.on('shipping-paid', handleShippingPaid);
      
      // Admin events (room-based)
      socketService.on('new-order', handleAdminNewOrder);
      socketService.on('new-invoice', handleAdminInvoiceCreated);
      socketService.on('invoice-updated', handleAdminInvoiceUpdated);
      socketService.on('invoice-sent', handleAdminInvoiceSent);
      socketService.on('invoice-deleted', handleAdminInvoiceDeleted);
      socketService.on('payment-received', handleAdminPaymentReceived);
      socketService.on('pending-bank-transfer', handleAdminPendingBankTransfer);
      socketService.on('designUploaded', handleAdminDesignUploaded);
      socketService.on('design-approved', handleAdminDesignApproved);
      socketService.on('admin-brief-response', handleAdminBriefResponded);
      socketService.on('feedback-resolved', handleAdminFeedbackResolved);
      socketService.on('shipping-created', handleAdminShippingCreated);
      socketService.on('tracking-updated', handleAdminTrackingUpdated);
      socketService.on('shipping-status-updated', handleAdminShippingStatusUpdated);
      socketService.on('shipping-paid', handleAdminShippingPaid);
      
      // System events (just log them)
      socketService.on('pending-feedback-count', (data) => {
        console.log('📊 Pending feedback count:', data);
      });
      
      socketService.on('order-ready-for-invoice', (data) => {
        console.log('💰 Order ready for invoice:', data);
      });
      
      socketService.on('new-customer-brief', (data) => {
        console.log('📝 New customer brief:', data);
      });
      
      socketService.on('new-feedback', (data) => {
        console.log('💬 New feedback:', data);
      });
      
      socketService.on('bank-transfer-verified', (data) => {
        console.log('✅ Bank transfer verified:', data);
      });

      socketInitialized.current = true;

      return () => {
        console.log('Cleaning up socket listeners');
        
        // Customer events
        socketService.off('invoice-created', handleInvoiceCreated);
        socketService.off('invoice-updated', handleInvoiceUpdated);
        socketService.off('invoice-sent', handleInvoiceSent);
        socketService.off('invoice-payment-updated', handleInvoicePaymentUpdated);
        socketService.off('invoice-deleted', handleInvoiceDeleted);
        socketService.off('order-status-updated', handleOrderStatusUpdate);
        socketService.off('designUploaded', handleDesignUploaded);
        socketService.off('design-updated', handleDesignUpdated);
        socketService.off('design-approved', handleDesignApproved);
        socketService.off('admin-brief-response', handleAdminBriefResponse);
        socketService.off('brief-deleted', handleBriefDeleted);
        socketService.off('feedback-response', handleFeedbackResponse);
        socketService.off('feedback-status-updated', handleFeedbackStatusUpdated);
        socketService.off('feedback-deleted', handleFeedbackDeleted);
        socketService.off('payment-verified', handlePaymentVerified);
        socketService.off('payment-failed', handlePaymentFailed);
        socketService.off('receipt-uploaded', handleReceiptUploaded);
        socketService.off('bank-transfer-approved', handleBankTransferApproved);
        socketService.off('bank-transfer-rejected', handleBankTransferRejected);
        socketService.off('shipping-created', handleShippingCreated);
        socketService.off('pickup-ready', handlePickupReady);
        socketService.off('tracking-updated', handleTrackingUpdated);
        socketService.off('shipping-status-updated', handleShippingStatusUpdated);
        socketService.off('shipping-paid', handleShippingPaid);
        
        // Admin events
        socketService.off('new-order', handleAdminNewOrder);
        socketService.off('new-invoice', handleAdminInvoiceCreated);
        socketService.off('invoice-updated', handleAdminInvoiceUpdated);
        socketService.off('invoice-sent', handleAdminInvoiceSent);
        socketService.off('invoice-deleted', handleAdminInvoiceDeleted);
        socketService.off('payment-received', handleAdminPaymentReceived);
        socketService.off('pending-bank-transfer', handleAdminPendingBankTransfer);
        socketService.off('designUploaded', handleAdminDesignUploaded);
        socketService.off('design-approved', handleAdminDesignApproved);
        socketService.off('admin-brief-response', handleAdminBriefResponded);
        socketService.off('feedback-resolved', handleAdminFeedbackResolved);
        socketService.off('shipping-created', handleAdminShippingCreated);
        socketService.off('tracking-updated', handleAdminTrackingUpdated);
        socketService.off('shipping-status-updated', handleAdminShippingStatusUpdated);
        socketService.off('shipping-paid', handleAdminShippingPaid);
        
        // System events
        socketService.off('pending-feedback-count');
        socketService.off('order-ready-for-invoice');
        socketService.off('new-customer-brief');
        socketService.off('new-feedback');
        socketService.off('bank-transfer-verified');
        
        clearInterval(interval);
        socketService.disconnect();
        socketInitialized.current = false;
      };
    } catch (e) {
      console.error('Failed to decode token or setup socket:', e);
      socketInitialized.current = false;
    }
  }, [isAuthenticated, userRole, userId, fetchHistoricalNotifications, addNotification, showToast,
      handleInvoiceCreated, handleInvoiceUpdated, handleInvoiceSent, handleInvoicePaymentUpdated,
      handleInvoiceDeleted, handleOrderStatusUpdate, handleDesignUploaded, handleDesignUpdated,
      handleDesignApproved, handleAdminBriefResponse, handleBriefDeleted, handleFeedbackResponse,
      handleFeedbackStatusUpdated, handleFeedbackDeleted, handlePaymentVerified, handlePaymentFailed,
      handleReceiptUploaded, handleBankTransferApproved, handleBankTransferRejected,
      handleShippingCreated, handlePickupReady, handleTrackingUpdated, handleShippingStatusUpdated,
      handleShippingPaid, handleAdminNewOrder, handleAdminInvoiceCreated, handleAdminInvoiceUpdated,
      handleAdminInvoiceSent, handleAdminInvoiceDeleted, handleAdminPaymentReceived,
      handleAdminPendingBankTransfer, handleAdminDesignUploaded, handleAdminDesignApproved,
      handleAdminBriefResponded, handleAdminFeedbackResolved, handleAdminShippingCreated,
      handleAdminTrackingUpdated, handleAdminShippingStatusUpdated, handleAdminShippingPaid]);

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