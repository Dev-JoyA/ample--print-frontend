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
      router.push(
        `/dashboards/admin-dashboard/collections/${product?.collectionId?._id || product?.collectionId}/products`
      );
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
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="relative text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent sm:h-12 sm:w-12"></div>
              <p className="mt-4 text-sm text-gray-400 sm:text-base">Loading product...</p>
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
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="rounded-lg border border-red-700 bg-red-900/30 p-6 text-center">
              <p className="text-sm text-red-200 sm:text-base">{error || 'Product not found'}</p>
              <Button variant="primary" onClick={() => router.back()} className="mt-4">
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
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-gray-400 sm:gap-2 sm:text-sm">
              <Link href="/dashboards/admin-dashboard" className="hover:text-red-400">
                Dashboard
              </Link>
              <span>›</span>
              <Link href="/dashboards/admin-dashboard/collections" className="hover:text-red-400">
                Collections
              </Link>
              <span>›</span>
              <Link
                href={`/dashboards/admin-dashboard/collections/${collectionId}/products`}
                className="hover:text-red-400"
              >
                {product.collectionId?.name
                  ? product.collectionId.name.length > 20
                    ? `${product.collectionId.name.substring(0, 20)}...`
                    : product.collectionId.name
                  : 'Collection'}
              </Link>
              <span>›</span>
              <span className="max-w-[150px] truncate text-white sm:max-w-[200px]">
                {product.name}
              </span>
            </nav>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="max-w-[250px] truncate text-2xl font-bold text-white sm:max-w-full sm:text-3xl">
                  {product.name}
                </h1>
                <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                  Product ID: {product._id?.slice(-8) || product._id}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/dashboards/admin-dashboard/products/${productId}/edit`}>
                  <Button variant="secondary" className="gap-2 text-sm">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Edit Product
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  className="gap-2 text-sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </Button>
                <Button variant="ghost" className="gap-2 text-sm" onClick={() => router.back()}>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back
                </Button>
              </div>
            </div>

            {showDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-md rounded-xl border border-gray-800 bg-slate-900 p-5 sm:p-6">
                  <h3 className="mb-4 text-lg font-bold text-white sm:text-xl">Confirm Delete</h3>
                  <p className="mb-6 text-sm text-gray-400 sm:text-base">
                    Are you sure you want to delete "{product.name}"? This action cannot be undone.
                  </p>
                  <div className="flex flex-col justify-end gap-3 sm:flex-row">
                    <Button
                      variant="secondary"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDelete} className="w-full sm:w-auto">
                      Delete Permanently
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {showImageModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                onClick={() => setShowImageModal(false)}
              >
                <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="absolute -top-10 right-0 text-white hover:text-gray-300 sm:-top-12"
                  >
                    <svg
                      className="h-6 w-6 sm:h-8 sm:w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  <div className="relative h-[60vh] overflow-hidden rounded-lg bg-slate-900 sm:h-[70vh] md:h-[80vh]">
                    <img
                      src={getImageUrl(images[modalImageIndex])}
                      alt={`${product.name} - Image ${modalImageIndex + 1}`}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setModalImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 sm:left-4 sm:p-2"
                      >
                        <svg
                          className="h-5 w-5 sm:h-6 sm:w-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          setModalImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 sm:right-4 sm:p-2"
                      >
                        <svg
                          className="h-5 w-5 sm:h-6 sm:w-6"
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
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div
                  className="group cursor-pointer overflow-hidden rounded-xl border border-gray-800 bg-slate-900 transition hover:border-red-600"
                  onClick={() => {
                    setModalImageIndex(selectedImage);
                    setShowImageModal(true);
                  }}
                >
                  <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 p-4">
                    {images.length > 0 ? (
                      <img
                        src={getImageUrl(images[selectedImage])}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        style={{ maxHeight: 'calc(100% - 2rem)' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                        }}
                      />
                    ) : (
                      <span className="text-6xl text-gray-700 sm:text-8xl">📦</span>
                    )}
                  </div>
                </div>

                {images.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {images.map((img, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg border-2 bg-slate-800 transition ${
                          selectedImage === index
                            ? 'border-red-600'
                            : 'border-transparent hover:border-gray-600'
                        }`}
                      >
                        <img
                          src={getImageUrl(img)}
                          alt={`Thumbnail ${index + 1}`}
                          className="h-full w-full object-cover"
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
                <div className="rounded-xl border border-gray-800 bg-slate-900 p-5 sm:p-6">
                  <h3 className="mb-4 text-base font-semibold text-white sm:text-lg">
                    Product Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm text-gray-400">Status</span>
                      {product.status === 'active' ? (
                        <span className="inline-block w-fit rounded-full bg-green-600/20 px-3 py-1 text-xs font-medium text-green-400 sm:text-sm">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block w-fit rounded-full bg-red-600/20 px-3 py-1 text-xs font-medium text-red-400 sm:text-sm">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm text-gray-400">Price</span>
                      <span className="text-xl font-bold text-white sm:text-2xl">
                        ₦{product.price?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-sm text-gray-400">Minimum Order</span>
                      <span className="text-sm font-medium text-white sm:text-base">
                        {product.minOrder}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-800 bg-slate-900 p-5 sm:p-6">
                  <h3 className="mb-4 text-base font-semibold text-white sm:text-lg">
                    Specifications
                  </h3>
                  <div className="space-y-3">
                    {product.dimension?.width && product.dimension?.height && (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-gray-400">Dimensions</span>
                        <span className="text-sm text-white sm:text-base">
                          {product.dimension.width} × {product.dimension.height}
                        </span>
                      </div>
                    )}
                    {product.material && (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-gray-400">Material</span>
                        <span className="text-sm text-white sm:text-base">{product.material}</span>
                      </div>
                    )}
                    {product.deliveryDay && (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-gray-400">Delivery Time</span>
                        <span className="text-sm text-white sm:text-base">
                          {product.deliveryDay}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-800 bg-slate-900 p-5 sm:p-6">
                  <h3 className="mb-4 text-base font-semibold text-white sm:text-lg">
                    Description
                  </h3>
                  <p className="min-h-[80px] text-sm leading-relaxed text-gray-300 sm:min-h-[100px] sm:text-base">
                    {product.description || 'No description provided.'}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-800 bg-slate-900 p-5 sm:p-6">
                  <h3 className="mb-4 text-base font-semibold text-white sm:text-lg">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <Link href={`/dashboards/admin-dashboard/products/${productId}/edit`}>
                      <button className="flex w-full items-center gap-3 rounded-lg bg-slate-800 px-4 py-2.5 text-left text-sm text-blue-400 transition hover:bg-slate-700 sm:py-3">
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
                        <span>Edit Product</span>
                      </button>
                    </Link>
                    <Link href={`/dashboards/admin-dashboard/collections/${collectionId}/products`}>
                      <button className="flex w-full items-center gap-3 rounded-lg bg-slate-800 px-4 py-2.5 text-left text-sm text-gray-300 transition hover:bg-slate-700 sm:py-3">
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
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                          />
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
