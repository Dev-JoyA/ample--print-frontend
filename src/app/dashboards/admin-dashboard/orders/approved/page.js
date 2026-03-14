'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';

export default function ApprovedOrdersPage() {
  const router = useRouter();
  useAuthCheck();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    fetchApprovedOrders();
  }, []);

  const fetchApprovedOrders = async () => {
    try {
      setLoading(true);
      // Fetch orders with status 'Approved'
      const response = await orderService.filter({ 
        status: 'Approved',
        limit: 100
      });
      
      let ordersData = [];
      if (response?.order && Array.isArray(response.order)) {
        ordersData = response.order;
      } else if (response?.orders && Array.isArray(response.orders)) {
        ordersData = response.orders;
      } else if (Array.isArray(response)) {
        ordersData = response;
      }
      
      setOrders(ordersData);
    } catch (err) {
      console.error('Failed to fetch approved orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToProduction = async (orderId) => {
    try {
      setUpdatingOrderId(orderId);
      await orderService.updateStatus(orderId, 'InProduction');
      
      // Refresh the list
      await fetchApprovedOrders();
      
    } catch (err) {
      console.error('Failed to move order to production:', err);
      alert('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleCompleteOrder = async (order) => {
    try {
      setUpdatingOrderId(order._id);
      
      // Check payment status
      if (order.paymentStatus === 'PartPayment') {
        // Part payment - move to awaiting final payment
        await orderService.updateStatus(order._id, 'AwaitingFinalPayment');
        
        // Email will be sent by backend automatically
        // Your backend's updateOrderStatus function handles notifications
        
      } else if (order.paymentStatus === 'Completed') {
        // Full payment - ready for shipping
        await orderService.updateStatus(order._id, 'ReadyForShipping');
      }
      
      // Refresh the list
      await fetchApprovedOrders();
      
    } catch (err) {
      console.error('Failed to complete order:', err);
      alert('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getCustomerName = (order) => {
    if (order.userId?.fullname) return order.userId.fullname;
    if (order.userId?.email) return order.userId.email.split('@')[0];
    return 'Customer';
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-white">Loading approved orders...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Approved Orders</h1>
            <p className="text-gray-400">Manage orders with approved designs</p>
          </div>
          <Link href="/dashboards/admin-dashboard/orders">
            <Button variant="secondary" size="md">
              View All Orders
            </Button>
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Orders Table */}
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-gray-800">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">No approved orders</h3>
            <p className="text-gray-400">Orders with approved designs will appear here</p>
          </div>
        ) : (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-slate-800/30 transition">
                      <td className="px-6 py-4">
                        <span className="text-white font-mono text-sm">
                          {order.orderNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white">
                          {getCustomerName(order)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">
                          {order.items?.length} item(s)
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.items?.map(item => item.productName).join(', ').substring(0, 30)}
                          {order.items?.length > 1 ? '...' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            order.paymentStatus === 'Completed' 
                              ? 'bg-green-900/50 text-green-400' 
                              : 'bg-yellow-900/50 text-yellow-400'
                          }`}>
                            {order.paymentStatus === 'Completed' ? 'Paid' : 'Part Payment'}
                          </span>
                          {order.paymentStatus === 'PartPayment' && (
                            <div className="mt-1 text-xs text-gray-400">
                              Paid: {formatCurrency(order.amountPaid)} / {formatCurrency(order.totalAmount)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <Link href={`/dashboards/admin-dashboard/orders/${order._id}`}>
                            <Button variant="ghost" size="xs" className="w-full">
                              View Details
                            </Button>
                          </Link>
                          
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleMoveToProduction(order._id)}
                            disabled={updatingOrderId === order._id}
                            className="w-full"
                          >
                            {updatingOrderId === order._id ? 'Updating...' : 'Move to Production'}
                          </Button>
                          
                          <Button
                            variant={order.paymentStatus === 'Completed' ? 'success' : 'warning'}
                            size="xs"
                            onClick={() => handleCompleteOrder(order)}
                            disabled={updatingOrderId === order._id}
                            className="w-full"
                          >
                            {updatingOrderId === order._id 
                              ? 'Updating...' 
                              : order.paymentStatus === 'Completed' 
                                ? 'Ready for Shipping' 
                                : 'Awaiting Balance'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}