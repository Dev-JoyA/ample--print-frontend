'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import SEOHead from '@/components/common/SEOHead';
import { useProtectedRoute } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { customerBriefService } from '@/services/customerBriefService';
import ProductBriefThread from '@/app/briefs/productBriefThread';
import { METADATA } from '@/lib/metadata';

export default function ProductBriefsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id;
  const productId = params.productId;

  const { isLoading: authLoading } = useProtectedRoute({
    redirectTo: '/auth/sign-in',
  });

  const [order, setOrder] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [conversationStatus, setConversationStatus] = useState({
    hasAdminResponse: false,
    isAdminResponseViewed: false,
    hasCustomerRespondedAfter: false,
    isLocked: false,
    adminMessageId: null,
  });
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    if (!authLoading && orderId) {
      fetchOrderDetails();
    }
  }, [authLoading, orderId]);

  useEffect(() => {
    if (orderId && productId && !loading) {
      checkConversationStatus();
    }
  }, [orderId, productId, loading]);

  const checkConversationStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await customerBriefService.getByOrderAndProduct(orderId, productId);

      let data = null;
      if (response?.data) {
        data = response.data;
      } else if (response) {
        data = response;
      }

      if (data) {
        const adminMessage = data?.admin || data?.superAdmin;
        const customerMessage = data?.customer;

        const hasAdminResponse = !!adminMessage;
        const isAdminResponseViewed = adminMessage?.viewed === true;
        const hasCustomerRespondedAfter =
          customerMessage &&
          adminMessage &&
          new Date(customerMessage.createdAt) > new Date(adminMessage.createdAt);

        const isLocked = hasAdminResponse && isAdminResponseViewed && hasCustomerRespondedAfter;

        setConversationStatus({
          hasAdminResponse,
          isAdminResponseViewed,
          hasCustomerRespondedAfter,
          isLocked,
          adminMessageId: adminMessage?._id || null,
        });
      }
    } catch (error) {
      console.error('Failed to check conversation status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await orderService.getById(orderId);
      const orderData = response?.order || response?.data || response;

      if (!orderData) {
        setError('Order not found');
        return;
      }

      setOrder(orderData);

      const item = orderData.items?.find((i) => (i.productId._id || i.productId) === productId);

      if (!item) {
        setError('Product not found in this order');
      }

      setProduct(item);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading || checkingStatus) {
    return (
      <DashboardLayout userRole="customer">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-xl border border-red-800 bg-red-900/20 p-8 text-center">
            <div className="mb-4 text-5xl">⚠️</div>
            <p className="mb-4 text-red-400">{error}</p>
            <button
              onClick={() => router.back()}
              className="rounded-lg bg-red-600 px-6 py-2 text-white transition hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const pageTitle = product?.productName
    ? `${product.productName} - Customization Brief`
    : 'Product Customization Brief';

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={`View and manage customization brief for ${product?.productName || 'product'}. Submit your design requirements and communicate with our team.`}
      />
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Order
            </button>

            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Customization Brief</h1>
              <p className="text-sm text-gray-400">Order #{order?.orderNumber}</p>
            </div>
          </div>

          {/* Locked Banner */}
          {conversationStatus.isLocked && (
            <div className="mb-6 rounded-lg border border-red-700 bg-red-900/30 p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <p className="font-medium text-red-400">Conversation Locked</p>
                  <p className="mt-1 text-sm text-gray-300">
                    You have already responded to the admin's message. Please wait for their next
                    response. No further replies can be sent at this time.
                  </p>
                  <button
                    onClick={() => router.push(`/orders/${orderId}`)}
                    className="mt-3 rounded-lg bg-red-600 px-4 py-1.5 text-sm text-white transition hover:bg-red-700"
                  >
                    Back to Order
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Waiting Banner */}
          {conversationStatus.hasAdminResponse && !conversationStatus.isAdminResponseViewed && (
            <div className="mb-6 rounded-lg border border-yellow-700 bg-yellow-900/30 p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <p className="font-medium text-yellow-400">Awaiting Your Review</p>
                  <p className="mt-1 text-sm text-gray-300">
                    Admin has responded to your brief. The response will be marked as viewed
                    automatically when you open the conversation below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {conversationStatus.hasAdminResponse &&
            conversationStatus.isAdminResponseViewed &&
            conversationStatus.hasCustomerRespondedAfter && (
              <div className="mb-6 rounded-lg border border-green-700 bg-green-900/30 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-medium text-green-400">Response Sent</p>
                    <p className="mt-1 text-sm text-gray-300">
                      You have already responded to the admin. Please wait for their reply.
                    </p>
                  </div>
                </div>
              </div>
            )}

          <ProductBriefThread
            orderId={orderId}
            productId={productId}
            productName={product?.productName || 'Product'}
            orderNumber={order?.orderNumber}
            isLocked={conversationStatus.isLocked}
            adminMessageId={conversationStatus.adminMessageId}
          />
        </div>
      </DashboardLayout>
    </>
  );
}
