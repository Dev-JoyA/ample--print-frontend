'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import { collectionService } from '@/services/collectionService';
import { productService } from '@/services/productService';
import { useAuthCheck } from '@/app/lib/auth';

export default function CollectionDetailPage() {
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
        collectionService.getCollectionProducts(collectionId)
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
    
    // If it's already a full URL
    if (imagePath.startsWith('http')) return imagePath;
    
    // Extract just the filename from the path
    let filename = imagePath;
    
    // If it's a full path like /uploads/filename.jpg or uploads/filename.jpg
    if (imagePath.includes('/')) {
      filename = imagePath.split('/').pop();
    }
    
    // Construct the URL using your download endpoint
    return `http://localhost:4001/api/v1/attachments/download/${filename}`;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Loading collection...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 flex-wrap">
            <Link href="/dashboards/admin-dashboard" className="hover:text-red-400">
              Dashboard
            </Link>
            <span>›</span>
            <Link href="/dashboards/admin-dashboard/collections" className="hover:text-red-400">
              Collections
            </Link>
            <span>›</span>
            <span className="text-white truncate max-w-[300px]">{collection?.name}</span>
          </nav>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* Collection Header */}
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-red-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center text-5xl">
                  📁
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">{collection?.name}</h1>
                  <div className="flex items-center gap-4 mt-2 text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      {products.length} product{products.length !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l5 5a2 2 0 01.586 1.414V19a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                      </svg>
                      ID: {collectionId.slice(-8)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Link href={`/dashboards/admin-dashboard/collections/${collectionId}/edit`}>
                  <Button variant="secondary" size="lg" className="gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Collection
                  </Button>
                </Link>
                <Link href={`/dashboards/admin-dashboard/products/create?collectionId=${collectionId}`}>
                  <Button variant="primary" size="lg" className="gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Product
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Products in this Collection</h2>
              <Link href={`/dashboards/admin-dashboard/collections/${collectionId}/products`}>
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </Link>
            </div>

            {products.length === 0 ? (
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-16 text-center">
                <div className="text-8xl mb-6 opacity-50">📦</div>
                <h3 className="text-2xl font-semibold text-white mb-3">No products yet</h3>
                <p className="text-gray-400 mb-8">Get started by adding your first product to this collection</p>
                <Link href={`/dashboards/admin-dashboard/products/create?collectionId=${collectionId}`}>
                  <Button variant="primary" size="lg">
                    Add Your First Product
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Product Grid Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.slice(0, 6).map(product => (
                    <Link
                      key={product._id}
                      href={`/dashboards/admin-dashboard/products/${product._id}`}
                      className="group bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden hover:border-red-600/50 hover:shadow-xl hover:shadow-red-600/10 transition-all duration-300 cursor-pointer"
                    >
                      <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                        {product.image || product.images?.[0] ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <img
                              src={getImageUrl(product.image || product.images?.[0])}
                              alt={product.name}
                              className="w-full h-full object-contain p-2"
                              style={{ maxHeight: '192px', maxWidth: '100%' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                                e.target.className = 'w-full h-full object-contain p-2';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <span className="text-6xl text-gray-700">📦</span>
                          </div>
                        )}
                        
                        {product.status === 'inactive' && (
                          <span className="absolute top-3 left-3 px-2 py-1 bg-red-600/90 text-white text-xs font-medium rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white group-hover:text-red-400 transition line-clamp-1 flex-1">
                            {product.name}
                          </h3>
                          <span className="text-sm font-bold text-red-400 ml-2 whitespace-nowrap">
                            ₦{product.price?.toLocaleString()}
                          </span>
                        </div>

                        <p className="text-sm text-gray-400 line-clamp-2 mb-3 min-h-[40px]">
                          {product.description || 'No description'}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-800 pt-3">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Min: {product.minOrder}
                          </span>
                          {product.dimension?.width && product.dimension?.height && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                              </svg>
                              {product.dimension.width} × {product.dimension.height}
                            </span>
                          )}
                          <span className="font-mono bg-slate-800 px-2 py-1 rounded">
                            #{product._id.slice(-4)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* View All Link */}
                {products.length > 6 && (
                  <div className="text-center mt-8">
                    <Link href={`/dashboards/admin-dashboard/collections/${collectionId}/products`}>
                      <Button variant="secondary" size="lg" className="gap-2">
                        View All {products.length} Products
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                  <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-gray-800 p-4">
                    <div className="text-sm text-gray-400">Total Products</div>
                    <div className="text-2xl font-bold text-white">{products.length}</div>
                  </div>
                  <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-gray-800 p-4">
                    <div className="text-sm text-gray-400">Active Products</div>
                    <div className="text-2xl font-bold text-green-400">
                      {products.filter(p => p.status !== 'inactive').length}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg border border-gray-800 p-4">
                    <div className="text-sm text-gray-400">Average Price</div>
                    <div className="text-2xl font-bold text-blue-400">
                      ₦{products.length > 0 
                        ? Math.round(products.reduce((acc, p) => acc + (p.price || 0), 0) / products.length).toLocaleString()
                        : 0
                      }
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