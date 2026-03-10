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

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'new-order': return '📦';
      case 'new-brief': 
      case 'new-customer-brief': return '📝';
      case 'brief-response':
      case 'admin-brief-response': return '📬';
      case 'design-uploaded':
      case 'designUploaded': return '🎨';
      case 'status-update':
      case 'order-status-updated': return '🔄';
      case 'invoice-ready':
      case 'order-ready-for-invoice': return '💰';
      case 'feedback-response': return '💬';
      case 'brief-deleted': return '🗑️';
      case 'payment-verified': return '✅';
      case 'payment-rejected': return '❌';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'new-order': return 'text-blue-400';
      case 'new-brief':
      case 'new-customer-brief': return 'text-yellow-400';
      case 'brief-response':
      case 'admin-brief-response': return 'text-pink-400';
      case 'design-uploaded':
      case 'designUploaded': return 'text-purple-400';
      case 'status-update':
      case 'order-status-updated': return 'text-green-400';
      case 'invoice-ready':
      case 'order-ready-for-invoice': return 'text-emerald-400';
      case 'feedback-response': return 'text-indigo-400';
      case 'brief-deleted': return 'text-red-400';
      case 'payment-verified': return 'text-green-400';
      case 'payment-rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getNotificationTitle = (type) => {
    switch(type) {
      case 'new-brief':
      case 'new-customer-brief': return 'New Customization Request';
      case 'brief-response':
      case 'admin-brief-response': return 'Admin Response to Your Brief';
      case 'designUploaded':
      case 'design-uploaded': return 'Design Ready for Review';
      case 'order-ready-for-invoice': return 'Order Ready for Invoice';
      case 'brief-deleted': return 'Brief Deleted';
      default: return null; // Use the title from the notification
    }
  };

  const getBriefStatus = (notification) => {
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
    markAsRead(notification.id);
    setIsOpen(false);
    
    // Handle brief-specific navigation
    if (notification.type === 'admin-brief-response' || notification.type === 'brief-response') {
      if (notification.data?.briefId) {
        router.push(`/briefs/${notification.data.briefId}`);
      } else if (notification.data?.orderId && notification.data?.productId) {
        router.push(`/orders/${notification.data.orderId}/products/${notification.data.productId}/briefs`);
      } else if (notification.link) {
        router.push(notification.link);
      }
    } 
    // Handle design upload notifications
    else if (notification.type === 'design-uploaded' || notification.type === 'designUploaded') {
      if (notification.data?.designId) {
        router.push(`/designs/${notification.data.designId}`);
      } else if (notification.data?.orderId) {
        router.push(`/orders/${notification.data.orderId}`);
      } else if (notification.link) {
        router.push(notification.link);
      }
    }
    // Default navigation
    else if (notification.link) {
      router.push(notification.link);
    } else if (notification.data?.orderId) {
      router.push(`/orders/${notification.data.orderId}`);
    } else if (notification.data?.briefId) {
      router.push(`/briefs/${notification.data.briefId}`);
    }
  };

  // Sort notifications by timestamp (newest first)
  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

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
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-3 opacity-50">🔔</div>
                <p className="text-gray-400 text-sm">No notifications yet</p>
                <p className="text-gray-600 text-xs mt-1">
                  We'll notify you when something new arrives
                </p>
              </div>
            ) : (
              recentNotifications.map((notification) => {
                const customTitle = getNotificationTitle(notification.type);
                const briefStatus = getBriefStatus(notification);
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`block p-4 border-b border-gray-800 hover:bg-slate-800/50 transition cursor-pointer ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                        <span className="text-xl">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium mb-1">
                              {customTitle || notification.title}
                            </p>
                            {briefStatus}
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0"></div>
                          )}
                        </div>
                        
                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-gray-500 text-xs">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                          </span>
                          
                          {notification.data?.orderNumber && (
                            <>
                              <span className="text-gray-600 text-xs">•</span>
                              <span className="text-gray-500 text-xs">
                                Order #{notification.data.orderNumber}
                              </span>
                            </>
                          )}
                          
                          {notification.type.includes('brief') && notification.data?.productName && (
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