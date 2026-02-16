'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import CollectionCard from '@/components/cards/CollectionCard';
import Button from '@/components/ui/Button';

export default function CollectionsPage() {
  const [collections] = useState([
    { id: 1, name: 'Brand Essentials', image: '/images/collection/nylons/1.jpg', productCount: 3 },
    { id: 2, name: 'Marketing & Promotional', image: '/images/collection/paperbags/bagpp.webp', productCount: 2 },
    { id: 3, name: 'Event & Celebration', image: null, productCount: 2 },
    { id: 4, name: 'Large Format', image: null, productCount: 1 },
    { id: 5, name: 'Packaging & Labels', image: null, productCount: 1 },
    { id: 6, name: 'Office & Administrative', image: null, productCount: 1 },
    { id: 7, name: 'Apparel & Merchandise', image: null, productCount: 1 },
    { id: 8, name: 'Custom & Specialty', image: null, productCount: 1 },
    { id: 9, name: 'Educational & Institutional', image: null, productCount: 1 },
    { id: 10, name: 'Premium Finishing', image: null, productCount: 1 },
  ]);

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Product Catalog</h1>
          <p className="text-gray-400">Select a foundation for your next masterpiece.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collections.map((collection) => (
            <Link key={collection.id} href={`/collections/${collection.id}/products`}>
              <CollectionCard collection={collection} />
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
