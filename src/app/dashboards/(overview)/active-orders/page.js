'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import OrderCard from '@/components/cards/OrderCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';
import { useProtectedRoute } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';

const OrderStatus = {
  Pending: 'Pending',
  OrderReceived: 'OrderReceived',
  FilesUploaded: 'FilesUploaded',
  AwaitingInvoice: 'AwaitingInvoice',
  InvoiceSent: 'InvoiceSent',
  DesignUploaded: 'DesignUploaded',
  UnderReview: 'UnderReview',
  Approved: 'Approved',
  AwaitingPartPayment: 'AwaitingPartPayment',
  PartPaymentMade: 'PartPaymentMade',
  InProduction: 'InProduction',
  Completed: 'Completed',
  AwaitingFinalPayment: 'AwaitingFinalPayment',
  FinalPaid: 'FinalPaid',
  ReadyForShipping: 'ReadyForShipping',
  Shipped: 'Shipped',
  Cancelled: 'Cancelled',
  Delivered: 'Delivered',
};

const ACTIVE_STATUSES = [
  OrderStatus.Pending,
  OrderStatus.OrderReceived,
  OrderStatus.FilesUploaded,
  OrderStatus.AwaitingInvoice,
  OrderStatus.InvoiceSent,
  OrderStatus.DesignUploaded,
  OrderStatus.UnderReview,
  OrderStatus.Approved,
  OrderStatus.AwaitingPartPayment,
  OrderStatus.PartPaymentMade,
  OrderStatus.InProduction,
  OrderStatus.AwaitingFinalPayment,
  OrderStatus.FinalPaid,
];

const EDITABLE_STATUSES = [
  OrderStatus.Pending,
  OrderStatus.OrderReceived,
  OrderStatus.FilesUploaded,
];

