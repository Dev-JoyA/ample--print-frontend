'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Textarea from '@/components/ui/Textarea';
import { productService } from '@/services/productService';
import { orderService } from '@/services/orderService';
import { customerBriefService } from '@/services/customerBriefService';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

  // Check authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullscreenImage, setShowFullscreenImage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Customer input fields
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(0);
  
  // Customer brief fields
  const [designInstructions, setDesignInstructions] = useState('');
  const [logos, setLogos] = useState([]);
  const [imagery, setImagery] = useState([]);
  const [voiceNote, setVoiceNote] = useState(null);
  const [showUploadSection, setShowUploadSection] = useState(false);

  // File previews
  const [logoPreviews, setLogoPreviews] = useState([]);
  const [imageryPreviews, setImageryPreviews] = useState([]);

  // Order selection
  const [userActiveOrders, setUserActiveOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='));
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserActiveOrders();
    }
  }, [isAuthenticated]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getById(productId);
      
      const productData = response?.product || response?.data || response;
      setProduct(productData);
      
      if (productData?.minOrder) {
        setQuantity(productData.minOrder);
      }
      
      if (productData?.dimension?.width && productData?.dimension?.height) {
        setSize(`${productData.dimension.width} x ${productData.dimension.height}`);
      }
    } catch (err) {
      console.error('Failed to fetch product:', err);
      setError('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActiveOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await orderService.getUserActiveOrders();
      
      let orders = [];
      if (response?.orders && Array.isArray(response.orders)) {
        orders = response.orders;
      }
      
      setUserActiveOrders(orders);
    } catch (err) {
      console.error('Failed to fetch active orders:', err);
    } finally {
      setLoadingOrders(false);
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

  const getAllImages = () => {
    const images = [];
    if (product?.image) images.push(product.image);
    if (product?.images?.length) images.push(...product.images);
    return images;
  };

  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    
    if (type === 'logos') {
      setLogos(prev => [...prev, ...files]);
      const previews = files.map(file => URL.createObjectURL(file));
      setLogoPreviews(prev => [...prev, ...previews]);
    } else if (type === 'imagery') {
      setImagery(prev => [...prev, ...files]);
      const previews = files.map(file => URL.createObjectURL(file));
      setImageryPreviews(prev => [...prev, ...previews]);
    }
  };

  const removeFile = (type, index) => {
    if (type === 'logos') {
      URL.revokeObjectURL(logoPreviews[index]);
      setLogos(prev => prev.filter((_, i) => i !== index));
      setLogoPreviews(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'imagery') {
      URL.revokeObjectURL(imageryPreviews[index]);
      setImagery(prev => prev.filter((_, i) => i !== index));
      setImageryPreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    const interval = setInterval(() => {
      setRecordingTime((prev) => prev + 0.1);
    }, 100);
    return () => clearInterval(interval);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);
    
    const mockAudioBlob = new Blob(['mock audio data'], { type: 'audio/webm' });
    const audioFile = new File([mockAudioBlob], 'voice-briefing.webm', { type: 'audio/webm' });
    setVoiceNote(audioFile);
  };

  const handleSubmitClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    const hasCustomization = 
      designInstructions.trim() !== '' || 
      logos.length > 0 || 
      imagery.length > 0 || 
      voiceNote !== null ||
      size.trim() !== '' ||
      color.trim() !== '' ||
      quantity > 0;

    if (!hasCustomization) {
      setError('Please provide at least one customization detail');
      return;
    }

    setError('');

    if (userActiveOrders.length > 0) {
      setShowOrderModal(true);
    } else {
      handleSubmit(null);
    }
  };

  const handleSubmit = async (selectedOrderId) => {
    try {
      setSubmitting(true);
      setError('');
      setShowOrderModal(false);

      let orderId;
      
      if (selectedOrderId) {
        // Add to existing order
        const addItemData = {
          productId: product._id,
          quantity: quantity
        };
        
        await orderService.addItemToOrder(selectedOrderId, addItemData);
        orderId = selectedOrderId;
      } else {
        // Create new order
        const orderData = {
          items: [
            {
              productId: product._id,
              quantity: quantity
            }
          ]
        };

        const orderResponse = await orderService.create(orderData);
        orderId = orderResponse?.order?._id || orderResponse?.data?._id || orderResponse?._id;
      }

      if (!orderId) {
        throw new Error('Failed to create/find order - no order ID returned');
      }

      const detailedDescription = `

PRODUCT INFORMATION:
-------------------
Product Name: ${product.name}
Product ID: ${product._id}
Collection: ${product.collectionId?.name || 'N/A'}

CUSTOMER SPECIFICATIONS:
----------------------
• Size/Dimensions: ${size || 'Not specified (will use standard)'}
• Color: ${color || 'Not specified (to be discussed)'}
• Quantity: ${quantity} units
• Material: ${product.material || 'Standard'}

DESIGN INSTRUCTIONS:
-------------------
${designInstructions || 'No design instructions provided'}

ADDITIONAL REQUIREMENTS:
-----------------------
${logos.length > 0 ? `• Logo files uploaded: ${logos.length} file(s)` : '• No logo files uploaded'}
${imagery.length > 0 ? `• Reference images uploaded: ${imagery.length} file(s)` : '• No reference images uploaded'}
${voiceNote ? '• Voice briefing recorded and attached' : '• No voice briefing recorded'}

DELIVERY EXPECTATIONS:
---------------------
Expected Lead Time: ${product.deliveryDay || 'Standard'}
Minimum Order Quantity: ${product.minOrder || 20} units

SUBMISSION TIMESTAMP:
-------------------
${new Date().toLocaleString()}
      `.trim();

      const formData = new FormData();
      formData.append('description', detailedDescription);
      
      logos.forEach((logo) => formData.append('logo', logo));
      imagery.forEach((image) => formData.append('image', image));
      if (voiceNote) formData.append('voiceNote', voiceNote);

      await customerBriefService.submit(orderId, product._id, formData);

        router.push(`/orders/summary?orderId=${orderId}`);
    } catch (err) {
      console.error('Failed to submit order:', err);
      setError(err.message || 'Failed to submit your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const images = getAllImages();

  if (loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-white">Loading product...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !product) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 text-center">
            <p className="text-red-200">{error || 'Product not found'}</p>
            <Button variant="primary" onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-7xl mx-auto">
        {/* Auth Modal */}
        {showAuthModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-xl border border-gray-800 p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Sign In Required</h3>
              <p className="text-gray-400 mb-6">
                Please sign in or create an account to continue with your order.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => setShowAuthModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => router.push('/auth/sign-in')}
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Order Selection Modal - Styled Better */}
        {showOrderModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl border border-gray-800 p-6 max-w-md w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Choose Order Option</h3>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-gray-400 mb-6 text-sm">
                Would you like to add this item to an existing order or create a new one?
              </p>
              
              <div className="space-y-3 mb-4">
                {/* New Order Option - Prominent */}
                <button
                  onClick={() => handleSubmit(null)}
                  className="w-full text-left p-5 bg-gradient-to-r from-primary/20 to-purple-600/20 hover:from-primary/30 hover:to-purple-600/30 rounded-xl transition border-2 border-primary/50 hover:border-primary group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/30 rounded-full flex items-center justify-center text-xl">
                      ✨
                    </div>
                    <div>
                      <span className="text-white font-semibold block text-lg">Create New Order</span>
                      <span className="text-xs text-gray-400">Start a fresh order with this item</span>
                    </div>
                  </div>
                </button>
                
                <div className="relative py-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-slate-900 px-4 text-sm text-gray-500">Your Active Orders</span>
                  </div>
                </div>
                
                {loadingOrders ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-gray-400 mt-3">Loading your orders...</p>
                  </div>
                ) : userActiveOrders.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {userActiveOrders.map(order => (
                      <button
                        key={order._id}
                        onClick={() => handleSubmit(order._id)}
                        className="w-full text-left p-4 bg-slate-800/80 hover:bg-slate-700 rounded-xl transition border border-gray-700 hover:border-primary group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-medium group-hover:text-primary transition">
                            Order #{order.orderNumber}
                          </span>
                          <StatusBadge status={order.status} className="text-[10px]" />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">
                            {order.items?.length || 0} item(s)
                          </span>
                          <span className="text-white font-semibold">
                            ₦{order.totalAmount?.toLocaleString() || 0}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-slate-800/30 rounded-xl">
                    <p className="text-gray-400">No active orders found</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 justify-end mt-4 pt-3 border-t border-gray-800">
                <Button
                  variant="secondary"
                  onClick={() => setShowOrderModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Studio
        </button>

        {/* Fullscreen Image Modal */}
        {showFullscreenImage && (
          <div 
            className="fixed inset-0 bg-black/90 z-40 flex items-center justify-center"
            onClick={() => setShowFullscreenImage(false)}
          >
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300"
              onClick={() => setShowFullscreenImage(false)}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative w-full max-w-4xl h-[80vh]">
              <Image
                src={getImageUrl(images[selectedImageIndex])}
                alt={product.name}
                fill
                className="object-contain"
              />
            </div>
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="relative">
            <div 
              className="relative w-full aspect-square bg-slate-950 rounded-lg overflow-hidden mb-4 cursor-pointer"
              onClick={() => setShowFullscreenImage(true)}
            >
              {images.length > 0 ? (
                <Image
                  src={getImageUrl(images[selectedImageIndex])}
                  alt={product.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl text-gray-700">📦</span>
                </div>
              )}
              <div className="absolute top-4 right-4">
                <StatusBadge 
                  status={product.deliveryDay || '3-5 Days'} 
                  className="!bg-slate-950 !text-white !border border-gray-300" 
                />
              </div>
              
              {images.length > 1 && (
                <div className="bg-zinc-700/80 absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-1 p-1 rounded-3xl">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(index);
                      }}
                      className={`py-2 px-4 rounded-lg font-bold text-[12px] transition-colors ${
                        selectedImageIndex === index
                          ? 'bg-primary text-white'
                          : 'bg-dark-light text-gray-400 hover:text-white'
                      }`}
                    >
                      IMG {index + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-3 gap-2 mt-4 w-full">
                {images.map((img, index) => (
                  <img 
                    key={index}
                    src={getImageUrl(img)} 
                    alt={`${product.name} - Image ${index + 1}`}
                    className={`w-full aspect-square object-cover rounded-md cursor-pointer transition hover:opacity-80 ${
                      selectedImageIndex === index ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge 
                  className="!border !border-red-700 !bg-slate-950" 
                  status={product.collectionId?.name?.toUpperCase() || 'PREMIUM'} 
                />
                <StatusBadge 
                  className="!text-green-600 !border border-none !bg-slate-950" 
                  status="QUALITY GUARANTEED" 
                />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">{product.name}</h1>
              <p className="text-gray-300 text-[14px] font-semibold">
                {product.description || 'High-quality product for your business needs.'}
              </p>
            </div>

            {/* Input Fields Row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Size</label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g., A4, 210x297mm"
                  className="w-full bg-slate-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Color</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g., Purple, black, white"
                  className="w-full bg-slate-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 mb-1 uppercase tracking-wider">Quantity</label>
                <input
                  type="number"
                  min={product.minOrder || 1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || product.minOrder)}
                  className="w-full bg-slate-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Order Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 rounded-lg p-4 border border-dark-lighter">
                <p className="text-[12px] font-semibold text-gray-400 mb-1">MINIMUM ORDER</p>
                <p className="text-xl font-bold text-white">{product.minOrder || 20} Units</p>
              </div>
              <div className="bg-slate-900 rounded-lg p-4 border border-dark-lighter">
                <p className="text-[12px] font-semibold text-gray-400 mb-1">LEAD TIME</p>
                <p className="text-xl font-bold text-white">{product.deliveryDay || '10-14 Days'}</p>
              </div>
            </div>

            {/* Design Instructions Link */}
            <div>
              <button
                onClick={() => setShowUploadSection(!showUploadSection)}
                className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="font-medium">Upload Logo or Design Files</span>
              </button>
            </div>

            {/* Upload Section */}
            {showUploadSection && (
              <div className="space-y-6 border-t border-gray-800 pt-4">
                {/* Design Instructions */}
                <div>
                  <h3 className="text-white font-semibold mb-3">DESIGN INSTRUCTIONS</h3>
                  <Textarea
                    className="!bg-slate-900 !border-gray-700"
                    placeholder="Describe how you want your design to be ..."
                    value={designInstructions}
                    onChange={(e) => setDesignInstructions(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Voice Briefing */}
                <div>
                  <h3 className="text-white font-semibold mb-3">VOICE BRIEFING</h3>
                  <div className="bg-slate-900 rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-400">Record your explanation</span>
                      <span className="text-sm text-primary">{recordingTime.toFixed(1)}s</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                          isRecording
                            ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                            : 'bg-primary hover:bg-primary-dark'
                        }`}
                      >
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                        </svg>
                      </button>
                    </div>
                    {voiceNote && (
                      <p className="text-xs text-green-500 text-center mt-3">✓ Recording saved</p>
                    )}
                  </div>
                </div>

                {/* Asset Uploads */}
                <div>
                  <h3 className="text-white font-semibold mb-3">ASSET UPLOADS</h3>
                  
                  {/* Logos Upload */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Logos & Brand Assets</p>
                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 hover:border-primary transition-colors">
                      <input
                        type="file"
                        accept="image/*,.svg,.pdf"
                        multiple
                        onChange={(e) => handleFileUpload(e, 'logos')}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label htmlFor="logo-upload" className="cursor-pointer block">
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-white text-sm">Click to upload logos</p>
                          <p className="text-xs text-gray-500 mt-1">SVG, PNG, PDF (max 10MB each)</p>
                        </div>
                      </label>
                    </div>

                    {logoPreviews.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        {logoPreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img src={preview} alt={`Logo ${index + 1}`} className="w-full aspect-square object-cover rounded-lg border border-gray-700" />
                            <button
                              onClick={() => removeFile('logos', index)}
                              className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reference Images Upload */}
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Reference Images</p>
                    <div className="border-2 border-dashed border-gray-700 rounded-lg p-4 hover:border-primary transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleFileUpload(e, 'imagery')}
                        className="hidden"
                        id="imagery-upload"
                      />
                      <label htmlFor="imagery-upload" className="cursor-pointer block">
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-white text-sm">Click to upload reference images</p>
                          <p className="text-xs text-gray-500 mt-1">JPG, PNG (max 5 images)</p>
                        </div>
                      </label>
                    </div>

                    {imageryPreviews.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        {imageryPreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img src={preview} alt={`Reference ${index + 1}`} className="w-full aspect-square object-cover rounded-lg border border-gray-700" />
                            <button
                              onClick={() => removeFile('imagery', index)}
                              className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Continue Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full mt-4"
              onClick={handleSubmitClick}
              disabled={submitting || (!isAuthenticated)}
            >
              {submitting ? 'Processing...' : 'Continue to Order'}
            </Button>

            {/* Authentication notice */}
            {!isAuthenticated && (
              <p className="text-xs text-yellow-500 text-center">
                You'll need to sign in to continue with your order
              </p>
            )}
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="mt-[3rem]">
          <h3 className="text-white font-bold text-[22px] mb-8">FULL TECHNICAL SPECIFICATIONS</h3>
          <div className="grid grid-cols-2 gap-x-8">
            {[
              [
                { 
                  label: 'BASE DIMENSIONS/SIZE', 
                  value: size || (product.dimension?.width && product.dimension?.height 
                    ? `${product.dimension.width} x ${product.dimension.height}`
                    : 'Standard') 
                },
                { 
                  label: 'EST. PRODUCTION', 
                  value: product.deliveryDay || '7-10 Days' 
                },
                { 
                  label: 'COLOR', 
                  value: color || 'To be specified' 
                },
              ],
              [
                { 
                  label: 'PRODUCTION MOQ', 
                  value: `${product.minOrder || 20} Units` 
                },
                { 
                  label: 'MATERIAL', 
                  value: product.material || 'Standard' 
                },
                { 
                  label: 'QUANTITY', 
                  value: `${quantity} Units` 
                },
              ]
            ].map((column, colIndex) => (
              <div key={colIndex} className="space-y-3">
                {column.map((item, index) => (
                  <div key={index} className="border-b border-gray-700 pb-[1.2rem]">
                    <div className="flex justify-between mt-[4rem]">
                      <span className="text-gray-300 font-semibold text-[12px] uppercase tracking-wider">{item.label}</span>
                      <span className="text-white font-medium">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          {/* Asset Summary */}
          {(logos.length > 0 || imagery.length > 0 || voiceNote) && (
            <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-gray-800">
              <h4 className="text-white font-semibold text-sm mb-3">ADDITIONAL ASSETS</h4>
              <div className="flex flex-wrap gap-3">
                {logos.length > 0 && (
                  <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">
                    {logos.length} Logo{logos.length > 1 ? 's' : ''}
                  </span>
                )}
                {imagery.length > 0 && (
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full">
                    {imagery.length} Reference Image{imagery.length > 1 ? 's' : ''}
                  </span>
                )}
                {voiceNote && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
                    Voice Note Added
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}


