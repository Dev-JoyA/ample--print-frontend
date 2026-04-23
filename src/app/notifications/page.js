'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import SEOHead from '@/components/common/SEOHead';
import { useNotifications } from '@/components/providers/NotificationProvider';
import { formatDistanceToNow } from 'date-fns';
import Button from '@/components/ui/Button';
import { METADATA } from '@/lib/metadata';

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    fetchHistoricalNotifications,
    isConnected,
  } = useNotifications();

  const [filter, setFilter] = useState('all');
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      if (typeof fetchHistoricalNotifications === 'function') {
        try {
          setLoading(true);
          setError(null);
          await fetchHistoricalNotifications();
        } catch (err) {
          console.error('Failed to fetch notifications:', err);
          setError('Could not load notifications. Please try again.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [fetchHistoricalNotifications]);

  const getNotificationIcon = (type) => {
    const iconMap = {
      'new-order': '📦',
      'new-brief': '📝',
      'brief-response': '📬',
      'admin-brief-response': '📬',
      'design-uploaded': '🎨',
      designUploaded: '🎨',
      'status-update': '🔄',
      'order-status-updated': '🔄',
      'invoice-ready': '💰',
      'order-ready-for-invoice': '💰',
      'feedback-response': '💬',
      'feedback-status-updated': '💬',
      'brief-deleted': '🗑️',
      'payment-verified': '✅',
      'payment-rejected': '❌',
      'shipping-updated': '🚚',
      'order-shipped': '📬',
      'order-delivered': '✅',
      'new-feedback': '💭',
      'new-customer-brief': '📝',
      'payment-receipt-uploaded': '🧾',
    };
    return iconMap[type] || '🔔';
  };

  const getNotificationTitle = (type) => {
    const titleMap = {
      'new-order': 'New Order',
      'new-brief': 'New Brief',
      'brief-response': 'Brief Response',
      'admin-brief-response': 'Admin Response',
      'design-uploaded': 'Design Ready',
      designUploaded: 'Design Ready',
      'status-update': 'Status Update',
      'order-status-updated': 'Order Status Updated',
      'invoice-ready': 'Invoice Ready',
      'order-ready-for-invoice': 'Ready for Invoice',
      'feedback-response': 'Feedback Response',
      'feedback-status-updated': 'Feedback Updated',
      'brief-deleted': 'Brief Deleted',
      'payment-verified': 'Payment Verified',
      'payment-rejected': 'Payment Rejected',
      'shipping-updated': 'Shipping Updated',
      'order-shipped': 'Order Shipped',
      'order-delivered': 'Order Delivered',
      'new-feedback': 'New Feedback',
      'new-customer-brief': 'Customer Brief',
      'payment-receipt-uploaded': 'Payment Receipt',
    };
    return titleMap[type] || 'Notification';
  };

  const getNotificationColor = (type) => {
    const colorMap = {
      'new-order': 'text-blue-400',
      'new-brief': 'text-yellow-400',
      'brief-response': 'text-pink-400',
      'admin-brief-response': 'text-pink-400',
      'design-uploaded': 'text-purple-400',
      designUploaded: 'text-purple-400',
      'status-update': 'text-green-400',
      'order-status-updated': 'text-green-400',
      'invoice-ready': 'text-emerald-400',
      'order-ready-for-invoice': 'text-emerald-400',
      'feedback-response': 'text-indigo-400',
      'feedback-status-updated': 'text-indigo-400',
      'brief-deleted': 'text-red-400',
      'payment-verified': 'text-green-400',
      'payment-rejected': 'text-red-400',
      'shipping-updated': 'text-blue-400',
      'order-shipped': 'text-blue-400',
      'order-delivered': 'text-green-400',
      'new-feedback': 'text-yellow-400',
      'new-customer-brief': 'text-yellow-400',
      'payment-receipt-uploaded': 'text-orange-400',
    };
    return colorMap[type] || 'text-gray-400';
  };

  const getNotificationBgColor = (type) => {
    const bgMap = {
      'new-order': 'bg-blue-900/20',
      'new-brief': 'bg-yellow-900/20',
      'brief-response': 'bg-pink-900/20',
      'admin-brief-response': 'bg-pink-900/20',
      'design-uploaded': 'bg-purple-900/20',
      designUploaded: 'bg-purple-900/20',
      'status-update': 'bg-green-900/20',
      'order-status-updated': 'bg-green-900/20',
      'invoice-ready': 'bg-emerald-900/20',
      'order-ready-for-invoice': 'bg-emerald-900/20',
      'feedback-response': 'bg-indigo-900/20',
      'feedback-status-updated': 'bg-indigo-900/20',
      'brief-deleted': 'bg-red-900/20',
      'payment-verified': 'bg-green-900/20',
      'payment-rejected': 'bg-red-900/20',
      'shipping-updated': 'bg-blue-900/20',
      'order-shipped': 'bg-blue-900/20',
      'order-delivered': 'bg-green-900/20',
      'new-feedback': 'bg-yellow-900/20',
      'new-customer-brief': 'bg-yellow-900/20',
      'payment-receipt-uploaded': 'bg-orange-900/20',
    };
    return bgMap[type] || 'bg-gray-900/20';
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleRetry = () => {
    if (typeof fetchHistoricalNotifications === 'function') {
      fetchHistoricalNotifications();
    }
  };

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  if (!mounted) {
    return (
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.notifications} />
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">Notifications</h1>
              {unreadCount > 0 && (
                <p className="mt-1 text-sm text-gray-400">
                  You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                </p>
              )}
              {isConnected === false && (
                <p className="mt-1 flex items-center gap-1 text-sm text-yellow-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400"></span>
                  Reconnecting to notification service...
                </p>
              )}
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="rounded-lg bg-primary/10 px-4 py-2 text-sm text-primary transition hover:text-primary-dark"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                filter === 'unread'
                  ? 'bg-primary text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-700 bg-red-900/30 p-8 text-center">
              <div className="mb-4 text-6xl">⚠️</div>
              <h3 className="mb-2 text-xl font-semibold text-white">Something went wrong</h3>
              <p className="mb-4 text-red-200">{error}</p>
              <Button variant="primary" onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          )}

          {!error && loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          ) : !error && filteredNotifications.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-12 text-center">
              <div className="mb-4 text-6xl opacity-50">🔔</div>
              <h3 className="mb-2 text-xl font-semibold text-white">No notifications</h3>
              <p className="text-gray-400">
                {filter === 'unread'
                  ? 'You have no unread notifications'
                  : 'You have no notifications yet'}
              </p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="mt-4 text-sm text-primary transition hover:text-primary-dark"
                >
                  View all notifications
                </button>
              )}
            </div>
          ) : (
            !error && (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`block cursor-pointer rounded-xl border p-4 transition hover:bg-gray-800/50 sm:p-6 ${
                      !notification.read
                        ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                        : 'border-gray-800 bg-gray-900/30 hover:bg-gray-800/30'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div
                        className={`h-12 w-12 flex-shrink-0 rounded-full ${getNotificationBgColor(notification.type)} flex items-center justify-center sm:h-14 sm:w-14`}
                      >
                        <span className="text-xl sm:text-2xl">
                          {getNotificationIcon(notification.type)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
                          <h4
                            className={`truncate text-base font-semibold sm:text-lg ${
                              !notification.read ? 'text-white' : 'text-gray-300'
                            }`}
                          >
                            {notification.title || getNotificationTitle(notification.type)}
                          </h4>
                          {!notification.read && (
                            <span className="mt-1 h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-primary sm:mt-2"></span>
                          )}
                        </div>

                        <p className="mb-3 line-clamp-2 text-sm text-gray-400 sm:text-base">
                          {notification.message}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-xs sm:gap-3 sm:text-sm">
                          <span className="text-gray-500">
                            {formatDistanceToNow(new Date(notification.timestamp), {
                              addSuffix: true,
                            })}
                          </span>
                          {notification.data?.orderNumber && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span className="font-medium text-primary">
                                Order #{notification.data.orderNumber}
                              </span>
                            </>
                          )}
                          {notification.data?.briefId && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span className="text-purple-400">Brief</span>
                            </>
                          )}
                          {notification.data?.invoiceNumber && (
                            <>
                              <span className="text-gray-600">•</span>
                              <span className="text-emerald-400">
                                Invoice #{notification.data.invoiceNumber}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
