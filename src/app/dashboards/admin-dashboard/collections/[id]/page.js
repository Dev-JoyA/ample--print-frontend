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
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <SEOHead {...METADATA.dashboard.admin} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs text-gray-400 sm:mb-6 sm:text-sm">
          <Link href="/dashboards/admin-dashboard" className="transition hover:text-red-400">
            Dashboard
          </Link>
          <span>›</span>
          <Link
            href="/dashboards/admin-dashboard/collections"
            className="transition hover:text-red-400"
          >
            Collections
          </Link>
          <span>›</span>
          <span className="max-w-[200px] truncate text-white">{collection?.name}</span>
        </nav>

        {error && (
          <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-gray-800 bg-slate-900 p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600/20 to-purple-600/20 text-4xl sm:h-20 sm:w-20 sm:text-5xl">
              📁
            </div>
            <div className="flex-1">
              <h1 className="break-words text-2xl font-bold text-white sm:text-3xl">
                {collection?.name}
              </h1>
              <p className="mt-1 text-sm text-gray-400 sm:text-base">
                Collection ID: {collectionId}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={`/dashboards/admin-dashboard/collections/${collectionId}/products`}>
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  View Products →
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:gap-6 md:grid-cols-3">
          <Link href={`/dashboards/admin-dashboard/collections/${collectionId}/products`}>
            <div className="cursor-pointer rounded-lg border border-gray-800 bg-slate-900 p-4 transition hover:border-red-600 sm:p-6">
              <div className="mb-3 text-3xl sm:mb-4 sm:text-4xl">📦</div>
              <h3 className="mb-2 text-lg font-bold text-white sm:text-xl">Manage Products</h3>
              <p className="text-xs text-gray-400 sm:text-sm">
                View, edit, or add products to this collection
              </p>
            </div>
          </Link>

          <Link href={`/dashboards/admin-dashboard/products/create?collectionId=${collectionId}`}>
            <div className="cursor-pointer rounded-lg border border-gray-800 bg-slate-900 p-4 transition hover:border-green-600 sm:p-6">
              <div className="mb-3 text-3xl sm:mb-4 sm:text-4xl">➕</div>
              <h3 className="mb-2 text-lg font-bold text-white sm:text-xl">Add New Product</h3>
              <p className="text-xs text-gray-400 sm:text-sm">
                Create a new product in this collection
              </p>
            </div>
          </Link>

          <Link href={`/dashboards/admin-dashboard/collections/${collectionId}/edit`}>
            <div className="cursor-pointer rounded-lg border border-gray-800 bg-slate-900 p-4 transition hover:border-blue-600 sm:p-6">
              <div className="mb-3 text-3xl sm:mb-4 sm:text-4xl">✏️</div>
              <h3 className="mb-2 text-lg font-bold text-white sm:text-xl">Edit Collection</h3>
              <p className="text-xs text-gray-400 sm:text-sm">Update collection name or settings</p>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
