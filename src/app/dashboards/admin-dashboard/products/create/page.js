'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import { productService } from '@/services/productService';
import { collectionService } from '@/services/collectionService';
import { useAuthCheck } from '@/app/lib/auth';

export default function CreateProductPage() {
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
      height: ''
    },
    minOrder: '',
    material: '',
    deliveryDay: '',
    status: 'active'
  });
  
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCollections, setFetchingCollections] = useState(true);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchCollections();
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
    
    // Handle nested dimension fields
    if (name === 'width' || name === 'height') {
      setFormData(prev => ({
        ...prev,
        dimension: {
          ...prev.dimension,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateImage = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

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
    
    // Limit to 3 files (as per backend)
    if (files.length > 3) {
      alert('Maximum 3 images allowed');
      return;
    }

    // Validate each file
    for (const file of files) {
      const validation = validateImage(file);
      if (!validation.valid) {
        setError(validation.message);
        return;
      }
    }

    setImageFiles(files);

    // Create preview URLs and clean up old ones
    imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
    setError('');
  };

  const removeImage = (index) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    
    // Clean up the preview URL
    URL.revokeObjectURL(newPreviews[index]);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
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
      setUploadProgress(0);
      
      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        dimension: {
          width: formData.dimension.width?.trim() || '',
          height: formData.dimension.height?.trim() || ''
        },
        minOrder: parseInt(formData.minOrder),
        material: formData.material?.trim() || '',
        deliveryDay: formData.deliveryDay?.trim() || '',
        status: formData.status
      };

      // Create FormData for multipart upload
      const formDataObj = new FormData();
      formDataObj.append('productData', JSON.stringify(productData));
      
      // Append images with the correct field name
      imageFiles.forEach((file, index) => {
        formDataObj.append('images', file);
      });

      // Log for debugging
      console.log('Submitting product:', {
        collectionId: formData.collectionId,
        productData,
        imageCount: imageFiles.length
      });

      const response = await productService.create(formData.collectionId, formDataObj);
      console.log('Product created:', response);
      
      // Redirect to the collection products page
      router.push(`/dashboards/admin-dashboard/collections/${formData.collectionId}/products`);
    } catch (err) {
      console.error('Failed to create product:', err);
      setError(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (fetchingCollections) {
    return (
      <DashboardLayout userRole="admin">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-white">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Create New Product</h1>
          <p className="text-gray-400 mt-2">Add a new product to your collection</p>
        </div>

        {/* Main Form */}
        <div className="bg-slate-900 rounded-lg border border-gray-800 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mb-4">
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Uploading... {uploadProgress}%</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Collection Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Collection <span className="text-red-500">*</span>
                </label>
                <select
                  name="collectionId"
                  value={formData.collectionId}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50"
                  required
                  disabled={loading || collections.length === 0}
                >
                  <option value="">Select a collection</option>
                  {collections.map(col => (
                    <option key={col._id} value={col._id}>
                      {col.name}
                    </option>
                  ))}
                </select>
                {collections.length === 0 && (
                  <p className="text-xs text-yellow-500 mt-1">
                    No collections found. Please create a collection first.
                  </p>
                )}
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., A5 Flyer"
                  className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50"
                  required
                  disabled={loading}
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
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
                  className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50"
                  required
                  disabled={loading}
                />
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Width (optional)
                </label>
                <input
                  type="text"
                  name="width"
                  value={formData.dimension.width}
                  onChange={handleChange}
                  placeholder="e.g., 100mm"
                  className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Height (optional)
                </label>
                <input
                  type="text"
                  name="height"
                  value={formData.dimension.height}
                  onChange={handleChange}
                  placeholder="e.g., 150mm"
                  className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50"
                  disabled={loading}
                />
              </div>

              {/* Minimum Order */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Minimum Order <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="minOrder"
                  value={formData.minOrder}
                  onChange={handleChange}
                  placeholder="100"
                  min="1"
                  className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50"
                  required
                  disabled={loading}
                />
              </div>

              {/* Material */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Material (optional)
                </label>
                <input
                  type="text"
                  name="material"
                  value={formData.material}
                  onChange={handleChange}
                  placeholder="e.g., Glossy paper"
                  className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50"
                  disabled={loading}
                />
              </div>

              {/* Delivery Day */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Delivery Day (optional)
                </label>
                <input
                  type="text"
                  name="deliveryDay"
                  value={formData.deliveryDay}
                  onChange={handleChange}
                  placeholder="e.g., 3-5 business days"
                  className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50"
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Describe the product..."
                  className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50"
                  disabled={loading}
                />
              </div>

              {/* Product Images */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Images <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-red-600 transition">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                    disabled={loading}
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer inline-flex flex-col items-center"
                  >
                    <svg className="w-12 h-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-300 font-medium">Click to upload images</span>
                    <span className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP up to 5MB each (max 3 images)</span>
                  </label>
                </div>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Image Previews
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-700">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {index === 0 && (
                            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                              Main Image
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          {imageFiles[index]?.name.slice(0, 20)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || collections.length === 0}
              >
                {loading ? 'Creating Product...' : 'Create Product'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}