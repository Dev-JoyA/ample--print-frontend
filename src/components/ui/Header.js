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
  const { isAuthenticated, loading, user } = useAuth();
  
  const isAuthPage = pathname?.startsWith('/auth/');
  
  if (isAuthPage || !isAuthenticated || loading) {
    return null;
  }

  const userRole = user?.role?.toLowerCase() || 'customer';

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-slate-950">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        {!showSearch && (
          <Link href="/dashboards/customer-dashboard" className="lg:hidden">
            <span className="text-lg font-bold text-white sm:text-xl">Ample Print</span>
          </Link>
        )}

        {showSearch && (
          <div className="w-full max-w-md flex-1 sm:max-w-xl lg:max-w-2xl">
            <SearchBar userRole={userRole} />
          </div>
        )}
        
        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationBell />
          {userRole === 'customer' && <CartIcon />}
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
};

export default Header;