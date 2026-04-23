'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import Textarea from '@/components/ui/Textarea';
import SEOHead from '@/components/common/SEOHead';
import { productService } from '@/services/productService';
import { orderService } from '@/services/orderService';
import { customerBriefService } from '@/services/customerBriefService';
import { METADATA, getProductMetadata } from '@/lib/metadata';
import { getImageUrl } from '@/lib/imageUtils';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id;

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

  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [designInstructions, setDesignInstructions] = useState('');
  const [logos, setLogos] = useState([]);
  const [imagery, setImagery] = useState([]);
  const [voiceNote, setVoiceNote] = useState(null);
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [logoPreviews, setLogoPreviews] = useState([]);
  const [imageryPreviews, setImageryPreviews] = useState([]);
  const [userActiveOrders, setUserActiveOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showPriceAlert, setShowPriceAlert] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

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

  const getAllImages = () => {
    const images = [];
    if (product?.image) images.push(product.image);
    if (product?.images?.length) images.push(...product.images);
    return images;
  };

  const handleImageError = (imagePath, index) => {
    console.error('Image failed to load:', imagePath);
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], `voice_briefing_${Date.now()}.wav`, { type: 'audio/wav' });
        setVoiceNote(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 0.1);
      }, 100);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSubmitClick = () => {
  if (!isAuthenticated) {
    setShowAuthModal(true);
    return;
  }

  // Only show price alert - no validation here
  setError('');
  setShowPriceAlert(true);
};

const handlePriceAlertConfirm = () => {
  setShowPriceAlert(false);
  
  // Check for customization AFTER price alert is acknowledged
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
  
  // Proceed with order
  if (userActiveOrders.length > 0) {
    setShowOrderModal(true);
  } else {
    handleSubmit(null);
  }
};

//   const handleSubmitClick = () => {
//     if (!isAuthenticated) {
//       setShowAuthModal(true);
//       return;
//     }

//     setError('');
//     setShowPriceAlert(true);

//     const hasCustomization = 
//       designInstructions.trim() !== '' || 
//       logos.length > 0 || 
//       imagery.length > 0 || 
//       voiceNote !== null ||
//       size.trim() !== '' ||
//       color.trim() !== '' ||
//       quantity > 0;

//     if (!hasCustomization) {
//       setError('Please provide at least one customization detail');
//       return;
//     }

    

//     if (userActiveOrders.length > 0) {
//       setShowOrderModal(true);
//     } else {
//       handleSubmit(null);
//     }

//   };

