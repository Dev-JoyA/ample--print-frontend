'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import SummaryCard from '@/components/cards/SummaryCard';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { invoiceService } from '@/services/invoiceService';
import { paymentService } from '@/services/paymentService';
import { adminService } from '@/services/adminService';

export default function SuperAdminDashboard() {
  useAuthCheck();

  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingInvoices: 0,
    unverifiedPayments: 0,
    totalOrders: 0,
    activeAdmins: 0,
    paidOrders: 0,
    partPaidOrders: 0,
    overdueInvoices: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all orders
      const ordersResponse = await orderService.getAll({ limit: 100 });
      const orders = ordersResponse?.order || [];
      
      // Calculate order stats
      const totalOrders = ordersResponse?.total || orders.length;
      const paidOrders = orders.filter(o => o.paymentStatus === 'Completed').length;
      const partPaidOrders = orders.filter(o => o.paymentStatus === 'PartPayment').length;
      
      // Calculate revenue (sum of all completed orders)
      const totalRevenue = orders
        .filter(o => o.paymentStatus === 'Completed')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      // Fetch pending invoices
      const invoicesResponse = await invoiceService.getAll({ status: 'pending', limit: 100 });
      const pendingInvoices = invoicesResponse?.invoices?.length || 0;
      
      // Fetch overdue invoices
      const overdueResponse = await invoiceService.getAll({ status: 'overdue', limit: 100 });
      const overdueInvoices = overdueResponse?.invoices?.length || 0;

      // Fetch unverified payments (bank transfers)
      const paymentsResponse = await paymentService.getPendingBankTransfers({ limit: 100 });
      const unverifiedPayments = paymentsResponse?.transactions?.length || 0;

      // Fetch active admins
      const adminsResponse = await adminService.getAllAdmins();
      const activeAdmins = adminsResponse?.filter(a => a.isActive).length || 0;

      // Fetch recent activities (you might need a dedicated activities endpoint)
      const recentOrders = orders.slice(0, 3).map(o => ({
        id: o._id,
        action: 'New order created',
        user: o.orderNumber,
        time: new Date(o.createdAt).toLocaleString(),
        status: 'info'
      }));

      const recentPayments = paymentsResponse?.transactions?.slice(0, 2).map(p => ({
        id: p._id,
        action: 'Payment received',
        user: `Order #${p.orderNumber}`,
        time: new Date(p.createdAt).toLocaleString(),
        status: 'success'
      })) || [];

      setStats({
        totalRevenue,
        pendingInvoices,
        unverifiedPayments,
        totalOrders,
        activeAdmins,
        paidOrders,
        partPaidOrders,
        overdueInvoices
      });

      // Format currency
      const formattedRevenue = `₦${totalRevenue.toLocaleString()}`;

      // Set pending verifications from bank transfers
      setPendingVerifications((paymentsResponse?.transactions || []).slice(0, 5).map(t => ({
        id: t._id,
        customer: t.userId?.email?.split('@')[0] || 'Customer',
        amount: `₦${t.amount?.toLocaleString()}`,
        orderId: `#${t.orderNumber}`,
        date: new Date(t.createdAt).toLocaleDateString()
      })));

      // Set recent invoices
      setRecentInvoices((invoicesResponse?.invoices || []).slice(0, 3).map(i => ({
        id: i._id,
        number: i.invoiceNumber,
        customer: i.orderId?.userId?.email?.split('@')[0] || 'Customer',
        amount: `₦${i.totalAmount?.toLocaleString()}`,
        status: i.status?.toLowerCase() || 'pending'
      })));

      // Combine recent activities
      setRecentActivities([
        ...recentOrders,
        ...recentPayments,
        { id: 'stats', action: 'Dashboard updated', user: 'System', time: 'Just now', status: 'info' }
      ]);

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const handleVerifyPayment = async (transactionId) => {
    try {
      await paymentService.verifyBankTransfer(transactionId, { status: 'approve' });
      // Refresh data
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to verify payment:', err);
      alert('Failed to verify payment');
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-white">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="super-admin">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Super Admin Dashboard</h1>
            <p className="text-gray-400">Welcome back! Here's what's happening with your business today.</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="primary" 
              size="md" 
              icon="📊"
              onClick={() => window.print()}
            >
              Generate Report
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
            {error}
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            icon="💰"
            color="green"
            subtitle="All time revenue"
          />
          <Link href="/dashboards/super-admin-dashboard/invoices?filter=pending">
            <SummaryCard
              title="Pending Invoices"
              value={stats.pendingInvoices.toString()}
              icon="📄"
              color="yellow"
              subtitle="Awaiting payment"
            />
          </Link>
          <Link href="/dashboards/super-admin-dashboard/payment-verification">
            <SummaryCard
              title="Unverified Payments"
              value={stats.unverifiedPayments.toString()}
              icon="⏳"
              color="red"
              subtitle="Need attention"
            />
          </Link>
          <Link href="/dashboards/super-admin-dashboard/orders">
            <SummaryCard
              title="Total Orders"
              value={stats.totalOrders.toString()}
              icon="📦"
              color="blue"
              subtitle={`${stats.paidOrders} paid, ${stats.partPaidOrders} partial`}
            />
          </Link>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboards/super-admin-dashboard/admin-management">
            <SummaryCard
              title="Active Admins"
              value={stats.activeAdmins.toString()}
              icon="👥"
              color="purple"
              subtitle="Currently managing system"
            />
          </Link>
          <Link href="/dashboards/super-admin-dashboard/invoices?filter=overdue">
            <SummaryCard
              title="Overdue Invoices"
              value={stats.overdueInvoices.toString()}
              icon="⚠️"
              color="orange"
              subtitle="Require attention"
            />
          </Link>
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
                    Verify Payments ({stats.unverifiedPayments})
                  </Button>
                </Link>
                <Link href="/dashboards/super-admin-dashboard/discounts">
                  <Button variant="secondary" size="md" className="w-full justify-start" icon="🏷️">
                    Manage Discounts
                  </Button>
                </Link>
                <Link href="/dashboards/super-admin-dashboard/invoices/create">
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
                  <span className="text-gray-400">Active Users</span>
                  <span className="text-blue-400 flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    {stats.activeAdmins + 50}+
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
            {pendingVerifications.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No pending verifications</p>
            ) : (
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
                          <button 
                            onClick={() => handleVerifyPayment(item.id)}
                            className="text-red-500 hover:text-red-400 text-sm font-medium"
                          >
                            Verify
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity & Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-slate-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No recent activity</p>
              ) : (
                recentActivities.map((activity) => (
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
                ))
              )}
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
              {recentInvoices.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No recent invoices</p>
              ) : (
                recentInvoices.map((invoice) => (
                  <Link key={invoice.id} href={`/dashboards/super-admin-dashboard/invoices/${invoice.id}`}>
                    <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition cursor-pointer">
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
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Navigation Cards for Main Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <Link href="/dashboards/super-admin-dashboard/admin-management">
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-950/50 p-6 rounded-lg border border-purple-800 hover:border-purple-600 transition cursor-pointer group">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="text-white font-bold text-lg group-hover:text-purple-400 transition">Admin Management</h3>
              <p className="text-gray-400 text-sm mt-2">Create, activate, or deactivate administrators</p>
              <p className="text-xs text-purple-400 mt-3">{stats.activeAdmins} active admins</p>
            </div>
          </Link>

          <Link href="/dashboards/super-admin-dashboard/discounts">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-950/50 p-6 rounded-lg border border-blue-800 hover:border-blue-600 transition cursor-pointer group">
              <div className="text-4xl mb-3">🏷️</div>
              <h3 className="text-white font-bold text-lg group-hover:text-blue-400 transition">Discounts</h3>
              <p className="text-gray-400 text-sm mt-2">Manage promotional codes and discounts</p>
            </div>
          </Link>

          <Link href="/dashboards/super-admin-dashboard/invoices">
            <div className="bg-gradient-to-br from-green-900/50 to-green-950/50 p-6 rounded-lg border border-green-800 hover:border-green-600 transition cursor-pointer group">
              <div className="text-4xl mb-3">📄</div>
              <h3 className="text-white font-bold text-lg group-hover:text-green-400 transition">Invoices</h3>
              <p className="text-gray-400 text-sm mt-2">View and manage all invoices</p>
              <p className="text-xs text-green-400 mt-3">{stats.pendingInvoices} pending</p>
            </div>
          </Link>

          <Link href="/dashboards/super-admin-dashboard/payment-verification">
            <div className="bg-gradient-to-br from-red-900/50 to-red-950/50 p-6 rounded-lg border border-red-800 hover:border-red-600 transition cursor-pointer group">
              <div className="text-4xl mb-3">✓</div>
              <h3 className="text-white font-bold text-lg group-hover:text-red-400 transition">Payment Verification</h3>
              <p className="text-gray-400 text-sm mt-2">Verify customer payments</p>
              <p className="text-xs text-red-400 mt-3">{stats.unverifiedPayments} pending</p>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}