'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/lib/auth';
import SearchBar from './SearchBar';
import NotificationBell from './NotificationBell';
import CartIcon from './CartIcon';
import ProfileDropdown from './ProfileDropdown';

const Header = ({ onSearch, showSearch = true }) => {
  const pathname = usePathname();
  const { isAuthenticated, loading, user } = useAuth(); // Get user from auth
  
  // Don't show header on auth pages or if not authenticated
  const isAuthPage = pathname?.startsWith('/auth/');
  
  if (isAuthPage || !isAuthenticated || loading) {
    return null;
  }

  // Determine user role - you might need to adjust this based on your auth structure
  const userRole = user?.role?.toLowerCase() || 'customer';

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
            <SearchBar userRole={userRole} />
          </div>
        )}
        
        <div className="flex items-center gap-4 ml-auto">
          {/* Notifications */}
          <NotificationBell />

          {/* Shopping Cart - Only for customers */}
          {userRole === 'customer' && <CartIcon />}

          {/* User Profile Dropdown */}
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;