'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import SummaryCard from '@/components/cards/SummaryCard';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: '₦2,450,000',
    pendingInvoices: 12,
    unverifiedPayments: 5,
    totalOrders: 148,
    activeAdmins: 8,
    pendingApprovals: 3,
    recentTransactions: [],
    lowStockItems: []
  });

  // Mock data for recent activities
  const recentActivities = [
    { id: 1, action: 'New admin created', user: 'john.doe@example.com', time: '5 minutes ago', status: 'success' },
    { id: 2, action: 'Payment verified', user: 'Payment #INV-2024-0012', time: '15 minutes ago', status: 'success' },
    { id: 3, action: 'Discount applied', user: 'Order #ORD-2024-0089', time: '1 hour ago', status: 'info' },
    { id: 4, action: 'Admin deactivated', user: 'jane.smith@example.com', time: '2 hours ago', status: 'warning' },
    { id: 5, action: 'Shipping invoice generated', user: 'Order #ORD-2024-0087', time: '3 hours ago', status: 'success' },
  ];

  // Mock data for pending verifications
  const pendingVerifications = [
    { id: 1, customer: 'Acme Corp', amount: '₦450,000', orderId: '#ORD-2024-0092', date: '2024-03-15' },
    { id: 2, customer: 'TechStart Inc', amount: '₦230,000', orderId: '#ORD-2024-0091', date: '2024-03-15' },
    { id: 3, customer: 'Creative Designs', amount: '₦125,000', orderId: '#ORD-2024-0090', date: '2024-03-14' },
  ];

  // Mock data for recent invoices
  const recentInvoices = [
    { id: 1, number: '#INV-2024-0045', customer: 'Global Print', amount: '₦780,000', status: 'paid' },
    { id: 2, number: '#INV-2024-0044', customer: 'Design Studio', amount: '₦120,000', status: 'pending' },
    { id: 3, number: '#INV-2024-0043', customer: 'Marketing Pro', amount: '₦345,000', status: 'overdue' },
  ];

  return (
    <DashboardLayout userRole="super-admin">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Super Admin Dashboard</h1>
            <p className="text-gray-400">Welcome back! Here's what's happening with your business today.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="primary" size="md" icon="📊">
              Generate Report
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            title="Total Revenue"
            value={stats.totalRevenue}
            icon="💰"
            color="green"
            trend="+12.5%"
            trendUp={true}
          />
          <SummaryCard
            title="Pending Invoices"
            value={stats.pendingInvoices}
            icon="📄"
            color="yellow"
            subtitle="Awaiting payment"
          />
          <SummaryCard
            title="Unverified Payments"
            value={stats.unverifiedPayments}
            icon="⏳"
            color="red"
            subtitle="Need attention"
          />
          <SummaryCard
            title="Total Orders"
            value={stats.totalOrders}
            icon="📦"
            color="blue"
            trend="+8.2%"
            trendUp={true}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SummaryCard
            title="Active Admins"
            value={stats.activeAdmins}
            icon="👥"
            color="purple"
            subtitle="Currently managing system"
          />
          <SummaryCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon="⏰"
            color="orange"
            subtitle="Designs awaiting review"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/dashboards/super-admin-dashboard/admin-management/create-admin">
                  <Button variant="secondary" size="md" className="w-full justify-start" icon="➕">
                    Create New Admin
                  </Button>
                </Link>
                <Link href="/dashboards/super-admin-dashboard/payment-verification">
                  <Button variant="secondary" size="md" className="w-full justify-start" icon="✓">
                    Verify Payments
                  </Button>
                </Link>
                <Link href="/dashboards/super-admin-dashboard/discounts">
                  <Button variant="secondary" size="md" className="w-full justify-start" icon="🏷️">
                    Manage Discounts
                  </Button>
                </Link>
                <Link href="/dashboards/super-admin-dashboard/invoices">
                  <Button variant="secondary" size="md" className="w-full justify-start" icon="📄">
                    Generate Invoice
                  </Button>
                </Link>
                <Link href="/dashboards/super-admin-dashboard/shipping-invoices">
                  <Button variant="secondary" size="md" className="w-full justify-start" icon="🚚">
                    Shipping Invoices
                  </Button>
                </Link>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-slate-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-xl font-bold text-white mb-4">System Status</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">API Status</span>
                  <span className="text-green-400 flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    Operational
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Database</span>
                  <span className="text-green-400 flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    Connected
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Storage</span>
                  <span className="text-yellow-400 flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                    78% Used
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Verifications */}
          <div className="lg:col-span-2 bg-slate-900 rounded-lg border border-gray-800 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Pending Payment Verifications</h2>
              <Link href="/dashboards/super-admin-dashboard/payment-verification" className="text-red-500 hover:text-red-400 text-sm">
                View All →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 text-gray-400 font-medium">Customer</th>
                    <th className="text-left py-3 text-gray-400 font-medium">Order ID</th>
                    <th className="text-left py-3 text-gray-400 font-medium">Amount</th>
                    <th className="text-left py-3 text-gray-400 font-medium">Date</th>
                    <th className="text-left py-3 text-gray-400 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingVerifications.map((item) => (
                    <tr key={item.id} className="border-b border-gray-800">
                      <td className="py-3 text-white">{item.customer}</td>
                      <td className="py-3 text-gray-300">{item.orderId}</td>
                      <td className="py-3 text-gray-300">{item.amount}</td>
                      <td className="py-3 text-gray-300">{item.date}</td>
                      <td className="py-3">
                        <button className="text-red-500 hover:text-red-400 text-sm font-medium">
                          Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity & Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-slate-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.action}</p>
                    <p className="text-gray-500 text-xs">{activity.user} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="bg-slate-900 rounded-lg border border-gray-800 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Recent Invoices</h2>
              <Link href="/dashboards/super-admin-dashboard/invoices" className="text-red-500 hover:text-red-400 text-sm">
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{invoice.number}</p>
                    <p className="text-gray-400 text-sm">{invoice.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{invoice.amount}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      invoice.status === 'paid' ? 'bg-green-900/50 text-green-400' :
                      invoice.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Cards for Main Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <Link href="/dashboards/super-admin-dashboard/admin-management">
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-950/50 p-6 rounded-lg border border-purple-800 hover:border-purple-600 transition cursor-pointer">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-white font-bold text-lg">Admin Management</h3>
              <p className="text-gray-400 text-sm mt-2">Create, activate, or deactivate administrators</p>
            </div>
          </Link>

          <Link href="/dashboards/super-admin-dashboard/discounts">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-950/50 p-6 rounded-lg border border-blue-800 hover:border-blue-600 transition cursor-pointer">
              <div className="text-4xl mb-3">🏷️</div>
              <h3 className="text-white font-bold text-lg">Discounts</h3>
              <p className="text-gray-400 text-sm mt-2">Manage promotional codes and discounts</p>
            </div>
          </Link>

          <Link href="/dashboards/super-admin-dashboard/invoices">
            <div className="bg-gradient-to-br from-green-900/50 to-green-950/50 p-6 rounded-lg border border-green-800 hover:border-green-600 transition cursor-pointer">
              <div className="text-4xl mb-3">📄</div>
              <h3 className="text-white font-bold text-lg">Invoices</h3>
              <p className="text-gray-400 text-sm mt-2">View and manage all invoices</p>
            </div>
          </Link>

          <Link href="/dashboards/super-admin-dashboard/payment-verification">
            <div className="bg-gradient-to-br from-red-900/50 to-red-950/50 p-6 rounded-lg border border-red-800 hover:border-red-600 transition cursor-pointer">
              <div className="text-4xl mb-3">✓</div>
              <h3 className="text-white font-bold text-lg">Payment Verification</h3>
              <p className="text-gray-400 text-sm mt-2">Verify customer payments</p>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}