'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = ({ userRole = 'customer' }) => {
  const pathname = usePathname();

  const customerNavItems = [
    { name: 'Dashboard', href: '/dashboards', icon: '📊' },
    { name: 'New Order', href: '/new-order', icon: '➕' },
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
  ];

  const superAdminNavItems = [
    { name: 'Dashboard', href: '/dashboards/super-admin-dashboard', icon: '📊' },
    { name: 'Invoices', href: '/super-admin/invoices', icon: '📄' },
    { name: 'Shipping Invoices', href: '/super-admin/shipping-invoices', icon: '🚚' },
    { name: 'Discounts', href: '/super-admin/discounts', icon: '💰' },
    { name: 'Payment Verification', href: '/super-admin/payment-verification', icon: '✅' },
    { name: 'Financial Records', href: '/super-admin/financial-records', icon: '📊' },
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
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-dark-light hover:text-white w-full transition-colors">
          <span className="text-xl">🚪</span>
          <span className="font-medium">Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
