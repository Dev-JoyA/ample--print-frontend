'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import OrderCard from '@/components/cards/OrderCard';
import SEOHead from '@/components/common/SEOHead';
import { useAuth, useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { METADATA } from '@/lib/metadata';
import { getImageUrl } from '@/lib/imageUtils';

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

const StatusDisplayNames = {
  Pending: 'Order Pending',
  OrderReceived: 'Order Received',
  FilesUploaded: 'Brief/Files Uploaded',
  AwaitingInvoice: 'Awaiting Invoice',
  InvoiceSent: 'Invoice Sent',
  DesignUploaded: 'Design Uploaded',
  UnderReview: 'Under Review',
  Approved: 'Design Approved',
  AwaitingPartPayment: 'Awaiting Part Payment',
  PartPaymentMade: 'Part Payment Made',
  InProduction: 'In Production',
  Completed: 'Production Completed',
  AwaitingFinalPayment: 'Awaiting Final Payment',
  FinalPaid: 'Final Payment Made',
  ReadyForShipping: 'Ready For Shipping',
  Shipped: 'Shipped',
  Cancelled: 'Cancelled',
  Delivered: 'Delivered',
};

const StatusFlowOrder = [
  OrderStatus.Pending,
  OrderStatus.OrderReceived,
  OrderStatus.FilesUploaded,
  OrderStatus.AwaitingInvoice,
  OrderStatus.InvoiceSent,
  OrderStatus.AwaitingPartPayment,
  OrderStatus.PartPaymentMade,
  OrderStatus.DesignUploaded,
  OrderStatus.UnderReview,
  OrderStatus.Approved,
  OrderStatus.InProduction,
  OrderStatus.Completed,
  OrderStatus.AwaitingFinalPayment,
  OrderStatus.FinalPaid,
  OrderStatus.ReadyForShipping,
  OrderStatus.Shipped,
  OrderStatus.Delivered,
  OrderStatus.Cancelled,
];

const getStatusPhases = (order) => {
  const basePhases = [
    {
      name: 'Order Placement',
      statuses: [OrderStatus.Pending, OrderStatus.OrderReceived],
      icon: '📋',
      color: 'blue',
    },
    {
      name: 'Brief & Invoice',
      statuses: [OrderStatus.FilesUploaded, OrderStatus.AwaitingInvoice, OrderStatus.InvoiceSent],
      icon: '📄',
      color: 'purple',
    },
  ];

  const paymentPhase = {
    name: order?.requiredPaymentType === 'part' ? 'Initial Deposit' : 'Payment',
    icon: '💰',
    color: order?.requiredPaymentType === 'part' ? 'yellow' : 'blue',
    statuses: [],
  };

  const finalPaymentPhase = {
    name: 'Final Payment',
    icon: '💳',
    color: 'green',
    statuses: [],
  };

  if (order?.requiredPaymentType === 'part') {
    paymentPhase.statuses = [OrderStatus.AwaitingPartPayment, OrderStatus.PartPaymentMade];
    paymentPhase.description = 'Pay deposit to start design work';

    finalPaymentPhase.statuses = [OrderStatus.AwaitingFinalPayment, OrderStatus.FinalPaid];
    finalPaymentPhase.description = 'Pay remaining balance after production';
  } else if (order?.requiredPaymentType === 'full') {
    paymentPhase.statuses = [OrderStatus.InvoiceSent];
    paymentPhase.description = 'Full payment required';
  }

  const designPhase = {
    name: 'Design & Approval',
    statuses: [OrderStatus.DesignUploaded, OrderStatus.UnderReview, OrderStatus.Approved],
    icon: '🎨',
    color: 'indigo',
  };

  const productionPhase = {
    name: 'Production',
    statuses: [OrderStatus.InProduction, OrderStatus.Completed],
    icon: '⚙️',
    color: 'yellow',
  };

  const shippingPhase = {
    name: 'Shipping & Delivery',
    statuses: [OrderStatus.ReadyForShipping, OrderStatus.Shipped, OrderStatus.Delivered],
    icon: '🚚',
    color: 'orange',
  };

  const cancelledPhase = {
    name: 'Cancelled',
    statuses: [OrderStatus.Cancelled],
    icon: '❌',
    color: 'red',
  };

  const phases = [...basePhases];

  if (paymentPhase.statuses.length > 0) {
    phases.push(paymentPhase);
  }

  phases.push(designPhase);
  phases.push(productionPhase);

  if (finalPaymentPhase.statuses.length > 0) {
    phases.push(finalPaymentPhase);
  }

  phases.push(shippingPhase);
  phases.push(cancelledPhase);

  return phases;
};

function OrderTrackingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  useAuthCheck();

  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);

  useEffect(() => {
    const orderParam = searchParams.get('order');
    if (orderParam) {
      setOrderNumber(orderParam);
      handleTrack(orderParam);
    }
  }, [searchParams]);

  const formatOrderNumber = (input) => {
    let formatted = input.trim();

    if (formatted.toUpperCase().startsWith('ORD-')) {
      const numberPart = formatted.substring(4);
      return `ORD-${numberPart}`;
    }

    if (/^\d+$/.test(formatted)) {
      return `ORD-${formatted}`;
    }

    return formatted.toUpperCase();
  };

  const handleTrack = async (orderNum = orderNumber) => {
    if (!orderNum.trim()) {
      setError('Please enter an order number');
      return;
    }

    const searchTerm = orderNum.trim();
    setOrderNumber(searchTerm);
    setSearchAttempted(true);

    try {
      setLoading(true);
      setError('');
      setTrackedOrder(null);

      console.log('🔍 Searching for order:', searchTerm);

      try {
        const response = await orderService.searchByOrderNumber(searchTerm);
        const orderData = response?.order || response?.data || response;

        if (orderData) {
          console.log('✅ Order found via search:', orderData);
          setTrackedOrder(orderData);
          return;
        }
      } catch (searchErr) {
        console.log('❌ Search endpoint failed:', searchErr);

        if (searchErr.status === 404) {
          console.log('Order not found via search, trying my-orders...');
        } else if (searchErr.status === 401 || searchErr.status === 403) {
          console.log('Authorization error, falling back to my-orders');
        } else {
          console.log('Other error, falling back to my-orders');
        }
      }

      console.log('📋 Fetching user orders as fallback...');
      const myOrdersResponse = await orderService.getMyOrders({ limit: 50 });

      let orders = [];
      if (myOrdersResponse?.order && Array.isArray(myOrdersResponse.order)) {
        orders = myOrdersResponse.order;
      } else if (myOrdersResponse?.orders && Array.isArray(myOrdersResponse.orders)) {
        orders = myOrdersResponse.orders;
      } else if (Array.isArray(myOrdersResponse)) {
        orders = myOrdersResponse;
      }

      console.log(`📊 Found ${orders.length} orders for user`);

      if (orders.length === 0) {
        setError('You have no orders yet.');
        return;
      }

      let foundOrder = null;
      const searchLower = searchTerm.toLowerCase();

      foundOrder = orders.find((o) => o.orderNumber === searchTerm);

      if (!foundOrder) {
        foundOrder = orders.find((o) => o.orderNumber?.toLowerCase() === searchLower);
      }

      if (!foundOrder && searchTerm.length >= 8) {
        foundOrder = orders.find((o) => o.orderNumber?.toLowerCase().includes(searchLower));
      }

      if (!foundOrder && searchTerm.includes('-')) {
        foundOrder = orders.find((o) =>
          o.orderNumber?.toLowerCase().includes(searchLower.split('-').join(''))
        );
      }

      if (foundOrder) {
        console.log('✅ Order found via my-orders:', foundOrder);
        setTrackedOrder(foundOrder);
      } else {
        setError('Order not found. Please check the order number and try again.');
      }
    } catch (err) {
      console.error('❌ Failed to track order:', err);

      if (err.userMessage) {
        setError(err.userMessage);
      } else if (err.message?.includes('Network') || err.message?.includes('Failed to fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setError('Please sign in to track your order.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError('');
    handleTrack();
  };

  //   const getImageUrl = (imagePath) => {
  //     if (!imagePath) return null;
  //     if (imagePath.startsWith('http')) return imagePath;
  //     let filename = imagePath;
  //     if (imagePath.includes('/')) {
  //       filename = imagePath.split('/').pop();
  //     }
  //     return `http://localhost:4001/api/v1/attachments/download/${filename}`;
  //   };

  const getCurrentStepIndex = () => {
    if (!trackedOrder) return -1;
    return StatusFlowOrder.indexOf(trackedOrder.status);
  };

  const getPaymentStatusMessage = () => {
    if (!trackedOrder) return '';

    if (trackedOrder.paymentStatus === 'Completed') {
      return 'Payment completed successfully';
    }

    if (trackedOrder.requiredPaymentType === 'part') {
      if (trackedOrder.paymentStatus === 'PartPayment') {
        return `Part payment received: ₦${trackedOrder.amountPaid?.toLocaleString()} (Deposit: ₦${trackedOrder.requiredDeposit?.toLocaleString()})`;
      }
      if (trackedOrder.paymentStatus === 'Pending') {
        return `Awaiting part payment - Deposit required: ₦${trackedOrder.requiredDeposit?.toLocaleString()}`;
      }
      if (trackedOrder.paymentStatus === 'Completed') {
        return 'Full payment completed';
      }
    }

    if (trackedOrder.requiredPaymentType === 'full') {
      if (trackedOrder.paymentStatus === 'Pending') {
        return `Awaiting full payment: ₦${trackedOrder.totalAmount?.toLocaleString()}`;
      }
      if (trackedOrder.paymentStatus === 'Completed') {
        return 'Full payment received';
      }
    }

    if (!trackedOrder.invoiceId) {
      return 'Invoice not yet generated';
    }

    return `Payment status: ${trackedOrder.paymentStatus}`;
  };

  const isCancelled = trackedOrder?.status === OrderStatus.Cancelled;

  if (authLoading) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
              <p className="text-gray-400">Loading...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.orderTracking} />
      <DashboardLayout userRole={user?.role}>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white sm:text-4xl">Order Tracking</h1>
            <p className="mt-1 text-sm text-gray-400">Track the real-time status of your order</p>
          </div>

          <div className="mb-8 rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Track Your Order</h2>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <Input
                  placeholder="Enter order number (e.g., ORD-2026-001 )"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
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
                <p className="mt-2 text-xs text-gray-500">
                  Enter your order number (supports ORD-2026-001, UUID format, or partial matches)
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => handleTrack()}
                disabled={loading}
                className="sm:w-auto"
              >
                {loading ? 'Tracking...' : 'Track Order'}
              </Button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-800 bg-red-900/20 p-4">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <p className="flex items-center gap-2 text-sm text-red-400">
                    <svg
                      className="h-5 w-5 flex-shrink-0"
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
                    {error}
                  </p>
                  <button
                    onClick={handleRetry}
                    className="whitespace-nowrap rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition hover:bg-red-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>

          {trackedOrder && (
            <div className="space-y-6">
              <OrderCard
                order={{
                  id: trackedOrder._id,
                  orderNumber: trackedOrder.orderNumber,
                  productName: trackedOrder.items?.[0]?.productName || 'Multiple Items',
                  productImage: getImageUrl(trackedOrder.items?.[0]?.productId?.images?.[0]),
                  orderedDate: new Date(trackedOrder.createdAt)
                    .toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })
                    .replace(/\//g, '-'),
                  totalAmount: trackedOrder.totalAmount,
                  status: trackedOrder.status,
                  itemsCount: trackedOrder.items?.length || 1,
                  paymentStatus: trackedOrder.paymentStatus,
                }}
                onClick={() => router.push(`/orders/${trackedOrder._id}`)}
              />

              {isCancelled && (
                <div className="rounded-xl border border-red-800 bg-red-900/20 p-6 text-center">
                  <div className="mb-4 text-5xl">❌</div>
                  <h3 className="mb-2 text-xl font-bold text-white">Order Cancelled</h3>
                  <p className="text-gray-400">
                    This order has been cancelled. Please contact support for more information.
                  </p>
                </div>
              )}

              {!isCancelled && (
                <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                  <h2 className="mb-6 text-xl font-semibold text-white">Order Status Timeline</h2>

                  {trackedOrder.invoiceId && trackedOrder.requiredPaymentType && (
                    <div
                      className={`mb-6 rounded-lg p-4 ${
                        trackedOrder.requiredPaymentType === 'part'
                          ? 'border border-yellow-800 bg-yellow-900/20'
                          : 'border border-blue-800 bg-blue-900/20'
                      }`}
                    >
                      <p
                        className={`flex items-center gap-2 text-sm ${
                          trackedOrder.requiredPaymentType === 'part'
                            ? 'text-yellow-400'
                            : 'text-blue-400'
                        }`}
                      >
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
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {getPaymentStatusMessage()}
                        {trackedOrder.requiredPaymentType === 'part' && (
                          <span className="rounded-full bg-yellow-900/30 px-2 py-0.5 text-xs">
                            Part Payment Plan
                          </span>
                        )}
                        {trackedOrder.requiredPaymentType === 'full' && (
                          <span className="rounded-full bg-blue-900/30 px-2 py-0.5 text-xs">
                            Full Payment
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  <div className="space-y-8">
                    {getStatusPhases(trackedOrder).map((phase, phaseIndex) => {
                      if (phase.name === 'Cancelled' && !isCancelled) return null;
                      if (phase.statuses.length === 0) return null;

                      const currentStatusInPhase = phase.statuses.find(
                        (status) => status === trackedOrder.status
                      );

                      const isPhaseCompleted = phase.statuses.every(
                        (status) => StatusFlowOrder.indexOf(status) <= getCurrentStepIndex()
                      );

                      const isPhaseActive = !!currentStatusInPhase;

                      return (
                        <div key={phase.name} className="relative">
                          <div className="mb-3 flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                isPhaseCompleted || isPhaseActive
                                  ? `bg-${phase.color}-900/30`
                                  : 'bg-gray-800'
                              }`}
                            >
                              <span className="text-xl">{phase.icon}</span>
                            </div>
                            <div>
                              <h3
                                className={`font-semibold ${
                                  isPhaseCompleted || isPhaseActive ? 'text-white' : 'text-gray-500'
                                }`}
                              >
                                {phase.name}
                              </h3>
                              {phase.description && (
                                <p className="text-xs text-gray-500">{phase.description}</p>
                              )}
                              {isPhaseActive && (
                                <p className="text-xs text-red-400">
                                  Current: {StatusDisplayNames[trackedOrder.status]}
                                </p>
                              )}
                            </div>
                            {isPhaseCompleted && (
                              <span className="ml-auto rounded-full border border-green-800 bg-green-900/30 px-2 py-1 text-xs text-green-400">
                                Completed
                              </span>
                            )}
                          </div>

                          <div className="ml-13 space-y-4 border-l-2 border-gray-800 pl-4">
                            {phase.statuses.map((status) => {
                              const isCompleted =
                                StatusFlowOrder.indexOf(status) < getCurrentStepIndex();
                              const isCurrent = status === trackedOrder.status;

                              return (
                                <div key={status} className="relative flex items-start gap-3">
                                  <div className="absolute -left-[25px] top-1">
                                    <div
                                      className={`h-4 w-4 rounded-full ${
                                        isCompleted
                                          ? 'bg-green-500'
                                          : isCurrent
                                            ? 'animate-pulse bg-red-500'
                                            : 'bg-gray-700'
                                      }`}
                                    ></div>
                                  </div>

                                  <div className="flex-1 pb-2">
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                      <p
                                        className={`text-sm font-medium ${
                                          isCompleted || isCurrent ? 'text-white' : 'text-gray-500'
                                        }`}
                                      >
                                        {StatusDisplayNames[status]}
                                      </p>
                                      {isCurrent && (
                                        <span className="rounded-full border border-red-700 bg-red-600/20 px-2 py-0.5 text-xs text-red-400">
                                          Current
                                        </span>
                                      )}
                                      {isCompleted && (
                                        <span className="flex items-center gap-1 text-xs text-green-500">
                                          <svg
                                            className="h-3 w-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M5 13l4 4L19 7"
                                            />
                                          </svg>
                                          Done
                                        </span>
                                      )}
                                    </div>

                                    {isCurrent && (
                                      <div className="mt-2 text-sm text-gray-400">
                                        {status === OrderStatus.AwaitingPartPayment && (
                                          <p>
                                            Awaiting initial deposit of ₦
                                            {trackedOrder.requiredDeposit?.toLocaleString()}
                                          </p>
                                        )}
                                        {status === OrderStatus.PartPaymentMade && (
                                          <p>Deposit received. Design work will begin soon.</p>
                                        )}
                                        {status === OrderStatus.DesignUploaded && (
                                          <p>
                                            Your design has been uploaded and is ready for your
                                            review.
                                          </p>
                                        )}
                                        {status === OrderStatus.UnderReview && (
                                          <p>
                                            Please review the design and provide feedback or
                                            approve.
                                          </p>
                                        )}
                                        {status === OrderStatus.Approved && (
                                          <p>
                                            Design approved! Your order will now proceed to
                                            production.
                                          </p>
                                        )}
                                        {status === OrderStatus.InProduction && (
                                          <p>Your order is currently being printed/produced.</p>
                                        )}
                                        {status === OrderStatus.Completed && (
                                          <p>
                                            Production is complete! Final payment is now required
                                            for shipping.
                                          </p>
                                        )}
                                        {status === OrderStatus.AwaitingFinalPayment && (
                                          <p>
                                            Awaiting final payment of ₦
                                            {trackedOrder.remainingBalance?.toLocaleString()} before
                                            shipping
                                          </p>
                                        )}
                                        {status === OrderStatus.FinalPaid && (
                                          <p>
                                            Final payment received. Your order will be prepared for
                                            shipping.
                                          </p>
                                        )}
                                        {status === OrderStatus.ReadyForShipping && (
                                          <p>Your order is packed and ready to be shipped.</p>
                                        )}
                                        {status === OrderStatus.Shipped && (
                                          <p>
                                            Your order has been shipped and is on its way to you.
                                          </p>
                                        )}
                                        {status === OrderStatus.Delivered && (
                                          <p>
                                            Your order has been delivered. Thank you for your
                                            business!
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-blue-900/30 p-2">
                      <svg
                        className="h-5 w-5 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">Payment Status</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={trackedOrder.paymentStatus} type="payment" />
                    <span className="text-sm text-gray-400">
                      Paid: ₦{trackedOrder.amountPaid?.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-gray-400">
                    Total: ₦{trackedOrder.totalAmount?.toLocaleString()}
                  </div>
                  {trackedOrder.requiredPaymentType === 'part' && trackedOrder.requiredDeposit && (
                    <div className="mt-3 rounded-lg bg-yellow-900/20 p-2 text-xs text-yellow-400">
                      Required Deposit: ₦{trackedOrder.requiredDeposit.toLocaleString()}
                    </div>
                  )}
                  {trackedOrder.remainingBalance > 0 && trackedOrder.status === 'Completed' && (
                    <div className="mt-3 rounded-lg bg-orange-900/20 p-2 text-xs text-orange-400">
                      Final Payment Due: ₦{trackedOrder.remainingBalance.toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-green-900/30 p-2">
                      <svg
                        className="h-5 w-5 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                        />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-white">Shipping Status</h3>
                  </div>
                  <StatusBadge
                    status={trackedOrder.shippingId ? 'Ready for Shipping' : 'Pending'}
                    type="order"
                  />
                  {trackedOrder.shippingId && (
                    <button
                      onClick={() => router.push(`/shipping/${trackedOrder.shippingId}`)}
                      className="mt-3 text-sm text-red-400 hover:text-red-300"
                    >
                      View Shipping Details →
                    </button>
                  )}
                  {trackedOrder.status === 'Completed' && (
                    <p className="mt-3 text-xs text-green-400">
                      Production complete.{' '}
                      {trackedOrder.remainingBalance > 0
                        ? 'Final payment required before shipping.'
                        : 'Ready for shipping.'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-center gap-4 pt-4">
                <Link href={`/orders/${trackedOrder._id}`}>
                  <Button variant="secondary" className="gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    View Full Details
                  </Button>
                </Link>
                <Link href="/order-history">
                  <Button variant="ghost" className="gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14v-6a4 4 0 00-4-4h-1"
                      />
                    </svg>
                    All Orders
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {!trackedOrder && !loading && !error && !searchAttempted && (
            <div className="rounded-xl border border-gray-800 bg-slate-900/30 py-16 text-center">
              <div className="mb-4 text-6xl">🔍</div>
              <p className="mb-2 text-lg text-gray-400">
                Enter an order number to track your order
              </p>
              <p className="mx-auto max-w-md text-sm text-gray-500">
                You can find your order number in your order confirmation email or in your order
                history. Format examples: ORD-2026-001 or 82097b5f-bbb0-4999-950d-3b155f484f85
              </p>
            </div>
          )}

          {!trackedOrder && !loading && error && searchAttempted && (
            <div className="rounded-xl border border-gray-800 bg-slate-900/30 py-16 text-center">
              <div className="mb-4 text-6xl">❓</div>
              <p className="mb-2 text-lg text-gray-400">No order found</p>
              <p className="mx-auto max-w-md text-sm text-gray-500">
                We couldn't find an order with that number. Please check the number and try again,
                or contact support if you need assistance.
              </p>
              <button
                onClick={() => {
                  setOrderNumber('');
                  setError('');
                  setSearchAttempted(false);
                }}
                className="mt-4 text-sm text-red-400 hover:text-red-300"
              >
                Clear and try again
              </button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={null}>
      <OrderTrackingPageContent />
    </Suspense>
  );
}
