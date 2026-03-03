'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import { productService } from '@/services/productService';
import { collectionService } from '@/services/collectionService';
import { useAuthCheck } from '@/app/lib/auth';

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
      height: ''
    },
    minOrder: '',
    material: '',
    deliveryDay: '',
    status: 'active'
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
      
      // Fetch collections for dropdown
      const collectionsRes = await collectionService.getAll({ limit: 100 });
      let collectionsData = [];
      if (collectionsRes?.collections && Array.isArray(collectionsRes.collections)) {
        collectionsData = collectionsRes.collections;
      } else if (Array.isArray(collectionsRes)) {
        collectionsData = collectionsRes;
      }
      setCollections(collectionsData);

      // Fetch product details
      const productRes = await productService.getById(productId);
      console.log('Product response:', productRes);
      
      const productData = productRes?.product || productRes?.data || productRes;
      setOriginalProduct(productData);

      // Populate form
      setFormData({
        collectionId: productData.collectionId?._id || productData.collectionId || '',
        name: productData.name || '',
        description: productData.description || '',
        price: productData.price?.toString() || '',
        dimension: {
          width: productData.dimension?.width || '',
          height: productData.dimension?.height || ''
        },
        minOrder: productData.minOrder?.toString() || '',
        material: productData.material || '',
        deliveryDay: productData.deliveryDay || '',
        status: productData.status || 'active'
      });

      // Load existing images
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
    
    // Limit total images (existing + new) to 10
    if (existingImages.length + imageFiles.length + files.length > 10) {
      alert('Maximum 10 images total allowed');
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

    setImageFiles(prev => [...prev, ...files]);

    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
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
    setImagesToRemove(prev => [...prev, existingImages[index]]);
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const restoreImage = (image) => {
    setImagesToRemove(prev => prev.filter(img => img !== image));
    setExistingImages(prev => [...prev, image]);
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

    // Check basic fields
    if (formData.collectionId !== (originalProduct.collectionId?._id || originalProduct.collectionId)) return true;
    if (formData.name !== originalProduct.name) return true;
    if (formData.description !== originalProduct.description) return true;
    if (parseFloat(formData.price) !== originalProduct.price) return true;
    if (parseInt(formData.minOrder) !== originalProduct.minOrder) return true;
    if (formData.material !== originalProduct.material) return true;
    if (formData.deliveryDay !== originalProduct.deliveryDay) return true;
    if (formData.status !== originalProduct.status) return true;

    // Check dimensions
    if (formData.dimension.width !== originalProduct.dimension?.width) return true;
    if (formData.dimension.height !== originalProduct.dimension?.height) return true;

    // Check images
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
        status: formData.status,
        collectionId: formData.collectionId
      };

      // Create FormData for multipart upload
      const formDataObj = new FormData();
      formDataObj.append('productData', JSON.stringify(productData));
      
      // Append new images
      imageFiles.forEach((file) => {
        formDataObj.append('images', file);
      });

      // Append images to remove (backend should handle this)
      if (imagesToRemove.length > 0) {
        formDataObj.append('imagesToRemove', JSON.stringify(imagesToRemove));
      }

      console.log('Updating product:', productId);
      const response = await productService.update(productId, formDataObj);
      console.log('Product updated:', response);
      
      setSuccess('Product updated successfully!');
      
      // Refresh data after short delay
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
      <DashboardLayout userRole="admin">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 mt-4">Loading product...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <Link href={`/dashboards/admin-dashboard/collections/${formData.collectionId}/products`} className="hover:text-red-400">
              Products
            </Link>
            <span>›</span>
            <Link href={`/dashboards/admin-dashboard/products/${productId}`} className="hover:text-red-400">
              {originalProduct?.name}
            </Link>
            <span>›</span>
            <span className="text-white">Edit</span>
          </nav>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Edit Product</h1>
              <p className="text-gray-400 mt-1">Update product information</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboards/admin-dashboard/products/${productId}`}>
                <Button variant="secondary">Cancel</Button>
              </Link>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={saving || !hasChanges()}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-200">
              {success}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="border-b border-gray-800 mb-6">
            <nav className="flex gap-6">
              <button
                onClick={() => setActiveTab('basic')}
                className={`pb-4 px-1 font-medium text-sm border-b-2 transition ${
                  activeTab === 'basic'
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Basic Information
              </button>
              <button
                onClick={() => setActiveTab('images')}
                className={`pb-4 px-1 font-medium text-sm border-b-2 transition ${
                  activeTab === 'images'
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Images ({existingImages.length + imageFiles.length}/10)
              </button>
            </nav>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit}>
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="bg-slate-900 rounded-xl border border-gray-800 p-6 space-y-6">
                {/* Collection Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Collection <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="collectionId"
                    value={formData.collectionId}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    required
                    disabled={saving}
                  >
                    <option value="">Select a collection</option>
                    {collections.map(col => (
                      <option key={col._id} value={col._id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
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
                    className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    required
                    disabled={saving}
                  />
                </div>

                {/* Price and Min Order */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                      required
                      disabled={saving}
                    />
                  </div>

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
                      className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                      required
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Dimensions */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dimensions (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="width"
                      value={formData.dimension.width}
                      onChange={handleChange}
                      placeholder="Width (e.g., 100mm)"
                      className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                      disabled={saving}
                    />
                    <input
                      type="text"
                      name="height"
                      value={formData.dimension.height}
                      onChange={handleChange}
                      placeholder="Height (e.g., 150mm)"
                      className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Material and Delivery */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Delivery Time (optional)
                    </label>
                    <input
                      type="text"
                      name="deliveryDay"
                      value={formData.deliveryDay}
                      onChange={handleChange}
                      placeholder="e.g., 3-5 business days"
                      className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    disabled={saving}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Describe the product..."
                    className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                    disabled={saving}
                  />
                </div>
              </div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <div className="bg-slate-900 rounded-xl border border-gray-800 p-6 space-y-6">
                {/* Upload New Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Add New Images
                  </label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-red-600 transition">
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
                      className={`cursor-pointer inline-flex flex-col items-center ${
                        existingImages.length + imageFiles.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <svg className="w-12 h-12 text-gray-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-300 font-medium">Click to upload images</span>
                      <span className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP up to 5MB each</span>
                    </label>
                  </div>
                </div>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Current Images
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {existingImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-700">
                            <img
                              src={getImageUrl(img)}
                              alt={`Product ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(index)}
                              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Image Previews */}
                {imagePreviews.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      New Images to Upload
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-700">
                            <img
                              src={preview}
                              alt={`New ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeNewImage(index)}
                              className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {imageFiles[index]?.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Images to Remove */}
                {imagesToRemove.length > 0 && (
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-red-400 mb-2">Images to Remove</h4>
                    <div className="flex flex-wrap gap-2">
                      {imagesToRemove.map((img, index) => (
                        <div key={index} className="flex items-center gap-2 bg-red-900/30 px-3 py-1 rounded-full">
                          <span className="text-xs text-red-300">Image {index + 1}</span>
                          <button
                            type="button"
                            onClick={() => restoreImage(img)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
              <Link href={`/dashboards/admin-dashboard/products/${productId}`}>
                <Button variant="secondary" disabled={saving}>
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                disabled={saving || !hasChanges()}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}