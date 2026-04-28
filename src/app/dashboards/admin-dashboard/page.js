'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import SummaryCard from '@/components/cards/SummaryCard';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { customerBriefService } from '@/services/customerBriefService';
import { feedbackService } from '@/services/feedbackService';
import { METADATA } from '@/lib/metadata';
import { getImageUrl } from '@/lib/imageUtils';

export default function AdminDashboard() {
  const router = useRouter();
  useAuthCheck();

  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingBriefs: 0,
    paidOrders: 0,
    designReady: 0,
    readyForShipping: 0,
    completedOrders: 0,
    pendingFeedback: 0,
    rejectedDesigns: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingBriefs, setPendingBriefs] = useState([]);
  const [recentFeedback, setRecentFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const ordersResponse = await orderService.getAll({ limit: 50, page: 1 });

      let orders = [];
      if (ordersResponse?.order && Array.isArray(ordersResponse.order)) {
        orders = ordersResponse.order;
      }

      setRecentOrders(orders.slice(0, 5));

      const totalOrders = ordersResponse?.total || orders.length;
      const paidOrders = orders.filter(
        (o) => o.paymentStatus === 'Completed' || o.paymentStatus === 'PartPayment'
      ).length;
      const designReady = orders.filter((o) => o.status === 'Approved').length;
      const readyForShipping = orders.filter((o) => o.status === 'ReadyForShipping').length;
      const completedOrders = orders.filter((o) => o.status === 'Delivered').length;

      try {
        const briefsResponse = await orderService.filter({
          status: 'FilesUploaded',
          limit: 5,
        });

        let briefs = [];
        let pendingBriefsCount = 0;

        if (briefsResponse?.order && Array.isArray(briefsResponse.order)) {
          briefs = briefsResponse.order;
          pendingBriefsCount = briefsResponse.total || briefs.length;
        }

        setPendingBriefs(briefs);

        setStats((prev) => ({
          ...prev,
          totalOrders,
          pendingBriefs: pendingBriefsCount,
          paidOrders,
          designReady,
          readyForShipping,
          completedOrders,
        }));
      } catch (briefError) {
        console.error('Failed to fetch briefs:', briefError);
        setStats((prev) => ({
          ...prev,
          totalOrders,
          pendingBriefs: 0,
          paidOrders,
          designReady,
          readyForShipping,
          completedOrders,
        }));
        setPendingBriefs([]);
      }

      try {
        const feedbackResponse = await feedbackService.getPending({ limit: 5 });
        const feedbackData = feedbackResponse?.feedback || feedbackResponse?.data || [];
        const rejectedDesigns = feedbackData.filter((f) => f.designId).length;

        setRecentFeedback(feedbackData.slice(0, 3));
        setStats((prev) => ({
          ...prev,
          pendingFeedback: feedbackResponse?.total || feedbackData.length,
          rejectedDesigns,
        }));
      } catch (fbError) {
        console.error('Failed to fetch feedback:', fbError);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReviewed = async (feedbackId) => {
    try {
      await feedbackService.updateStatus(feedbackId, 'Reviewed');
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to update feedback status:', err);
    }
  };

  const getCustomerName = (order) => {
    if (order.userId?.fullname) return order.userId.fullname;
    if (order.userId?.email) return order.userId.email.split('@')[0];
    return 'Customer';
  };

  const handleQuickFilter = () => {
    router.push(`/dashboards/admin-dashboard/customer-briefs`);
  };

  //   const getImageUrl = (path) => {
  //     if (!path) return null;
  //     if (path.startsWith('http')) return path;
  //     let filename = path.split('/').pop();
  //     return `http://localhost:4001/api/v1/attachments/download/${filename}`;
  //   };

  if (loading) {
    return (
      <>
        <SEOHead {...METADATA.dashboard.admin} />
        <DashboardLayout userRole="admin">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="relative text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent sm:h-12 sm:w-12"></div>
              <p className="mt-4 text-sm text-gray-400 sm:text-base">Loading dashboard...</p>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.dashboard.admin} />
      <DashboardLayout userRole="admin">
        <div className="mx-auto max-w-7xl space-y-6 px-4 sm:space-y-8 sm:px-6 lg:px-8">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-400 sm:text-base">
                Manage orders, customer briefs, designs, and feedback
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboards/admin-dashboard/orders">
                <Button variant="primary" size="md" className="text-sm">
                  View All Orders
                </Button>
              </Link>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-700 bg-red-900/50 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            <div onClick={() => handleQuickFilter('all')} className="cursor-pointer">
              <SummaryCard
                title="Total Orders"
                value={stats.totalOrders.toString()}
                icon="📦"
                color="blue"
              />
            </div>

            {/* <div onClick={() => handleQuickFilter('pending-briefs')} className="cursor-pointer"> */}
            <div onClick={() => handleQuickFilter()} className="cursor-pointer">
              <SummaryCard
                title="Pending Briefs"
                value={stats.pendingBriefs.toString()}
                icon="📝"
                color="yellow"
                subtitle="Orders awaiting brief response"
              />
            </div>

            <div
              onClick={() => router.push('/dashboards/admin-dashboard/feedback')}
              className="cursor-pointer"
            >
              <SummaryCard
                title="Pending Feedback"
                value={stats.pendingFeedback.toString()}
                icon="💬"
                color="orange"
                subtitle={`${stats.rejectedDesigns} design rejections`}
              />
            </div>

            <div onClick={() => handleQuickFilter('ready-to-ship')} className="cursor-pointer">
              <SummaryCard
                title="Ready to Ship"
                value={stats.readyForShipping.toString()}
                icon="📬"
                color="teal"
                subtitle="Orders ready for shipping"
              />
            </div>

            <div onClick={() => handleQuickFilter('completed')} className="cursor-pointer">
              <SummaryCard
                title="Delivered"
                value={stats.completedOrders.toString()}
                icon="✅"
                color="green"
                subtitle="Orders delivered"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            <div
              onClick={() => router.push('/dashboards/admin-dashboard/orders/management')}
              className="cursor-pointer rounded-lg border border-purple-800 bg-gradient-to-br from-purple-900/30 to-purple-950/30 p-5 transition hover:border-purple-600 sm:p-6"
            >
              <div className="mb-3 text-3xl sm:text-4xl">🎨</div>
              <h3 className="text-base font-bold text-white sm:text-lg">Order Management</h3>
              <p className="mt-2 text-xs text-gray-400 sm:text-sm">
                {stats.designReady} orders with approved designs ready for production
              </p>
              <span className="mt-2 block text-xs text-purple-400">Start production →</span>
            </div>

            <div
              onClick={() => router.push('/dashboards/admin-dashboard/shipping')}
              className="cursor-pointer rounded-lg border border-teal-800 bg-gradient-to-br from-teal-900/30 to-teal-950/30 p-5 transition hover:border-teal-600 sm:p-6"
            >
              <div className="mb-3 text-3xl sm:text-4xl">🚚</div>
              <h3 className="text-base font-bold text-white sm:text-lg">Shipping Management</h3>
              <p className="mt-2 text-xs text-gray-400 sm:text-sm">
                Manage deliveries, pickups, and shipping invoices
              </p>
              <span className="mt-2 block text-xs text-teal-400">View all shipping →</span>
            </div>

            <div
              onClick={() => router.push('/dashboards/admin-dashboard/feedback')}
              className="cursor-pointer rounded-lg border border-orange-800 bg-gradient-to-br from-orange-900/30 to-orange-950/30 p-5 transition hover:border-orange-600 sm:p-6"
            >
              <div className="mb-3 text-3xl sm:text-4xl">💬</div>
              <h3 className="text-base font-bold text-white sm:text-lg">Customer Feedback</h3>
              <p className="mt-2 text-xs text-gray-400 sm:text-sm">
                {stats.pendingFeedback} pending responses • {stats.rejectedDesigns} design
                rejections
              </p>
              <span className="mt-2 block text-xs text-orange-400">View feedback →</span>
            </div>

            <div
              onClick={() => router.push('/dashboards/admin-dashboard/design-upload')}
              className="cursor-pointer rounded-lg border border-blue-800 bg-gradient-to-br from-blue-900/30 to-blue-950/30 p-5 transition hover:border-blue-600 sm:p-6"
            >
              <div className="mb-3 text-3xl sm:text-4xl">🎨</div>
              <h3 className="text-base font-bold text-white sm:text-lg">Upload Design</h3>
              <p className="mt-2 text-xs text-gray-400 sm:text-sm">
                Upload designs for paid orders or respond to rejections
              </p>
              <span className="mt-2 block text-xs text-blue-400">Click to upload →</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-lg border border-gray-800 bg-slate-900">
              <div className="border-b border-gray-800 p-4 sm:p-6">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <h2 className="text-lg font-semibold text-white sm:text-xl">Recent Orders</h2>
                  <Link
                    href="/dashboards/admin-dashboard/orders"
                    className="text-sm text-red-500 hover:text-red-400"
                  >
                    View All →
                  </Link>
                </div>
              </div>

              {recentOrders.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-400">No recent orders</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {recentOrders.map((order) => (
                    <Link key={order._id} href={`/dashboards/admin-dashboard/orders/${order._id}`}>
                      <div className="cursor-pointer p-4 transition hover:bg-slate-800/50">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-white sm:text-base">
                              {order.orderNumber}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-400">{getCustomerName(order)}</span>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-gray-400">
                              {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                            </span>
                            <span className="text-gray-400">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-white">
                            ₦{order.totalAmount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {order.paymentStatus === 'Completed' && (
                            <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-xs text-green-400">
                              Paid
                            </span>
                          )}
                          {order.paymentStatus === 'PartPayment' && (
                            <span className="rounded-full bg-yellow-600/20 px-2 py-0.5 text-xs text-yellow-400">
                              Part Payment
                            </span>
                          )}
                          {order.status === 'Approved' && (
                            <span className="rounded-full bg-purple-600/20 px-2 py-0.5 text-xs text-purple-400">
                              Design Ready
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-800 bg-slate-900">
              <div className="border-b border-gray-800 p-4 sm:p-6">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-white sm:text-xl">Pending Briefs</h2>
                    <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                      Orders awaiting brief response
                    </p>
                  </div>
                  <Link
                    href="/dashboards/admin-dashboard/customer-briefs"
                    className="text-sm text-red-500 hover:text-red-400"
                  >
                    View All →
                  </Link>
                </div>
              </div>

              {pendingBriefs.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-400">No pending briefs</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {pendingBriefs.map((order) => (
                    <Link key={order._id} href={`/dashboards/admin-dashboard/orders/${order._id}`}>
                      <div className="cursor-pointer p-4 transition hover:bg-slate-800/30">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                          <div className="min-w-0 flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-white">
                                Order #{order.orderNumber}
                              </span>
                              <span className="rounded-full bg-yellow-600/20 px-2 py-0.5 text-xs text-yellow-400">
                                Brief Pending
                              </span>
                            </div>

                            <div className="mb-2 space-y-1">
                              <p className="text-xs text-gray-300 sm:text-sm">
                                <span className="text-gray-500">Customer:</span>{' '}
                                {getCustomerName(order)}
                              </p>
                              <p className="text-xs text-gray-300 sm:text-sm">
                                <span className="text-gray-500">Products:</span>{' '}
                                {order.items?.map((item) => item.productName).join(', ')}
                              </p>
                            </div>

                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                Submitted: {new Date(order.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <Button
                            variant="primary"
                            size="sm"
                            className="w-full whitespace-nowrap text-sm sm:w-auto"
                          >
                            Review Brief
                          </Button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
