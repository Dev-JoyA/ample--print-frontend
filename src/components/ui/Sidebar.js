'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { COOKIE_NAMES } from '@/lib/constants';
import { authService } from '@/services/authService';

const Sidebar = ({ userRole = 'customer' }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const customerNavItems = [
    { name: 'Dashboard', href: '/dashboards', icon: '📊' },
    { name: 'Notifications', href: '/notifications', icon: '➕' },
    { name: 'Collections', href: '/collections', icon: '📁' },
    { name: 'Design Approval', href: '/design-approval', icon: '✓' },
    { name: 'Invoices', href: '/invoices', icon: '📄' },
    { name: 'Order Tracking', href: '/order-tracking', icon: '🕐' },
    { name: 'Order History', href: '/order-history', icon: '🔄' },
  ];

  const adminNavItems = [
    { name: 'Dashboard', href: '/dashboards/admin-dashboard', icon: '📊' },
    { name: 'Orders', href: '/dashboards/admin-dashboard/orders', icon: '📦' },
    { name: 'Customer Briefs', href: '/dashboards/admin-dashboard/customer-briefs', icon: '📝' },
    { name: 'Design Upload', href: '/dashboards/admin-dashboard/design-upload', icon: '🎨' },
    { name: 'Notifications', href: '/notifications', icon: '➕' },
    { name: 'Collections', href: '/dashboards/admin-dashboard/collections', icon: '➕' },
    { name: 'Products', href: '/dashboards/admin-dashboard/products/create', icon: '➕' },
  ];

  const superAdminNavItems = [
    { name: 'Dashboard', href: '/dashboards/super-admin-dashboard', icon: '📊' },
    { name: 'Invoices', href: '/dashboards/super-admin-dashboard/invoices', icon: '📄' },
    { name: 'Shipping Invoices', href: '/dashboards/super-admin-dashboard/shipping-invoices', icon: '🚚' },
    { name: 'Discounts', href: '/dashboards/super-admin-dashboard/discounts', icon: '💰' },
    { name: 'Payment Verification', href: '/dashboards/super-admin-dashboard/payment-verification', icon: '✅' },
    { name: 'Financial Records', href: '/dashboards/super-admin-dashboard/financial-records', icon: '📊' },
  ];

  const getNavItems = () => {
    if (userRole === 'admin') return adminNavItems;
    if (userRole === 'super-admin') return superAdminNavItems;
    return customerNavItems;
  };

  const navItems = getNavItems();

  const isActive = (href) => {
    if (href === '/dashboards' || href === '/dashboards/admin-dashboard' || href === '/dashboards/super-admin-dashboard') {
      return pathname === href || pathname.startsWith(href + '/');
    }
    return pathname === href || pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      // Get refresh token from cookies
      const refreshToken = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${COOKIE_NAMES.REFRESH_TOKEN}=`))
        ?.split('=')[1];

      // Call logout API if refresh token exists
      if (refreshToken) {
        try {
          await authService.logout(refreshToken);
        } catch (error) {
          console.error('Logout API error:', error);
          // Continue with logout even if API fails
        }
      }

      // Clear all auth cookies
      document.cookie = `${COOKIE_NAMES.TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      document.cookie = `${COOKIE_NAMES.REFRESH_TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      
      // Clear any other app-specific cookies
      document.cookie = `super_admin_secret=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      
      // Redirect to home page
      router.push('/');
      
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if error occurs
      router.push('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="fixed border-x border-dark-light left-0 bg-slate-950 top-0 h-screen w-[14rem] flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 ">
        <div className="flex items-center gap-2 ">
          <div className="flex items-center gap-2">
            <img className="w-17 h-17" src="/images/logo/logo.png" alt="Logo" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 pt-10 pb-[10rem] pr-4 pb-4 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 font-semibold text-[14px] text-gray-50 rounded-lg transition-colors ${
                active
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-dark-light hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-dark-light">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-dark-light hover:text-white w-full transition-colors ${
            isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span className="text-xl">{isLoggingOut ? '⏳' : '🚪'}</span>
          <span className="font-medium">{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;