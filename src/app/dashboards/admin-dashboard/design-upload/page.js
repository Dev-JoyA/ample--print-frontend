'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { orderService } from '@/services/orderService';
import { designService } from '@/services/designService';
import { feedbackService } from '@/services/feedbackService';
import { METADATA } from '@/lib/metadata';

function DesignUploadPageContent() {
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
      const response = await orderService.getAll({ limit: 50 });
      let allOrders = [];
      if (response?.order && Array.isArray(response.order)) {
        allOrders = response.order;
      }
      const eligibleOrders = allOrders.filter((order) => {
        if (!order.invoiceId) return false;
        const isValidStatus = order.status === 'FinalPaid' || order.status === 'PartPaymentMade';
        const isValidPayment =
          order.paymentStatus === 'Completed' ||
          (order.paymentStatus === 'PartPayment' &&
            order.amountPaid >= (order.requiredDeposit || 0));
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
      const designMap = {};
      designs.forEach((design) => {
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
      const response = await orderService.getById(orderId);
      const orderData = response?.order || response?.data || response;
      setOrderDetails(orderData);
      const designs = await fetchExistingDesigns(orderId);
      const initialDesigns = {};
      orderData.items.forEach((item, index) => {
        const productId = item.productId?._id || item.productId;
        const existingDesign = designs[productId];
        initialDesigns[productId] = {
          productName: item.productName,
          files: [],
          uploading: false,
          uploaded: !!existingDesign,
          designStatus: existingDesign?.isApproved ? 'approved' : existingDesign ? 'pending' : null,
          designId: existingDesign?._id,
          error: null,
          index,
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
    if (productDesigns[productId]?.designStatus === 'approved') {
      setError('Cannot upload new design for approved product');
      return;
    }
    setProductDesigns((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        files: [...prev[productId].files, ...Array.from(files)],
        error: null,
      },
    }));
  };

  const removeFile = (productId, fileIndex) => {
    setProductDesigns((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        files: prev[productId].files.filter((_, i) => i !== fileIndex),
      },
    }));
  };

  const handleUploadDesign = async (productId) => {
    const design = productDesigns[productId];
    if (!design || design.files.length === 0) {
      setProductDesigns((prev) => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          error: 'Please select at least one file to upload',
        },
      }));
      return;
    }
    try {
      setProductDesigns((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], uploading: true, error: null },
      }));
      const formData = new FormData();
      design.files.forEach((file) => {
        formData.append('images', file);
      });
      formData.append('productId', productId);
      formData.append('description', `Design for ${design.productName}`);
      console.log('🔍 Debug Info:');
      console.log('- Order ID being sent:', selectedOrder);
      console.log('- Product ID being sent:', productId);
      console.log('- Number of files:', design.files.length);
      console.log('- API URL:', `/design/orders/${selectedOrder}`);
      const response = await designService.upload(selectedOrder, formData);
      console.log('✅ Upload response:', response);
      if (feedbackIdParam) {
        try {
          await feedbackService.updateStatus(feedbackIdParam, 'Resolved');
          console.log('✅ Feedback marked as resolved');
        } catch (fbErr) {
          console.error('Failed to update feedback status:', fbErr);
        }
      }
      setProductDesigns((prev) => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          uploaded: true,
          uploading: false,
          files: [],
          designStatus: 'pending',
          designId: response.data?._id,
          uploadResponse: response,
        },
      }));
      setSuccess(`Design for ${design.productName} uploaded successfully!`);
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
        data: err.data,
      });
      setProductDesigns((prev) => ({
        ...prev,
        [productId]: {
          ...prev[productId],
          uploading: false,
          error: err.message || 'Failed to upload design. Please try again.',
        },
      }));
    }
  };

  const getPaymentStatusLabel = (order) => {
    if (order.status === 'FinalPaid') return 'Final Payment Made';
    if (order.status === 'PartPaymentMade') return 'Part Payment Made';
    return order.status;
  };

  const getDesignStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="rounded-full bg-green-900/50 px-2 py-1 text-xs text-green-400">
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="rounded-full bg-yellow-900/50 px-2 py-1 text-xs text-yellow-400">
            Pending Approval
          </span>
        );
      default:
        return null;
    }
  };

  if (loading && !orderDetails) {
    return (
      <>
        <SEOHead {...METADATA.dashboard.admin} />
        <DashboardLayout userRole="admin">
          <div className="mx-auto max-w-4xl">
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-white">Loading orders...</div>
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
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">Design Upload</h1>
            <p className="text-sm text-gray-400 sm:text-base">
              {feedbackIdParam
                ? 'Upload a new design version in response to customer feedback'
                : 'Upload designs for each product individually'}
            </p>
            {feedbackInfo && (
              <div className="mt-4 rounded-lg border border-yellow-800 bg-yellow-900/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="text-xl text-yellow-400">💬</div>
                  <div>
                    <h3 className="mb-1 font-semibold text-white">
                      Responding to Customer Feedback
                    </h3>
                    <p className="mb-2 text-sm text-gray-300">"{feedbackInfo.message}"</p>
                    <p className="text-xs text-gray-400">
                      Order #{feedbackInfo.orderId?.orderNumber} • Product:{' '}
                      {feedbackInfo.designId?.productName || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-700 bg-red-900/50 p-3 text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg border border-green-700 bg-green-900/50 p-3 text-green-200">
              {success}
              {feedbackIdParam && <p className="mt-1 text-sm">Redirecting back to feedback...</p>}
            </div>
          )}

          <div className="space-y-6 rounded-xl border border-gray-800 bg-slate-900/50 p-4 backdrop-blur-sm sm:p-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Select Order</label>
              <select
                value={selectedOrder}
                onChange={(e) => handleOrderSelect(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={!!orderIdParam}
              >
                <option value="">Choose an order...</option>
                {orders.map((order) => (
                  <option key={order._id} value={order._id}>
                    {order.orderNumber} - {getPaymentStatusLabel(order)} - ₦
                    {order.totalAmount?.toLocaleString()}
                  </option>
                ))}
              </select>
              {orderIdParam && (
                <p className="mt-2 text-xs text-blue-400">Order pre-selected from feedback</p>
              )}
            </div>

            {orderDetails && (
              <div className="rounded-lg bg-slate-800/30 p-4">
                <h3 className="mb-3 font-medium text-white">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="text-gray-400">Order Number:</span>
                    <span className="text-white">{orderDetails.orderNumber}</span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span
                      className={`inline-block w-fit rounded-full px-2 py-0.5 text-xs ${
                        orderDetails.status === 'FinalPaid'
                          ? 'bg-green-900/50 text-green-400'
                          : 'bg-yellow-900/50 text-yellow-400'
                      }`}
                    >
                      {orderDetails.status}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <span className="text-gray-400">Total Items:</span>
                    <span className="text-white">{orderDetails.items?.length}</span>
                  </div>
                </div>
              </div>
            )}

            {orderDetails &&
              Object.entries(productDesigns).map(([productId, design]) => {
                const isTargetProduct = productIdParam === productId;
                return (
                  <div
                    key={productId}
                    className={`space-y-4 rounded-lg border p-4 sm:p-6 ${
                      isTargetProduct ? 'border-yellow-600 bg-yellow-900/10' : 'border-gray-800'
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-semibold text-white sm:text-lg">
                          {design.productName}
                        </h3>
                        {getDesignStatusBadge(design.designStatus)}
                        {isTargetProduct && (
                          <span className="rounded-full bg-yellow-900/50 px-2 py-1 text-xs text-yellow-400">
                            Needs Update
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors sm:p-6 ${
                        design.designStatus === 'approved'
                          ? 'cursor-not-allowed border-gray-700 bg-gray-800/50'
                          : 'cursor-pointer border-gray-700 hover:border-primary/50'
                      }`}
                    >
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
                        <svg
                          className="mx-auto mb-4 h-10 w-10 text-gray-400 sm:h-12 sm:w-12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <p className="mb-1 text-sm font-medium text-white sm:text-base">
                          {design.designStatus === 'approved'
                            ? 'Design already approved - cannot modify'
                            : design.uploading
                              ? 'Uploading...'
                              : design.uploaded
                                ? 'Design uploaded (pending approval)'
                                : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-400 sm:text-sm">
                          {design.designStatus !== 'approved' &&
                            'PNG, JPG, PDF, AI, PSD (MAX. 50MB per file)'}
                        </p>
                      </label>
                    </div>

                    {design.files.length > 0 && design.designStatus !== 'approved' && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-300">Selected Files:</p>
                        {design.files.map((file, fileIndex) => (
                          <div
                            key={fileIndex}
                            className="flex flex-col justify-between gap-2 rounded-lg bg-slate-800 p-2 sm:flex-row sm:items-center"
                          >
                            <span className="max-w-full truncate text-sm text-white sm:max-w-[300px]">
                              {file.name}
                            </span>
                            <button
                              onClick={() => removeFile(productId, fileIndex)}
                              className="text-sm text-red-400 hover:text-red-300"
                              disabled={design.uploading}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {design.error && <p className="text-sm text-red-400">{design.error}</p>}

                    {design.designStatus !== 'approved' && !design.uploaded && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUploadDesign(productId)}
                        disabled={design.files.length === 0 || design.uploading}
                        className="w-full"
                      >
                        {design.uploading
                          ? 'Uploading...'
                          : `Upload Design for ${design.productName}`}
                      </Button>
                    )}

                    {design.uploaded && design.designStatus === 'pending' && (
                      <p className="text-center text-sm text-yellow-400">
                        Design uploaded and pending customer approval
                      </p>
                    )}
                  </div>
                );
              })}

            {orderDetails && (
              <div className="flex justify-end border-t border-gray-800 pt-4">
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
    </>
  );
}

export default function DesignUploadPage() {
  return (
    <Suspense fallback={null}>
      <DesignUploadPageContent />
    </Suspense>
  );
}
