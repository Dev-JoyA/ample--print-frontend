'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { customerBriefService } from '@/services/customerBriefService';
import { productService } from '@/services/productService';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id;

  useAuthCheck();

  const [order, setOrder] = useState(null);
  const [briefs, setBriefs] = useState({});
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('items');

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
        // Fetch briefs and products for each item
        const briefPromises = orderData.items.map(async (item) => {
          const productId = item.productId._id || item.productId;
          
          // Fetch brief
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

  if (loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading order details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout userRole="customer">
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

  return (
    <DashboardLayout userRole="customer">
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
              Back
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
                  onClick={() => router.push('/order-history')}
                  className="gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14v-6a4 4 0 00-4-4h-1" />
                  </svg>
                  All Orders
                </Button>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-gray-800 p-6 sm:p-8 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">📋</span>
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
                  <span>Processing</span>
                  <span>Design</span>
                  <span>Production</span>
                  <span>Delivery</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full transition-all duration-500"
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
                    ? 'border-primary text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Order Items ({order.items?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('briefs')}
                className={`pb-4 px-1 font-medium text-sm whitespace-nowrap border-b-2 transition ${
                  activeTab === 'briefs'
                    ? 'border-primary text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Customization Briefs
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`pb-4 px-1 font-medium text-sm whitespace-nowrap border-b-2 transition ${
                  activeTab === 'payment'
                    ? 'border-primary text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Payment Details
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
                    <div key={index} className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-white">{item.productName}</h3>
                            <p className="text-primary font-bold text-lg">{formatCurrency(item.price * item.quantity)}</p>
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
                                <span className="text-green-400">✓ Brief submitted</span>
                                <button
                                  onClick={() => setActiveTab('briefs')}
                                  className="text-sm text-primary hover:text-primary-dark transition"
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
                    <div className="border-t border-gray-700 pt-3 mt-3">
                      <div className="flex justify-between">
                        <span className="text-base font-medium text-white">Total</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Briefs Tab */}
            {activeTab === 'briefs' && (
              <div className="space-y-4">
                {Object.keys(briefs).length > 0 ? (
                  Object.entries(briefs).map(([productId, brief]) => {
                    const item = order.items?.find(i => (i.productId._id || i.productId) === productId);
                    
                    return (
                      <div key={productId} className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div>
                            <h3 className="text-white font-medium">{item?.productName}</h3>
                            <p className="text-xs text-gray-500">Brief ID: {brief._id?.slice(-8)}</p>
                          </div>
                        </div>
                        
                        <div className="bg-slate-800/30 rounded-lg p-4">
                          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
                            {brief.description}
                          </pre>
                        </div>
                        
                        <div className="mt-4 text-xs text-gray-500">
                          Submitted: {formatDate(brief.createdAt)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-gray-800">
                    <div className="text-4xl mb-3">📝</div>
                    <p className="text-gray-400">No customization briefs found for this order.</p>
                  </div>
                )}
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
                  </div>

                  {order.remainingBalance > 0 && (
                    <Button 
                      variant="primary" 
                      size="lg" 
                      className="w-full"
                      onClick={() => router.push(`/payment?orderId=${orderId}`)}
                    >
                      Pay Remaining Balance
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}