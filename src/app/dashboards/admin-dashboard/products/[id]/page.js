'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import SEOHead from '@/components/common/SEOHead';
import { productService } from '@/services/productService';
import { useAuthCheck } from '@/app/lib/auth';
import { METADATA } from '@/lib/metadata';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  useAuthCheck();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getById(productId);
      console.log('Product response:', response);
      const productData = response?.product || response?.data || response;
      setProduct(productData);
    } catch (err) {
      console.error('Failed to fetch product:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await productService.delete(productId);
      router.push(`/dashboards/admin-dashboard/collections/${product?.collectionId?._id || product?.collectionId}/products`);
    } catch (err) {
      alert('Failed to delete product: ' + err.message);
    }
  };

  const getAllImages = () => {
    const images = [];
    if (product?.image) images.push(product.image);
    if (product?.images?.length) images.push(...product.images);
    return images;
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
      <>
        <SEOHead {...METADATA.dashboard.admin} />
        <DashboardLayout userRole="admin">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="relative text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-400 mt-4 text-sm sm:text-base">Loading product...</p>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <SEOHead {...METADATA.dashboard.admin} />
        <DashboardLayout userRole="admin">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 text-center">
              <p className="text-red-200 text-sm sm:text-base">{error || 'Product not found'}</p>
              <Button
                variant="primary"
                onClick={() => router.back()}
                className="mt-4"
              >
                Go Back
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  const images = getAllImages();
  const collectionId = product.collectionId?._id || product.collectionId;

  return (
    <>
      <SEOHead {...METADATA.dashboard.admin} />
      <DashboardLayout userRole="admin">
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-400 mb-6 flex-wrap">
              <Link href="/dashboards/admin-dashboard" className="hover:text-red-400">
                Dashboard
              </Link>
              <span>›</span>
              <Link href="/dashboards/admin-dashboard/collections" className="hover:text-red-400">
                Collections
              </Link>
              <span>›</span>
              <Link href={`/dashboards/admin-dashboard/collections/${collectionId}/products`} className="hover:text-red-400">
                {product.collectionId?.name ? (product.collectionId.name.length > 20 ? `${product.collectionId.name.substring(0, 20)}...` : product.collectionId.name) : 'Collection'}
              </Link>
              <span>›</span>
              <span className="text-white truncate max-w-[150px] sm:max-w-[200px]">{product.name}</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white truncate max-w-[250px] sm:max-w-full">{product.name}</h1>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  Product ID: {product._id?.slice(-8) || product._id}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/dashboards/admin-dashboard/products/${productId}/edit`}>
                  <Button variant="secondary" className="gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Product
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  className="gap-2 text-sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  className="gap-2 text-sm"
                  onClick={() => router.back()}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </Button>
              </div>
            </div>

            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 rounded-xl border border-gray-800 p-5 sm:p-6 max-w-md w-full">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Confirm Delete</h3>
                  <p className="text-gray-400 text-sm sm:text-base mb-6">
                    Are you sure you want to delete "{product.name}"? This action cannot be undone.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleDelete}
                      className="w-full sm:w-auto"
                    >
                      Delete Permanently
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {showImageModal && (
              <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setShowImageModal(false)}>
                <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="absolute -top-10 sm:-top-12 right-0 text-white hover:text-gray-300"
                  >
                    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] bg-slate-900 rounded-lg overflow-hidden">
                    <img
                      src={getImageUrl(images[modalImageIndex])}
                      alt={`${product.name} - Image ${modalImageIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setModalImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setModalImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 sm:p-2 rounded-full"
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div
                  className="bg-slate-900 rounded-xl border border-gray-800 overflow-hidden cursor-pointer hover:border-red-600 transition group"
                  onClick={() => {
                    setModalImageIndex(selectedImage);
                    setShowImageModal(true);
                  }}
                >
                  <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center p-4">
                    {images.length > 0 ? (
                      <img
                        src={getImageUrl(images[selectedImage])}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        style={{ maxHeight: 'calc(100% - 2rem)' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                        }}
                      />
                    ) : (
                      <span className="text-6xl sm:text-8xl text-gray-700">📦</span>
                    )}
                  </div>
                </div>

                {images.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {images.map((img, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`relative aspect-square bg-slate-800 rounded-lg overflow-hidden cursor-pointer border-2 transition ${
                          selectedImage === index
                            ? 'border-red-600'
                            : 'border-transparent hover:border-gray-600'
                        }`}
                      >
                        <img
                          src={getImageUrl(img)}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-5 sm:space-y-6">
                <div className="bg-slate-900 rounded-xl border border-gray-800 p-5 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Product Status</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="text-gray-400 text-sm">Status</span>
                      {product.status === 'active' ? (
                        <span className="inline-block w-fit px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-xs sm:text-sm font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block w-fit px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-xs sm:text-sm font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="text-gray-400 text-sm">Price</span>
                      <span className="text-xl sm:text-2xl font-bold text-white">
                        ₦{product.price?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="text-gray-400 text-sm">Minimum Order</span>
                      <span className="text-white font-medium text-sm sm:text-base">{product.minOrder}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-xl border border-gray-800 p-5 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Specifications</h3>
                  <div className="space-y-3">
                    {product.dimension?.width && product.dimension?.height && (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <span className="text-gray-400 text-sm">Dimensions</span>
                        <span className="text-white text-sm sm:text-base">
                          {product.dimension.width} × {product.dimension.height}
                        </span>
                      </div>
                    )}
                    {product.material && (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <span className="text-gray-400 text-sm">Material</span>
                        <span className="text-white text-sm sm:text-base">{product.material}</span>
                      </div>
                    )}
                    {product.deliveryDay && (
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <span className="text-gray-400 text-sm">Delivery Time</span>
                        <span className="text-white text-sm sm:text-base">{product.deliveryDay}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 rounded-xl border border-gray-800 p-5 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Description</h3>
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base min-h-[80px] sm:min-h-[100px]">
                    {product.description || 'No description provided.'}
                  </p>
                </div>

                <div className="bg-slate-900 rounded-xl border border-gray-800 p-5 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Link href={`/dashboards/admin-dashboard/products/${productId}/edit`}>
                      <button className="w-full text-left px-4 py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-blue-400 transition flex items-center gap-3 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>Edit Product</span>
                      </button>
                    </Link>
                    <Link href={`/dashboards/admin-dashboard/collections/${collectionId}/products`}>
                      <button className="w-full text-left px-4 py-2.5 sm:py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-gray-300 transition flex items-center gap-3 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Back to Collection</span>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}