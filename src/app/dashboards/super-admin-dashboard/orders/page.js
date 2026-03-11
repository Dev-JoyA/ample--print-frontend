'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { customerBriefService } from '@/services/customerBriefService';

export default function SuperAdminOrdersPage() {
  useAuthCheck();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter') || 'all';
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(filterParam);
  const [stats, setStats] = useState({
    total: 0,
    needsInvoice: 0,
    paid: 0,
    partPaid: 0,
    inProduction: 0,
    completed: 0
  });

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let ordersData = [];
      
      if (filter === 'needs-invoice') {
        // Fetch orders ready for invoice
        const response = await orderService.getOrdersReadyForInvoice();
        console.log("Orders ready for invoice:", response);
        
        if (response?.orders && Array.isArray(response.orders)) {
          ordersData = response.orders;
        } else if (response?.order && Array.isArray(response.order)) {
          ordersData = response.order;
        } else if (Array.isArray(response)) {
          ordersData = response;
        } else if (response?.data?.orders) {
          ordersData = response.data.orders;
        }
      } else {
        // Fetch all orders with optional status filter
        const params = { limit: 50 };
        if (filter !== 'all') {
          params.status = filter;
        }
        const response = await orderService.getAll(params);
        ordersData = response?.order || [];
      }
      
      setOrders(ordersData);
      
      // Fetch stats for the filter cards
      await fetchStats();
      
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get counts for different order types
      const [allOrders, needsInvoiceOrders, paidOrders, partPaidOrders, productionOrders, completedOrders] = await Promise.all([
        orderService.getAll({ limit: 1 }).catch(() => ({ total: 0 })),
        orderService.getOrdersReadyForInvoice().catch(() => ({ orders: [] })),
        orderService.filter({ paymentStatus: 'Completed', limit: 1 }).catch(() => ({ total: 0 })),
        orderService.filter({ paymentStatus: 'PartPayment', limit: 1 }).catch(() => ({ total: 0 })),
        orderService.filter({ status: 'InProduction', limit: 1 }).catch(() => ({ total: 0 })),
        orderService.filter({ status: 'Completed', limit: 1 }).catch(() => ({ total: 0 }))
      ]);

      // Calculate needs invoice count
      let needsInvoiceCount = 0;
      if (needsInvoiceOrders?.orders && Array.isArray(needsInvoiceOrders.orders)) {
        needsInvoiceCount = needsInvoiceOrders.orders.length;
      } else if (needsInvoiceOrders?.order && Array.isArray(needsInvoiceOrders.order)) {
        needsInvoiceCount = needsInvoiceOrders.order.length;
      } else if (Array.isArray(needsInvoiceOrders)) {
        needsInvoiceCount = needsInvoiceOrders.length;
      }

      setStats({
        total: allOrders?.total || 0,
        needsInvoice: needsInvoiceCount,
        paid: paidOrders?.total || 0,
        partPaid: partPaidOrders?.total || 0,
        inProduction: productionOrders?.total || 0,
        completed: completedOrders?.total || 0
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleViewOrder = (orderId) => {
    router.push(`/dashboards/super-admin-dashboard/orders/${orderId}`);
  };

  const handleCreateInvoice = (orderId) => {
    router.push(`/dashboards/super-admin-dashboard/invoices/create?orderId=${orderId}`);
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
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
    return colors[status] || 'gray';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'Pending': 'yellow',
      'PartPayment': 'blue',
      'Completed': 'green',
      'Failed': 'red',
      'Refunded': 'gray'
    };
    return colors[status] || 'gray';
  };

  return (
    <DashboardLayout userRole="super-admin">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Orders</h1>
            <p className="text-gray-400">Manage and track all orders</p>
          </div>
          <Link href="/dashboards/super-admin-dashboard">
            <Button variant="ghost" size="sm">← Back to Dashboard</Button>
          </Link>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div 
            onClick={() => setFilter('all')}
            className={`bg-slate-900 rounded-lg border p-4 cursor-pointer transition hover:bg-slate-800/50 ${
              filter === 'all' ? 'border-red-500' : 'border-gray-800'
            }`}
          >
            <p className="text-gray-400 text-sm">Total Orders</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div 
            onClick={() => setFilter('needs-invoice')}
            className={`bg-slate-900 rounded-lg border p-4 cursor-pointer transition hover:bg-slate-800/50 ${
              filter === 'needs-invoice' ? 'border-yellow-500' : 'border-gray-800'
            }`}
          >
            <p className="text-gray-400 text-sm">Need Invoice</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.needsInvoice}</p>
          </div>
          <div 
            onClick={() => setFilter('paid')}
            className={`bg-slate-900 rounded-lg border p-4 cursor-pointer transition hover:bg-slate-800/50 ${
              filter === 'paid' ? 'border-green-500' : 'border-gray-800'
            }`}
          >
            <p className="text-gray-400 text-sm">Paid</p>
            <p className="text-2xl font-bold text-green-400">{stats.paid}</p>
          </div>
          <div 
            onClick={() => setFilter('part-paid')}
            className={`bg-slate-900 rounded-lg border p-4 cursor-pointer transition hover:bg-slate-800/50 ${
              filter === 'part-paid' ? 'border-blue-500' : 'border-gray-800'
            }`}
          >
            <p className="text-gray-400 text-sm">Part Paid</p>
            <p className="text-2xl font-bold text-blue-400">{stats.partPaid}</p>
          </div>
          <div 
            onClick={() => setFilter('in-production')}
            className={`bg-slate-900 rounded-lg border p-4 cursor-pointer transition hover:bg-slate-800/50 ${
              filter === 'in-production' ? 'border-purple-500' : 'border-gray-800'
            }`}
          >
            <p className="text-gray-400 text-sm">In Production</p>
            <p className="text-2xl font-bold text-purple-400">{stats.inProduction}</p>
          </div>
          <div 
            onClick={() => setFilter('completed')}
            className={`bg-slate-900 rounded-lg border p-4 cursor-pointer transition hover:bg-slate-800/50 ${
              filter === 'completed' ? 'border-green-500' : 'border-gray-800'
            }`}
          >
            <p className="text-gray-400 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-slate-900 rounded-lg border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No orders found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-950 border-b border-gray-800">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Order #</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Customer</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Items</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Total</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Payment</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Status</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Date</th>
                    <th className="text-left p-4 text-gray-400 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-b border-gray-800 hover:bg-slate-800/50 transition">
                      <td className="p-4">
                        <span className="text-white font-mono text-sm font-medium">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-white text-sm">
                          {order.userId?.email?.split('@')[0] || order.userId?.fullname || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300 text-sm">
                        {order.items?.length || 0} item(s)
                      </td>
                      <td className="p-4 text-white text-sm font-medium">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs bg-${getPaymentStatusColor(order.paymentStatus)}-900/50 text-${getPaymentStatusColor(order.paymentStatus)}-400`}>
                          {order.paymentStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs bg-${getStatusColor(order.status)}-900/50 text-${getStatusColor(order.status)}-400`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewOrder(order._id)}
                            className="text-blue-500 hover:text-blue-400 text-sm"
                          >
                            View
                          </button>
                          {filter === 'needs-invoice' && !order.invoiceId && (
                            <button
                              onClick={() => handleCreateInvoice(order._id)}
                              className="text-green-500 hover:text-green-400 text-sm font-medium"
                            >
                              Create Invoice
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}