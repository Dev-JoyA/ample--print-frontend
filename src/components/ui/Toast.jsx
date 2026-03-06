'use client';

import { useState, useEffect } from 'react';

export const Toast = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch(type) {
      case 'success':
        return 'bg-green-600/20 border-green-600 text-green-400';
      case 'error':
        return 'bg-red-600/20 border-red-600 text-red-400';
      case 'warning':
        return 'bg-yellow-600/20 border-yellow-600 text-yellow-400';
      default:
        return 'bg-primary/20 border-primary text-primary';
    }
  };

  const getIcon = () => {
    switch(type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-md p-4 rounded-lg border ${getTypeStyles()} backdrop-blur-sm animate-slide-up`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{getIcon()}</span>
        <p className="text-sm flex-1">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-gray-400 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Toast Container
export const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};