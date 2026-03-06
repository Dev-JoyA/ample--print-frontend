'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/components/providers/NotificationProvider';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef(null);

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
      case 'new-brief': return '📝';
      case 'design-uploaded': return '🎨';
      case 'status-update': return '🔄';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'new-order': return 'text-blue-400';
      case 'new-brief': return 'text-yellow-400';
      case 'design-uploaded': return 'text-purple-400';
      case 'status-update': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white text-xs flex items-center justify-center rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h3 className="text-white font-semibold">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
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
                    setIsOpen(false);
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
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
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
              <button
                onClick={() => {
                  // Navigate to notifications page
                  setIsOpen(false);
                }}
                className="text-xs text-gray-400 hover:text-white transition"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}