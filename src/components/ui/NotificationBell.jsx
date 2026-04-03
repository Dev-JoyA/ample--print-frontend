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
        return <span className="ml-2 text-xs text-purple-400">🎨 Includes design</span>;
      }
      if (notification.data?.hasImages) {
        return <span className="ml-2 text-xs text-blue-400">📷 Has images</span>;
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
  };

  const handleViewAllClick = () => {
    setIsOpen(false);
    router.push('/notifications');
  };

  const sortedNotifications = [...(notifications || [])].sort((a, b) => {
    const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
    const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
    return dateB - dateA;
  });

  const recentNotifications = sortedNotifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-gray-800 bg-slate-900 shadow-2xl sm:w-96">
          <div className="flex items-center justify-between border-b border-gray-800 bg-slate-800/50 p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white sm:text-base">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-xs text-red-400">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={() => {
                  markAllAsRead();
                }}
                className="text-xs text-primary transition hover:text-primary-dark"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto sm:max-h-96">
            {!notifications || notifications.length === 0 ? (
              <div className="p-6 text-center sm:p-8">
                <div className="mb-2 text-4xl opacity-50 sm:text-5xl">🔔</div>
                <p className="text-xs text-gray-400 sm:text-sm">No notifications yet</p>
                <p className="mt-1 text-[10px] text-gray-600 sm:text-xs">
                  We'll notify you when something new arrives
                </p>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-6 text-center sm:p-8">
                <div className="mb-2 text-4xl opacity-50 sm:text-5xl">🔔</div>
                <p className="text-xs text-gray-400 sm:text-sm">No recent notifications</p>
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
                    className={`block cursor-pointer border-b border-gray-800 p-3 transition hover:bg-slate-800/50 sm:p-4 ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 sm:h-10 sm:w-10 ${colorClass}`}>
                        <span className="text-sm sm:text-xl">{icon}</span>
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-white sm:text-sm">
                              {customTitle || notification.title || 'Notification'}
                            </p>
                            {briefStatus}
                          </div>
                          {!notification.read && (
                            <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary sm:mt-1.5 sm:h-2 sm:w-2"></div>
                          )}
                        </div>
                        
                        <p className="mt-1 text-[10px] text-gray-400 line-clamp-2 sm:text-xs">
                          {notification.message || 'No message'}
                        </p>
                        
                        <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] sm:mt-2 sm:gap-2 sm:text-xs">
                          <span className="text-gray-500">
                            {notification.timestamp 
                              ? formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })
                              : 'recently'}
                          </span>
                          
                          {notification.data?.orderNumber && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span className="text-gray-500">
                                Order #{notification.data.orderNumber}
                              </span>
                            </>
                          )}
                          
                          {notification.type && notification.type.includes('brief') && notification.data?.productName && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span className="text-pink-400">
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

          {notifications.length > 0 && (
            <div className="border-t border-gray-800 bg-slate-800/30 p-2 text-center sm:p-3">
              <button
                onClick={handleViewAllClick}
                className="block w-full py-1 text-xs text-gray-400 transition hover:text-white"
              >
                View all notifications ({notifications.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}