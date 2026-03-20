'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';
import { collectionService } from '@/services/collectionService';
import { useAuthCheck } from '@/app/lib/auth';

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id;

  useAuthCheck();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCollection();
  }, [collectionId]);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      const response = await collectionService.getById(collectionId);
      setCollection(response?.collection || response?.data || null);
    } catch (err) {
      console.error(err);
      setError('Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <SEOHead {...METADATA.dashboard.admin} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-white">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <SEOHead {...METADATA.dashboard.admin} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 flex-wrap">
          <Link href="/dashboards/admin-dashboard" className="hover:text-red-400 transition">
            Dashboard
          </Link>
          <span>›</span>
          <Link href="/dashboards/admin-dashboard/collections" className="hover:text-red-400 transition">
            Collections
          </Link>
          <span>›</span>
          <span className="text-white truncate max-w-[200px]">{collection?.name}</span>
        </nav>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="bg-slate-900 rounded-xl border border-gray-800 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl shrink-0">
              📁
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">{collection?.name}</h1>
              <p className="text-gray-400 text-sm sm:text-base mt-1">
                Collection ID: {collectionId}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={`/dashboards/admin-dashboard/collections/${collectionId}/products`}>
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  View Products →
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
          <Link href={`/dashboards/admin-dashboard/collections/${collectionId}/products`}>
            <div className="bg-slate-900 rounded-lg border border-gray-800 p-4 sm:p-6 hover:border-red-600 transition cursor-pointer">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📦</div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Manage Products</h3>
              <p className="text-xs sm:text-sm text-gray-400">View, edit, or add products to this collection</p>
            </div>
          </Link>

          <Link href={`/dashboards/admin-dashboard/products/create?collectionId=${collectionId}`}>
            <div className="bg-slate-900 rounded-lg border border-gray-800 p-4 sm:p-6 hover:border-green-600 transition cursor-pointer">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">➕</div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Add New Product</h3>
              <p className="text-xs sm:text-sm text-gray-400">Create a new product in this collection</p>
            </div>
          </Link>

          <Link href={`/dashboards/admin-dashboard/collections/${collectionId}/edit`}>
            <div className="bg-slate-900 rounded-lg border border-gray-800 p-4 sm:p-6 hover:border-blue-600 transition cursor-pointer">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">✏️</div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Edit Collection</h3>
              <p className="text-xs sm:text-sm text-gray-400">Update collection name or settings</p>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}