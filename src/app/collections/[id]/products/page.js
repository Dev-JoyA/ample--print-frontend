'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import ProductCard from '@/components/cards/ProductCard';
import Button from '@/components/ui/Button';

export default function ProductListPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id;

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 500000]);

  const categories = [
    { name: 'All', count: 13 },
    { name: 'Brand Essentials', count: 3 },
    { name: 'Marketing & Promotional', count: 2 },
    { name: 'Event & Celebration', count: 2 },
    { name: 'Large Format', count: 1 },
    { name: 'Packaging & Labels', count: 1 },
    { name: 'Office & Administrative', count: 1 },
    { name: 'Apparel & Merchandise', count: 1 },
    { name: 'Custom & Specialty', count: 1 },
    { name: 'Educational & Institutional', count: 1 },
    { name: 'Premium Finishing', count: 1 },
  ];

  const products = [
    {
      id: 1,
      name: 'Business Cards',
      description: 'Premium printed cards for professional introductions and networking.',
      price: 800.99,
      category: 'BRAND ESSENTIALS',
      moq: '250 Units',
      format: '85mm x 55mm',
    },
    {
      id: 2,
      name: 'Letterheads',
      description: 'Custom branded letterheads for official documents and corporate communications.',
      price: 800.99,
      category: 'BRAND ESSENTIALS',
      moq: '250 Units',
      format: '85mm x 55mm',
    },
    {
      id: 3,
      name: 'Corporate Folders',
      description: 'Branded folders for proposals, contracts, and company presentations.',
      price: 800.99,
      category: 'BRAND ESSENTIALS',
      moq: '250 Units',
      format: '85mm x 55mm',
    },
  ];

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Studio
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Product Catalog</h1>
          <p className="text-gray-400">Select a foundation for your next masterpiece.</p>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-dark-light rounded-lg p-6 space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-white font-semibold mb-4">PRINT SOLUTIONS</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === cat.name
                          ? 'bg-primary text-white'
                          : 'text-gray-400 hover:bg-dark hover:text-white'
                      }`}
                    >
                      {cat.name} ({cat.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-white font-semibold mb-4">PRICE RANGE</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="500000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>₦0</span>
                    <span>₦500,000</span>
                  </div>
                </div>
              </div>

              {/* Custom Quote */}
              <div className="bg-dark rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">Can't find what you need?</h4>
                <p className="text-gray-400 text-sm mb-4">
                  We offer fully custom solutions for unique requirements.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Custom Quote
                </Button>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => router.push(`/products/${product.id}`)}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
