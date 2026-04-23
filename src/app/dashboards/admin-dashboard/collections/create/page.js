'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';
import { collectionService } from '@/services/collectionService';
import { useAuthCheck } from '@/app/lib/auth';

export default function CreateCollectionPage() {
  const router = useRouter();
  useAuthCheck();

  const [formData, setFormData] = useState({
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Collection name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await collectionService.create({ name: formData.name });
      console.log('Collection created:', response);

      setSuccess(`Collection "${formData.name}" created successfully!`);
      setFormData({ name: '' });

      setTimeout(() => {
        router.push('/dashboards/admin-dashboard/collections');
      }, 2000);
    } catch (err) {
      console.error('Failed to create collection:', err);
      setError(err.message || 'Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout userRole="admin">
      <SEOHead {...METADATA.dashboard.admin} />
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Create New Collection</h1>
          <p className="mt-2 text-sm text-gray-400 sm:text-base">
            Add a new product category to your store
          </p>
        </div>

        <div className="rounded-lg border border-gray-800 bg-slate-900 p-4 sm:p-6">
          {success && (
            <div className="mb-4 rounded-lg border border-green-700 bg-green-900/50 p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-400">{success}</p>
                  <p className="mt-1 text-xs text-green-600/80">
                    Redirecting to collections list...
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-300">
                Collection Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Flyers, Business Cards, Posters"
                className={`w-full rounded-lg border bg-slate-800 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-600 ${
                  success ? 'border-green-700 bg-green-900/20' : 'border-gray-700'
                }`}
                disabled={loading || success}
                required
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                This name will be displayed to customers browsing your products
              </p>
            </div>

            <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading || success}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || success}
                className="w-full sm:w-auto"
              >
                {loading ? 'Creating...' : success ? 'Created!' : 'Create Collection'}
              </Button>
            </div>
          </form>

          {success && (
            <div className="mt-4 flex flex-col gap-3 border-t border-gray-800 pt-4 sm:flex-row">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSuccess('');
                  setFormData({ name: '' });
                }}
                className="w-full sm:w-auto"
              >
                Create Another
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboards/admin-dashboard/collections')}
                className="w-full sm:w-auto"
              >
                View All Collections
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
