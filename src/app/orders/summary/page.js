'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';

function OrderSummaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');

  const order = {
    product: {
      id: productId || '1',
      name: 'Custom T-Shirts',
      image: '/images/collection/nylons/1.jpg',
      price: 1500.00,
    },
    quantity: 20,
    customization: {
      designInstructions: 'Modern minimalistic look with red accent',
      hasVoiceBrief: true,
      assetsUploaded: 2,
    },
    subtotal: 30000.00,
    shipping: 0,
    total: 30000.00,
  };

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Order Summary</h1>

        <div className="space-y-6">
          {/* Product Preview */}
          <div className="bg-dark-light rounded-lg p-6 border border-dark-lighter">
            <h2 className="text-xl font-semibold text-white mb-4">Selected Product</h2>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-dark rounded-lg overflow-hidden">
                <Image
                  src={order.product.image}
                  alt={order.product.name}
                  width={96}
                  height={96}
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{order.product.name}</h3>
                <p className="text-gray-400">Quantity: {order.quantity} units</p>
                <p className="text-gray-400">₦{order.product.price.toLocaleString()} per unit</p>
              </div>
            </div>
          </div>

          {/* Customization Preview */}
          <div className="bg-dark-light rounded-lg p-6 border border-dark-lighter">
            <h2 className="text-xl font-semibold text-white mb-4">Customization Details</h2>
            <div className="space-y-2 text-gray-300">
              <p><span className="font-medium">Design Instructions:</span> {order.customization.designInstructions}</p>
              <p><span className="font-medium">Voice Briefing:</span> {order.customization.hasVoiceBrief ? 'Yes' : 'No'}</p>
              <p><span className="font-medium">Assets Uploaded:</span> {order.customization.assetsUploaded} files</p>
            </div>
          </div>

          {/* Order Totals */}
          <div className="bg-dark-light rounded-lg p-6 border border-dark-lighter">
            <h2 className="text-xl font-semibold text-white mb-4">Order Totals</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span>₦{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Shipping</span>
                <span>₦{order.shipping.toLocaleString()}</span>
              </div>
              <div className="border-t border-dark-lighter pt-3 flex justify-between">
                <span className="text-xl font-semibold text-white">Total</span>
                <span className="text-xl font-semibold text-white">₦{order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={() => router.back()}
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push('/payment')}
              className="flex-1"
              icon="→"
              iconPosition="right"
            >
              Proceed to Payment
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function OrderSummaryPage() {
  return (
    <Suspense fallback={
      <DashboardLayout userRole="customer">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Order Summary</h1>
          <div className="text-gray-400">Loading...</div>
        </div>
      </DashboardLayout>
    }>
      <OrderSummaryContent />
    </Suspense>
  );
}
