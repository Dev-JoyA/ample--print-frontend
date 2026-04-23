'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import SEOHead from '@/components/common/SEOHead';
import { productService } from '@/services/productService';
import { collectionService } from '@/services/collectionService';
import { useAuthCheck } from '@/app/lib/auth';
import { METADATA } from '@/lib/metadata';

function CreateProductPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCollectionId = searchParams.get('collectionId');

  useAuthCheck();

  const [collections, setCollections] = useState([]);
  const [formData, setFormData] = useState({
    collectionId: preselectedCollectionId || '',
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

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCollections, setFetchingCollections] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchCollections();
    return () => {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, []);

  const fetchCollections = async () => {
    try {
      setFetchingCollections(true);
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
      setFetchingCollections(false);
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
    const newFiles = Array.from(e.target.files);

    if (imageFiles.length + newFiles.length > 3) {
      alert(
        `You can only upload a maximum of 3 images. You already have ${imageFiles.length} image(s).`
      );
      return;
    }

    for (const file of newFiles) {
      const validation = validateImage(file);
      if (!validation.valid) {
        setError(validation.message);
        return;
      }
    }

    const updatedFiles = [...imageFiles, ...newFiles];
    setImageFiles(updatedFiles);

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);

    setError('');
    e.target.value = '';
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
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
    if (!formData.price || formData.price <= 0) {
      setError('Please enter a valid price');
      return false;
    }
    if (!formData.minOrder || formData.minOrder < 1) {
      setError('Minimum order quantity must be at least 1');
      return false;
    }
    if (!formData.deliveryDay.trim()) {
      setError('Delivery day is required');
      return false;
    }
    if (imageFiles.length === 0) {
      setError('Please upload at least one product image');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setUploadProgress(0);

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
      };

      const formDataObj = new FormData();
      formDataObj.append('productData', JSON.stringify(productData));

      imageFiles.forEach((file) => {
        formDataObj.append('images', file);
      });

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await productService.create(formData.collectionId, formDataObj);

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('Product created:', response);
      setSuccess(`Product "${formData.name}" created successfully!`);

      setFormData({
        collectionId: preselectedCollectionId || '',
        name: '',
        description: '',
        price: '',
        dimension: { width: '', height: '' },
        minOrder: '',
        material: '',
        deliveryDay: '',
        status: 'active',
      });

      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      setImageFiles([]);
      setImagePreviews([]);

      setTimeout(() => {
        router.push(`/dashboards/admin-dashboard/collections/${formData.collectionId}/products`);
      }, 2000);
    } catch (err) {
      console.error('Failed to create product:', err);
      setError(err.message || 'Failed to create product');
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingCollections) {
    return (
      <>
        <SEOHead {...METADATA.dashboard.admin} />
        <DashboardLayout userRole="admin">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="relative text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent sm:h-12 sm:w-12"></div>
              <p className="mt-4 text-sm text-gray-400 sm:text-base">Loading collections...</p>
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
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Create New Product</h1>
            <p className="mt-2 text-sm text-gray-400 sm:text-base">
              Add a new product to your collection
            </p>
          </div>

          <div className="rounded-lg border border-gray-800 bg-slate-900 p-5 sm:p-6">
            {success && (
              <div className="mb-4 rounded-lg border border-green-700 bg-green-900/50 p-4">
                <div className="flex items-center gap-3">
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
                      Redirecting to products list...
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

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mb-4">
                <div className="mb-1 flex justify-between text-xs text-gray-400">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-red-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                    Collection <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="collectionId"
                    value={formData.collectionId}
                    onChange={handleChange}
                    className={`w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 sm:px-4 ${
                      success ? 'border-green-700' : 'border-gray-700'
                    }`}
                    required
                    disabled={loading || success || collections.length === 0}
                  >
                    <option value="">Select a collection</option>
                    {collections.map((col) => (
                      <option key={col._id} value={col._id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                  {collections.length === 0 && (
                    <p className="mt-1 text-xs text-yellow-500">
                      No collections found. Please create a collection first.
                    </p>
                  )}
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
                    className={`w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 sm:px-4 ${
                      success ? 'border-green-700' : 'border-gray-700'
                    }`}
                    required
                    disabled={loading || success}
                  />
                </div>

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
                    className={`w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 sm:px-4 ${
                      success ? 'border-green-700' : 'border-gray-700'
                    }`}
                    required
                    disabled={loading || success}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                    Width (optional)
                  </label>
                  <input
                    type="text"
                    name="width"
                    value={formData.dimension.width}
                    onChange={handleChange}
                    placeholder="e.g., 100mm"
                    className={`w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 sm:px-4 ${
                      success ? 'border-green-700' : 'border-gray-700'
                    }`}
                    disabled={loading || success}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                    Height (optional)
                  </label>
                  <input
                    type="text"
                    name="height"
                    value={formData.dimension.height}
                    onChange={handleChange}
                    placeholder="e.g., 150mm"
                    className={`w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 sm:px-4 ${
                      success ? 'border-green-700' : 'border-gray-700'
                    }`}
                    disabled={loading || success}
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
                    className={`w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 sm:px-4 ${
                      success ? 'border-green-700' : 'border-gray-700'
                    }`}
                    required
                    disabled={loading || success}
                  />
                </div>

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
                    className={`w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 sm:px-4 ${
                      success ? 'border-green-700' : 'border-gray-700'
                    }`}
                    disabled={loading || success}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                    Delivery Day <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="deliveryDay"
                    value={formData.deliveryDay}
                    onChange={handleChange}
                    placeholder="e.g., 3-5 business days"
                    className={`w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 sm:px-4 ${
                      success ? 'border-green-700' : 'border-gray-700'
                    }`}
                    required
                    disabled={loading || success}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                    Description (optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Describe the product..."
                    className={`w-full rounded-lg border bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50 sm:px-4 ${
                      success ? 'border-green-700' : 'border-gray-700'
                    }`}
                    disabled={loading || success}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                    Product Images <span className="text-red-500">*</span> (Max 3)
                  </label>
                  <div
                    className={`rounded-lg border-2 border-dashed p-5 text-center transition sm:p-6 ${
                      success
                        ? 'border-green-700 bg-green-900/20'
                        : 'border-gray-700 hover:border-red-600'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                      disabled={loading || success || imageFiles.length >= 3}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`inline-flex cursor-pointer flex-col items-center ${
                        imageFiles.length >= 3 ? 'cursor-not-allowed opacity-50' : ''
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
                        {imageFiles.length >= 3
                          ? 'Maximum images reached'
                          : 'Click to upload images'}
                      </span>
                      <span className="mt-1 text-xs text-gray-500">
                        {imageFiles.length}/3 images selected • JPEG, PNG, WebP up to 5MB
                      </span>
                    </label>
                  </div>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="mb-3 block text-xs font-medium text-gray-300 sm:text-sm">
                      Image Previews ({imagePreviews.length}/3)
                    </label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="group relative">
                          <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-700">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                            {index === 0 && (
                              <div className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs text-white">
                                Main Image
                              </div>
                            )}
                            {!success && (
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
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
                            )}
                          </div>
                          <p className="mt-1 truncate text-center text-xs text-gray-500">
                            {imageFiles[index]?.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col justify-end gap-3 border-t border-gray-800 pt-4 sm:mt-8 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                  disabled={loading || success}
                  className="w-full text-sm sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || success || collections.length === 0}
                  className="w-full text-sm sm:w-auto"
                >
                  {loading ? 'Creating...' : success ? 'Created!' : 'Create Product'}
                </Button>
              </div>

              {success && (
                <div className="mt-4 flex flex-col justify-end gap-3 sm:flex-row">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSuccess('');
                      setUploadProgress(0);
                    }}
                    className="text-sm"
                  >
                    Create Another Product
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      router.push(
                        `/dashboards/admin-dashboard/collections/${formData.collectionId}/products`
                      )
                    }
                    className="text-sm"
                  >
                    View Products
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}

export default function CreateProductPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout userRole="admin">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <p className="text-gray-400">Loading...</p>
          </div>
        </DashboardLayout>
      }
    >
      <CreateProductPageContent />
    </Suspense>
  );
}
