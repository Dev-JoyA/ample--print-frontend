'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import SEOHead from '@/components/common/SEOHead';
import { productService } from '@/services/productService';
import { collectionService } from '@/services/collectionService';
import { useAuthCheck } from '@/app/lib/auth';
import { METADATA } from '@/lib/metadata';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  useAuthCheck();

  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    collectionId: '',
    name: '',
    description: '',
    price: '',
    dimension: {
      width: '',
      height: '',
    },
    minOrder: '',
    material: '',
    deliveryDay: '',
    status: 'active',
  });

  const [originalProduct, setOriginalProduct] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const collectionsRes = await collectionService.getAll({ limit: 100 });
      let collectionsData = [];
      if (collectionsRes?.collections && Array.isArray(collectionsRes.collections)) {
        collectionsData = collectionsRes.collections;
      } else if (Array.isArray(collectionsRes)) {
        collectionsData = collectionsRes;
      }
      setCollections(collectionsData);

      const productRes = await productService.getById(productId);
      console.log('Product response:', productRes);

      const productData = productRes?.product || productRes?.data || productRes;
      setOriginalProduct(productData);

      setFormData({
        collectionId: productData.collectionId?._id || productData.collectionId || '',
        name: productData.name || '',
        description: productData.description || '',
        price: productData.price?.toString() || '',
        dimension: {
          width: productData.dimension?.width || '',
          height: productData.dimension?.height || '',
        },
        minOrder: productData.minOrder?.toString() || '',
        material: productData.material || '',
        deliveryDay: productData.deliveryDay || '',
        status: productData.status || 'active',
      });

      const images = [];
      if (productData.image) images.push(productData.image);
      if (productData.images?.length) images.push(...productData.images);
      setExistingImages(images);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'width' || name === 'height') {
      setFormData((prev) => ({
        ...prev,
        dimension: {
          ...prev.dimension,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateImage = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      return { valid: false, message: 'Only JPEG, PNG, and WebP images are allowed' };
    }

    if (file.size > maxSize) {
      return { valid: false, message: 'Image size must be less than 5MB' };
    }

    return { valid: true };
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (existingImages.length + imageFiles.length + files.length > 10) {
      alert('Maximum 10 images total allowed');
      return;
    }

    for (const file of files) {
      const validation = validateImage(file);
      if (!validation.valid) {
        setError(validation.message);
        return;
      }
    }

    setImageFiles((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    setError('');
  };

  const removeNewImage = (index) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];

    URL.revokeObjectURL(newPreviews[index]);

    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);

    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const removeExistingImage = (index) => {
    setImagesToRemove((prev) => [...prev, existingImages[index]]);
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const restoreImage = (image) => {
    setImagesToRemove((prev) => prev.filter((img) => img !== image));
    setExistingImages((prev) => [...prev, image]);
  };

  const validateForm = () => {
    if (!formData.collectionId) {
      setError('Please select a collection');
      return false;
    }

    if (!formData.name.trim()) {
      setError('Product name is required');
      return false;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Please enter a valid price');
      return false;
    }

    if (!formData.minOrder || parseInt(formData.minOrder) < 1) {
      setError('Minimum order quantity must be at least 1');
      return false;
    }

    return true;
  };

  const hasChanges = () => {
    if (!originalProduct) return false;

    if (
      formData.collectionId !== (originalProduct.collectionId?._id || originalProduct.collectionId)
    )
      return true;
    if (formData.name !== originalProduct.name) return true;
    if (formData.description !== originalProduct.description) return true;
    if (parseFloat(formData.price) !== originalProduct.price) return true;
    if (parseInt(formData.minOrder) !== originalProduct.minOrder) return true;
    if (formData.material !== originalProduct.material) return true;
    if (formData.deliveryDay !== originalProduct.deliveryDay) return true;
    if (formData.status !== originalProduct.status) return true;
    if (formData.dimension.width !== originalProduct.dimension?.width) return true;
    if (formData.dimension.height !== originalProduct.dimension?.height) return true;
    if (imageFiles.length > 0) return true;
    if (imagesToRemove.length > 0) return true;

    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!hasChanges()) {
      setError('No changes made to product');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        dimension: {
          width: formData.dimension.width?.trim() || '',
          height: formData.dimension.height?.trim() || '',
        },
        minOrder: parseInt(formData.minOrder),
        material: formData.material?.trim() || '',
        deliveryDay: formData.deliveryDay?.trim() || '',
        status: formData.status,
        collectionId: formData.collectionId,
      };

      const formDataObj = new FormData();
      formDataObj.append('productData', JSON.stringify(productData));

      imageFiles.forEach((file) => {
        formDataObj.append('images', file);
      });

      if (imagesToRemove.length > 0) {
        formDataObj.append('imagesToRemove', JSON.stringify(imagesToRemove));
      }

      console.log('Updating product:', productId);
      const response = await productService.update(productId, formDataObj);
      console.log('Product updated:', response);

      setSuccess('Product updated successfully!');

      setTimeout(() => {
        router.push(`/dashboards/admin-dashboard/products/${productId}`);
      }, 1500);
    } catch (err) {
      console.error('Failed to update product:', err);
      setError(err.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-image.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads')) return `http://localhost:4001${imagePath}`;
    return `http://localhost:4001/uploads/${imagePath}`;
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

  return (
    <>
      <SEOHead {...METADATA.dashboard.admin} />
      <DashboardLayout userRole="admin">
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
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
                href={`/dashboards/admin-dashboard/collections/${formData.collectionId}/products`}
                className="hover:text-red-400"
              >
                Products
              </Link>
              <span>›</span>
              <Link
                href={`/dashboards/admin-dashboard/products/${productId}`}
                className="hover:text-red-400"
              >
                {originalProduct?.name?.length > 20
                  ? `${originalProduct.name.substring(0, 20)}...`
                  : originalProduct?.name}
              </Link>
              <span>›</span>
              <span className="text-white">Edit</span>
            </nav>

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">Edit Product</h1>
                <p className="mt-1 text-sm text-gray-400 sm:text-base">
                  Update product information
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/dashboards/admin-dashboard/products/${productId}`}>
                  <Button variant="secondary" className="text-sm">
                    Cancel
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={saving || !hasChanges()}
                  className="text-sm"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
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

            <div className="mb-6 border-b border-gray-800">
              <nav className="flex gap-4 sm:gap-6">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`border-b-2 px-1 pb-4 text-xs font-medium transition sm:text-sm ${
                    activeTab === 'basic'
                      ? 'border-red-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Basic Information
                </button>
                <button
                  onClick={() => setActiveTab('images')}
                  className={`border-b-2 px-1 pb-4 text-xs font-medium transition sm:text-sm ${
                    activeTab === 'images'
                      ? 'border-red-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Images ({existingImages.length + imageFiles.length}/10)
                </button>
              </nav>
            </div>

            <form onSubmit={handleSubmit}>
              {activeTab === 'basic' && (
                <div className="space-y-5 rounded-xl border border-gray-800 bg-slate-900 p-5 sm:space-y-6 sm:p-6">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                      Collection <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="collectionId"
                      value={formData.collectionId}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:px-4"
                      required
                      disabled={saving}
                    >
                      <option value="">Select a collection</option>
                      {collections.map((col) => (
                        <option key={col._id} value={col._id}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., A5 Flyer"
                      className="w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:px-4"
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                        Price (₦) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className="w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:px-4"
                        required
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                        Minimum Order <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="minOrder"
                        value={formData.minOrder}
                        onChange={handleChange}
                        placeholder="100"
                        min="1"
                        className="w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:px-4"
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                      Dimensions (optional)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="width"
                        value={formData.dimension.width}
                        onChange={handleChange}
                        placeholder="Width (e.g., 100mm)"
                        className="w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:px-4"
                        disabled={saving}
                      />
                      <input
                        type="text"
                        name="height"
                        value={formData.dimension.height}
                        onChange={handleChange}
                        placeholder="Height (e.g., 150mm)"
                        className="w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:px-4"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                        Material (optional)
                      </label>
                      <input
                        type="text"
                        name="material"
                        value={formData.material}
                        onChange={handleChange}
                        placeholder="e.g., Glossy paper"
                        className="w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:px-4"
                        disabled={saving}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                        Delivery Time (optional)
                      </label>
                      <input
                        type="text"
                        name="deliveryDay"
                        value={formData.deliveryDay}
                        onChange={handleChange}
                        placeholder="e.g., 3-5 business days"
                        className="w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:px-4"
                        disabled={saving}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:px-4"
                      disabled={saving}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                      Description (optional)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Describe the product..."
                      className="w-full rounded-lg border border-gray-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 sm:px-4"
                      disabled={saving}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'images' && (
                <div className="space-y-5 rounded-xl border border-gray-800 bg-slate-900 p-5 sm:space-y-6 sm:p-6">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                      Add New Images
                    </label>
                    <div className="rounded-lg border-2 border-dashed border-gray-700 p-4 text-center transition hover:border-red-600 sm:p-6">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                        disabled={saving || existingImages.length + imageFiles.length >= 10}
                      />
                      <label
                        htmlFor="image-upload"
                        className={`inline-flex cursor-pointer flex-col items-center ${
                          existingImages.length + imageFiles.length >= 10
                            ? 'cursor-not-allowed opacity-50'
                            : ''
                        }`}
                      >
                        <svg
                          className="mb-3 h-10 w-10 text-gray-500 sm:h-12 sm:w-12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-sm font-medium text-gray-300">
                          Click to upload images
                        </span>
                        <span className="mt-1 text-xs text-gray-500">
                          JPEG, PNG, WebP up to 5MB each
                        </span>
                      </label>
                    </div>
                  </div>

                  {existingImages.length > 0 && (
                    <div>
                      <label className="mb-3 block text-xs font-medium text-gray-300 sm:text-sm">
                        Current Images
                      </label>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                        {existingImages.map((img, index) => (
                          <div key={index} className="group relative">
                            <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-700">
                              <img
                                src={getImageUrl(img)}
                                alt={`Product ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeExistingImage(index)}
                                className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white opacity-0 transition group-hover:opacity-100"
                              >
                                <svg
                                  className="h-3 w-3 sm:h-4 sm:w-4"
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
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {imagePreviews.length > 0 && (
                    <div>
                      <label className="mb-3 block text-xs font-medium text-gray-300 sm:text-sm">
                        New Images to Upload
                      </label>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="group relative">
                            <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-700">
                              <img
                                src={preview}
                                alt={`New ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeNewImage(index)}
                                className="absolute right-2 top-2 rounded-full bg-red-600 p-1 text-white opacity-0 transition group-hover:opacity-100"
                              >
                                <svg
                                  className="h-3 w-3 sm:h-4 sm:w-4"
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
                            </div>
                            <p className="mt-1 truncate text-xs text-gray-500">
                              {imageFiles[index]?.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {imagesToRemove.length > 0 && (
                    <div className="rounded-lg border border-red-800 bg-red-900/20 p-4">
                      <h4 className="mb-2 text-xs font-medium text-red-400 sm:text-sm">
                        Images to Remove
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {imagesToRemove.map((img, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 rounded-full bg-red-900/30 px-2 py-1 sm:px-3"
                          >
                            <span className="text-xs text-red-300">Image {index + 1}</span>
                            <button
                              type="button"
                              onClick={() => restoreImage(img)}
                              className="text-red-400 hover:text-red-300"
                            >
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-col justify-end gap-3 border-t border-gray-800 pt-4 sm:flex-row">
                <Link href={`/dashboards/admin-dashboard/products/${productId}`}>
                  <Button
                    variant="secondary"
                    disabled={saving}
                    className="w-full text-sm sm:w-auto"
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving || !hasChanges()}
                  className="w-full text-sm sm:w-auto"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
