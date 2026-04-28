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

export default function OrderManagementPage() {
  const router = useRouter();
  useAuthCheck();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAll({ limit: 100 });
      let allOrders = [];
      if (response?.order && Array.isArray(response.order)) {
        allOrders = response.order;
      } else if (response?.orders && Array.isArray(response.orders)) {
        allOrders = response.orders;
      } else if (Array.isArray(response)) {
        allOrders = response;
      }
      setOrders(allOrders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await orderService.updateStatus(orderId, newStatus);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Approved: 'green',
      InProduction: 'blue',
      Completed: 'purple',
      AwaitingFinalPayment: 'yellow',
      FinalPaid: 'green',
      Cancelled: 'red',
      PartPaymentMade: 'blue',
      AwaitingPartPayment: 'orange',
    };
    return colors[status] || 'gray';
  };

  const getCustomerName = (order) => {
    if (order.userId?.fullname) return order.userId.fullname;
    if (order.userId?.email) return order.userId.email.split('@')[0];
    return 'Customer';
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const isDepositOrder = (order) => {
    return order.requiredPaymentType === 'part';
  };

  const hasRemainingBalance = (order) => {
    return order.remainingBalance > 0;
  };

  const isFullyPaid = (order) => {
    return order.remainingBalance === 0 || order.paymentStatus === 'Completed';
  };

  const getActionButton = (order) => {
    if (updatingOrderId === order._id) {
      return (
        <Button variant="primary" size="sm" disabled className="min-w-[100px] sm:min-w-[120px]">
          <span className="flex items-center justify-center gap-2 text-xs sm:text-sm">
            <svg className="h-3 w-3 animate-spin sm:h-4 sm:w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Updating...
          </span>
        </Button>
      );
    }

    if (order.status === 'Approved') {
      return (
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleUpdateStatus(order._id, 'InProduction')}
          className="min-w-[100px] text-xs sm:min-w-[120px] sm:text-sm"
        >
          Start Production
        </Button>
      );
    }
    if (order.status === 'InProduction') {
      const isDepositWithBalance = isDepositOrder(order) && hasRemainingBalance(order);
      const nextStatus = isDepositWithBalance ? 'AwaitingFinalPayment' : 'Completed';

      const buttonText = isDepositWithBalance
        ? 'Complete Production (Awaiting Final Payment)'
        : 'Complete Production';

      return (
        <Button
          variant="success"
          size="sm"
          onClick={() => handleUpdateStatus(order._id, nextStatus)}
          className="min-w-[100px] text-xs sm:min-w-[120px] sm:text-sm"
        >
          {buttonText}
        </Button>
      );
    }

    if (order.status === 'Completed') {
      if (isDepositOrder(order)) {
        if (hasRemainingBalance(order)) {
          return (
            <span className="inline-flex items-center whitespace-nowrap rounded-lg border border-yellow-800 bg-yellow-900/30 px-2 py-1 text-xs font-medium text-yellow-400 sm:px-3 sm:text-sm">
              ⚠️ Balance: {formatCurrency(order.remainingBalance)} - Should be AwaitingFinalPayment
            </span>
          );
        } else {
          return (
            <span className="inline-flex items-center whitespace-nowrap rounded-lg border border-green-800 bg-green-900/30 px-2 py-1 text-xs font-medium text-green-400 sm:px-3 sm:text-sm">
              ✓ Fully Paid - Ready for Shipping
            </span>
          );
        }
      } else {
        if (isFullyPaid(order)) {
          return (
            <span className="inline-flex items-center whitespace-nowrap rounded-lg border border-green-800 bg-green-900/30 px-2 py-1 text-xs font-medium text-green-400 sm:px-3 sm:text-sm">
              ✓ Fully Paid - Ready for Shipping
            </span>
          );
        } else {
          return (
            <span className="inline-flex items-center whitespace-nowrap rounded-lg border border-yellow-800 bg-yellow-900/30 px-2 py-1 text-xs font-medium text-yellow-400 sm:px-3 sm:text-sm">
              ⏳ Awaiting Full Payment
            </span>
          );
        }
      }
    }

    if (order.status === 'AwaitingFinalPayment') {
      if (isFullyPaid(order)) {
        return (
          <Button
            variant="success"
            size="sm"
            onClick={() => handleUpdateStatus(order._id, 'Completed')}
            className="min-w-[100px] text-xs sm:min-w-[120px] sm:text-sm"
          >
            Mark as Complete
          </Button>
        );
      } else {
        return (
          <span className="inline-flex items-center whitespace-nowrap rounded-lg border border-yellow-800 bg-yellow-900/30 px-2 py-1 text-xs font-medium text-yellow-400 sm:px-3 sm:text-sm">
            ⏳ Balance: {formatCurrency(order.remainingBalance)}
          </span>
        );
      }
    }

    if (order.status === 'FinalPaid') {
      if (isFullyPaid(order)) {
        return (
          <Button
            variant="success"
            size="sm"
            onClick={() => handleUpdateStatus(order._id, 'Completed')}
            className="min-w-[100px] text-xs sm:min-w-[120px] sm:text-sm"
          >
            Mark as Complete
          </Button>
        );
      } else {
        return (
          <span className="inline-flex items-center whitespace-nowrap rounded-lg border border-red-800 bg-red-900/30 px-2 py-1 text-xs font-medium text-red-400 sm:px-3 sm:text-sm">
            ⚠️ Payment Error
          </span>
        );
      }
    }

    if (order.status === 'ReadyForShipping' || order.status === 'Shipped') {
      return (
        <Link href={`/dashboards/admin-dashboard/shipping?orderId=${order._id}`}>
          <Button
            variant="secondary"
            size="sm"
            className="min-w-[100px] text-xs sm:min-w-[120px] sm:text-sm"
          >
            View Shipping
          </Button>
        </Link>
      );
    }

    if (order.status === 'Delivered') {
      return (
        <span className="inline-flex items-center whitespace-nowrap rounded-lg border border-green-800 bg-green-900/30 px-2 py-1 text-xs font-medium text-green-400 sm:px-3 sm:text-sm">
          ✓ Delivered
        </span>
      );
    }

    if (order.status === 'Cancelled') {
      return (
        <span className="inline-flex items-center whitespace-nowrap rounded-lg border border-red-800 bg-red-900/30 px-2 py-1 text-xs font-medium text-red-400 sm:px-3 sm:text-sm">
          ✗ Cancelled
        </span>
      );
    }

    return null;
  };

  const getStatusMessage = (order) => {
    if (order.status === 'AwaitingFinalPayment') {
      return `Paid: ${formatCurrency(order.amountPaid)} | Balance: ${formatCurrency(order.remainingBalance)} - Awaiting final payment to complete order`;
    }

    if (order.status === 'Completed') {
      if (isDepositOrder(order)) {
        if (hasRemainingBalance(order)) {
          return `⚠️ ERROR: Deposit order with balance ${formatCurrency(order.remainingBalance)} should be in AwaitingFinalPayment status`;
        } else {
          return `Fully paid: ${formatCurrency(order.totalAmount)} - Customer can select shipping`;
        }
      } else {
        if (isFullyPaid(order)) {
          return `Fully paid: ${formatCurrency(order.totalAmount)} - Customer can select shipping`;
        } else {
          return `Payment pending: ${formatCurrency(order.totalAmount)} - Customer needs to pay`;
        }
      }
    }

    if (order.status === 'InProduction') {
      if (isDepositOrder(order) && hasRemainingBalance(order)) {
        return `Deposit paid: ${formatCurrency(order.amountPaid)}. After production, will require final payment of ${formatCurrency(order.remainingBalance)}`;
      }
      return `Order is in production`;
    }

    if (order.status === 'Approved') {
      if (isDepositOrder(order) && hasRemainingBalance(order)) {
        return `Deposit paid: ${formatCurrency(order.amountPaid)}. Ready to start production`;
      }
      return `Design approved. Ready to start production`;
    }

    return null;
  };

  const tabs = [
    { id: 'all', label: 'All Orders', color: 'gray' },
    { id: 'Approved', label: 'Approved', color: 'green' },
    { id: 'InProduction', label: 'In Production', color: 'blue' },
    { id: 'AwaitingFinalPayment', label: 'Awaiting Payment', color: 'yellow' },
    { id: 'Completed', label: 'Completed', color: 'purple' },
    { id: 'FinalPaid', label: 'Final Paid', color: 'green' },
    { id: 'Cancelled', label: 'Cancelled', color: 'red' },
  ];

  const filteredOrders =
    activeTab === 'all' ? orders : orders.filter((order) => order.status === activeTab);

  const getCountByStatus = (status) => {
    if (status === 'all') return orders.length;
    return orders.filter((o) => o.status === status).length;
  };

  if (loading) {
    return (
      <>
        <SEOHead {...METADATA.dashboard.admin} />
        <DashboardLayout userRole="admin">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="relative text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent sm:h-16 sm:w-16"></div>
              <p className="mt-4 text-sm text-gray-400 sm:text-base">Loading orders...</p>
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
        <div className="space-y-5 px-4 sm:space-y-6 sm:px-0">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Order Management</h1>
              <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                Track production and payment status
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboards/admin-dashboard/shipping">
                <Button variant="secondary" size="sm" className="text-xs sm:text-sm">
                  Go to Shipping Management
                </Button>
              </Link>
              <Button
                variant="secondary"
                onClick={fetchOrders}
                size="sm"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <svg
                  className="h-3 w-3 sm:h-4 sm:w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-800 bg-red-900/20 p-3">
              <p className="text-xs text-red-400 sm:text-sm">{error}</p>
            </div>
          )}

          <div className="overflow-x-auto border-b border-gray-800 pb-px">
            <nav className="flex min-w-max gap-1">
              {tabs.map((tab) => {
                const count = getCountByStatus(tab.id);
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`whitespace-nowrap border-b-2 px-3 py-2 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
                      isActive
                        ? `border-${tab.color}-500 text-${tab.color}-400`
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span
                        className={`ml-1 rounded-full px-1.5 py-0.5 text-xs sm:ml-2 sm:px-2 ${
                          isActive
                            ? `bg-${tab.color}-900/50 text-${tab.color}-400`
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-8 text-center sm:p-12">
              <div className="mb-3 text-4xl opacity-50 sm:text-5xl">📋</div>
              <h3 className="mb-1 text-lg font-semibold text-white sm:text-xl">No orders found</h3>
              <p className="text-xs text-gray-400 sm:text-sm">
                {activeTab === 'all'
                  ? 'There are no orders in the system yet'
                  : `No orders with status: ${activeTab}`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order._id}
                  className="rounded-lg border border-gray-800 bg-slate-900/50 p-3 transition-all hover:border-gray-700 sm:p-4"
                >
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 sm:h-10 sm:w-10">
                        <span className="text-base sm:text-xl">📦</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-white sm:text-base">
                            {order.orderNumber}
                          </h3>
                          <StatusBadge status={order.status} size="sm" />
                          {isDepositOrder(order) && (
                            <span className="rounded-full bg-blue-900/50 px-1.5 py-0.5 text-xs text-blue-400">
                              Deposit: {formatCurrency(order.requiredDeposit)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {getCustomerName(order)} • {order.items?.length} item(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-white sm:text-lg">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-lg bg-slate-800/30 p-2">
                      <p className="mb-1 text-xs font-medium text-gray-400">Products</p>
                      <div className="space-y-1">
                        {order.items?.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="max-w-[120px] truncate text-gray-300 sm:max-w-[150px]">
                              {item.productName}
                            </span>
                            <span className="ml-2 font-medium text-primary">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                        {order.items?.length > 2 && (
                          <p className="text-xs text-gray-500">+{order.items.length - 2} more</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg bg-slate-800/30 p-2">
                      <p className="mb-1 text-xs font-medium text-gray-400">Payment Details</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Status:</span>
                          <span
                            className={`inline-block rounded-full px-1.5 py-0.5 text-xs font-medium sm:px-2 ${
                              order.paymentStatus === 'Completed'
                                ? 'bg-green-900/50 text-green-400'
                                : order.paymentStatus === 'PartPayment'
                                  ? 'bg-yellow-900/50 text-yellow-400'
                                  : 'bg-gray-900/50 text-gray-400'
                            }`}
                          >
                            {order.paymentStatus || 'Pending'}
                          </span>
                        </div>
                        {order.requiredPaymentType && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Type:</span>
                            <span className="capitalize text-white">
                              {order.requiredPaymentType}
                            </span>
                          </div>
                        )}
                        {order.amountPaid > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Paid:</span>
                            <span className="text-green-400">
                              {formatCurrency(order.amountPaid)}
                            </span>
                          </div>
                        )}
                        {order.remainingBalance > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Balance:</span>
                            <span className="text-yellow-400">
                              {formatCurrency(order.remainingBalance)}
                            </span>
                          </div>
                        )}
                        {order.requiredDeposit > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Deposit:</span>
                            <span className="text-blue-400">
                              {formatCurrency(order.requiredDeposit)}
                            </span>
                          </div>
                        )}
                      </div>

                      {getStatusMessage(order) && (
                        <div className="mt-2 border-t border-gray-700 pt-2">
                          <p className="text-xs text-gray-400">{getStatusMessage(order)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-gray-800 pt-2">
                    {getActionButton(order)}
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
