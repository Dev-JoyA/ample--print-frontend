'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/components/providers/NotificationProvider';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debug log to see what notifications look like
  useEffect(() => {
    console.log('Current notifications in bell:', notifications);
    console.log('Unread count:', unreadCount);
  }, [notifications, unreadCount]);

  const getNotificationIcon = (type) => {
    const iconMap = {
      'new-order': '📦',
      'new-brief': '📝',
      'new-customer-brief': '📝',
      'brief-response': '📬',
      'admin-brief-response': '📬',
      'design-uploaded': '🎨',
      'designUploaded': '🎨',
      'status-update': '🔄',
      'order-status-updated': '🔄',
      'invoice-ready': '💰',
      'order-ready-for-invoice': '💰',
      'feedback-response': '💬',
      'brief-deleted': '🗑️',
      'payment-verified': '✅',
      'payment-rejected': '❌',
      'payment-received': '💰',
      'payment-failed': '❌',
      'shipping-created': '🚚',
      'pickup-ready': '📦',
      'tracking-updated': '📍',
      'shipping-status-updated': '🚚',
      'invoice-created': '💰',
      'invoice-updated': '💰',
      'invoice-sent': '📤',
      'invoice-deleted': '🗑️',
      'invoice-payment-updated': '💰',
      'design-updated': '🎨',
      'design-approved': '✅',
      'new-feedback': '💬',
      'feedback-status-updated': '🔄',
      'feedback-deleted': '🗑️',
      'receipt-uploaded': '📎',
      'bank-transfer-approved': '✅',
      'bank-transfer-rejected': '❌',
      'pending-bank-transfer': '⏳'
    };
    return iconMap[type] || '🔔';
  };

  const getNotificationColor = (type) => {
    const colorMap = {
      'new-order': 'text-blue-400',
      'new-brief': 'text-yellow-400',
      'new-customer-brief': 'text-yellow-400',
      'brief-response': 'text-pink-400',
      'admin-brief-response': 'text-pink-400',
      'design-uploaded': 'text-purple-400',
      'designUploaded': 'text-purple-400',
      'status-update': 'text-green-400',
      'order-status-updated': 'text-green-400',
      'invoice-ready': 'text-emerald-400',
      'order-ready-for-invoice': 'text-emerald-400',
      'feedback-response': 'text-indigo-400',
      'brief-deleted': 'text-red-400',
      'payment-verified': 'text-green-400',
      'payment-rejected': 'text-red-400',
      'payment-received': 'text-green-400',
      'payment-failed': 'text-red-400',
      'shipping-created': 'text-blue-400',
      'pickup-ready': 'text-green-400',
      'tracking-updated': 'text-blue-400',
      'shipping-status-updated': 'text-blue-400',
      'invoice-created': 'text-green-400',
      'invoice-updated': 'text-yellow-400',
      'invoice-sent': 'text-blue-400',
      'invoice-deleted': 'text-red-400',
      'invoice-payment-updated': 'text-green-400',
      'design-updated': 'text-purple-400',
      'design-approved': 'text-green-400',
      'new-feedback': 'text-indigo-400',
      'feedback-status-updated': 'text-yellow-400',
      'feedback-deleted': 'text-red-400',
      'receipt-uploaded': 'text-blue-400',
      'bank-transfer-approved': 'text-green-400',
      'bank-transfer-rejected': 'text-red-400',
      'pending-bank-transfer': 'text-yellow-400'
    };
    return colorMap[type] || 'text-gray-400';
  };

  const getNotificationTitle = (type) => {
    const titleMap = {
      'new-brief': 'New Customization Request',
      'new-customer-brief': 'New Customization Request',
      'brief-response': 'Admin Response to Your Brief',
      'admin-brief-response': 'Admin Response to Your Brief',
      'designUploaded': 'Design Ready for Review',
      'design-uploaded': 'Design Ready for Review',
      'order-ready-for-invoice': 'Order Ready for Invoice',
      'brief-deleted': 'Brief Deleted',
      'payment-received': 'Payment Received',
      'payment-verified': 'Payment Verified',
      'payment-failed': 'Payment Failed',
      'payment-rejected': 'Payment Rejected',
      'shipping-created': 'Shipping Created',
      'pickup-ready': 'Order Ready for Pickup',
      'tracking-updated': 'Tracking Information Updated',
      'shipping-status-updated': 'Shipping Status Updated',
      'invoice-created': 'Invoice Created',
      'invoice-updated': 'Invoice Updated',
      'invoice-sent': 'Invoice Sent',
      'invoice-deleted': 'Invoice Deleted',
      'invoice-payment-updated': 'Payment Update',
      'design-updated': 'Design Updated',
      'design-approved': 'Design Approved',
      'new-feedback': 'New Feedback',
      'feedback-response': 'Feedback Response',
      'feedback-status-updated': 'Feedback Status Updated',
      'feedback-deleted': 'Feedback Deleted',
      'receipt-uploaded': 'Receipt Uploaded',
      'bank-transfer-approved': 'Bank Transfer Approved',
      'bank-transfer-rejected': 'Bank Transfer Rejected',
      'pending-bank-transfer': 'Pending Bank Transfer'
    };
    return titleMap[type] || null;
  };

  const getBriefStatus = (notification) => {
    if (!notification || !notification.type) return null;
    
    if (notification.type.includes('brief')) {
      if (notification.data?.hasDesign) {
        return <span className="text-xs text-purple-400 ml-2">🎨 Includes design</span>;
      }
      if (notification.data?.hasImages) {
        return <span className="text-xs text-blue-400 ml-2">📷 Has images</span>;
      }
    }
    return null;
  };

  const handleNotificationClick = (notification) => {
    if (!notification) return;
    
    const notificationId = notification.id || notification._id;
    if (notificationId) {
      markAsRead(notificationId);
    }
    
    setIsOpen(false);
    
    // Use link from notification if available
    if (notification.link) {
      router.push(notification.link);
      return;
    }
    
    // Handle different notification types
    const type = notification.type || '';
    const data = notification.data || {};
    
    if (type.includes('brief') || type.includes('Brief')) {
      if (data.briefId) {
        router.push(`/briefs/${data.briefId}`);
      } else if (data.orderId && data.productId) {
        router.push(`/orders/${data.orderId}/products/${data.productId}/briefs`);
      } else if (data.orderId) {
        router.push(`/orders/${data.orderId}`);
      }
    } 
    else if (type.includes('design') || type.includes('Design')) {
      if (data.designId) {
        router.push(`/designs/${data.designId}`);
      } else if (data.orderId) {
        router.push(`/orders/${data.orderId}`);
      }
    }
    else if (type.includes('invoice') || type.includes('Invoice')) {
      if (data.invoiceId) {
        router.push(`/invoices/${data.invoiceId}`);
      } else if (data.orderId) {
        router.push(`/orders/${data.orderId}`);
      }
    }
    else if (type.includes('payment') || type.includes('Payment')) {
      if (data.orderId) {
        router.push(`/orders/${data.orderId}`);
      } else if (data.transactionId) {
        router.push(`/transactions/${data.transactionId}`);
      }
    }
    else if (type.includes('shipping') || type.includes('Shipping') || type.includes('pickup')) {
      if (data.orderId) {
        router.push(`/orders/${data.orderId}/shipping`);
      } else if (data.shippingId) {
        router.push(`/shipping/${data.shippingId}`);
      }
    }
    else if (type.includes('feedback') || type.includes('Feedback')) {
      if (data.feedbackId) {
        router.push(`/feedback/${data.feedbackId}`);
      } else if (data.orderId) {
        router.push(`/orders/${data.orderId}`);
      }
    }
    else if (data.orderId) {
      router.push(`/orders/${data.orderId}`);
    }
  };

  // Sort notifications by timestamp (newest first)
  const sortedNotifications = [...(notifications || [])].sort((a, b) => {
    const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
    const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
    return dateB - dateA;
  });

  // Limit to 5 notifications in the dropdown
  const recentNotifications = sortedNotifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs flex items-center justify-center rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-slate-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-slate-800/50">
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-600/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={() => {
                  markAllAsRead();
                }}
                className="text-xs text-primary hover:text-primary-dark transition"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-3 opacity-50">🔔</div>
                <p className="text-gray-400 text-sm">No notifications yet</p>
                <p className="text-gray-600 text-xs mt-1">
                  We'll notify you when something new arrives
                </p>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-3 opacity-50">🔔</div>
                <p className="text-gray-400 text-sm">No recent notifications</p>
              </div>
            ) : (
              recentNotifications.map((notification) => {
                if (!notification) return null;
                
                const customTitle = getNotificationTitle(notification.type);
                const briefStatus = getBriefStatus(notification);
                const icon = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification.type);
                
                return (
                  <div
                    key={notification.id || notification._id || Math.random()}
                    onClick={() => handleNotificationClick(notification)}
                    className={`block p-4 border-b border-gray-800 hover:bg-slate-800/50 transition cursor-pointer ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <span className="text-xl">{icon}</span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium mb-1">
                              {customTitle || notification.title || 'Notification'}
                            </p>
                            {briefStatus}
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                          )}
                        </div>
                        
                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                          {notification.message || 'No message'}
                        </p>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-gray-500 text-xs">
                            {notification.timestamp 
                              ? formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })
                              : 'recently'}
                          </span>
                          
                          {notification.data?.orderNumber && (
                            <>
                              <span className="text-gray-600 text-xs">•</span>
                              <span className="text-gray-500 text-xs">
                                Order #{notification.data.orderNumber}
                              </span>
                            </>
                          )}
                          
                          {notification.type && notification.type.includes('brief') && notification.data?.productName && (
                            <>
                              <span className="text-gray-600 text-xs">•</span>
                              <span className="text-pink-400 text-xs">
                                {notification.data.productName}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-800 text-center bg-slate-800/30">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs text-gray-400 hover:text-white transition block py-1"
              >
                View all notifications ({notifications.length})
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}