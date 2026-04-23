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

export default function EditCollectionPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id;

  useAuthCheck();

  const [collection, setCollection] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCollection();
  }, [collectionId]);

  const fetchCollection = async () => {
    try {
      setLoading(true);
      const response = await collectionService.getById(collectionId);
      console.log('Collection response:', response);

      const collectionData = response?.collection || response?.data || response;
      setCollection(collectionData);
      setName(collectionData?.name || '');
    } catch (err) {
      console.error('Failed to fetch collection:', err);
      setError('Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Collection name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await collectionService.update(collectionId, { name: name.trim() });
      console.log('Collection updated:', response);

      setSuccess('Collection updated successfully!');

      setTimeout(() => {
        router.push(`/dashboards/admin-dashboard/collections/${collectionId}`);
      }, 1500);
    } catch (err) {
      console.error('Failed to update collection:', err);
      setError(err.message || 'Failed to update collection');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <SEOHead {...METADATA.dashboard.admin} />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Loading collection...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <SEOHead {...METADATA.dashboard.admin} />
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
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
            <Link
              href={`/dashboards/admin-dashboard/collections/${collectionId}`}
              className="max-w-[120px] truncate transition hover:text-red-400 sm:max-w-[200px]"
            >
              {collection?.name}
            </Link>
            <span>›</span>
            <span className="text-white">Edit</span>
          </nav>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Edit Collection</h1>
              <p className="mt-1 text-sm text-gray-400 sm:text-base">Update collection name</p>
            </div>
            <Link href={`/dashboards/admin-dashboard/collections/${collectionId}`}>
              <Button variant="secondary" className="w-full sm:w-auto">
                Cancel
              </Button>
            </Link>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-green-700 bg-green-900/50 p-3 text-sm text-green-200">
              {success}
            </div>
          )}

          <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-4 backdrop-blur-sm sm:p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-300">
                  Collection Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Flyers, Business Cards, Posters"
                  className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 sm:py-3"
                  disabled={saving}
                  required
                  autoFocus
                />
                <p className="mt-2 text-xs text-gray-500">
                  This name will be displayed to customers browsing your products
                </p>
              </div>

              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <Link
                  href={`/dashboards/admin-dashboard/collections/${collectionId}`}
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="secondary"
                    type="button"
                    disabled={saving}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving || !name.trim() || name === collection?.name}
                  className="w-full sm:w-auto"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>

          <div className="mt-6 rounded-lg border border-gray-800 bg-slate-900/30 p-4">
            <h3 className="mb-2 text-sm font-medium text-gray-400">Collection Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-0">
                <span className="text-gray-500">Collection ID</span>
                <span className="break-all font-mono text-xs text-gray-300 sm:text-sm">
                  {collectionId}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-0">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-300">
                  {collection?.createdAt
                    ? new Date(collection.createdAt).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-0">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-gray-300">
                  {collection?.updatedAt
                    ? new Date(collection.updatedAt).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
