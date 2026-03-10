'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchBar from './SearchBar';
import NotificationBell from './NotificationBell';
import { useNotifications } from '@/components/providers/NotificationProvider';

const Header = ({ onSearch, showSearch = true, userRole }) => {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  return (
    <header className="sticky top-0 z-40 bg-slate-950 border-b border-gray-800">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo/Brand - visible on mobile when search is hidden */}
        {!showSearch && (
          <Link href="/dashboards/customer-dashboard" className="lg:hidden">
            <span className="text-xl font-bold text-white">Ample Print</span>
          </Link>
        )}

        {/* Search Bar - conditionally shown */}
        {showSearch && (
          <div className="flex-1 max-w-2xl">
            <SearchBar onSearch={onSearch} />
          </div>
        )}
        
        <div className="flex items-center gap-4 ml-auto">
          {/* Notifications - Using the NotificationBell component */}
          <NotificationBell />

          {/* Shopping Cart - Only for customers */}
          {userRole?.toLowerCase() === 'customer' && (
            <button 
              onClick={() => router.push('/cart')}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors relative"
              aria-label="Shopping cart"
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-xs flex items-center justify-center text-white">
                0
              </span>
            </button>
          )}

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => router.push('/profile')}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary overflow-hidden">
                <Image
                  src="/images/logo/logo.png"
                  alt="User"
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm text-white">Account</p>
                <p className="text-xs text-gray-400">{userRole}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;