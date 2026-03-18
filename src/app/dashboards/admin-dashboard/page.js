'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import SummaryCard from '@/components/cards/SummaryCard';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { customerBriefService } from '@/services/customerBriefService';
import { feedbackService } from '@/services/feedbackService';

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
    rejectedDesigns: 0
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
      
      // Fetch all orders
      const ordersResponse = await orderService.getAll({ limit: 50, page: 1 });
      
      let orders = [];
      if (ordersResponse?.order && Array.isArray(ordersResponse.order)) {
        orders = ordersResponse.order;
      }
      
      // Get 5 most recent orders
      setRecentOrders(orders.slice(0, 5));

      // Calculate stats based on correct criteria
      const totalOrders = ordersResponse?.total || orders.length;
      
      // Paid orders: paymentStatus === 'Completed' OR paymentStatus === 'PartPayment'
      const paidOrders = orders.filter(o => 
        o.paymentStatus === 'Completed' || o.paymentStatus === 'PartPayment'
      ).length;
      
      // Design Ready: status === 'Approved' (design approved, ready for production)
      const designReady = orders.filter(o => o.status === 'Approved').length;
      
      // Ready for Shipping: status === 'ReadyForShipping' (ready to be shipped)
      const readyForShipping = orders.filter(o => o.status === 'ReadyForShipping').length;
      
      // Completed/Delivered: status === 'Delivered'
      const completedOrders = orders.filter(o => o.status === 'Delivered').length;

      // Fetch pending briefs (orders with status 'FilesUploaded')
      try {
        const briefsResponse = await orderService.filter({ 
          status: 'FilesUploaded',
          limit: 5
        });
        
        let briefs = [];
        let pendingBriefsCount = 0;
        
        if (briefsResponse?.order && Array.isArray(briefsResponse.order)) {
          briefs = briefsResponse.order;
          pendingBriefsCount = briefsResponse.total || briefs.length;
        }
        
        setPendingBriefs(briefs);
        
        setStats(prev => ({
          ...prev,
          totalOrders,
          pendingBriefs: pendingBriefsCount,
          paidOrders,
          designReady,
          readyForShipping,
          completedOrders
        }));
      } catch (briefError) {
        console.error("Failed to fetch briefs:", briefError);
        setStats(prev => ({
          ...prev,
          totalOrders,
          pendingBriefs: 0,
          paidOrders,
          designReady,
          readyForShipping,
          completedOrders
        }));
        setPendingBriefs([]);
      }

      // Fetch pending feedback
      try {
        const feedbackResponse = await feedbackService.getPending({ limit: 5 });
        const feedbackData = feedbackResponse?.feedback || feedbackResponse?.data || [];
        
        // Count rejected designs (feedback related to designs)
        const rejectedDesigns = feedbackData.filter(f => f.designId).length;
        
        setRecentFeedback(feedbackData.slice(0, 3));
        setStats(prev => ({
          ...prev,
          pendingFeedback: feedbackResponse?.total || feedbackData.length,
          rejectedDesigns
        }));
      } catch (fbError) {
        console.error("Failed to fetch feedback:", fbError);
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
      // Refresh data
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

  const handleQuickFilter = (filter) => {
    router.push(`/dashboards/admin-dashboard/orders?filter=${filter}`);
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    let filename = path.split('/').pop();
    return `http://localhost:4001/api/v1/attachments/download/${filename}`;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-white">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage orders, customer briefs, designs, and feedback</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboards/admin-dashboard/orders">
              <Button variant="primary" size="md">
                View All Orders
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
            {error}
          </div>
        )}

        {/* Summary Cards - Clickable */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div onClick={() => handleQuickFilter('all')} className="cursor-pointer">
            <SummaryCard
              title="Total Orders"
              value={stats.totalOrders.toString()}
              icon="📦"
              color="blue"
            />
          </div>
          
          <div onClick={() => handleQuickFilter('pending-briefs')} className="cursor-pointer">
            <SummaryCard
              title="Pending Briefs"
              value={stats.pendingBriefs.toString()}
              icon="📝"
              color="yellow"
              subtitle="Orders awaiting brief response"
            />
          </div>
          
          <div onClick={() => router.push('/dashboards/admin-dashboard/feedback')} className="cursor-pointer">
            <SummaryCard
              title="Pending Feedback"
              value={stats.pendingFeedback.toString()}
              icon="💬"
              color="orange"
              subtitle={`${stats.rejectedDesigns} design rejections`}
            />
          </div>
          
          {/* <div onClick={() => router.push('/dashboards/admin-dashboard/orders/approved')} className="cursor-pointer">
            <SummaryCard
              title="Design Ready"
              value={stats.designReady.toString()}
              icon="🎨"
              color="purple"
              subtitle="Approved designs ready for production"
            />
          </div> */}
          
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

        {/* Quick Action Cards - Updated */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => router.push('/dashboards/admin-dashboard/orders/approved')}
            className="bg-gradient-to-br from-purple-900/30 to-purple-950/30 p-6 rounded-lg border border-purple-800 hover:border-purple-600 transition cursor-pointer"
          >
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="text-white font-bold text-lg">Order Management</h3>
            <p className="text-gray-400 text-sm mt-2">
              {stats.designReady} orders with approved designs ready for production
            </p>
            <span className="text-xs text-purple-400 mt-2 block">Start production →</span>
          </div>

            <div 
                onClick={() => router.push('/dashboards/admin-dashboard/shipping')}
                className="bg-gradient-to-br from-teal-900/30 to-teal-950/30 p-6 rounded-lg border border-teal-800 hover:border-teal-600 transition cursor-pointer"
                >
                <div className="text-4xl mb-3">🚚</div>
                <h3 className="text-white font-bold text-lg">Shipping Management</h3>
                <p className="text-gray-400 text-sm mt-2">
                    Manage deliveries, pickups, and shipping invoices
                </p>
                <span className="text-xs text-teal-400 mt-2 block">View all shipping →</span>
                </div>

          <div 
            onClick={() => router.push('/dashboards/admin-dashboard/feedback')}
            className="bg-gradient-to-br from-orange-900/30 to-orange-950/30 p-6 rounded-lg border border-orange-800 hover:border-orange-600 transition cursor-pointer"
          >
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-white font-bold text-lg">Customer Feedback</h3>
            <p className="text-gray-400 text-sm mt-2">
              {stats.pendingFeedback} pending responses • {stats.rejectedDesigns} design rejections
            </p>
            <span className="text-xs text-orange-400 mt-2 block">View feedback →</span>
          </div>

          <div 
            onClick={() => router.push('/dashboards/admin-dashboard/design-upload')}
            className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 p-6 rounded-lg border border-blue-800 hover:border-blue-600 transition cursor-pointer"
          >
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="text-white font-bold text-lg">Upload Design</h3>
            <p className="text-gray-400 text-sm mt-2">
              Upload designs for paid orders or respond to rejections
            </p>
            <span className="text-xs text-blue-400 mt-2 block">Click to upload →</span>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-slate-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
                <Link href="/dashboards/admin-dashboard/orders" className="text-red-500 hover:text-red-400 text-sm">
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
                    <div className="p-4 hover:bg-slate-800/50 transition cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{order.orderNumber}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-400">{getCustomerName(order)}</span>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400">
                            {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                          </span>
                          <span className="text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-white font-medium">
                          ₦{order.totalAmount?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {order.paymentStatus === 'Completed' && (
                          <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full">
                            Paid
                          </span>
                        )}
                        {order.paymentStatus === 'PartPayment' && (
                          <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full">
                            Part Payment
                          </span>
                        )}
                        {order.status === 'Approved' && (
                          <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full">
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

          {/* Pending Customer Briefs */}
          <div className="bg-slate-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Pending Briefs</h2>
                  <p className="text-sm text-gray-400 mt-1">Orders awaiting brief response</p>
                </div>
                <Link href="/dashboards/admin-dashboard/customer-briefs" className="text-red-500 hover:text-red-400 text-sm">
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
                    <div className="p-4 hover:bg-slate-800/30 transition cursor-pointer">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-white font-medium">Order #{order.orderNumber}</span>
                            <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full">
                              Brief Pending
                            </span>
                          </div>
                          
                          <div className="space-y-1 mb-2">
                            <p className="text-sm text-gray-300">
                              <span className="text-gray-500">Customer:</span> {getCustomerName(order)}
                            </p>
                            <p className="text-sm text-gray-300">
                              <span className="text-gray-500">Products:</span>{' '}
                              {order.items?.map(item => item.productName).join(', ')}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              Submitted: {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <Button variant="primary" size="sm" className="whitespace-nowrap">
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
  );
}