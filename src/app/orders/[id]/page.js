'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { useAuth, useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { customerBriefService } from '@/services/customerBriefService';
import { METADATA, getOrderMetadata } from '@/lib/metadata';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = params.id;

  useAuthCheck();

  const [order, setOrder] = useState(null);
  const [briefs, setBriefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('items');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);

      const orderResponse = await orderService.getById(orderId);
      console.log('Order response:', orderResponse);

      const orderData = orderResponse?.order || orderResponse?.data || orderResponse;
      setOrder(orderData);

      if (orderData?.items) {
        const briefPromises = orderData.items.map(async (item) => {
          const productId = item.productId._id || item.productId;

          try {
            const briefResponse = await customerBriefService.getByOrderAndProduct(
              orderId,
              productId
            );
            return {
              productId,
              brief: briefResponse?.data || briefResponse,
            };
          } catch (err) {
            console.log(`No brief found for product ${productId}`);
            return null;
          }
        });

        const briefResults = await Promise.all(briefPromises);
        const briefMap = briefResults
          .filter((b) => b !== null)
          .reduce((acc, curr) => {
            acc[curr.productId] = curr.brief;
            return acc;
          }, {});

        setBriefs(briefMap);
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    let filename = imagePath;
    if (imagePath.includes('/')) {
      filename = imagePath.split('/').pop();
    }
    return `http://localhost:4001/api/v1/attachments/download/${filename}`;
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusProgress = (status) => {
    const steps = [
      'Pending',
      'OrderReceived',
      'FilesUploaded',
      'DesignUploaded',
      'Approved',
      'InProduction',
      'Completed',
      'Delivered',
    ];
    const currentIndex = steps.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-500',
      OrderReceived: 'bg-blue-500',
      FilesUploaded: 'bg-purple-500',
      DesignUploaded: 'bg-indigo-500',
      UnderReview: 'bg-orange-500',
      Approved: 'bg-green-500',
      InProduction: 'bg-blue-500',
      Completed: 'bg-green-500',
      Delivered: 'bg-green-500',
      Cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const handleDownloadInvoice = () => {
    console.log('Download invoice for order:', orderId);
  };

  const handleTrackOrder = () => {
    router.push(`/order-tracking?order=${order.orderNumber}`);
  };

  if (loading) {
    return (
      <>
        <SEOHead
          title="Loading Order..."
          description="Please wait while we load your order details"
          robots="noindex, nofollow"
        />
        <DashboardLayout userRole={user?.role}>
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
              <p className="text-gray-400">Loading order details...</p>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <SEOHead
          title="Order Not Found"
          description="The requested order could not be found"
          robots="noindex, nofollow"
        />
        <DashboardLayout userRole={user?.role}>
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-red-700 bg-red-900/30 p-8 text-center">
              <div className="mb-4 text-6xl">😕</div>
              <h2 className="mb-2 text-2xl font-bold text-white">Order Not Found</h2>
              <p className="mb-6 text-gray-400">
                {error || "The order you're looking for doesn't exist."}
              </p>
              <Button variant="primary" onClick={() => router.push('/order-history')}>
                View My Orders
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  const progress = getStatusProgress(order.status);
  const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const needsPayment = order.remainingBalance > 0;

  return (
    <>
      <SEOHead {...getOrderMetadata(order)} />
      <DashboardLayout userRole={user?.role}>
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-12">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mb-6">
              <button
                onClick={() => router.push('/orders')}
                className="group mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
              >
                <svg
                  className="h-4 w-4 transition-transform group-hover:-translate-x-1 sm:h-5 sm:w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Orders
              </button>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white sm:text-4xl">Order Details</h1>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <span className="text-gray-400">Order #{order.orderNumber}</span>
                    <span className="h-1 w-1 rounded-full bg-gray-600"></span>
                    <span className="text-gray-400">{formatDate(order.createdAt)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {order.invoiceId && (
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={handleDownloadInvoice}
                      className="gap-2"
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
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Invoice
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => window.print()}
                    className="gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                      />
                    </svg>
                    Print
                  </Button>
                  <Button variant="primary" size="md" onClick={handleTrackOrder} className="gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                      />
                    </svg>
                    Track
                  </Button>
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-gray-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${getStatusColor(order.status)}/20`}
                  >
                    <span className="text-3xl">
                      {order.status === 'Delivered'
                        ? '✅'
                        : order.status === 'InProduction'
                          ? '⚙️'
                          : order.status === 'DesignUploaded'
                            ? '🎨'
                            : order.status === 'Approved'
                              ? '👍'
                              : '📋'}
                    </span>
                  </div>
                  <div>
                    <p className="mb-1 text-sm text-gray-400">Current Status</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge status={order.status} className="px-4 py-1.5 text-sm" />
                      <span className="text-xs text-gray-500 sm:text-sm">
                        Updated {formatDate(order.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-md">
                  <div className="mb-2 flex justify-between text-xs text-gray-500">
                    <span>Ordered</span>
                    <span>Design</span>
                    <span>Production</span>
                    <span>Delivery</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-600 to-purple-600 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 border-b border-gray-800">
              <nav className="scrollbar-hide flex gap-4 overflow-x-auto pb-1 sm:gap-6">
                <button
                  onClick={() => setActiveTab('items')}
                  className={`whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium transition ${
                    activeTab === 'items'
                      ? 'border-red-600 text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Order Items ({order.items?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('briefs')}
                  className={`whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium transition ${
                    activeTab === 'briefs'
                      ? 'border-red-600 text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Customization Briefs
                  {Object.keys(briefs).length > 0 && ` (${Object.keys(briefs).length})`}
                </button>
                <button
                  onClick={() => setActiveTab('payment')}
                  className={`whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium transition ${
                    activeTab === 'payment'
                      ? 'border-red-600 text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Payment Details
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`whitespace-nowrap border-b-2 px-1 pb-4 text-sm font-medium transition ${
                    activeTab === 'timeline'
                      ? 'border-red-600 text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Timeline
                </button>
              </nav>
            </div>

            <div className="space-y-6">
              {activeTab === 'items' && (
                <div className="space-y-4">
                  {order.items?.map((item, index) => {
                    const productId = item.productId._id || item.productId;
                    const brief = briefs[productId];

                    return (
                      <div
                        key={index}
                        className="rounded-xl border border-gray-800 bg-slate-900/50 p-4 transition-all hover:border-gray-700 sm:p-6"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row">
                          <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-800 text-4xl">
                            📦
                          </div>

                          <div className="flex-1">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <h3 className="text-base font-semibold text-white sm:text-lg">
                                {item.productName}
                              </h3>
                              <p className="text-base font-bold text-red-400 sm:text-lg">
                                {formatCurrency(item.price * item.quantity)}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 sm:gap-4">
                              <div>
                                <p className="text-gray-500">Quantity</p>
                                <p className="font-medium text-white">{item.quantity}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Unit Price</p>
                                <p className="font-medium text-white">
                                  {formatCurrency(item.price)}
                                </p>
                              </div>
                              {item.productSnapshot?.dimension && (
                                <div>
                                  <p className="text-gray-500">Dimensions</p>
                                  <p className="font-medium text-white">
                                    {item.productSnapshot.dimension.width} x{' '}
                                    {item.productSnapshot.dimension.height}
                                  </p>
                                </div>
                              )}
                              {item.productSnapshot?.material && (
                                <div>
                                  <p className="text-gray-500">Material</p>
                                  <p className="font-medium text-white">
                                    {item.productSnapshot.material}
                                  </p>
                                </div>
                              )}
                            </div>

                            {brief && (
                              <div className="mt-4 border-t border-gray-700 pt-4">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="flex items-center gap-1 text-green-400">
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
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                    Brief submitted
                                  </span>
                                  <button
                                    onClick={() => setActiveTab('briefs')}
                                    className="ml-2 text-sm text-red-400 transition hover:text-red-300"
                                  >
                                    View details →
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="mt-6 rounded-xl border border-gray-800 bg-slate-900/50 p-4 sm:p-6">
                    <h3 className="mb-4 text-lg font-semibold text-white">Order Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Subtotal ({totalItems} items)</span>
                        <span className="text-white">{formatCurrency(order.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Amount Paid</span>
                        <span className="text-green-400">{formatCurrency(order.amountPaid)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Remaining Balance</span>
                        <span className="text-yellow-400">
                          {formatCurrency(order.remainingBalance)}
                        </span>
                      </div>
                      <div className="mt-3 border-t border-gray-700 pt-3">
                        <div className="flex justify-between">
                          <span className="text-base font-medium text-white">Total</span>
                          <span className="text-xl font-bold text-red-400">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'briefs' && (
                <div className="space-y-6">
                  {order.items?.map((item) => {
                    const productId = item.productId._id || item.productId;
                    const brief = briefs[productId];

                    return (
                      <div
                        key={productId}
                        className="overflow-hidden rounded-xl border border-gray-800 bg-slate-900/50 transition-all hover:border-gray-700"
                      >
                        <div className="border-b border-gray-700 bg-slate-800/50 p-4">
                          <h3 className="text-base font-semibold text-white sm:text-lg">
                            {item.productName}
                          </h3>
                          <p className="text-xs text-gray-400 sm:text-sm">
                            Quantity: {item.quantity}
                          </p>
                        </div>

                        <div className="p-4 sm:p-6">
                          {brief ? (
                            <div className="space-y-4">
                              {brief.description && (
                                <div>
                                  <p className="mb-1 text-xs text-gray-400 sm:text-sm">
                                    Description:
                                  </p>
                                  <p className="rounded-lg bg-slate-800/50 p-3 text-sm text-white sm:text-base">
                                    {brief.description}
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                                {brief.image && (
                                  <div className="text-center">
                                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900/30 sm:h-12 sm:w-12">
                                      <svg
                                        className="h-5 w-5 text-blue-400 sm:h-6 sm:w-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                    </div>
                                    <p className="text-xs text-gray-400">Image</p>
                                  </div>
                                )}
                                {brief.voiceNote && (
                                  <div className="text-center">
                                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-900/30 sm:h-12 sm:w-12">
                                      <svg
                                        className="h-5 w-5 text-green-400 sm:h-6 sm:w-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                                        />
                                      </svg>
                                    </div>
                                    <p className="text-xs text-gray-400">Voice Note</p>
                                  </div>
                                )}
                                {brief.video && (
                                  <div className="text-center">
                                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-red-900/30 sm:h-12 sm:w-12">
                                      <svg
                                        className="h-5 w-5 text-red-400 sm:h-6 sm:w-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                      </svg>
                                    </div>
                                    <p className="text-xs text-gray-400">Video</p>
                                  </div>
                                )}
                                {brief.logo && (
                                  <div className="text-center">
                                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-900/30 sm:h-12 sm:w-12">
                                      <svg
                                        className="h-5 w-5 text-purple-400 sm:h-6 sm:w-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                    </div>
                                    <p className="text-xs text-gray-400">Logo</p>
                                  </div>
                                )}
                              </div>

                              <div className="mt-4">
                                <Link href={`/orders/${orderId}/products/${productId}/briefs`}>
                                  <Button variant="secondary" size="sm" className="w-full">
                                    View Full Brief Conversation
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <div className="py-6 text-center sm:py-8">
                              <p className="text-sm text-gray-400 sm:text-base">
                                No customization brief submitted for this product yet.
                              </p>
                              <Link href={`/orders/${orderId}/products/${productId}/briefs`}>
                                <Button variant="primary" size="sm" className="mt-4">
                                  Add Customization Brief
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === 'payment' && (
                <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-4 sm:p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">Payment Summary</h3>

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between border-b border-gray-800 py-3">
                      <span className="text-sm text-gray-400 sm:text-base">Order Total</span>
                      <span className="font-medium text-white">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between border-b border-gray-800 py-3">
                      <span className="text-sm text-gray-400 sm:text-base">Amount Paid</span>
                      <span className="font-medium text-green-400">
                        {formatCurrency(order.amountPaid)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between py-3">
                      <span className="text-sm text-gray-400 sm:text-base">Remaining Balance</span>
                      <span className="font-medium text-yellow-400">
                        {formatCurrency(order.remainingBalance)}
                      </span>
                    </div>

                    <div className="mt-6 rounded-lg bg-slate-800/30 p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            order.paymentStatus === 'Completed'
                              ? 'bg-green-500'
                              : order.paymentStatus === 'PartPayment'
                                ? 'bg-yellow-500'
                                : 'bg-gray-500'
                          }`}
                        ></div>
                        <span className="font-medium text-white">
                          Payment Status: {order.paymentStatus}
                        </span>
                      </div>

                      {order.requiredPaymentType && (
                        <p className="text-xs text-gray-400 sm:text-sm">
                          Payment Type:{' '}
                          {order.requiredPaymentType === 'full' ? 'Full Payment' : 'Part Payment'}
                          {order.requiredDeposit &&
                            ` (Deposit: ${formatCurrency(order.requiredDeposit)})`}
                        </p>
                      )}
                    </div>

                    {order.remainingBalance > 0 && (
                      <Button
                        variant="primary"
                        size="lg"
                        className="mt-4 w-full"
                        onClick={() =>
                          router.push(
                            `/payment?orderId=${orderId}&amount=${order.remainingBalance}`
                          )
                        }
                      >
                        Pay Remaining Balance
                      </Button>
                    )}

                    {order.invoiceId && (
                      <Button
                        variant="secondary"
                        size="lg"
                        className="mt-2 w-full"
                        onClick={() => router.push(`/invoices/${order.invoiceId}`)}
                      >
                        View Invoice
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-4 sm:p-6">
                  <h3 className="mb-6 text-lg font-semibold text-white">Order Timeline</h3>

                  <div className="space-y-4">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="relative">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 sm:h-10 sm:w-10">
                          <svg
                            className="h-4 w-4 text-green-400 sm:h-5 sm:w-5"
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
                        </div>
                        {order.updatedAt && (
                          <div className="absolute left-3 top-10 h-16 w-0.5 bg-gray-700 sm:left-4"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <p className="font-medium text-white">Order Placed</p>
                        <p className="text-xs text-gray-400 sm:text-sm">
                          {formatDate(order.createdAt)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Your order has been received and is being processed.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 sm:gap-4">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
                          order.paymentStatus !== 'Pending' ? 'bg-green-500/20' : 'bg-gray-700'
                        }`}
                      >
                        <svg
                          className={`h-4 w-4 sm:h-5 sm:w-5 ${
                            order.paymentStatus !== 'Pending' ? 'text-green-400' : 'text-gray-500'
                          }`}
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
                      <div className="flex-1 pb-8">
                        <p className="font-medium text-white">Payment {order.paymentStatus}</p>
                        <p className="text-xs text-gray-400 sm:text-sm">
                          {order.amountPaid > 0
                            ? `Paid: ${formatCurrency(order.amountPaid)}`
                            : 'Payment pending'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 sm:gap-4">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10 ${
                          Object.keys(briefs).length > 0 ? 'bg-green-500/20' : 'bg-gray-700'
                        }`}
                      >
                        <svg
                          className={`h-4 w-4 sm:h-5 sm:w-5 ${
                            Object.keys(briefs).length > 0 ? 'text-green-400' : 'text-gray-500'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 pb-8">
                        <p className="font-medium text-white">Customization Brief</p>
                        <p className="text-xs text-gray-400 sm:text-sm">
                          {Object.keys(briefs).length > 0 ? 'Brief submitted' : 'No brief yet'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 sm:gap-4">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full sm:h-10 sm:w-10 ${getStatusColor(order.status).replace('bg-', 'bg-')}/20`}
                      >
                        <span className="text-base sm:text-lg">
                          {order.status === 'Delivered'
                            ? '✅'
                            : order.status === 'InProduction'
                              ? '⚙️'
                              : order.status === 'DesignUploaded'
                                ? '🎨'
                                : '📋'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">Current Status: {order.status}</p>
                        <p className="text-xs text-gray-400 sm:text-sm">
                          Updated {formatDate(order.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
