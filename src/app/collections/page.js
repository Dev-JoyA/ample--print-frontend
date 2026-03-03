'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import CollectionCard from '@/components/cards/CollectionCard';
import Button from '@/components/ui/Button';
import { collectionService } from '@/services/collectionService';

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await collectionService.getAll({ limit: 100 });
      
      let collectionsData = [];
      if (response?.collections && Array.isArray(response.collections)) {
        collectionsData = response.collections;
      } else if (Array.isArray(response)) {
        collectionsData = response;
      } else if (response?.data?.collections) {
        collectionsData = response.data.collections;
      }

      // For each collection, fetch its products to get count and thumbnail
      const collectionsWithDetails = await Promise.all(
        collectionsData.map(async (collection) => {
          try {
            const productsRes = await collectionService.getCollectionProducts(collection._id);
            let products = [];
            if (productsRes?.products && Array.isArray(productsRes.products)) {
              products = productsRes.products;
            } else if (Array.isArray(productsRes)) {
              products = productsRes;
            } else if (productsRes?.data && Array.isArray(productsRes.data)) {
              products = productsRes.data;
            }

            // Get the first product's image as thumbnail
            let thumbnail = null;
            if (products[0]?.image) {
              thumbnail = products[0].image;
            } else if (products[0]?.images?.[0]) {
              thumbnail = products[0].images[0];
            }

            // Format image URL
            if (thumbnail) {
              if (!thumbnail.startsWith('http')) {
                let filename = thumbnail;
                if (thumbnail.includes('/')) {
                  filename = thumbnail.split('/').pop();
                }
                thumbnail = `http://localhost:4001/api/v1/attachments/download/${filename}`;
              }
            }

            return {
              id: collection._id,
              name: collection.name,
              image: thumbnail,
              productCount: products.length
            };
          } catch (err) {
            console.error(`Failed to fetch products for collection ${collection._id}:`, err);
            return {
              id: collection._id,
              name: collection.name,
              image: null,
              productCount: 0
            };
          }
        })
      );

      setCollections(collectionsWithDetails);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Collection Catalog</h1>
            <p className="text-gray-400">Loading collections...</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {[1,2,3,4,5,6,7,8,9,10].map((i) => (
              <div key={i} className="bg-slate-800/50 rounded-lg h-64 animate-pulse"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Collection Catalog</h1>
            <p className="text-red-400">{error}</p>
          </div>
          <Button onClick={fetchCollections} variant="primary">
            Try Again
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Collection Catalog</h1>
          <p className="text-gray-400">Select a foundation for your next masterpiece.</p>
        </div>

        {collections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No collections available yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {collections.map((collection) => (
              <Link key={collection.id} href={`/collections/${collection.id}/products`}>
                <CollectionCard collection={collection} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}