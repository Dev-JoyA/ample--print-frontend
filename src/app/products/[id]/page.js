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
          <div>
            <div className="relative w-full aspect-square bg-slate-950 rounded-lg overflow-hidden mb-4">
              <Image
                src={product.images[selectedView]}
                alt={product.name}
                fill
                className="object-cover"
              />
              <div className="absolute top-4 right-4">
                <StatusBadge status={product.leadTime} />
              </div>
            </div>
            <div className="flex gap-2">
              {['FRONT', 'INNER', 'BACK'].map((view) => (
                <button
                  key={view}
                  onClick={() => setSelectedView(view)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
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

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={product.category} />
                <StatusBadge status="QUALITY GUARANTEED" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">{product.name}</h1>
              <p className="text-gray-400">{product.description}</p>
            </div>

            {/* Order Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-light rounded-lg p-4 border border-dark-lighter">
                <p className="text-sm text-gray-400 mb-1">MINIMUM ORDER</p>
                <p className="text-xl font-bold text-white">{product.moq} Units</p>
              </div>
              <div className="bg-dark-light rounded-lg p-4 border border-dark-lighter">
                <p className="text-sm text-gray-400 mb-1">STANDARD SIZE</p>
                <p className="text-xl font-bold text-white">{product.sizes}</p>
              </div>
            </div>

            {/* Project Volume */}
            <div>
              <h3 className="text-white font-semibold mb-2">
                PROJECT VOLUME
                <span className="text-primary ml-2 text-sm">Starting from {product.moq} units</span>
              </h3>
              <div className="flex gap-2">
                {quantityOptions.map((qty) => (
                  <button
                    key={qty}
                    onClick={() => setQuantity(qty)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      quantity === qty
                        ? 'bg-primary text-white'
                        : 'bg-dark-light text-gray-400 hover:text-white'
                    }`}
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>

            {/* Project Estimate */}
            <div className="bg-dark-light rounded-lg p-6 border border-dark-lighter">
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

            {/* Technical Specifications */}
            <div className="bg-dark-light rounded-lg p-6 border border-dark-lighter">
              <h3 className="text-white font-semibold mb-4">FULL TECHNICAL SPECIFICATIONS</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">BASE DIMENSIONS</span>
                  <span className="text-white">{product.specifications.dimensions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">EST. PRODUCTION</span>
                  <span className="text-white">{product.specifications.production}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">PRINT</span>
                  <span className="text-white">{product.specifications.print}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">PRODUCTION MOQ</span>
                  <span className="text-white">{product.specifications.moq}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">MATERIAL</span>
                  <span className="text-white">{product.specifications.material}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">FIT</span>
                  <span className="text-white">{product.specifications.fit}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