//   const handlePriceAlertConfirm = () => {
//   setShowPriceAlert(false);
//   if (userActiveOrders.length > 0) {
//     setShowOrderModal(true);
//   } else {
//     handleSubmit(null);
//   }
// };

  const handleSubmit = async (selectedOrderId) => {
    try {
      setSubmitting(true);
      setError('');
      setShowOrderModal(false);

      let orderId;
      
      if (selectedOrderId) {
        const addItemData = {
          productId: product._id,
          quantity: quantity
        };
        await orderService.addItemToOrder(selectedOrderId, addItemData);
        orderId = selectedOrderId;
      } else {
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
      <>
        <SEOHead
          title="Loading Product..."
          description="Please wait while we load product details"
          robots="noindex, nofollow"
        />
        <DashboardLayout userRole="customer">
          <div className="mx-auto max-w-7xl">
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-white">Loading product...</div>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <SEOHead
          title="Product Not Found"
          description="The requested product could not be found"
          robots="noindex, nofollow"
        />
        <DashboardLayout userRole="customer">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="rounded-lg border border-red-700 bg-red-900/30 p-6 text-center">
              <p className="text-red-200">{error || 'Product not found'}</p>
              <Button variant="primary" onClick={() => router.back()} className="mt-4">
                Go Back
              </Button>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  return (
    <>
      <SEOHead {...getProductMetadata(product)} />

      {/* Price Alert - Place OUTSIDE DashboardLayout at root level */}
      {showPriceAlert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-yellow-700/50 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/20">
                <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Pricing Notice</h3>
            </div>

            <p className="mb-2 text-sm text-gray-300">
              The final price of your order is <span className="font-semibold text-yellow-400">subject to change</span> based on your customization requirements.
            </p>
            <p className="text-sm text-gray-400">
              Once our team reviews your brief, an updated invoice will be sent to you reflecting the final cost.
            </p>

            <div className="mt-6 flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowPriceAlert(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 !bg-yellow-500 hover:!bg-yellow-600"
                onClick={handlePriceAlertConfirm}
              >
                I Understand, Continue
              </Button>
            </div>
          </div>
        </div>
      )}
           
      <DashboardLayout userRole="customer">
        <div className="mx-auto max-w-7xl">
          {showAuthModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="w-full max-w-md rounded-xl border border-gray-800 bg-slate-900 p-6">
                <h3 className="mb-4 text-xl font-bold text-white">Sign In Required</h3>
                <p className="mb-6 text-gray-400">
                  Please sign in or create an account to continue with your order.
                </p>
                <p className="mb-6 text-sm text-gray-300">
                  <Link
                    href={`/auth/sign-in?next=${encodeURIComponent(`/products/${productId}`)}`}
                    className="text-primary underline hover:text-primary-dark"
                  >
                    Go to sign in
                  </Link>
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setShowAuthModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() =>
                      router.push(`/auth/sign-in?next=${encodeURIComponent(`/products/${productId}`)}`)
                    }
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showOrderModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-slate-900 p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Choose Order Option</h3>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="text-gray-400 transition hover:text-white"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <p className="mb-6 text-sm text-gray-400">
                  Would you like to add this item to an existing order or create a new one?
                </p>
                
                <div className="mb-4 space-y-3">
                  <button
                    onClick={() => handleSubmit(null)}
                    className="w-full rounded-xl border-2 border-primary/50 bg-gradient-to-r from-primary/20 to-purple-600/20 p-5 text-left transition hover:from-primary/30 hover:to-purple-600/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/30 text-xl">
                        ✨
                      </div>
                      <div>
                        <span className="block text-lg font-semibold text-white">Create New Order</span>
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
                    <div className="py-8 text-center">
                      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent"></div>
                      <p className="mt-3 text-sm text-gray-400">Loading your orders...</p>
                    </div>
                  ) : userActiveOrders.length > 0 ? (
                    <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                      {userActiveOrders.map(order => (
                        <button
                          key={order._id}
                          onClick={() => handleSubmit(order._id)}
                          className="w-full rounded-xl border border-gray-700 bg-slate-800/80 p-4 text-left transition hover:border-primary hover:bg-slate-700"
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <span className="font-medium text-white group-hover:text-primary">
                              Order #{order.orderNumber}
                            </span>
                            <StatusBadge status={order.status} className="text-[10px]" />
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-400">
                              {order.items?.length || 0} item(s)
                            </span>
                            <span className="font-semibold text-white">
                              ₦{order.totalAmount?.toLocaleString() || 0}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-800/30 py-8 text-center">
                      <p className="text-gray-400">No active orders found</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex justify-end gap-3 border-t border-gray-800 pt-3">
                  <Button variant="secondary" onClick={() => setShowOrderModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Studio
          </button>

          {showFullscreenImage && (
            <div 
              className="fixed inset-0 z-40 flex items-center justify-center bg-black/90"
              onClick={() => setShowFullscreenImage(false)}
            >
              <button
                className="absolute right-4 top-4 text-white hover:text-gray-300"
                onClick={() => setShowFullscreenImage(false)}
              >
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="relative h-[80vh] w-full max-w-4xl">
                <img 
                  src={`${getImageUrl(images[selectedImageIndex])}?t=${Date.now()}`}
                  alt={product.name}
                  className="h-full w-full object-contain"
                  crossOrigin="anonymous"
                />
              </div>
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}

          <div className="grid gap-8 md:grid-cols-2">
            <div className="relative">
              <div 
                className="relative mb-4 aspect-square w-full cursor-pointer overflow-hidden rounded-lg bg-slate-950"
                onClick={() => setShowFullscreenImage(true)}
              >
                {images.length > 0 ? (
                  <img 
                    src={`${getImageUrl(images[selectedImageIndex])}?t=${Date.now()}`}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                    onError={() => handleImageError(images[selectedImageIndex], 'main')}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-6xl text-gray-700">📦</span>
                  </div>
                )}
                <div className="absolute right-4 top-4">
                  <StatusBadge 
                    status={product.deliveryDay || '3-5 Days'} 
                    className="!border !border-gray-300 !bg-slate-950 !text-white" 
                  />
                </div>
                
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1 rounded-3xl bg-zinc-700/80 p-1">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex(index);
                        }}
                        className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
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
                <div className="mt-4 grid w-full grid-cols-3 gap-2">
                  {images.map((img, index) => (
                    <img 
                      key={index}
                      src={`${getImageUrl(img)}?t=${Date.now()}`}
                      alt={`${product.name} - Image ${index + 1}`}
                      crossOrigin="anonymous"
                      className={`aspect-square w-full cursor-pointer rounded-md object-cover transition hover:opacity-80 ${
                        selectedImageIndex === index ? 'ring-2 ring-primary' : ''
                      }`}
                      onError={() => handleImageError(img, index)}
                      onClick={() => setSelectedImageIndex(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <StatusBadge 
                    className="!border !border-red-700 !bg-slate-950" 
                    status={product.collectionId?.name?.toUpperCase() || 'PREMIUM'} 
                  />
                  <StatusBadge 
                    className="!border-none !bg-slate-950 !text-green-600" 
                    status="QUALITY GUARANTEED" 
                  />
                </div>
                <h1 className="mb-4 text-3xl font-bold text-white">{product.name}</h1>
                <p className="text-sm font-semibold text-gray-300">
                  {product.description || 'High-quality product for your business needs.'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Size</label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g., A4, 210x297mm"
                    className="w-full rounded-lg border border-gray-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g., Purple, black, white"
                    className="w-full rounded-lg border border-gray-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-gray-400">Quantity</label>
                  <input
                    type="number"
                    min={product.minOrder || 1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || product.minOrder)}
                    className="w-full rounded-lg border border-gray-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-dark-lighter bg-slate-900 p-4">
                  <p className="mb-1 text-xs font-semibold text-gray-400">MINIMUM ORDER</p>
                  <p className="text-xl font-bold text-white">{product.minOrder || 20} Units</p>
                </div>
                <div className="rounded-lg border border-dark-lighter bg-slate-900 p-4">
                  <p className="mb-1 text-xs font-semibold text-gray-400">LEAD TIME</p>
                  <p className="text-xl font-bold text-white">{product.deliveryDay || '10-14 Days'}</p>
                </div>
              </div>

              <div>
                <button
                  onClick={() => setShowUploadSection(!showUploadSection)}
                  className="flex items-center gap-2 text-primary transition-colors hover:text-primary-dark"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="font-medium">Upload Logo or Design Files</span>
                </button>
              </div>

              {showUploadSection && (
                <div className="space-y-6 border-t border-gray-800 pt-4">
                  <div>
                    <h3 className="mb-3 font-semibold text-white">DESIGN INSTRUCTIONS</h3>
                    <Textarea
                      className="!border-gray-700 !bg-slate-900"
                      placeholder="Describe how you want your design to be ..."
                      value={designInstructions}
                      onChange={(e) => setDesignInstructions(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold text-white">VOICE BRIEFING</h3>
                    <div className="rounded-xl border border-gray-700 bg-slate-900 p-4 sm:p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm text-gray-400">Record your explanation</span>
                        <span className="text-sm text-primary">{recordingTime.toFixed(1)}s</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`flex h-14 w-14 items-center justify-center rounded-full transition-all sm:h-16 sm:w-16 ${
                            isRecording
                              ? 'animate-pulse bg-red-600 hover:bg-red-700'
                              : 'bg-primary hover:bg-primary-dark'
                          }`}
                        >
                          <svg className="h-7 w-7 text-white sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                          </svg>
                        </button>
                      </div>
                      {voiceNote && (
                        <p className="mt-3 text-center text-xs text-green-500">✓ Recording saved</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 font-semibold text-white">ASSET UPLOADS</h3>
                    
                    <div className="mb-4">
                      <p className="mb-2 text-sm text-gray-400">Logos & Brand Assets</p>
                      <div className="rounded-lg border-2 border-dashed border-gray-700 p-4 transition-colors hover:border-primary">
                        <input
                          type="file"
                          accept="image/*,.svg,.pdf"
                          multiple
                          onChange={(e) => handleFileUpload(e, 'logos')}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label htmlFor="logo-upload" className="block cursor-pointer">
                          <div className="text-center">
                            <svg className="mx-auto mb-2 h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm text-white">Click to upload logos</p>
                            <p className="mt-1 text-xs text-gray-500">SVG, PNG, PDF (max 10MB each)</p>
                          </div>
                        </label>
                      </div>

                      {logoPreviews.length > 0 && (
                        <div className="mt-3 grid grid-cols-4 gap-2">
                          {logoPreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img src={preview} alt={`Logo ${index + 1}`} className="aspect-square w-full rounded-lg border border-gray-700 object-cover" />
                              <button
                                onClick={() => removeFile('logos', index)}
                                className="absolute -right-1 -top-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition group-hover:opacity-100"
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="mb-2 text-sm text-gray-400">Reference Images</p>
                      <div className="rounded-lg border-2 border-dashed border-gray-700 p-4 transition-colors hover:border-primary">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleFileUpload(e, 'imagery')}
                          className="hidden"
                          id="imagery-upload"
                        />
                        <label htmlFor="imagery-upload" className="block cursor-pointer">
                          <div className="text-center">
                            <svg className="mx-auto mb-2 h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-white">Click to upload reference images</p>
                            <p className="mt-1 text-xs text-gray-500">JPG, PNG (max 5 images)</p>
                          </div>
                        </label>
                      </div>

                      {imageryPreviews.length > 0 && (
                        <div className="mt-3 grid grid-cols-4 gap-2">
                          {imageryPreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img src={preview} alt={`Reference ${index + 1}`} className="aspect-square w-full rounded-lg border border-gray-700 object-cover" />
                              <button
                                onClick={() => removeFile('imagery', index)}
                                className="absolute -right-1 -top-1 rounded-full bg-red-600 p-1 text-white opacity-0 transition group-hover:opacity-100"
                              >
                                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              <Button
                variant="primary"
                size="lg"
                className="mt-4 w-full"
                onClick={handleSubmitClick}
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'Continue to Order'}
              </Button>

              {!isAuthenticated && (
                <p className="text-center text-xs text-yellow-500">
                  You'll need to sign in to continue with your order
                </p>
              )}
            </div>
          </div>

          <div className="mt-12">
            <h3 className="mb-8 text-2xl font-bold text-white">FULL TECHNICAL SPECIFICATIONS</h3>
            <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="border-b border-gray-700 pb-4">
                  <div className="mt-8 flex justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">BASE DIMENSIONS/SIZE</span>
                    <span className="font-medium text-white">
                      {size || (product.dimension?.width && product.dimension?.height 
                        ? `${product.dimension.width} x ${product.dimension.height}`
                        : 'Standard')}
                    </span>
                  </div>
                </div>
                <div className="border-b border-gray-700 pb-4">
                  <div className="mt-8 flex justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">EST. PRODUCTION</span>
                    <span className="font-medium text-white">{product.deliveryDay || '7-10 Days'}</span>
                  </div>
                </div>
                <div className="border-b border-gray-700 pb-4">
                  <div className="mt-8 flex justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">COLOR</span>
                    <span className="font-medium text-white">{color || 'To be specified'}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="border-b border-gray-700 pb-4">
                  <div className="mt-8 flex justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">PRODUCTION MOQ</span>
                    <span className="font-medium text-white">{product.minOrder || 20} Units</span>
                  </div>
                </div>
                <div className="border-b border-gray-700 pb-4">
                  <div className="mt-8 flex justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">MATERIAL</span>
                    <span className="font-medium text-white">{product.material || 'Standard'}</span>
                  </div>
                </div>
                <div className="border-b border-gray-700 pb-4">
                  <div className="mt-8 flex justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-300">QUANTITY</span>
                    <span className="font-medium text-white">{quantity} Units</span>
                  </div>
                </div>
              </div>
            </div>
            
            {(logos.length > 0 || imagery.length > 0 || voiceNote) && (
              <div className="mt-6 rounded-lg border border-gray-800 bg-slate-900/50 p-4">
                <h4 className="mb-3 text-sm font-semibold text-white">ADDITIONAL ASSETS</h4>
                <div className="flex flex-wrap gap-3">
                  {logos.length > 0 && (
                    <span className="rounded-full bg-primary/20 px-3 py-1 text-xs text-primary">
                      {logos.length} Logo{logos.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {imagery.length > 0 && (
                    <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-400">
                      {imagery.length} Reference Image{imagery.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {voiceNote && (
                    <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
                      Voice Note Added
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}