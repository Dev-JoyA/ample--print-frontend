'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth, useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { customerBriefService } from '@/services/customerBriefService';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const orderId = params.id;

  useAuthCheck();

  const [order, setOrder] = useState(null);
  const [briefs, setBriefs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('items');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      const orderResponse = await orderService.getById(orderId);
      console.log('Order response:', orderResponse);
      
      const orderData = orderResponse?.order || orderResponse?.data || orderResponse;
      setOrder(orderData);

      if (orderData?.items) {
        // Fetch briefs for each item
        const briefPromises = orderData.items.map(async (item) => {
          const productId = item.productId._id || item.productId;
          
          try {
            const briefResponse = await customerBriefService.getByOrderAndProduct(orderId, productId);
            return {
              productId,
              brief: briefResponse?.data || briefResponse
            };
          } catch (err) {
            console.log(`No brief found for product ${productId}`);
            return null;
          }
        });

        const briefResults = await Promise.all(briefPromises);
        const briefMap = briefResults.filter(b => b !== null).reduce((acc, curr) => {
          acc[curr.productId] = curr.brief;
          return acc;
        }, {});
        
        setBriefs(briefMap);
      }

    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
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

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusProgress = (status) => {
    const steps = [
      'Pending',
      'OrderReceived',
      'FilesUploaded',
      'DesignUploaded',
      'Approved',
      'InProduction',
      'Completed',
      'Delivered'
    ];
    const currentIndex = steps.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-500',
      OrderReceived: 'bg-blue-500',
      FilesUploaded: 'bg-purple-500',
      DesignUploaded: 'bg-indigo-500',
      UnderReview: 'bg-orange-500',
      Approved: 'bg-green-500',
      InProduction: 'bg-blue-500',
      Completed: 'bg-green-500',
      Delivered: 'bg-green-500',
      Cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const handleDownloadInvoice = () => {
    // Implement invoice download
    console.log('Download invoice for order:', orderId);
  };

  const handleTrackOrder = () => {
    router.push(`/order-tracking?order=${order.orderNumber}`);
  };

  if (loading) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading order details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-white mb-2">Order Not Found</h2>
            <p className="text-gray-400 mb-6">{error || 'The order you\'re looking for doesn\'t exist.'}</p>
            <Button variant="primary" onClick={() => router.push('/order-history')}>
              View My Orders
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const progress = getStatusProgress(order.status);
  const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const needsPayment = order.remainingBalance > 0;

  return (
    <DashboardLayout userRole={user?.role}>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors group"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Orders
            </button>
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Order Details</h1>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-gray-400">Order #{order.orderNumber}</span>
                  <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                  <span className="text-gray-400">{formatDate(order.createdAt)}</span>
                </div>
              </div>
              <div className="flex gap-3">
                {order.invoiceId && (
                  <Button 
                    variant="secondary" 
                    size="md"
                    onClick={handleDownloadInvoice}
                    className="gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Invoice
                  </Button>
                )}
                <Button 
                  variant="secondary" 
                  size="md"
                  onClick={() => window.print()}
                  className="gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </Button>
                <Button 
                  variant="primary" 
                  size="md"
                  onClick={handleTrackOrder}
                  className="gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Track
                </Button>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-gray-800 p-6 sm:p-8 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${getStatusColor(order.status)}/20 rounded-2xl flex items-center justify-center`}>
                  <span className="text-3xl">
                    {order.status === 'Delivered' ? '✅' : 
                     order.status === 'InProduction' ? '⚙️' :
                     order.status === 'DesignUploaded' ? '🎨' :
                     order.status === 'Approved' ? '👍' : '📋'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Current Status</p>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} className="text-sm px-4 py-1.5" />
                    <span className="text-sm text-gray-500">
                      Updated {formatDate(order.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 max-w-md">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Ordered</span>
                  <span>Design</span>
                  <span>Production</span>
                  <span>Delivery</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-600 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-800 mb-6">
            <nav className="flex gap-6 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setActiveTab('items')}
                className={`pb-4 px-1 font-medium text-sm whitespace-nowrap border-b-2 transition ${
                  activeTab === 'items'
                    ? 'border-red-600 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Order Items ({order.items?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('briefs')}
                className={`pb-4 px-1 font-medium text-sm whitespace-nowrap border-b-2 transition ${
                  activeTab === 'briefs'
                    ? 'border-red-600 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Customization Briefs
                {Object.keys(briefs).length > 0 && ` (${Object.keys(briefs).length})`}
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`pb-4 px-1 font-medium text-sm whitespace-nowrap border-b-2 transition ${
                  activeTab === 'payment'
                    ? 'border-red-600 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Payment Details
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`pb-4 px-1 font-medium text-sm whitespace-nowrap border-b-2 transition ${
                  activeTab === 'timeline'
                    ? 'border-red-600 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Timeline
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Items Tab */}
            {activeTab === 'items' && (
              <div className="space-y-4">
                {order.items?.map((item, index) => {
                  const productId = item.productId._id || item.productId;
                  const brief = briefs[productId];
                  
                  return (
                    <div key={index} className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-all">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Product Image Placeholder */}
                        <div className="w-24 h-24 bg-slate-800 rounded-lg flex items-center justify-center text-4xl">
                          📦
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-white">{item.productName}</h3>
                            <p className="text-red-400 font-bold text-lg">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Quantity</p>
                              <p className="text-white font-medium">{item.quantity}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Unit Price</p>
                              <p className="text-white font-medium">{formatCurrency(item.price)}</p>
                            </div>
                            {item.productSnapshot?.dimension && (
                              <div>
                                <p className="text-gray-500">Dimensions</p>
                                <p className="text-white font-medium">
                                  {item.productSnapshot.dimension.width} x {item.productSnapshot.dimension.height}
                                </p>
                              </div>
                            )}
                            {item.productSnapshot?.material && (
                              <div>
                                <p className="text-gray-500">Material</p>
                                <p className="text-white font-medium">{item.productSnapshot.material}</p>
                              </div>
                            )}
                          </div>

                          {brief && (
                            <div className="mt-4 pt-4 border-t border-gray-700">
                              <div className="flex items-center gap-2">
                                <span className="text-green-400 flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Brief submitted
                                </span>
                                <button
                                  onClick={() => setActiveTab('briefs')}
                                  className="text-sm text-red-400 hover:text-red-300 transition ml-2"
                                >
                                  View details →
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Order Summary */}
                <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6 mt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Subtotal ({totalItems} items)</span>
                      <span className="text-white">{formatCurrency(order.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Amount Paid</span>
                      <span className="text-green-400">{formatCurrency(order.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Remaining Balance</span>
                      <span className="text-yellow-400">{formatCurrency(order.remainingBalance)}</span>
                    </div>
                    <div className="border-t border-gray-700 pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="text-base font-medium text-white">Total</span>
                        <span className="text-xl font-bold text-red-400">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Briefs Tab */}
            {activeTab === 'briefs' && (
              <div className="space-y-6">
                {order.items?.map((item) => {
                  const productId = item.productId._id || item.productId;
                  const brief = briefs[productId];
                  
                  return (
                    <div key={productId} className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden hover:border-gray-700 transition-all">
                      <div className="bg-slate-800/50 p-4 border-b border-gray-700">
                        <h3 className="text-lg font-semibold text-white">{item.productName}</h3>
                        <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                      </div>
                      
                      <div className="p-6">
                        {brief ? (
                          <div className="space-y-4">
                            {brief.description && (
                              <div>
                                <p className="text-gray-400 text-sm mb-1">Description:</p>
                                <p className="text-white bg-slate-800/50 p-3 rounded-lg">{brief.description}</p>
                              </div>
                            )}
                            
                            {/* Attachments */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              {brief.image && (
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <p className="text-xs text-gray-400">Image</p>
                                </div>
                              )}
                              {brief.voiceNote && (
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                  </div>
                                  <p className="text-xs text-gray-400">Voice Note</p>
                                </div>
                              )}
                              {brief.video && (
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-red-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <p className="text-xs text-gray-400">Video</p>
                                </div>
                              )}
                              {brief.logo && (
                                <div className="text-center">
                                  <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <p className="text-xs text-gray-400">Logo</p>
                                </div>
                              )}
                            </div>

                            <div className="mt-4">
                              <Link href={`/orders/${orderId}/products/${productId}/briefs`}>
                                <Button variant="secondary" size="sm" className="w-full">
                                  View Full Brief Conversation
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-400">No customization brief submitted for this product yet.</p>
                            <Link href={`/orders/${orderId}/products/${productId}/briefs`}>
                              <Button variant="primary" size="sm" className="mt-4">
                                Add Customization Brief
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Payment Tab */}
            {activeTab === 'payment' && (
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Payment Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="text-gray-400">Order Total</span>
                    <span className="text-white font-medium">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-800">
                    <span className="text-gray-400">Amount Paid</span>
                    <span className="text-green-400 font-medium">{formatCurrency(order.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-400">Remaining Balance</span>
                    <span className="text-yellow-400 font-medium">{formatCurrency(order.remainingBalance)}</span>
                  </div>
                  
                  <div className="mt-6 p-4 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-3 h-3 rounded-full ${
                        order.paymentStatus === 'Completed' ? 'bg-green-500' :
                        order.paymentStatus === 'PartPayment' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="text-white font-medium">Payment Status: {order.paymentStatus}</span>
                    </div>
                    
                    {order.requiredPaymentType && (
                      <p className="text-sm text-gray-400">
                        Payment Type: {order.requiredPaymentType === 'full' ? 'Full Payment' : 'Part Payment'}
                        {order.requiredDeposit && ` (Deposit: ${formatCurrency(order.requiredDeposit)})`}
                      </p>
                    )}
                  </div>

                  {order.remainingBalance > 0 && (
                    <Button 
                      variant="primary" 
                      size="lg" 
                      className="w-full mt-4"
                      onClick={() => router.push(`/payment?orderId=${orderId}&amount=${order.remainingBalance}`)}
                    >
                      Pay Remaining Balance
                    </Button>
                  )}

                  {order.invoiceId && (
                    <Button 
                      variant="secondary" 
                      size="lg" 
                      className="w-full mt-2"
                      onClick={() => router.push(`/invoices/${order.invoiceId}`)}
                    >
                      View Invoice
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Order Timeline</h3>
                
                <div className="space-y-4">
                  {/* Order Created */}
                  <div className="flex gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {order.updatedAt && <div className="absolute top-10 left-4 w-0.5 h-16 bg-gray-700"></div>}
                    </div>
                    <div className="flex-1 pb-8">
                      <p className="text-white font-medium">Order Placed</p>
                      <p className="text-sm text-gray-400">{formatDate(order.createdAt)}</p>
                      <p className="text-xs text-gray-500 mt-1">Your order has been received and is being processed.</p>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 ${order.paymentStatus !== 'Pending' ? 'bg-green-500/20' : 'bg-gray-700'} rounded-full flex items-center justify-center`}>
                      <svg className={`w-5 h-5 ${order.paymentStatus !== 'Pending' ? 'text-green-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 pb-8">
                      <p className="text-white font-medium">Payment {order.paymentStatus}</p>
                      <p className="text-sm text-gray-400">
                        {order.amountPaid > 0 ? `Paid: ${formatCurrency(order.amountPaid)}` : 'Payment pending'}
                      </p>
                    </div>
                  </div>

                  {/* Brief Status */}
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 ${Object.keys(briefs).length > 0 ? 'bg-green-500/20' : 'bg-gray-700'} rounded-full flex items-center justify-center`}>
                      <svg className={`w-5 h-5 ${Object.keys(briefs).length > 0 ? 'text-green-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div className="flex-1 pb-8">
                      <p className="text-white font-medium">Customization Brief</p>
                      <p className="text-sm text-gray-400">
                        {Object.keys(briefs).length > 0 ? 'Brief submitted' : 'No brief yet'}
                      </p>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 ${getStatusColor(order.status).replace('bg-', 'bg-')}/20 rounded-full flex items-center justify-center`}>
                      <span className="text-lg">
                        {order.status === 'Delivered' ? '✅' : 
                         order.status === 'InProduction' ? '⚙️' :
                         order.status === 'DesignUploaded' ? '🎨' : '📋'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Current Status: {order.status}</p>
                      <p className="text-sm text-gray-400">Updated {formatDate(order.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}