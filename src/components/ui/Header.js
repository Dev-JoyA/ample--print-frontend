'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/app/lib/auth';
import SearchBar from './SearchBar';
import NotificationBell from './NotificationBell';
import CartIcon from './CartIcon';
import ProfileDropdown from './ProfileDropdown';
import Button from '@/components/ui/Button';

const Header = ({ onSearch, showSearch = true }) => {
  const pathname = usePathname();
  const { isAuthenticated, loading, user } = useAuth();

  const isAuthPage = pathname?.startsWith('/auth/');

  if (isAuthPage) {
    return null;
  }

  if (!isAuthenticated) {
  const isActive = (section) => {
    if (section === 'home') return pathname === '/';
    return pathname?.startsWith(`/${section}`);
  };

  const NAV_ITEMS = [
    { label: 'Home', href: '/', section: 'home' },
    { label: 'Collections', href: '/collections', section: 'collections' },
    { label: 'About', href: '/about', section: 'about' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-dark-light bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-[5rem] max-w-7xl items-center justify-between px-4 sm:h-[4.5rem] sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex h-full shrink-0 items-center"
          aria-label="Go to homepage"
        >
          <img
            className="h-full w-auto object-contain brightness-110 drop-shadow-md"
            src="/images/logo/logo.png"
            alt="Logo"
          />
        </Link>

        <nav className="hidden items-center gap-2 md:flex lg:gap-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`whitespace-nowrap px-2 py-2 text-xs font-semibold transition-colors lg:px-2.5 lg:text-sm ${
                isActive(item.section)
                  ? 'text-red-600'
                  : 'text-gray-400 hover:text-white'
              }`}
              aria-current={isActive(item.section) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/auth/sign-in">
            <Button variant="secondary" size="sm">
              Login
            </Button>
          </Link>

          <Link href="/new-order">
            <Button variant="primary" size="sm">
              Explore Studio
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
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
