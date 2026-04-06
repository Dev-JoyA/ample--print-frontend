'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { customerBriefService } from '@/services/customerBriefService';
import { METADATA, getOrderMetadata } from '@/lib/metadata';

function OrderSummaryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useAuthCheck();
  
  const orderId = searchParams.get('orderId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [briefs, setBriefs] = useState({});

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    fetchOrderData();
  }, [orderId]);

  const fetchOrderData = async () => {
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
            const briefResponse = await customerBriefService.getByOrderAndProduct(orderId, productId);
            return {
              productId,
              brief: briefResponse?.data || briefResponse
            };
          } catch (err) {
            console.log(`No brief found for product ${productId}`);
            return null;
          }
        });

        const briefResults = await Promise.all(briefPromises);
        const briefMap = briefResults.filter(b => b !== null).reduce((acc, curr) => {
          acc[curr.productId] = curr.brief;
          return acc;
        }, {});
        
        setBriefs(briefMap);
      }

    } catch (err) {
      console.error('Failed to fetch order:', err);
      setError('Failed to load order summary');
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
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <>
        <SEOHead
          title="Order Confirmation"
          description="Your order has been placed successfully"
          robots="noindex, nofollow"
        />
        <DashboardLayout userRole="customer">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-gray-400">Processing your order...</p>
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
        <DashboardLayout userRole="customer">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-red-700 bg-red-900/30 p-8 text-center">
              <div className="mb-4 text-6xl">😕</div>
              <h2 className="mb-2 text-2xl font-bold text-white">Order Not Found</h2>
              <p className="mb-6 text-gray-400">{error || 'Unable to load order summary'}</p>
              <Button variant="primary" onClick={() => router.push('/collections')}>
                Browse Collections
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <>
      <SEOHead
        title="Order Confirmed"
        description={`Order #${order.orderNumber} has been confirmed successfully`}
        {...getOrderMetadata(order)}
      />
      <DashboardLayout userRole="customer">
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mb-6 text-center sm:mb-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-600/20 sm:h-20 sm:w-20">
                <svg className="h-8 w-8 text-green-400 sm:h-10 sm:w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl sm:text-4xl">Order Confirmed!</h1>
              <p className="mt-1 text-sm text-gray-400 sm:mt-2 sm:text-base">Thank you for your order. We'll start working on it right away.</p>
            </div>

            <div className="mb-6 overflow-hidden rounded-2xl border border-gray-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="border-b border-gray-800 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="mb-1 text-xs text-gray-400 sm:text-sm">Order Number</p>
                    <p className="font-mono text-base font-semibold text-white sm:text-xl">{order.orderNumber}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="mb-1 text-xs text-gray-400 sm:text-sm">Order Date</p>
                    <p className="text-sm text-white sm:text-base">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <h2 className="mb-4 text-base font-semibold text-white sm:text-lg">Order Items</h2>
                <div className="space-y-3 sm:space-y-4">
                  {order.items?.map((item, index) => {
                    const productId = item.productId._id || item.productId;
                    const brief = briefs[productId];
                    
                    return (
                      <div key={index} className="flex flex-col gap-3 rounded-xl bg-slate-800/30 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
                        <div className="flex-1">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-medium text-white sm:text-base">{item.productName}</h3>
                            <p className="text-sm font-semibold text-primary sm:text-base">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs sm:gap-3 sm:text-sm">
                            <span className="text-gray-400">Qty: {item.quantity}</span>
                            <span className="h-1 w-1 rounded-full bg-gray-600"></span>
                            <span className="text-gray-400">Unit Price: {formatCurrency(item.price)}</span>
                            {brief && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-gray-600"></span>
                                <span className="inline-flex items-center gap-1 text-green-400">
                                  <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Brief Submitted
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 border-t border-gray-800 pt-4 sm:mt-6 sm:pt-6">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className="text-sm text-gray-400 sm:text-base">Subtotal ({totalItems} items)</span>
                    <span className="text-sm font-semibold text-white sm:text-base">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap justify-between items-center gap-2">
                    <span className="text-sm text-gray-400 sm:text-base">Amount Paid</span>
                    <span className="text-sm font-semibold text-green-400 sm:text-base">{formatCurrency(order.amountPaid)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap justify-between items-center gap-2 border-t border-gray-700 pt-3">
                    <span className="text-base font-medium text-white sm:text-lg">Total</span>
                    <span className="text-lg font-bold text-primary sm:text-xl">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push(`/orders/${orderId}`)}
                className="gap-2"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Order Details
              </Button>
              
              <Button
                variant="secondary"
                size="lg"
                onClick={() => router.push('/order-history')}
                className="gap-2"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14v-6a4 4 0 00-4-4h-1" />
                </svg>
                View All Orders
              </Button>
            </div>

            <p className="mt-6 text-center text-xs text-gray-500 sm:mt-8 sm:text-sm">
              A confirmation email has been sent to your email address.
            </p>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}

export default function OrderSummaryPage() {
  return (
    <Suspense fallback={null}>
      <OrderSummaryPageContent />
    </Suspense>
  );
}