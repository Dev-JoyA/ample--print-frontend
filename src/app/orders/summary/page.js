'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { customerBriefService } from '@/services/customerBriefService';

export default function OrderSummaryPage() {
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
      
      // Fetch order details
      const orderResponse = await orderService.getById(orderId);
      console.log('Order response:', orderResponse);
      
      const orderData = orderResponse?.order || orderResponse?.data || orderResponse;
      setOrder(orderData);

      // Fetch briefs for each item in the order
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
      <DashboardLayout userRole="customer">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Processing your order...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-white mb-2">Order Not Found</h2>
            <p className="text-gray-400 mb-6">{error || 'Unable to load order summary'}</p>
            <Button variant="primary" onClick={() => router.push('/collections')}>
              Browse Collections
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <DashboardLayout userRole="customer">
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600/20 rounded-full mb-4">
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Order Confirmed!</h1>
            <p className="text-gray-400">Thank you for your order. We'll start working on it right away.</p>
          </div>

          {/* Order Summary Card */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Order Number</p>
                  <p className="text-xl font-mono text-white font-semibold">{order.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">Order Date</p>
                  <p className="text-white">{formatDate(order.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items?.map((item, index) => {
                  const productId = item.productId._id || item.productId;
                  const brief = briefs[productId];
                  
                  return (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-slate-800/30 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-medium">{item.productName}</h3>
                          <p className="text-primary font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="text-gray-400">Qty: {item.quantity}</span>
                          <span className="text-gray-400">Unit Price: {formatCurrency(item.price)}</span>
                          {brief && (
                            <span className="inline-flex items-center gap-1 text-green-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Brief Submitted
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Total */}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Subtotal ({totalItems} items)</span>
                  <span className="text-white font-semibold">{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-400">Amount Paid</span>
                  <span className="text-green-400 font-semibold">{formatCurrency(order.amountPaid)}</span>
                </div>
                <div className="flex justify-between items-center mt-2 text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-primary">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push(`/orders/${orderId}`)}
              className="gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14v-6a4 4 0 00-4-4h-1" />
              </svg>
              View All Orders
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            A confirmation email has been sent to your email address.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}