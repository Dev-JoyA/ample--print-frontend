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

export default function AdminDashboard() {
  const router = useRouter();
  useAuthCheck();
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingBriefs: 0,
    paidOrders: 0,
    inProduction: 0,
    readyForShipping: 0,
    completedOrders: 0,
    designReady: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingBriefs, setPendingBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all orders
      const ordersResponse = await orderService.getAll({ limit: 10, page: 1 });
      
      let orders = [];
      if (ordersResponse?.order && Array.isArray(ordersResponse.order)) {
        orders = ordersResponse.order;
      }
      
      // Get only 5 most recent orders
      setRecentOrders(orders.slice(0, 5));

      // Calculate stats
      const totalOrders = ordersResponse?.total || orders.length;
      const paidOrders = orders.filter(o => o.paymentStatus === 'Completed').length;
      const inProduction = orders.filter(o => o.status === 'InProduction').length;
      const readyForShipping = orders.filter(o => o.status === 'ReadyForShipping').length;
      const completedOrders = orders.filter(o => o.status === 'Delivered').length;
      const designReady = orders.filter(o => o.status === 'DesignUploaded' || o.status === 'Approved').length;

      // Fetch pending briefs (customer briefs needing admin response)
      try {
        const briefsResponse = await customerBriefService.getAdminBriefs({ 
          hasResponded: false,
          limit: 2
        });
        
        let briefs = [];
        let pendingBriefsCount = 0;
        
        if (briefsResponse?.briefs && Array.isArray(briefsResponse.briefs)) {
          briefs = briefsResponse.briefs;
          pendingBriefsCount = briefsResponse.total || briefs.length;
        }
        
        setPendingBriefs(briefs);
        
        setStats({
          totalOrders,
          pendingBriefs: pendingBriefsCount,
          paidOrders,
          inProduction,
          readyForShipping,
          completedOrders,
          designReady
        });
      } catch (briefError) {
        console.error("Failed to fetch briefs:", briefError);
        setStats({
          totalOrders,
          pendingBriefs: 0,
          paidOrders,
          inProduction,
          readyForShipping,
          completedOrders,
          designReady
        });
        setPendingBriefs([]);
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (order) => {
    if (order.userId?.fullname) return order.userId.fullname;
    if (order.userId?.email) return order.userId.email.split('@')[0];
    return 'Customer';
  };

  const getBriefCustomerInfo = (brief) => {
    // Extract customer info from brief (you might need to adjust this based on your data structure)
    if (brief.orderId?.userId) {
      if (brief.orderId.userId.fullname) return brief.orderId.userId.fullname;
      if (brief.orderId.userId.email) return brief.orderId.userId.email.split('@')[0];
    }
    return 'Customer';
  };

  const handleQuickFilter = (filter) => {
    router.push(`/dashboards/admin-dashboard/orders?filter=${filter}`);
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
            <p className="text-gray-400">Manage orders, customer briefs, and designs</p>
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
          <div onClick={() => router.push('/dashboards/admin-dashboard/customer-briefs')} className="cursor-pointer">
            <SummaryCard
              title="Pending Briefs"
              value={stats.pendingBriefs.toString()}
              icon="📝"
              color="yellow"
            />
          </div>
          <div onClick={() => handleQuickFilter('paid')} className="cursor-pointer">
            <SummaryCard
              title="Paid Orders"
              value={stats.paidOrders.toString()}
              icon="💰"
              color="green"
            />
          </div>
          <div onClick={() => handleQuickFilter('design-ready')} className="cursor-pointer">
            <SummaryCard
              title="Design Ready"
              value={stats.designReady.toString()}
              icon="🎨"
              color="purple"
            />
          </div>
          <div onClick={() => handleQuickFilter('ready-to-ship')} className="cursor-pointer">
            <SummaryCard
              title="Ready to Ship"
              value={stats.readyForShipping.toString()}
              icon="📬"
              color="teal"
            />
          </div>
          <div onClick={() => handleQuickFilter('completed')} className="cursor-pointer">
            <SummaryCard
              title="Completed"
              value={stats.completedOrders.toString()}
              icon="✅"
              color="green"
            />
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => handleQuickFilter('paid')}
            className="bg-gradient-to-br from-green-900/30 to-green-950/30 p-6 rounded-lg border border-green-800 hover:border-green-600 transition cursor-pointer"
          >
            <div className="text-4xl mb-3">💰</div>
            <h3 className="text-white font-bold text-lg">Paid Orders</h3>
            <p className="text-gray-400 text-sm mt-2">
              {stats.paidOrders} orders ready for design work
            </p>
            <span className="text-xs text-green-400 mt-2 block">Click to view →</span>
          </div>

          <div 
            onClick={() => router.push('/dashboards/admin-dashboard/design-upload')}
            className="bg-gradient-to-br from-purple-900/30 to-purple-950/30 p-6 rounded-lg border border-purple-800 hover:border-purple-600 transition cursor-pointer"
          >
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="text-white font-bold text-lg">Upload Design</h3>
            <p className="text-gray-400 text-sm mt-2">
              Upload designs for approved orders
            </p>
            <span className="text-xs text-purple-400 mt-2 block">Click to upload →</span>
          </div>

          <div 
            onClick={() => handleQuickFilter('ready-to-ship')}
            className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 p-6 rounded-lg border border-blue-800 hover:border-blue-600 transition cursor-pointer"
          >
            <div className="text-4xl mb-3">📬</div>
            <h3 className="text-white font-bold text-lg">Ready to Ship</h3>
            <p className="text-gray-400 text-sm mt-2">
              {stats.readyForShipping} orders ready for shipping
            </p>
            <span className="text-xs text-blue-400 mt-2 block">Click to view →</span>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders - Styled Better */}
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
                      {order.paymentStatus === 'Completed' && (
                        <div className="mt-2">
                          <span className="text-xs bg-green-600/20 text-green-400 px-2 py-0.5 rounded-full">
                            Paid
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Pending Customer Briefs - Styled Better */}
          <div className="bg-slate-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Pending Customer Briefs</h2>
                  <p className="text-sm text-gray-400 mt-1">Briefs awaiting your response</p>
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
                {pendingBriefs.map((brief) => {
                  const customerName = getBriefCustomerInfo(brief);
                  const orderNumber = brief.orderId?.orderNumber || 'N/A';
                  const productName = brief.productId?.name || 'Unknown Product';
                  
                  return (
                    <div key={brief._id} className="p-4 hover:bg-slate-800/30 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-white font-medium">Order #{orderNumber}</span>
                            <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full">
                              Needs Response
                            </span>
                          </div>
                          
                          <div className="space-y-1 mb-3">
                            <p className="text-sm text-gray-300">
                              <span className="text-gray-500">Customer:</span> {customerName}
                            </p>
                            <p className="text-sm text-gray-300">
                              <span className="text-gray-500">Product:</span> {productName}
                            </p>
                          </div>

                          <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                            {brief.description || 'No description provided'}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex gap-2 text-xs">
                              {brief.image && <span className="text-blue-400">📷 Image</span>}
                              {brief.voiceNote && <span className="text-green-400">🎤 Voice</span>}
                              {brief.video && <span className="text-red-400">🎥 Video</span>}
                              {brief.logo && <span className="text-purple-400">🎨 Logo</span>}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(brief.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <Link href={`/dashboards/admin-dashboard/customer-briefs/${brief._id}`}>
                          <Button variant="primary" size="sm" className="whitespace-nowrap">
                            Respond to Brief
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Row */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-gray-800 p-4">
            <p className="text-sm text-gray-400">In Production</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.inProduction}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-gray-800 p-4">
            <p className="text-sm text-gray-400">Design Ready</p>
            <p className="text-2xl font-bold text-purple-400">{stats.designReady}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-gray-800 p-4">
            <p className="text-sm text-gray-400">Ready to Ship</p>
            <p className="text-2xl font-bold text-blue-400">{stats.readyForShipping}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-gray-800 p-4">
            <p className="text-sm text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-green-400">{stats.completedOrders}</p>
          </div>
        </div> */}
      </div>
    </DashboardLayout>
  );
}