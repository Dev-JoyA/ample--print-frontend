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

        <div className="grid md:grid-cols-2 gap-8 ">
          {/* Product Images */}
            <div className="relative">
                <div className="relative w-full aspect-square bg-slate-950 rounded-lg overflow-hidden mb-4">
                    <Image
                    src={product.images[selectedView]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    />
                    <div className="absolute top-4 right-4">
                    <StatusBadge status={product.leadTime} className='!bg-slate-950 !text-white !border border-gray-300 ' />
                    </div>
                    
                    {/* View buttons - fixed positioning */}
                    <div className="bg-zinc-700  absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 p-1 rounded-3xl">
                    {['FRONT', 'INNER', 'BACK'].map((view) => (
                        <button
                        key={view}
                        onClick={() => setSelectedView(view)}
                        className={`bg-zinc-700 flex-1 py-2 px-2 rounded-lg font-bold text-[14px] transition-colors ${
                            selectedView === view
                            ? 'bg-primary text-white'
                            : 'bg-dark-light text-gray-400 hover:text-white'
                        }`}
                        >
                        {view}
                        </button>
                    ))}
                    </div>
                </div>

                {/* Thumbnail images */}
                <div className="grid grid-cols-3 gap-2 mt-4 w-full">
                    <img src="/images/dummy-images/bg-7.jpg" className="w-full aspect-square object-cover rounded-md" />
                    <img src="/images/dummy-images/bg-6.jpg" className="w-full aspect-square object-cover rounded-md" />
                    <img src="/images/dummy-images/bg-5.jpg" className="w-full aspect-square object-cover rounded-md" />
                </div>
            </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge className="!border !border-red-700 !bg-slate-950" status={product.category} />
                <StatusBadge className="!text-green-600 !border border-none !bg-slate-950" status="QUALITY GUARANTEED" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">{product.name}</h1>
              <p className="text-gray-300 text-[14px] font-semibold">{product.description}</p>
            </div>

            {/* Order Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-lg p-4 border border-dark-lighter">
                <p className="text-[12px] font-semibold text-gray-400 mb-1 ">MINIMUM ORDER</p>
                <p className="text-l font-bold text-white">{product.moq} Units</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-4 border border-dark-lighter">
                <p className="text-[12px] font-semibold text-gray-400 mb-1 py-0">STANDARD SIZE</p>
                <p className="text-xl font-bold text-white">{product.sizes}</p>
              </div>
            </div>

            {/* Project Volume */}
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
                    onClick={() =>
                        setQuantity((prev) => Math.max(product.moq, prev - 1))
                    }
                    className="px-3 py-2 bg-slate-900 text-gray-400 rounded-lg font-medium hover:text-white transition-colors"
                    >
                    &#x25BC; {/* Down arrow */}
                    </button>

                    {/* Display Quantity */}
                    <span className="px-4 py-2 bg-slate-800 text-white font-medium rounded-lg w-16 text-center">
                    {quantity}
                    </span>

                    {/* Increment Button */}
                    <button
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="px-3 py-2 bg-slate-900 text-gray-400 rounded-lg font-medium hover:text-white transition-colors"
                    >
                    &#x25B2; {/* Up arrow */}
                    </button>
                </div>
            </div>

            {/* Project Estimate */}
            <div className="bg-slate-900 rounded-lg p-6 border border-dark-lighter">
              <h3 className="text-white font-semibold mb-4">PROJECT ESTIMATE</h3>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-3xl font-bold text-white">₦{(product.price * quantity).toLocaleString()}</p>
                  <p className="text-sm text-gray-400">₦{product.price.toLocaleString()} / unit</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Tier: Enterprise-Grade</p>
                </div>
              </div>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                icon="→"
                iconPosition="right"
                onClick={() => router.push(`/products/${productId}/customize`)}
              >
                Proceed to Design Briefing
              </Button>
              <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>5 DAYS LEAD TIME</span>
              </div>
            </div>
        </div>
        
        </div>
        {/* Technical Specifications */}
        <div className="mt-[3rem]">
            <h3 className="text-white font-bold mt-[7rem] text-[22px]">FULL TECHNICAL SPECIFICATIONS</h3>
            <div className="grid grid-cols-2 gap-x-8">
                {/* Split specifications into two arrays */}
                {[
                [
                    { label: 'BASE DIMENSIONS', value: product.specifications.dimensions },
                    { label: 'EST. PRODUCTION', value: product.specifications.production },
                    { label: 'PRINT', value: product.specifications.print },
                ],
                [
                    { label: 'PRODUCTION MOQ', value: product.specifications.moq },
                    { label: 'MATERIAL', value: product.specifications.material },
                    { label: 'FIT', value: product.specifications.fit },
                ]
                ].map((column, colIndex) => (
                <div key={colIndex} className="space-y-3">
                    {column.map((item, index) => (
                    <div key={index} className="border-b border-gray-700 pb-[1.2rem] ">
                        <div className="flex justify-between mt-[4rem]">
                        <span className="text-gray-300 font-semibold text-[12px]">{item.label}</span>
                        <span className="text-white">{item.value}</span>
                        </div>
                    </div>
                    ))}
                </div>
                ))}
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
