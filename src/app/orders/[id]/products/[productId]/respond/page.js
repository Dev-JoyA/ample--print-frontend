'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import { useProtectedRoute } from '@/app/lib/auth';
import { customerBriefService } from '@/services/customerBriefService';
import { orderService } from '@/services/orderService';
import { useToast } from '@/components/providers/ToastProvider';

export default function RespondToBriefPage({ params }) {
  // Unwrap params with React.use()
  const unwrappedParams = React.use(params);
  const orderId = unwrappedParams.id;
  const productId = unwrappedParams.productId;
  
  const router = useRouter();
  const { isLoading: authLoading } = useProtectedRoute({
    redirectTo: '/auth/sign-in'
  });
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [product, setProduct] = useState(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!authLoading && orderId) {
      fetchOrderDetails();
    }
  }, [authLoading, orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await orderService.getById(orderId);
      const orderData = response?.order || response?.data || response;
      setOrder(orderData);
      
      // Find the product in the order
      const item = orderData.items?.find(
        i => (i.productId._id || i.productId) === productId
      );
      if (item) {
        setProduct(item);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!description.trim()) {
      showToast('Please enter your response', 'error');
      return;
    }

    try {
      setLoading(true);
      await customerBriefService.submit(orderId, productId, { description });
      showToast('Response sent successfully', 'success');
      router.push(`/orders/${orderId}`);
    } catch (error) {
      console.error('Failed to send response:', error);
      showToast('Failed to send response', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href={`/orders/${orderId}`}>
          <Button variant="ghost" size="sm" className="gap-2 mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Order
          </Button>
        </Link>

        <div className="bg-slate-900/50 rounded-xl border border-gray-800 p-6">
          <h1 className="text-2xl font-bold text-white mb-2">Respond to Brief</h1>
          {product && (
            <p className="text-gray-400 mb-6">
              Order #{order?.orderNumber} • {product.productName}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Your Response</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full bg-slate-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary"
                placeholder="Type your response here..."
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
              >
                Send Response
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}