'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';
import { collectionService } from '@/services/collectionService';
import { productService } from '@/services/productService';
import { useAuthCheck } from '@/app/lib/auth';

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id;

  useAuthCheck();

  const [collection, setCollection] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [collectionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [collectionRes, productsRes] = await Promise.all([
        collectionService.getById(collectionId),
        collectionService.getCollectionProducts(collectionId),
      ]);

      setCollection(collectionRes?.collection || collectionRes?.data || null);

      let productsData = [];
      if (productsRes?.products && Array.isArray(productsRes.products)) {
        productsData = productsRes.products;
      } else if (Array.isArray(productsRes)) {
        productsData = productsRes;
      } else if (productsRes?.data && Array.isArray(productsRes.data)) {
        productsData = productsRes.data;
      }
      setProducts(productsData);
    } catch (err) {
      console.error(err);
      setError('Failed to load collection details');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    let filename = imagePath;
    if (imagePath.includes('/')) {
      filename = imagePath.split('/').pop();
    }
    return `http://localhost:4001/api/v1/attachments/download/${filename}`;
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
            <span className="max-w-[200px] truncate text-white sm:max-w-[300px]">
              {collection?.name}
            </span>
          </nav>

          {error && (
            <div className="mb-6 rounded-lg border border-red-700 bg-red-900/30 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="mb-6 rounded-2xl border border-gray-800 bg-slate-900/50 p-6 backdrop-blur-sm sm:mb-8 sm:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600/20 to-purple-600/20 text-4xl sm:h-20 sm:w-20 sm:text-5xl">
                  📁
                </div>
                <div>
                  <h1 className="break-words text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                    {collection?.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-400 sm:gap-4">
                    <span className="flex items-center gap-1">
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
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      {products.length} product{products.length !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
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
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                        />
                      </svg>
                      ID: {collectionId.slice(-8)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href={`/dashboards/admin-dashboard/collections/${collectionId}/edit`}>
                  <Button variant="secondary" size="lg" className="w-full gap-2 sm:w-auto">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Edit Collection
                  </Button>
                </Link>
                <Link
                  href={`/dashboards/admin-dashboard/products/create?collectionId=${collectionId}`}
                >
                  <Button variant="primary" size="lg" className="w-full gap-2 sm:w-auto">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Product
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Products in this Collection
              </h2>
              <Link href={`/dashboards/admin-dashboard/collections/${collectionId}/products`}>
                <Button variant="ghost" size="sm" className="w-full gap-1 sm:w-auto">
                  View All
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Button>
              </Link>
            </div>

            {products.length === 0 ? (
              <div className="rounded-2xl border border-gray-800 bg-slate-900/50 p-12 text-center backdrop-blur-sm sm:p-16">
                <div className="mb-6 text-6xl opacity-50 sm:text-8xl">📦</div>
                <h3 className="mb-3 text-xl font-semibold text-white sm:text-2xl">
                  No products yet
                </h3>
                <p className="mb-6 text-sm text-gray-400 sm:mb-8 sm:text-base">
                  Get started by adding your first product to this collection
                </p>
                <Link
                  href={`/dashboards/admin-dashboard/products/create?collectionId=${collectionId}`}
                >
                  <Button variant="primary" size="lg">
                    Add Your First Product
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                  {products.slice(0, 6).map((product) => (
                    <Link
                      key={product._id}
                      href={`/dashboards/admin-dashboard/products/${product._id}`}
                      className="group cursor-pointer overflow-hidden rounded-xl border border-gray-800 bg-slate-900/50 backdrop-blur-sm transition-all duration-300 hover:border-red-600/50 hover:shadow-xl hover:shadow-red-600/10"
                    >
                      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 sm:h-48">
                        {product.image || product.images?.[0] ? (
                          <div className="flex h-full w-full items-center justify-center bg-gray-800">
                            <img
                              src={getImageUrl(product.image || product.images?.[0])}
                              alt={product.name}
                              className="h-full w-full object-contain p-2"
                              style={{ maxHeight: '160px', maxWidth: '100%' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-5xl text-gray-700 sm:text-6xl">📦</span>
                          </div>
                        )}

                        {product.status === 'inactive' && (
                          <span className="absolute left-3 top-3 rounded-full bg-red-600/90 px-2 py-1 text-xs font-medium text-white">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="p-3 sm:p-4">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="line-clamp-1 text-sm font-semibold text-white transition group-hover:text-red-400 sm:text-base">
                            {product.name}
                          </h3>
                          <span className="whitespace-nowrap text-xs font-bold text-red-400 sm:text-sm">
                            ₦{product.price?.toLocaleString()}
                          </span>
                        </div>

                        <p className="mb-3 line-clamp-2 min-h-[32px] text-xs text-gray-400 sm:min-h-[40px] sm:text-sm">
                          {product.description || 'No description'}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-800 pt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                            Min: {product.minOrder}
                          </span>
                          {product.dimension?.width && product.dimension?.height && (
                            <span className="flex items-center gap-1">
                              <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                                />
                              </svg>
                              {product.dimension.width} × {product.dimension.height}
                            </span>
                          )}
                          <span className="rounded bg-slate-800 px-2 py-1 font-mono text-xs">
                            #{product._id.slice(-4)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {products.length > 6 && (
                  <div className="mt-6 text-center sm:mt-8">
                    <Link href={`/dashboards/admin-dashboard/collections/${collectionId}/products`}>
                      <Button variant="secondary" size="lg" className="w-full gap-2 sm:w-auto">
                        View All {products.length} Products
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
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </Button>
                    </Link>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
                  <div className="rounded-lg border border-gray-800 bg-slate-900/50 p-3 backdrop-blur-sm sm:p-4">
                    <div className="text-xs text-gray-400 sm:text-sm">Total Products</div>
                    <div className="text-xl font-bold text-white sm:text-2xl">
                      {products.length}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-slate-900/50 p-3 backdrop-blur-sm sm:p-4">
                    <div className="text-xs text-gray-400 sm:text-sm">Active Products</div>
                    <div className="text-xl font-bold text-green-400 sm:text-2xl">
                      {products.filter((p) => p.status !== 'inactive').length}
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-slate-900/50 p-3 backdrop-blur-sm sm:p-4">
                    <div className="text-xs text-gray-400 sm:text-sm">Average Price</div>
                    <div className="text-xl font-bold text-blue-400 sm:text-2xl">
                      ₦
                      {products.length > 0
                        ? Math.round(
                            products.reduce((acc, p) => acc + (p.price || 0), 0) / products.length
                          ).toLocaleString()
                        : 0}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
