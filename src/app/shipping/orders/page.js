'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';

export default function ReadyForShippingPage() {
  const router = useRouter();
  useAuthCheck();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrdersReadyForShipping();
  }, []);

  const fetchOrdersReadyForShipping = async () => {
    try {
      setLoading(true);
      
      // Fetch all orders for the user
      const response = await orderService.getMyOrders({ limit: 50 });
      
      let allOrders = [];
      if (response?.order && Array.isArray(response.order)) {
        allOrders = response.order;
      } else if (response?.orders && Array.isArray(response.orders)) {
        allOrders = response.orders;
      } else if (Array.isArray(response)) {
        allOrders = response;
      }
      
      // Filter for orders that are completed but don't have shipping selected
      const readyForShipping = allOrders.filter(order => 
        order.status === 'Completed' && !order.shippingId
      );
      
      setOrders(readyForShipping);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectShipping = (orderId) => {
    router.push(`/shipping?orderId=${orderId}`);
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-white">Loading...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🚚</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Ready for Shipping</h1>
            <p className="text-gray-400 text-sm mt-1">Orders that need shipping selection</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-slate-900/50 rounded-xl border border-gray-800 p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-white mb-2">No orders ready for shipping</h3>
            <p className="text-gray-400">When your orders are completed, they'll appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-slate-900/50 border border-gray-800 rounded-lg p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{order.orderNumber}</h3>
                      <StatusBadge status={order.status} />
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-400">
                        <span className="text-gray-500">Items:</span> {order.items?.length || 0}
                      </p>
                      <p className="text-gray-400">
                        <span className="text-gray-500">Total:</span> {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="text-gray-400">
                        <span className="text-gray-500">Placed:</span> {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="warning"
                    onClick={() => handleSelectShipping(order._id)}
                  >
                    Select Shipping
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}