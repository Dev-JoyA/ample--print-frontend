'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { COOKIE_NAMES } from '@/lib/constants';
import { authService } from '@/services/authService';

const Sidebar = ({ userRole = 'customer' }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [effectiveRole, setEffectiveRole] = useState(userRole);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1];

    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(window.atob(base64));

        const role = decoded?.role || decoded?.userRole || decoded?.user?.role;
        if (role) {
          const normalizedRole = role.toLowerCase();
          console.log('Sidebar detected role:', normalizedRole);
          setEffectiveRole(normalizedRole);
        }
      } catch (e) {
        console.error('Failed to decode token in sidebar:', e);
        setEffectiveRole(userRole);
      }
    } else {
      setEffectiveRole(userRole);
    }
  }, [userRole]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    {
      name: 'Admin Management',
      href: '/dashboards/super-admin-dashboard/admin-management',
      icon: '👥',
    },
    { name: 'Invoices', href: '/dashboards/super-admin-dashboard/invoices', icon: '📄' },
    { name: 'Notifications', href: '/notifications', icon: '➕' },
    { name: 'Discounts', href: '/dashboards/super-admin-dashboard/discounts', icon: '💰' },
    {
      name: 'Payment Verification',
      href: '/dashboards/super-admin-dashboard/payment-verification',
      icon: '✅',
    },
    {
      name: 'Financial Records',
      href: '/dashboards/super-admin-dashboard/financial-records',
      icon: '📊',
    },
    { name: 'Bank Accounts', href: '/dashboards/super-admin-dashboard/bank-accounts', icon: '🏦' },
  ];

  const getNavItems = () => {
    console.log('Getting nav items for role:', effectiveRole);
    if (effectiveRole === 'admin' || effectiveRole === 'Admin') return adminNavItems;
    if (
      effectiveRole === 'super-admin' ||
      effectiveRole === 'SuperAdmin' ||
      effectiveRole === 'superadmin'
    )
      return superAdminNavItems;
    return customerNavItems;
  };

  const navItems = getNavItems();

  const isActive = (href) => {
    if (
      href === '/dashboards' ||
      href === '/dashboards/admin-dashboard' ||
      href === '/dashboards/super-admin-dashboard'
    ) {
      return pathname === href || pathname.startsWith(href + '/');
    }
    return pathname === href || pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      const refreshToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${COOKIE_NAMES.REFRESH_TOKEN}=`))
        ?.split('=')[1];

      if (refreshToken) {
        try {
          await authService.logout(refreshToken);
        } catch (error) {
          console.error('Logout API error:', error);
        }
      }

      document.cookie = `${COOKIE_NAMES.TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      document.cookie = `${COOKIE_NAMES.REFRESH_TOKEN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
      document.cookie = `super_admin_secret=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;

      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <img
            className="h-16 w-auto brightness-110 drop-shadow-md sm:h-24"
            src="/images/logo/logo.png"
            alt="Logo"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4 sm:px-4">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base ${
                active
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-dark-light hover:text-white'
              }`}
            >
              <span className="text-base sm:text-xl">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-dark-light p-3 sm:p-4">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-dark-light hover:text-white sm:px-4 sm:py-3 sm:text-base ${
            isLoggingOut ? 'cursor-not-allowed opacity-50' : ''
          }`}
        >
          <span className="text-base sm:text-xl">{isLoggingOut ? '⏳' : '🚪'}</span>
          <span className="font-medium">{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="fixed left-4 top-4 z-50 rounded-lg bg-slate-800 p-2 text-white lg:hidden"
        aria-label="Menu"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeMobileMenu} />
      )}

      {/* Sidebar - Mobile: Fixed drawer, Desktop: Static */}
      {/* <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-dark-light bg-slate-950 transition-transform duration-300 lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      > */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-dark-light bg-slate-950 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
