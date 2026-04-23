'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { METADATA } from '@/lib/metadata';

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

      const response = await orderService.getMyOrders({ limit: 50 });

      let allOrders = [];
      if (response?.order && Array.isArray(response.order)) {
        allOrders = response.order;
      } else if (response?.orders && Array.isArray(response.orders)) {
        allOrders = response.orders;
      } else if (Array.isArray(response)) {
        allOrders = response;
      }

      const readyForShipping = allOrders.filter(
        (order) => order.status === 'Completed' && !order.shippingId
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
      <>
        <SEOHead
          title="Ready for Shipping"
          description="Select shipping for your completed orders"
          robots="noindex, nofollow"
        />
        <DashboardLayout userRole="customer">
          <div className="mx-auto max-w-4xl px-4 py-8">
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-white">Loading...</div>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <SEOHead title="Ready for Shipping" description="Select shipping for your completed orders" />
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 flex flex-col items-start gap-3 sm:mb-8 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20 sm:h-14 sm:w-14">
              <span className="text-2xl sm:text-3xl">🚚</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl sm:text-4xl">
                Ready for Shipping
              </h1>
              <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                Orders that need shipping selection
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-800 bg-red-900/20 p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-8 text-center sm:p-12">
              <div className="mb-4 text-5xl sm:text-6xl">📦</div>
              <h3 className="mb-2 text-lg font-semibold text-white sm:text-xl">
                No orders ready for shipping
              </h3>
              <p className="text-xs text-gray-400 sm:text-sm">
                When your orders are completed, they'll appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="rounded-lg border border-gray-800 bg-slate-900/50 p-4 sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                        <h3 className="text-base font-bold text-white sm:text-xl">
                          {order.orderNumber}
                        </h3>
                        <StatusBadge status={order.status} />
                      </div>

                      <div className="space-y-1 text-xs sm:text-sm">
                        <p className="text-gray-400">
                          <span className="text-gray-500">Items:</span> {order.items?.length || 0}
                        </p>
                        <p className="text-gray-400">
                          <span className="text-gray-500">Total:</span>{' '}
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <p className="text-gray-400">
                          <span className="text-gray-500">Placed:</span>{' '}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="warning"
                      onClick={() => handleSelectShipping(order._id)}
                      className="w-full sm:w-auto"
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
    </>
  );
}