export default function ActiveOrdersPage() {
  const router = useRouter();
  const { isLoading: authLoading, user } = useProtectedRoute({
    redirectTo: '/auth/sign-in',
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [addingToOrder, setAddingToOrder] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchActiveOrders();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(
        (order) =>
          order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.items?.some((item) =>
            item.productName?.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  const fetchActiveOrders = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Fetching active orders for user:', user?._id);

      let ordersData = [];

      try {
        console.log('Attempting getUserActiveOrders...');
        const response = await orderService.getUserActiveOrders();
        console.log('getUserActiveOrders response:', response);

        if (response.orders && Array.isArray(response.orders)) {
          ordersData = response.orders;
          console.log('Found orders in response.orders:', ordersData.length);
        } else if (response.data?.orders && Array.isArray(response.data.orders)) {
          ordersData = response.data.orders;
          console.log('Found orders in response.data.orders:', ordersData.length);
        } else if (Array.isArray(response)) {
          ordersData = response;
          console.log('Found orders in response array:', ordersData.length);
        } else if (response.data && Array.isArray(response.data)) {
          ordersData = response.data;
          console.log('Found orders in response.data:', ordersData.length);
        }
      } catch (err) {
        console.log('getUserActiveOrders failed:', err.message);
      }

      if (ordersData.length === 0) {
        try {
          console.log('Attempting getMyOrders as fallback...');
          const response = await orderService.getMyOrders({ limit: 100 });
          console.log('getMyOrders response:', response);

          if (response.order && Array.isArray(response.order)) {
            ordersData = response.order;
            console.log('Found orders in response.order:', ordersData.length);
          } else if (response.orders && Array.isArray(response.orders)) {
            ordersData = response.orders;
            console.log('Found orders in response.orders:', ordersData.length);
          } else if (response.data?.order && Array.isArray(response.data.order)) {
            ordersData = response.data.order;
            console.log('Found orders in response.data.order:', ordersData.length);
          } else if (response.data?.orders && Array.isArray(response.data.orders)) {
            ordersData = response.data.orders;
            console.log('Found orders in response.data.orders:', ordersData.length);
          } else if (Array.isArray(response)) {
            ordersData = response;
            console.log('Found orders in response array:', ordersData.length);
          } else if (response.data && Array.isArray(response.data)) {
            ordersData = response.data;
            console.log('Found orders in response.data:', ordersData.length);
          }
        } catch (err) {
          console.log('getMyOrders failed:', err.message);
        }
      }

      console.log('Total orders fetched:', ordersData.length);
      console.log(
        'All orders:',
        ordersData.map((o) => ({
          id: o._id,
          orderNumber: o.orderNumber,
          status: o.status,
          createdAt: o.createdAt,
        }))
      );

      const activeOrders = ordersData
        .filter((order) => {
          if (!order || !order.status) return false;
          if (order.status === OrderStatus.Completed) return false;
          if (order.status === OrderStatus.Shipped) return false;
          if (order.status === OrderStatus.ReadyForShipping) return false;
          if (order.status === OrderStatus.Delivered) return false;
          if (order.status === OrderStatus.Cancelled) return false;

          return ACTIVE_STATUSES.includes(order.status);
        })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      console.log('Active orders after filtering:', activeOrders.length);
      console.log(
        'Active orders details:',
        activeOrders.map((o) => ({
          orderNumber: o.orderNumber,
          status: o.status,
        }))
      );

      setOrders(activeOrders);
      setFilteredOrders(activeOrders);
    } catch (err) {
      console.error('Failed to fetch active orders:', err);
      setError('Unable to load your active orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (orderId) => {
    setAddingToOrder(orderId);
    sessionStorage.setItem('addingToOrderId', orderId);
    router.push('/collections/all/products');
  };

  const canAddProduct = (order) => {
    return EDITABLE_STATUSES.includes(order.status);
  };

  const getStatusMessage = (order) => {
    if (!canAddProduct(order)) {
      return 'Cannot add products - order already in processing';
    }
    return 'You can add more products to this order';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString)
        .toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
        .replace(/\//g, '-');
    } catch {
      return 'Invalid date';
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout userRole="customer">
        <SEOHead {...METADATA.dashboard.customer} />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-gray-400">Loading your active orders...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <SEOHead {...METADATA.dashboard.customer} />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">Active Orders</h1>
            <p className="text-sm text-gray-400 sm:text-base">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} in progress
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/new-order" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full gap-2 sm:w-auto">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Order
              </Button>
            </Link>
            <Link href="/order-history" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full sm:w-auto">
                View All Orders
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex flex-col items-start gap-3 rounded-lg border border-red-700 bg-red-900/30 p-4 sm:flex-row sm:items-center">
            <svg
              className="h-5 w-5 flex-shrink-0 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="flex-1 text-sm text-red-200">{error}</p>
            <button
              onClick={fetchActiveOrders}
              className="text-sm text-red-400 underline hover:text-red-300"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search by order number or product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            icon={
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
          />
        </div>

        {filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-8 text-center sm:p-12">
            {searchTerm ? (
              <>
                <p className="mb-3 text-gray-400">No orders match your search</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-sm text-primary transition hover:text-primary-dark"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <div className="mb-4 text-5xl sm:text-6xl">📦</div>
                <h3 className="mb-2 text-lg font-semibold text-white sm:text-xl">
                  No Active Orders
                </h3>
                <p className="mb-6 text-sm text-gray-400 sm:text-base">
                  You don't have any active orders at the moment
                </p>

                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 overflow-x-auto rounded-lg bg-gray-800 p-3 text-left">
                    <p className="text-xs text-gray-400">
                      Check the browser console (F12) for detailed logs
                    </p>
                  </div>
                )}

                <Link href="/collections">
                  <Button variant="primary" size="lg">
                    Start Shopping
                  </Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="overflow-hidden rounded-xl border border-gray-800 bg-slate-900/30"
              >
                <OrderCard
                  order={{
                    id: order._id,
                    orderNumber: order.orderNumber || 'N/A',
                    productName: order.items?.[0]?.productName || 'Multiple Items',
                    orderedDate: formatDate(order.createdAt),
                    totalAmount: order.totalAmount || 0,
                    status: order.status || 'Unknown',
                    itemsCount: order.items?.length || 1,
                  }}
                  onClick={() => router.push(`/orders/${order._id}`)}
                />

                {canAddProduct(order) && (
                  <div className="mt-2 border-t border-gray-800 px-4 pb-4 pt-2 sm:px-6">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <p className="text-center text-sm text-gray-400 sm:text-left">
                        {getStatusMessage(order)}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddProduct(order._id)}
                        className="w-full gap-2 sm:w-auto"
                        disabled={addingToOrder === order._id}
                      >
                        {addingToOrder === order._id ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                            Add Products
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {!canAddProduct(order) &&
                  !['Completed', 'Shipped', 'Delivered', 'Cancelled'].includes(order.status) && (
                    <div className="mt-2 border-t border-gray-800 px-4 pb-4 pt-2 sm:px-6">
                      <p className="text-center text-sm text-yellow-500 sm:text-left">
                        ⚠️ {getStatusMessage(order)}
                      </p>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-800 bg-slate-900/50 p-4">
              <p className="text-sm text-gray-400">Total Active Orders</p>
              <p className="text-2xl font-bold text-white">{orders.length}</p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-slate-900/50 p-4">
              <p className="text-sm text-gray-400">Editable Orders</p>
              <p className="text-2xl font-bold text-white">
                {orders.filter((o) => EDITABLE_STATUSES.includes(o.status)).length}
              </p>
            </div>
            <div className="rounded-lg border border-gray-800 bg-slate-900/50 p-4 sm:col-span-2 lg:col-span-1">
              <p className="text-sm text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-white">
                ₦{orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
