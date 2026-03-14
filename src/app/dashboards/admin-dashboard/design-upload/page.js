'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { orderService } from '@/services/orderService';
import { designService } from '@/services/designService';
import { feedbackService } from '@/services/feedbackService';

export default function DesignUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams.get('orderId');
  const productIdParam = searchParams.get('productId');
  const feedbackIdParam = searchParams.get('feedbackId');
  
  const [selectedOrder, setSelectedOrder] = useState(orderIdParam || '');
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState(null);
  const [existingDesigns, setExistingDesigns] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [feedbackInfo, setFeedbackInfo] = useState(null);
  
  // Track designs for each product
  const [productDesigns, setProductDesigns] = useState({});

  useEffect(() => {
    fetchEligibleOrders();
  }, []);

  useEffect(() => {
    if (orderIdParam) {
      handleOrderSelect(orderIdParam);
    }
  }, [orderIdParam]);

  useEffect(() => {
    if (feedbackIdParam) {
      fetchFeedbackInfo(feedbackIdParam);
    }
  }, [feedbackIdParam]);

  const fetchEligibleOrders = async () => {
    try {
      setLoading(true);
      
      // Fetch orders that are eligible for design upload
      const response = await orderService.getAll({ limit: 50 });
      
      let allOrders = [];
      if (response?.order && Array.isArray(response.order)) {
        allOrders = response.order;
      }
      
      // Filter orders that are eligible for design upload
      const eligibleOrders = allOrders.filter(order => {
        if (!order.invoiceId) return false;
        
        const isValidStatus = order.status === 'FinalPaid' || order.status === 'PartPaymentMade';
        const isValidPayment = 
          order.paymentStatus === 'Completed' || 
          (order.paymentStatus === 'PartPayment' && order.amountPaid >= (order.requiredDeposit || 0));
        
        return isValidStatus && isValidPayment;
      });
      
      setOrders(eligibleOrders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedbackInfo = async (feedbackId) => {
    try {
      const response = await feedbackService.getById(feedbackId);
      const feedback = response?.data || response;
      setFeedbackInfo(feedback);
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
    }
  };

  const fetchExistingDesigns = async (orderId) => {
    try {
      const response = await designService.getByOrder(orderId);
      const designs = response?.data || [];
      
      // Map designs by productId
      const designMap = {};
      designs.forEach(design => {
        const productId = design.productId?._id || design.productId;
        designMap[productId] = design;
      });
      
      setExistingDesigns(designMap);
      return designMap;
    } catch (err) {
      console.error('Failed to fetch existing designs:', err);
      return {};
    }
  };

  const handleOrderSelect = async (orderId) => {
    setSelectedOrder(orderId);
    setProductDesigns({});
    setExistingDesigns({});
    setError('');
    setSuccess('');
    
    if (!orderId) {
      setOrderDetails(null);
      return;
    }
    
    try {
      setLoading(true);
      
      // Fetch order details
      const response = await orderService.getById(orderId);
      const orderData = response?.order || response?.data || response;
      
      setOrderDetails(orderData);
      
      // Fetch existing designs for this order
      const designs = await fetchExistingDesigns(orderId);
      
      // Initialize design state for each product
      const initialDesigns = {};
      orderData.items.forEach((item, index) => {
        const productId = item.productId?._id || item.productId;
        const existingDesign = designs[productId];
        
        initialDesigns[productId] = {
          productName: item.productName,
          files: [],
          uploading: false,
          uploaded: !!existingDesign,
          designStatus: existingDesign?.isApproved ? 'approved' : 
                       existingDesign ? 'pending' : null,
          designId: existingDesign?._id,
          error: null,
          index
        };
      });
      setProductDesigns(initialDesigns);
      
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (productId, files) => {
    // Don't allow uploading if product already has approved design
    if (productDesigns[productId]?.designStatus === 'approved') {
      setError('Cannot upload new design for approved product');
      return;
    }

    setProductDesigns(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        files: [...prev[productId].files, ...Array.from(files)],
        error: null
      }
    }));
  };

  const removeFile = (productId, fileIndex) => {
    setProductDesigns(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        files: prev[productId].files.filter((_, i) => i !== fileIndex)
      }
    }));
  };

  const handleUploadDesign = async (productId) => {
    const design = productDesigns[productId];
    
    if (!design || design.files.length === 0) {
      setProductDesigns(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          error: 'Please select at least one file to upload'
        }
      }));
      return;
    }

    try {
      setProductDesigns(prev => ({
        ...prev,
        [productId]: { ...prev[productId], uploading: true, error: null }
      }));

      const formData = new FormData();
      
      // Add all files as 'images'
      design.files.forEach(file => {
        formData.append('images', file);
      });
      
      // Add product ID
      formData.append('productId', productId);
      
      // Add description (optional)
      formData.append('description', `Design for ${design.productName}`);

      console.log('🔍 Debug Info:');
      console.log('- Order ID being sent:', selectedOrder);
      console.log('- Product ID being sent:', productId);
      console.log('- Number of files:', design.files.length);
      console.log('- API URL:', `/design/orders/${selectedOrder}`);

      const response = await designService.upload(selectedOrder, formData);
      
      console.log('✅ Upload response:', response);

      // If this upload was in response to feedback, mark feedback as resolved
      if (feedbackIdParam) {
        try {
          await feedbackService.updateStatus(feedbackIdParam, 'Resolved');
          console.log('✅ Feedback marked as resolved');
        } catch (fbErr) {
          console.error('Failed to update feedback status:', fbErr);
        }
      }

      setProductDesigns(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          uploaded: true,
          uploading: false,
          files: [],
          designStatus: 'pending',
          designId: response.data?._id,
          uploadResponse: response
        }
      }));

      setSuccess(`Design for ${design.productName} uploaded successfully!`);
      
      // If this was from feedback, redirect back after 2 seconds
      if (feedbackIdParam) {
        setTimeout(() => {
          router.push('/dashboards/admin-dashboard/feedback');
        }, 2000);
      } else {
        setTimeout(() => setSuccess(''), 5000);
      }

    } catch (err) {
      console.error(`❌ Failed to upload design for product ${productId}:`, err);
      console.error('❌ Error details:', {
        message: err.message,
        status: err.status,
        data: err.data
      });
      setProductDesigns(prev => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          uploading: false,
          error: err.message || 'Failed to upload design. Please try again.'
        }
      }));
    }
  };

  const getPaymentStatusLabel = (order) => {
    if (order.status === 'FinalPaid') return 'Final Payment Made';
    if (order.status === 'PartPaymentMade') return 'Part Payment Made';
    return order.status;
  };

  const getDesignStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-900/50 text-green-400 rounded-full text-xs">Approved</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 rounded-full text-xs">Pending Approval</span>;
      default:
        return null;
    }
  };

  if (loading && !orderDetails) {
    return (
      <DashboardLayout userRole="admin">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-white">Loading orders...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Design Upload</h1>
          <p className="text-gray-400">
            {feedbackIdParam 
              ? 'Upload a new design version in response to customer feedback'
              : 'Upload designs for each product individually'}
          </p>
          
          {/* Feedback Context Banner */}
          {feedbackInfo && (
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-yellow-400 text-xl">💬</div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Responding to Customer Feedback</h3>
                  <p className="text-sm text-gray-300 mb-2">"{feedbackInfo.message}"</p>
                  <p className="text-xs text-gray-400">
                    Order #{feedbackInfo.orderId?.orderNumber} • 
                    Product: {feedbackInfo.designId?.productName || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-200">
            {success}
            {feedbackIdParam && (
              <p className="text-sm mt-1">Redirecting back to feedback...</p>
            )}
          </div>
        )}

        <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 space-y-6">
          {/* Order Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Order
            </label>
            <select
              value={selectedOrder}
              onChange={(e) => handleOrderSelect(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!!orderIdParam} // Disable if order is pre-selected from feedback
            >
              <option value="">Choose an order...</option>
              {orders.map((order) => (
                <option key={order._id} value={order._id}>
                  {order.orderNumber} - {getPaymentStatusLabel(order)} - ₦{order.totalAmount?.toLocaleString()}
                </option>
              ))}
            </select>
            {orderIdParam && (
              <p className="text-xs text-blue-400 mt-2">
                Order pre-selected from feedback
              </p>
            )}
          </div>

          {/* Order Summary */}
          {orderDetails && (
            <div className="bg-slate-800/30 rounded-lg p-4">
              <h3 className="text-white font-medium mb-3">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Order Number:</span>
                  <span className="text-white">{orderDetails.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    orderDetails.status === 'FinalPaid' 
                      ? 'bg-green-900/50 text-green-400' 
                      : 'bg-yellow-900/50 text-yellow-400'
                  }`}>
                    {orderDetails.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Items:</span>
                  <span className="text-white">{orderDetails.items?.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Product Design Sections - Individual Uploads Only */}
          {orderDetails && Object.entries(productDesigns).map(([productId, design]) => {
            // Highlight the product that was in the feedback
            const isTargetProduct = productIdParam === productId;
            
            return (
              <div 
                key={productId} 
                className={`border rounded-lg p-6 space-y-4 ${
                  isTargetProduct 
                    ? 'border-yellow-600 bg-yellow-900/10' 
                    : 'border-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">{design.productName}</h3>
                    {getDesignStatusBadge(design.designStatus)}
                    {isTargetProduct && (
                      <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 rounded-full text-xs">
                        Needs Update
                      </span>
                    )}
                  </div>
                </div>

                {/* File Upload Area - Disabled for approved designs */}
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  design.designStatus === 'approved'
                    ? 'border-gray-700 bg-gray-800/50 cursor-not-allowed'
                    : 'border-gray-700 hover:border-primary/50 cursor-pointer'
                }`}>
                  <input
                    type="file"
                    accept="image/*,.pdf,.ai,.psd"
                    multiple
                    onChange={(e) => handleFileUpload(productId, e.target.files)}
                    className="hidden"
                    id={`design-upload-${productId}`}
                    disabled={design.designStatus === 'approved' || design.uploading}
                  />
                  <label 
                    htmlFor={`design-upload-${productId}`} 
                    className={`${design.designStatus === 'approved' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-white font-medium mb-1">
                      {design.designStatus === 'approved' 
                        ? 'Design already approved - cannot modify' 
                        : design.uploading 
                          ? 'Uploading...' 
                          : design.uploaded
                            ? 'Design uploaded (pending approval)'
                            : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {design.designStatus !== 'approved' && 'PNG, JPG, PDF, AI, PSD (MAX. 50MB per file)'}
                    </p>
                  </label>
                </div>

                {/* Selected Files List */}
                {design.files.length > 0 && design.designStatus !== 'approved' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300">Selected Files:</p>
                    {design.files.map((file, fileIndex) => (
                      <div key={fileIndex} className="flex items-center justify-between bg-slate-800 rounded-lg p-2">
                        <span className="text-white text-sm truncate max-w-[300px]">{file.name}</span>
                        <button
                          onClick={() => removeFile(productId, fileIndex)}
                          className="text-red-400 hover:text-red-300 text-sm"
                          disabled={design.uploading}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Error Message */}
                {design.error && (
                  <p className="text-sm text-red-400">{design.error}</p>
                )}

                {/* Individual Upload Button - Only for products that need designs */}
                {design.designStatus !== 'approved' && !design.uploaded && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUploadDesign(productId)}
                    disabled={design.files.length === 0 || design.uploading}
                    className="w-full"
                  >
                    {design.uploading ? 'Uploading...' : `Upload Design for ${design.productName}`}
                  </Button>
                )}

                {/* Show message if design is pending */}
                {design.uploaded && design.designStatus === 'pending' && (
                  <p className="text-sm text-yellow-400 text-center">
                    Design uploaded and pending customer approval
                  </p>
                )}
              </div>
            );
          })}

          {/* Cancel Button */}
          {orderDetails && (
            <div className="flex justify-end pt-4 border-t border-gray-800">
              <Button
                variant="secondary"
                onClick={() => {
                  if (feedbackIdParam) {
                    router.push('/dashboards/admin-dashboard/feedback');
                  } else {
                    setSelectedOrder('');
                    setOrderDetails(null);
                    setProductDesigns({});
                  }
                }}
              >
                {feedbackIdParam ? 'Back to Feedback' : 'Cancel'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}