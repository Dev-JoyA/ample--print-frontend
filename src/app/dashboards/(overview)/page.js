'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import SummaryCard from '@/components/cards/SummaryCard';
import OrderCard from '@/components/cards/OrderCard';
import InvoiceCard from '@/components/cards/InvoiceCard';
import Button from '@/components/ui/Button';
import { useProtectedRoute } from '@/app/lib/auth';
import { customerService } from '@/services/customerService';

export default function CustomerDashboard() {
  const router = useRouter();
  const { isLoading: authLoading, user } = useProtectedRoute({
    redirectTo: '/auth/sign-in'
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    activeOrders: 0,
    pendingInvoices: 0,
    designsForApproval: 0,
    completedOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
    }
  }, [authLoading, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get user profile
      const profile = await customerService.getUserProfile();
      setUserName(profile.name);

      // Get dashboard stats
      const data = await customerService.getDashboardStats();
      
      setStats({
        activeOrders: data.activeOrders,
        pendingInvoices: data.pendingInvoices,
        designsForApproval: data.designsForApproval,
        completedOrders: data.completedOrders
      });

      setRecentOrders(data.recentOrders || []);
      setUnpaidInvoices(data.unpaidInvoices || []);

    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Unable to load some dashboard data. Showing available information.');
    } finally {
      setLoading(false);
    }
  };

  const getDesignsMessage = () => {
    if (stats.designsForApproval === 0) return "No designs awaiting approval";
    if (stats.designsForApproval === 1) return "You have 1 design awaiting your approval";
    return `You have ${stats.designsForApproval} designs awaiting your approval`;
  };

  const getWelcomeName = () => {
    if (userName) return userName.split(' ')[0];
    //if (user?.email) return user.email.split('@')[0];
    return 'there';
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, {getWelcomeName()}
            </h1>
            <p className="text-gray-400">{getDesignsMessage()}</p>
          </div>
          <Link href="/new-order">
            <Button variant="primary" size="md" className="gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Start a New Print Order
            </Button>
          </Link>
        </div>

        {/* Error Message (non-blocking) */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-yellow-200 text-sm">{error}</p>
            <button 
              onClick={fetchDashboardData}
              className="ml-auto text-sm text-yellow-400 hover:text-yellow-300 underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary Cards with Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/dashboards/active-orders" className="block cursor-pointer">
            <SummaryCard
              title="Active Orders"
              value={stats.activeOrders.toString()}
              icon="📦"
              color="blue"
              subtitle="In progress"
            />
          </Link>
          <Link href="/invoices?filter=pending" className="block cursor-pointer">
            <SummaryCard
              title="Available Invoices"
              value={stats.pendingInvoices.toString()}
              icon="📄"
              color="red"
              subtitle="View all sent invoices"
            />
          </Link>
          <Link href="/designs?filter=pending" className="block cursor-pointer">
            <SummaryCard
              title="Designs to Review"
              value={stats.designsForApproval.toString()}
              icon="🎨"
              color="yellow"
              subtitle="Awaiting approval"
            />
          </Link>
          <Link href="/order-history?filter=completed" className="block cursor-pointer">
            <SummaryCard
              title="Completed"
              value={stats.completedOrders.toString()}
              icon="✅"
              color="green"
              subtitle="Delivered orders"
            />
          </Link>
        </div>

        {/* Active Orders & Unpaid Invoices */}
        <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
          {/* Active Orders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
              <Link href="/order-history" className="text-primary hover:text-primary-dark text-sm transition">
                View All →
              </Link>
            </div>
            
            {recentOrders.length === 0 ? (
              <div className="bg-slate-900/50 rounded-xl border border-gray-800 p-8 text-center">
                <p className="text-gray-400 mb-3">No active orders</p>
                <Link href="/collections">
                  <Button variant="primary" size="sm">
                    Start Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <OrderCard 
                    key={order._id} 
                    order={{
                      id: order._id,
                      orderNumber: order.orderNumber,
                      productName: order.items?.[0]?.productName || 'Multiple Items',
                      orderedDate: new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      }).replace(/\//g, '-'),
                      totalAmount: order.totalAmount,
                      status: order.status,
                      itemsCount: order.items?.length || 1
                    }}
                    onClick={() => router.push(`/orders/${order._id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Unpaid Invoices */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Pending Invoices</h2>
              <Link href="/invoices" className="text-primary hover:text-primary-dark text-sm transition">
                View All →
              </Link>
            </div>
            
            {unpaidInvoices.length === 0 ? (
              <div className="bg-slate-900/50 rounded-xl border border-gray-800 p-8 text-center">
                <p className="text-gray-400">No pending invoices</p>
              </div>
            ) : (
              <div className="space-y-4">
                {unpaidInvoices.map((invoice) => (
                  <InvoiceCard 
                    key={invoice._id} 
                    invoice={{
                      id: invoice._id,
                      invoiceNumber: invoice.invoiceNumber,
                      balance: invoice.remainingAmount || invoice.totalAmount,
                      status: invoice.status,
                      dueSoon: invoice.dueDate ? new Date(invoice.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : false
                    }}
                    onClick={() => router.push(`/invoices/${invoice._id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}