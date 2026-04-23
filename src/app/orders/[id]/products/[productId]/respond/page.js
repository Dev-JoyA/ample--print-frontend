'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import SEOHead from '@/components/common/SEOHead';
import { useProtectedRoute } from '@/app/lib/auth';
import { customerBriefService } from '@/services/customerBriefService';
import { orderService } from '@/services/orderService';
import { useToast } from '@/components/providers/ToastProvider';
import { METADATA, getOrderMetadata } from '@/lib/metadata';

export default function RespondToBriefPage({ params }) {
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.id;
  const productId = unwrappedParams.productId;

  const router = useRouter();
  const { isLoading: authLoading } = useProtectedRoute({
    redirectTo: '/auth/sign-in',
  });
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [product, setProduct] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && orderId) {
      fetchOrderDetails();
    }
  }, [authLoading, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await orderService.getById(orderId);
      const orderData = response?.order || response?.data || response;
      setOrder(orderData);

      const item = orderData.items?.find((i) => (i.productId._id || i.productId) === productId);
      if (item) {
        setProduct(item);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      showToast('Failed to load order details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      showToast('Please enter your response', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await customerBriefService.submit(orderId, productId, { description });
      showToast('Response sent successfully', 'success');
      router.push(`/orders/${orderId}`);
    } catch (error) {
      console.error('Failed to send response:', error);
      showToast(error?.message || 'Failed to send response', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const pageTitle = product ? `Respond to Brief - ${product.productName}` : 'Respond to Brief';
  const pageDescription = order
    ? `Respond to customization brief for order #${order.orderNumber}`
    : 'Respond to your customization brief';

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        robots="noindex, follow"
        {...(order && getOrderMetadata(order))}
      />
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Link href={`/orders/${orderId}`} className="inline-block">
            <Button variant="ghost" size="sm" className="mb-4 gap-2 sm:mb-6">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Order
            </Button>
          </Link>

          <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-4 backdrop-blur-sm sm:p-6">
            <h1 className="text-xl font-bold text-white sm:text-2xl">Respond to Brief</h1>
            {product && (
              <p className="mt-1 text-sm text-gray-400 sm:mt-2 sm:text-base">
                Order #{order?.orderNumber} • {product.productName}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 sm:mt-8">
              <div>
                <label className="mb-2 block text-sm text-gray-400 sm:text-base">
                  Your Response
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-gray-700 bg-slate-800 p-3 text-sm text-white focus:border-primary focus:outline-none sm:text-base"
                  placeholder="Type your response here..."
                  required
                  disabled={submitting}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  {submitting ? 'Sending...' : 'Send Response'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
