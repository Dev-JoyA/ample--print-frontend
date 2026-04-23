'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';
import { collectionService } from '@/services/collectionService';
import { useAuthCheck } from '@/app/lib/auth';

export default function CollectionsPage() {
  const router = useRouter();
  useAuthCheck();

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCollection, setEditingCollection] = useState(null);
  const [editName, setEditName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

      setCollections(collectionsData);
    } catch (err) {
      console.error('Failed to fetch collections:', err);
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (collection) => {
    setEditingCollection(collection);
    setEditName(collection.name);
  };

  const handleUpdate = async () => {
    if (!editName.trim()) {
      alert('Collection name cannot be empty');
      return;
    }

    try {
      setLoading(true);
      await collectionService.update(editingCollection._id, { name: editName });
      setEditingCollection(null);
      fetchCollections();
    } catch (err) {
      alert('Failed to update collection: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (
      confirm(
        `Are you sure you want to delete "${name}"? This will also delete all products in this collection.`
      )
    ) {
      try {
        setLoading(true);
        await collectionService.delete(id);
        fetchCollections();
      } catch (err) {
        alert('Failed to delete collection: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && collections.length === 0) {
    return (
      <DashboardLayout userRole="admin">
        <SEOHead {...METADATA.dashboard.admin} />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-white">Loading collections...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <SEOHead {...METADATA.dashboard.admin} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Collections</h1>
            <p className="mt-1 text-sm text-gray-400 sm:mt-2 sm:text-base">
              Manage your product categories
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboards/admin-dashboard/collections/create">
              <Button variant="primary" icon="+" className="w-full sm:w-auto">
                New Collection
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-800 bg-slate-900 py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 sm:py-3"
            />
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {filteredCollections.length === 0 ? (
          <div className="rounded-lg border border-gray-800 bg-slate-900 p-8 text-center sm:p-12">
            <div className="mb-4 text-5xl sm:text-6xl">📁</div>
            <h3 className="mb-2 text-lg font-medium text-white sm:text-xl">
              {searchTerm ? 'No matching collections' : 'No collections yet'}
            </h3>
            <p className="mb-6 text-sm text-gray-400 sm:text-base">
              {searchTerm
                ? 'Try a different search term'
                : 'Create your first collection to start adding products'}
            </p>
            {!searchTerm && (
              <Link href="/dashboards/admin-dashboard/collections/create">
                <Button variant="primary">Create Collection</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {filteredCollections.map((collection) => (
              <div
                key={collection._id}
                className="group overflow-hidden rounded-lg border border-gray-800 bg-slate-900 transition-all duration-300 hover:shadow-xl"
              >
                {editingCollection?._id === collection._id ? (
                  <div className="p-4 sm:p-6">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mb-3 w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdate}
                        className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCollection(null)}
                        className="flex-1 rounded-lg bg-gray-700 py-2 text-sm font-medium text-white transition hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 sm:p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-red-600/20 to-purple-600/20 text-2xl sm:h-12 sm:w-12 sm:text-3xl">
                            📁
                          </div>
                          <div>
                            <h3 className="break-words text-base font-semibold text-white transition group-hover:text-red-400 sm:text-lg">
                              {collection.name}
                            </h3>
                            <p className="text-xs text-gray-500">ID: {collection._id.slice(-6)}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                          <button
                            onClick={() => handleEdit(collection)}
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-slate-800 hover:text-blue-400 sm:p-2"
                            title="Edit"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(collection._id, collection.name)}
                            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-slate-800 hover:text-red-400 sm:p-2"
                            title="Delete"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col justify-between gap-3 border-t border-gray-800 pt-3 sm:mt-6 sm:flex-row sm:items-center sm:pt-4">
                        <Link
                          href={`/dashboards/admin-dashboard/collections/${collection._id}/products`}
                          className="flex items-center justify-center gap-1 text-sm font-medium text-red-500 hover:text-red-400 sm:justify-start"
                        >
                          View Products
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                        <Link
                          href={`/dashboards/admin-dashboard/products/create?collectionId=${collection._id}`}
                          className="flex items-center justify-center gap-1 text-sm text-gray-400 hover:text-gray-300 sm:justify-start"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          Add Product
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
