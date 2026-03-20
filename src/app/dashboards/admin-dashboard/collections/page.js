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
    if (confirm(`Are you sure you want to delete "${name}"? This will also delete all products in this collection.`)) {
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

  const filteredCollections = collections.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && collections.length === 0) {
    return (
      <DashboardLayout userRole="admin">
        <SEOHead {...METADATA.dashboard.admin} />
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-white">Loading collections...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <SEOHead {...METADATA.dashboard.admin} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Collections</h1>
            <p className="text-gray-400 text-sm sm:text-base mt-1 sm:mt-2">Manage your product categories</p>
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
              className="w-full bg-slate-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
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
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {filteredCollections.length === 0 ? (
          <div className="bg-slate-900 rounded-lg border border-gray-800 p-8 sm:p-12 text-center">
            <div className="text-5xl sm:text-6xl mb-4">📁</div>
            <h3 className="text-lg sm:text-xl font-medium text-white mb-2">
              {searchTerm ? 'No matching collections' : 'No collections yet'}
            </h3>
            <p className="text-gray-400 text-sm sm:text-base mb-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCollections.map((collection) => (
              <div
                key={collection._id}
                className="bg-slate-900 rounded-lg border border-gray-800 overflow-hidden hover:shadow-xl transition-all duration-300 group"
              >
                {editingCollection?._id === collection._id ? (
                  <div className="p-4 sm:p-6">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-slate-800 border border-gray-700 rounded-lg px-3 py-2 text-white mb-3 focus:outline-none focus:ring-2 focus:ring-red-600"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdate}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCollection(null)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-600/20 to-purple-600/20 rounded-lg flex items-center justify-center text-2xl sm:text-3xl shrink-0">
                            📁
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-red-400 transition break-words">
                              {collection.name}
                            </h3>
                            <p className="text-xs text-gray-500">
                              ID: {collection._id.slice(-6)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                          <button
                            onClick={() => handleEdit(collection)}
                            className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-blue-400 transition"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(collection._id, collection.name)}
                            className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-red-400 transition"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-800">
                        <Link
                          href={`/dashboards/admin-dashboard/collections/${collection._id}/products`}
                          className="text-sm text-red-500 hover:text-red-400 font-medium flex items-center gap-1 justify-center sm:justify-start"
                        >
                          View Products
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                        <Link
                          href={`/dashboards/admin-dashboard/products/create?collectionId=${collection._id}`}
                          className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1 justify-center sm:justify-start"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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