'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SearchBar from './SearchBar';
import { useNotifications } from '@/components/providers/NotificationProvider';
import { useToast } from '@/components/providers/ToastProvider';

// Custom date formatter
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

const Header = ({ onSearch, showSearch = true, userRole }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { showToast } = useToast();
  const notificationRef = useRef(null);

  // Show toast for new notifications
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (!latest.read) {
        showToast(latest.message, 'info');
      }
    }
  }, [notifications, showToast]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'new-order': return '📦';
      case 'new-brief': return '📝';
      case 'design-uploaded': return '🎨';
      case 'status-update': return '🔄';
      case 'payment-verified': return '💰';
      case 'invoice-generated': return '📄';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'new-order': return 'text-blue-400';
      case 'new-brief': return 'text-yellow-400';
      case 'design-uploaded': return 'text-purple-400';
      case 'status-update': return 'text-green-400';
      case 'payment-verified': return 'text-emerald-400';
      case 'invoice-generated': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950 border-b -ml-[10rem] border-dark-light">
      <div className="flex items-center justify-between px-6 py-4">
        {showSearch && (
          <SearchBar onSearch={onSearch} />
        )}
        
        <div className="flex items-center gap-4 ml-auto">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-gray-300 hover:text-white hover:bg-dark-light rounded-lg transition-colors relative"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
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

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <h3 className="text-white font-semibold">Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={() => {
                        markAllAsRead();
                        setShowNotifications(false);
                      }}
                      className="text-xs text-primary hover:text-primary-dark transition"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="text-4xl mb-2">🔔</div>
                      <p className="text-sm">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <Link
                        key={notification.id}
                        href={notification.link}
                        onClick={() => {
                          markAsRead(notification.id);
                          setShowNotifications(false);
                        }}
                        className={`block p-4 border-b border-gray-800 hover:bg-slate-800/50 transition ${
                          !notification.read ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`text-xl ${getNotificationColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium mb-1">
                              {notification.title}
                            </p>
                            <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {formatRelativeTime(notification.timestamp)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-800 text-center">
                    <Link
                      href={`/dashboards/${userRole?.toLowerCase()}-dashboard/notifications`}
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-gray-400 hover:text-white transition"
                    >
                      View all notifications
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Shopping Cart - Only for customers */}
          {userRole?.toLowerCase() === 'customer' && (
            <button className="p-2 text-gray-300 hover:text-white hover:bg-dark-light rounded-lg transition-colors relative">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-xs flex items-center justify-center text-white">
                0
              </span>
            </button>
          )}

          {/* User Profile */}
          <div className="w-10 h-10 rounded-full bg-primary overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-light transition-all">
            <Image
              src="/images/logo/logo.png"
              alt="User"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;