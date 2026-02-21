'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  const [selectedView, setSelectedView] = useState('FRONT');
  const [quantity, setQuantity] = useState(20);

  const product = {
    id: productId,
    name: 'Custom T-Shirts',
    description: 'BRANDED APPAREL FOR BUSINESSES, EVENTS, AND CAMPAIGNS. 100% Organic Cotton shirts with high-fidelity screen printing.',
    price: 1500.00,
    category: 'BRANDED MERCHANDISE',
    images: {
      FRONT: '/images/collection/nylons/1.jpg',
      INNER: '/images/collection/nylons/1.jpg',
      BACK: '/images/collection/nylons/1.jpg',
    },
    leadTime: '10-14 Days',
    moq: 20,
    sizes: 'All Sizes (S-XXL)',
    specifications: {
      dimensions: 'All Sizes (S-XXL)',
      production: '7-10 Days',
      print: 'Screen/DTG',
      moq: '20 Units',
      material: '180gsm Cotton',
      fit: 'Modern Unisex',
    },
  };

  const quantityOptions = [20, 40, 100, 200];

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Studio
        </button>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Items 1 & 2 (stacked vertically) */}
          <div className="col-span-2 space-y-6">
            {/* Item 1 - Customization Details (Rectangular - wider than height) */}
            <div className="bg-slate-900 rounded-xl p-6 border border-gray-800">
            {/* First div - title and edit on same line, opposite ends */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Brief Overview</h2>
                <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-500 !bg-transparent"
                icon={
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                }
                iconPosition="left"
                >
                edit
                </Button>
            </div>

            {/* Second div - instructions */}
            <div className="bg-gray-950 rounded-xl p-4 mb-4">
                <h3 className="text-gray-400 font-bold text-md mb-2">INSTRUCTIONS</h3>
                <p className="text-gray-300">Modern minimalist look with a focus on our brand's primary red accent. Please use high-contrast imagery where possible.</p>
            </div>

            {/* Third div - two equal buttons */}
            <div className="grid grid-cols-2 gap-4">
                {/* View note attached button - transparent red */}
                <button className="flex justify-between items-center w-full bg-red-600/15 hover:bg-red-600/30 rounded-lg px-4 py-4 transition-colors">
                <span className="text-white font-medium">Voice note attached</span>
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                </button>

                {/* 3 assets uploaded button - transparent blue */}
                <button className="flex justify-between items-center w-full bg-blue-600/15 hover:bg-blue-600/30 rounded-lg px-4 py-4 transition-colors">
                <span className="text-blue-600 font-medium">3 assets uploaded</span>
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                </button>
            </div>
            </div>

            {/* Item 2 - Product Details (Rectangular - wider than height) */}
            <div className="bg-slate-900 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-4">Product Configuration</h2>
            <div className="space-y-4">
                <div className="flex items-start gap-4">
                    {/* Image - maintains full length but same shape */}
                    <div className="w-30 h-[10rem] bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                        src={product.images.FRONT}
                        alt={product.name}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                        />
                    </div>
                    <div className="w-full">
                        {/* Product title - directly next to image */}
                        <h3 className="text-white font-bold text-lg mt-3">Luxury Brand Book</h3>
                        {/* Two pairs of items at opposite ends */}
                        <div className="flex justify-between items-start gap-4 mt-2">
                        {/* Left pair - Qty & Finish (stacked vertically with lines) */}
                        <div className="flex-1 space-y-3">
                            <div className="flex justify-between rounded-lg p-2">
                                <p className="text-xs font-semibold text-gray-400 ">Qty</p>
                                 <p className="text-sm font-semibold text-white">{product.moq} Units</p>
                            </div>
                            <div className="border-b border-gray-700 "></div>
                             <div className="flex justify-between rounded-lg p-2">
                                 <p className="text-xs font-semibold text-gray-400 ">Finish</p>
                                 <p className="text-sm font-semibold text-white">{product.finish || 'Matte Lamination'}</p>
                            </div>
                            <div className="border-b border-gray-700"></div>
                        </div>
                        
                        {/* Right pair - Size & Binding (stacked vertically with lines) */}
                        <div className="flex-1 space-y-3">
                            <div className="flex justify-between rounded-lg p-2">
                                <p className="text-xs font-semibold text-gray-400 ">Size</p>
                                <p className="text-sm font-semibold text-white">{product.sizes}</p>
                            </div>
                            <div className="border-b border-gray-700"></div>
                            
                            <div className="flex justify-between rounded-lg p-2">
                                <p className="text-xs font-semibold text-gray-400 ">Binding</p>
                                <p className="text-sm font-semibold text-white">{product.binding || 'Hardcover'}</p>
                            </div>
                            <div className="border-b border-gray-700"></div>
                        </div>
                        </div>
                    </div>    
                </div>  
            </div>
            </div>
          </div>

          {/* Right Column - Items 3 & 4 (stacked vertically) */}
          <div className="col-span-1 space-y-6">
            {/* Item 3 - Order Totals with Proceed to Checkout Button */}
            <div className="bg-slate-900 rounded-lg p-6 border rounded-xl border-gray-800">
              <h2 className="text-xl font-bold text-white mb-4">Order Totals</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">₦{(product.price * quantity).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping</span>
                  <span className="text-white">Calculated at next step</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tax</span>
                  <span className="text-white">Calculated at next step</span>
                </div>
                <div className="border-t border-dark-lighter pt-3">
                  <div className="flex justify-between font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-primary">₦{(product.price * quantity).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {/* Single Button - Proceed to Checkout */}
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                icon="→"
                iconPosition="right"
                onClick={() => router.push(`/checkout/${productId}`)}
              >
                Proceed to Checkout
              </Button>
            </div>

            {/* Item 4 - Purchase Quantity */}
            <div className="bg-slate-900 rounded-lg p-6 border border-dark-lighter">
              <h2 className="text-xl font-bold text-white mb-4">Purchase Quantity</h2>
              <div>
                <h3 className="text-white font-semibold mb-2">
                  PROJECT VOLUME
                  <span className="text-primary ml-2 text-sm">
                    Starting from {product.moq} units
                  </span>
                </h3>

                <div className="flex items-center gap-2">
                  {/* Decrement Button */}
                  <button
                    onClick={() => setQuantity((prev) => Math.max(product.moq, prev - 1))}
                    className="px-3 py-2 bg-slate-800 text-gray-400 rounded-lg font-medium hover:text-white transition-colors"
                  >
                    &#x25BC;
                  </button>

                  {/* Display Quantity */}
                  <span className="px-4 py-2 bg-slate-800 text-white font-medium rounded-lg w-16 text-center">
                    {quantity}
                  </span>

                  {/* Increment Button */}
                  <button
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="px-3 py-2 bg-slate-800 text-gray-400 rounded-lg font-medium hover:text-white transition-colors"
                  >
                    &#x25B2;
                  </button>
                </div>

                <p className="text-sm text-gray-400 mt-3">
                  Price per unit: ₦{product.price.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}