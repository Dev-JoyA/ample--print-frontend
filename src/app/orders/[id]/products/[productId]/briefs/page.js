'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useProtectedRoute } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import ProductBriefThread from '@/app/briefs/productBriefThread';

export default function ProductBriefsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id;
  const productId = params.productId;

  const { isLoading: authLoading } = useProtectedRoute({
    redirectTo: '/auth/sign-in'
  });

  const [order, setOrder] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

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
      
      // Find the product in the order
      const item = orderData.items?.find(
        i => (i.productId._id || i.productId) === productId
      );
      setProduct(item);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProductBriefThread
          orderId={orderId}
          productId={productId}
          productName={product?.productName || 'Product'}
          orderNumber={order?.orderNumber}
        />
      </div>
    </DashboardLayout>
  );
}