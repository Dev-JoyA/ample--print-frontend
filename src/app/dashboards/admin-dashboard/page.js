'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import SummaryCard from '@/components/cards/SummaryCard';
import Button from '@/components/ui/Button';
import { useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { customerBriefService } from '@/services/customerBriefService';
import { collectionService } from '@/services/collectionService';
import { productService } from '@/services/productService';

export default function AdminDashboard() {
  useAuthCheck();
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingBriefs: 0,
    paidOrders: 0,
    inProduction: 0,
    readyForShipping: 0,
    completedOrders: 0
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [pendingBriefs, setPendingBriefs] = useState([]);
  const [recentCollections, setRecentCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all orders (latest first, limit 10)
      const ordersResponse = await orderService.getAll({ limit: 10, page: 1 });
      console.log("Orders response:", ordersResponse);
      
      // Handle response structure
      let orders = [];
      if (ordersResponse?.order && Array.isArray(ordersResponse.order)) {
        orders = ordersResponse.order;
      } else if (ordersResponse?.data?.order && Array.isArray(ordersResponse.data.order)) {
        orders = ordersResponse.data.order;
      } else if (Array.isArray(ordersResponse)) {
        orders = ordersResponse;
      }
      
      setRecentOrders(orders.slice(0, 5)); // Show only 5 most recent

      // Calculate stats from orders
      const totalOrders = ordersResponse?.total || orders.length;
      const paidOrders = orders.filter(o => 
        o.paymentStatus === 'Completed' || o.paymentStatus === 'completed'
      ).length;
      
      const inProduction = orders.filter(o => 
        o.status === 'InProduction' || o.status === 'inProduction'
      ).length;
      
      const readyForShipping = orders.filter(o => 
        o.status === 'ReadyForShipping' || o.status === 'readyForShipping'
      ).length;
      
      const completedOrders = orders.filter(o => 
        o.status === 'Delivered' || o.status === 'delivered' || o.status === 'Completed'
      ).length;

      // Fetch pending briefs (customer briefs needing admin response)
      try {
        const briefsResponse = await customerBriefService.getAdminBriefs({ 
          hasResponded: false,
          limit: 5
        });
        
        let briefs = [];
        let pendingBriefsCount = 0;
        
        if (briefsResponse?.briefs && Array.isArray(briefsResponse.briefs)) {
          briefs = briefsResponse.briefs;
          pendingBriefsCount = briefsResponse.total || briefs.length;
        } else if (briefsResponse?.data?.briefs) {
          briefs = briefsResponse.data.briefs;
          pendingBriefsCount = briefsResponse.data.total || briefs.length;
        }
        
        setPendingBriefs(briefs);
        
        setStats({
          totalOrders,
          pendingBriefs: pendingBriefsCount,
          paidOrders,
          inProduction,
          readyForShipping,
          completedOrders
        });
      } catch (briefError) {
        console.error("Failed to fetch briefs:", briefError);
        setStats({
          totalOrders,
          pendingBriefs: 0,
          paidOrders,
          inProduction,
          readyForShipping,
          completedOrders
        });
        setPendingBriefs([]);
      }

      // Fetch recent collections for quick access
      try {
        const collectionsResponse = await collectionService.getAll({ limit: 4 });
        let collections = [];
        if (collectionsResponse?.collections && Array.isArray(collectionsResponse.collections)) {
          collections = collectionsResponse.collections;
        } else if (Array.isArray(collectionsResponse)) {
          collections = collectionsResponse;
        }
        setRecentCollections(collections);
      } catch (colError) {
        console.error("Failed to fetch collections:", colError);
        setRecentCollections([]);
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Helper function for status badge color
  const getStatusColor = (status) => {
    const statusMap = {
      'Pending': 'yellow',
      'OrderReceived': 'blue',
      'FilesUploaded': 'purple',
      'DesignUploaded': 'indigo',
      'UnderReview': 'orange',
      'Approved': 'green',
      'AwaitingPartPayment': 'yellow',
      'PartPaymentMade': 'blue',
      'InProduction': 'purple',
      'Completed': 'green',
      'ReadyForShipping': 'teal',
      'Shipped': 'blue',
      'Delivered': 'green',
      'Cancelled': 'red'
    };
    return statusMap[status] || 'gray';
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
        {/* Header with Tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage products, orders, and customer briefs</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboards/admin-dashboard/collections/create">
              <Button variant="primary" size="md" icon="+">
                New Collection
              </Button>
            </Link>
            <Link href="/dashboards/admin-dashboard/products/create">
              <Button variant="secondary" size="md" icon="+">
                New Product
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-800">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-1 font-medium text-sm border-b-2 transition ${
                activeTab === 'overview'
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('collections')}
              className={`pb-4 px-1 font-medium text-sm border-b-2 transition ${
                activeTab === 'collections'
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Collections & Products
            </button>
            <button
              onClick={() => setActiveTab('briefs')}
              className={`pb-4 px-1 font-medium text-sm border-b-2 transition ${
                activeTab === 'briefs'
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Customer Briefs
              {stats.pendingBriefs > 0 && (
                <span className="ml-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.pendingBriefs}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-4 px-1 font-medium text-sm border-b-2 transition ${
                activeTab === 'orders'
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Order Management
            </button>
          </nav>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
            {error}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <SummaryCard
                title="Total Orders"
                value={stats.totalOrders.toString()}
                icon="📦"
                color="blue"
              />
              <SummaryCard
                title="Pending Briefs"
                value={stats.pendingBriefs.toString()}
                icon="📝"
                color="yellow"
              />
              <SummaryCard
                title="Paid Orders"
                value={stats.paidOrders.toString()}
                icon="💰"
                color="green"
              />
              <SummaryCard
                title="In Production"
                value={stats.inProduction.toString()}
                icon="⚙️"
                color="purple"
              />
              <SummaryCard
                title="Ready to Ship"
                value={stats.readyForShipping.toString()}
                icon="📬"
                color="teal"
              />
              <SummaryCard
                title="Completed"
                value={stats.completedOrders.toString()}
                icon="✅"
                color="green"
              />
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/dashboards/admin-dashboard/orders?filter=paid">
                <div className="bg-gradient-to-br from-green-900/30 to-green-950/30 p-6 rounded-lg border border-green-800 hover:border-green-600 transition cursor-pointer">
                  <div className="text-4xl mb-3">💰</div>
                  <h3 className="text-white font-bold text-lg">Paid Orders</h3>
                  <p className="text-gray-400 text-sm mt-2">
                    View all paid orders ready for design work
                  </p>
                </div>
              </Link>

              <Link href="/dashboards/admin-dashboard/design-upload">
                <div className="bg-gradient-to-br from-purple-900/30 to-purple-950/30 p-6 rounded-lg border border-purple-800 hover:border-purple-600 transition cursor-pointer">
                  <div className="text-4xl mb-3">🎨</div>
                  <h3 className="text-white font-bold text-lg">Upload Design</h3>
                  <p className="text-gray-400 text-sm mt-2">
                    Upload designs for approved orders
                  </p>
                </div>
              </Link>

              <Link href="/dashboards/admin-dashboard/orders/status-update">
                <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 p-6 rounded-lg border border-blue-800 hover:border-blue-600 transition cursor-pointer">
                  <div className="text-4xl mb-3">🔄</div>
                  <h3 className="text-white font-bold text-lg">Update Status</h3>
                  <p className="text-gray-400 text-sm mt-2">
                    Move orders through production stages
                  </p>
                </div>
              </Link>
            </div>

            {/* Recent Orders */}
            <div className="bg-slate-900 rounded-lg border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Recent Orders</h2>
                <Link href="/dashboards/admin-dashboard/orders" className="text-red-500 hover:text-red-400 text-sm">
                  View All →
                </Link>
              </div>
              
              {recentOrders.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No recent orders</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800 rounded-lg">
                      <tr>
                        <th className="text-left p-3 text-gray-400 font-medium text-sm">Order #</th>
                        <th className="text-left p-3 text-gray-400 font-medium text-sm">Customer</th>
                        <th className="text-left p-3 text-gray-400 font-medium text-sm">Items</th>
                        <th className="text-left p-3 text-gray-400 font-medium text-sm">Total</th>
                        <th className="text-left p-3 text-gray-400 font-medium text-sm">Payment</th>
                        <th className="text-left p-3 text-gray-400 font-medium text-sm">Status</th>
                        <th className="text-left p-3 text-gray-400 font-medium text-sm">Date</th>
                        <th className="text-left p-3 text-gray-400 font-medium text-sm">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order._id} className="border-b border-gray-800 hover:bg-slate-800/50">
                          <td className="p-3 text-white font-medium">{order.orderNumber}</td>
                          <td className="p-3 text-gray-300">
                            {order.userId?.email?.split('@')[0] || 'N/A'}
                          </td>
                          <td className="p-3 text-gray-300">
                            {order.items?.length} item(s)
                          </td>
                          <td className="p-3 text-white font-medium">
                            ₦{order.totalAmount?.toLocaleString()}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              order.paymentStatus === 'Completed' ? 'bg-green-900/50 text-green-400' :
                              order.paymentStatus === 'PartPayment' ? 'bg-yellow-900/50 text-yellow-400' :
                              'bg-gray-900/50 text-gray-400'
                            }`}>
                              {order.paymentStatus || 'Pending'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs bg-${getStatusColor(order.status)}-900/50 text-${getStatusColor(order.status)}-400`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-3 text-gray-400 text-sm">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="p-3">
                            <Link href={`/dashboards/admin-dashboard/orders/${order._id}`}>
                              <button className="text-red-500 hover:text-red-400 text-sm">
                                View
                              </button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pending Briefs Section */}
            {pendingBriefs.length > 0 && (
              <div className="bg-slate-900 rounded-lg border border-gray-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Briefs Awaiting Response</h2>
                  <Link href="/dashboards/admin-dashboard/customer-briefs" className="text-red-500 hover:text-red-400 text-sm">
                    View All →
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {pendingBriefs.slice(0, 3).map((brief) => (
                    <Link key={brief._id} href={`/dashboards/admin-dashboard/customer-briefs/${brief._id}`}>
                      <div className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-white font-medium">
                              Order #{brief.orderId?.orderNumber || 'N/A'}
                            </span>
                            <p className="text-sm text-gray-300 mt-1 line-clamp-1">
                              {brief.description || 'No description provided'}
                            </p>
                          </div>
                          <span className="bg-yellow-900/50 text-yellow-400 px-2 py-1 rounded-full text-xs">
                            Pending
                          </span>
                        </div>
                        <div className="flex gap-2 text-xs">
                          {brief.image && <span className="text-blue-400">📷 Image</span>}
                          {brief.voiceNote && <span className="text-green-400">🎤 Voice</span>}
                          {brief.video && <span className="text-red-400">🎥 Video</span>}
                          {brief.logo && <span className="text-purple-400">🎨 Logo</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDate(brief.createdAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COLLECTIONS & PRODUCTS TAB */}
        {activeTab === 'collections' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/dashboards/admin-dashboard/collections">
                <div className="bg-slate-900 rounded-lg border border-gray-800 p-6 hover:border-red-600 transition cursor-pointer">
                  <div className="text-4xl mb-4">📁</div>
                  <h3 className="text-xl font-bold text-white mb-2">Manage Collections</h3>
                  <p className="text-gray-400">Create, edit, and organize product collections</p>
                  <div className="mt-4 flex gap-2">
                    <span className="text-sm text-red-500">Create New →</span>
                  </div>
                </div>
              </Link>

              <Link href="/dashboards/admin-dashboard/products">
                <div className="bg-slate-900 rounded-lg border border-gray-800 p-6 hover:border-red-600 transition cursor-pointer">
                  <div className="text-4xl mb-4">📦</div>
                  <h3 className="text-xl font-bold text-white mb-2">Manage Products</h3>
                  <p className="text-gray-400">Add, edit, or remove products from collections</p>
                  <div className="mt-4 flex gap-2">
                    <span className="text-sm text-red-500">Add Product →</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Recent Collections */}
            <div className="bg-slate-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Your Collections</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recentCollections.map((collection) => (
                  <Link key={collection._id} href={`/dashboards/admin-dashboard/collections/${collection._id}`}>
                    <div className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition cursor-pointer text-center">
                      <div className="text-3xl mb-2">📁</div>
                      <h3 className="text-white font-medium">{collection.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">View Products →</p>
                    </div>
                  </Link>
                ))}
                <Link href="/dashboards/admin-dashboard/collections/create">
                  <div className="bg-slate-800/50 border-2 border-dashed border-gray-700 rounded-lg p-4 hover:border-red-600 transition cursor-pointer text-center flex flex-col items-center justify-center">
                    <div className="text-3xl mb-2 text-gray-500">+</div>
                    <h3 className="text-gray-400 font-medium">New Collection</h3>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMER BRIEFS TAB */}
        {activeTab === 'briefs' && (
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Customer Briefs</h2>
              
              {pendingBriefs.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No pending briefs</p>
              ) : (
                <div className="space-y-4">
                  {pendingBriefs.map((brief) => (
                    <div key={brief._id} className="bg-slate-800 rounded-lg p-5">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-white font-medium">Order #{brief.orderId?.orderNumber || 'N/A'}</span>
                            <span className="bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded-full text-xs">
                              Needs Response
                            </span>
                          </div>
                          <p className="text-gray-300 mb-3">{brief.description || 'No description'}</p>
                          <div className="flex gap-3 text-sm text-gray-400">
                            {brief.image && <span>📷 Image</span>}
                            {brief.voiceNote && <span>🎤 Voice Note</span>}
                            {brief.video && <span>🎥 Video</span>}
                            {brief.logo && <span>🎨 Logo</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/dashboards/admin-dashboard/customer-briefs/${brief._id}`}>
                            <Button variant="primary" size="sm">
                              Review & Respond
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ORDER MANAGEMENT TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/dashboards/admin-dashboard/orders?filter=paid">
                <div className="bg-slate-900 rounded-lg border border-gray-800 p-4 hover:border-green-600 transition cursor-pointer">
                  <div className="text-2xl mb-2">💰</div>
                  <h3 className="text-white font-bold">Paid Orders</h3>
                  <p className="text-sm text-gray-400">Ready for design work</p>
                </div>
              </Link>
              
              <Link href="/dashboards/admin-dashboard/orders?filter=production">
                <div className="bg-slate-900 rounded-lg border border-gray-800 p-4 hover:border-purple-600 transition cursor-pointer">
                  <div className="text-2xl mb-2">⚙️</div>
                  <h3 className="text-white font-bold">In Production</h3>
                  <p className="text-sm text-gray-400">Currently being printed</p>
                </div>
              </Link>
              
              <Link href="/dashboards/admin-dashboard/orders?filter=shipping">
                <div className="bg-slate-900 rounded-lg border border-gray-800 p-4 hover:border-blue-600 transition cursor-pointer">
                  <div className="text-2xl mb-2">📬</div>
                  <h3 className="text-white font-bold">Ready to Ship</h3>
                  <p className="text-sm text-gray-400">Awaiting shipping</p>
                </div>
              </Link>
            </div>

            <div className="bg-slate-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Status Update</h2>
              <p className="text-gray-400 mb-4">Select an order to update its production status</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentOrders.slice(0, 4).map((order) => (
                  <Link key={order._id} href={`/dashboards/admin-dashboard/orders/${order._id}/status`}>
                    <div className="bg-slate-800 rounded-lg p-4 hover:bg-slate-750 transition cursor-pointer">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">{order.orderNumber}</span>
                        <span className={`px-2 py-1 rounded-full text-xs bg-${getStatusColor(order.status)}-900/50 text-${getStatusColor(order.status)}-400`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {order.items?.length} items • ₦{order.totalAmount?.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/dashboards/admin-dashboard/orders">
                  <Button variant="ghost" size="sm">
                    View All Orders →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}