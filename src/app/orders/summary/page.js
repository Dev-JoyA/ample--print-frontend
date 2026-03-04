'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { customerBriefService } from '@/services/customerBriefService';
import { productService } from '@/services/productService';

export default function OrderSummaryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check authentication first
  useAuthCheck();
  
  const productId = searchParams.get('productId');
  const orderId = searchParams.get('orderId');
  const briefId = searchParams.get('briefId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [brief, setBrief] = useState(null);
  const [product, setProduct] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    order: true,
    specifications: true,
    assets: true
  });

  useEffect(() => {
    // Validate required params
    if (!productId || !orderId || !briefId) {
      setError('Missing required information');
      setLoading(false);
      return;
    }

    fetchSummaryData();
  }, [productId, orderId, briefId]);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching data with:', { productId, orderId, briefId });

      // Fetch all data in parallel with better error handling
      const promises = [
        productService.getById(productId).catch(err => {
          console.error('Product fetch error:', err);
          return null;
        }),
        orderService.getById(orderId).catch(err => {
          console.error('Order fetch error:', err);
          return null;
        }),
        customerBriefService.getById(briefId).catch(err => {
          console.error('Brief fetch error:', err);
          return null;
        })
      ];

      const [productRes, orderRes, briefRes] = await Promise.all(promises);

      console.log('Product response:', productRes);
      console.log('Order response:', orderRes);
      console.log('Brief response:', briefRes);

      // Check if any requests failed
      if (!productRes && !orderRes && !briefRes) {
        throw new Error('Failed to load order information');
      }

      // Extract data from responses
      if (productRes) {
        setProduct(productRes?.product || productRes?.data || productRes);
      }
      
      if (orderRes) {
        setOrder(orderRes?.order || orderRes?.data || orderRes);
      }
      
      if (briefRes) {
        setBrief(briefRes?.data || briefRes);
      }

    } catch (err) {
      console.error('Failed to fetch summary data:', err);
      setError(err.message || 'Failed to load order summary');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  // Parse the detailed description from the brief
  const parseDescription = (description) => {
    if (!description) return {};
    
    const sections = {};
    const lines = description.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      if (line.includes('PRODUCT INFORMATION:')) {
        currentSection = 'product';
      } else if (line.includes('CUSTOMER SPECIFICATIONS:')) {
        currentSection = 'specs';
      } else if (line.includes('DESIGN INSTRUCTIONS:')) {
        currentSection = 'design';
      } else if (line.includes('ADDITIONAL REQUIREMENTS:')) {
        currentSection = 'assets';
      } else if (line.includes('DELIVERY EXPECTATIONS:')) {
        currentSection = 'delivery';
      } else if (line.trim() && !line.includes('=') && !line.includes('-')) {
        if (!sections[currentSection]) sections[currentSection] = [];
        sections[currentSection].push(line.trim());
      }
    });
    
    return sections;
  };

  if (loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your order summary...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || (!product && !order && !brief)) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">😕</div>
            <h2 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-400 mb-6">{error || 'Unable to load order summary'}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="primary" onClick={() => router.push('/collections')}>
                Browse Collections
              </Button>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const parsedBrief = brief ? parseDescription(brief.description) : {};

  return (
    <DashboardLayout userRole="customer">
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Order Summary</h1>
                <p className="text-sm sm:text-base text-gray-400 mt-1">
                  Review your order details before proceeding
                </p>
              </div>
              {order && (
                <div className="flex gap-2 sm:gap-3">
                  <Button variant="secondary" size="sm" onClick={() => router.push(`/products/${productId}`)}>
                    Edit Order
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => router.push('/checkout')}>
                    Proceed to Checkout
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Order Status Cards */}
          {order && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
                <p className="text-xs text-gray-500 mb-1">Order Number</p>
                <p className="text-sm sm:text-base font-mono text-white break-all">{order.orderNumber}</p>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
                <p className="text-xs text-gray-500 mb-1">Order Date</p>
                <p className="text-sm sm:text-base text-white">{formatDate(order.createdAt)}</p>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
                <p className="text-xs text-gray-500 mb-1">Order Status</p>
                <StatusBadge status={order.status || 'Pending'} className="text-xs sm:text-sm" />
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="space-y-4 sm:space-y-6">
            {/* Product Summary Card */}
            {product && (
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
                <div 
                  className="p-4 sm:p-6 cursor-pointer hover:bg-slate-800/50 transition-colors flex items-center justify-between"
                  onClick={() => toggleSection('order')}
                >
                  <h2 className="text-lg sm:text-xl font-semibold text-white">Product Details</h2>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedSections.order ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {expandedSections.order && (
                  <div className="p-4 sm:p-6 pt-0 sm:pt-0 border-t border-gray-800">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                      {/* Product Image */}
                      <div className="w-full sm:w-32 h-32 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                        {product?.image || product?.images?.[0] ? (
                          <img
                            src={getImageUrl(product.image || product.images[0])}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/200x200?text=Product';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-3xl text-gray-700">📦</span>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-white">{product.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-400 mt-1">{product.description?.substring(0, 100)}...</p>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div>
                            <p className="text-xs text-gray-500">Unit Price</p>
                            <p className="text-sm font-medium text-white">{formatCurrency(product.price)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Quantity</p>
                            <p className="text-sm font-medium text-white">{order?.items?.[0]?.quantity || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="text-sm font-bold text-primary">
                              {formatCurrency(product.price * (order?.items?.[0]?.quantity || 1))}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">MOQ</p>
                            <p className="text-sm font-medium text-white">{product.minOrder} units</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Specifications Summary */}
            {brief && Object.keys(parsedBrief).length > 0 && (
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
                <div 
                  className="p-4 sm:p-6 cursor-pointer hover:bg-slate-800/50 transition-colors flex items-center justify-between"
                  onClick={() => toggleSection('specifications')}
                >
                  <h2 className="text-lg sm:text-xl font-semibold text-white">Customization Details</h2>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedSections.specifications ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {expandedSections.specifications && (
                  <div className="p-4 sm:p-6 pt-0 sm:pt-0 border-t border-gray-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Customer Specifications */}
                      {parsedBrief.specs && (
                        <div>
                          <h3 className="text-sm font-medium text-primary mb-3">CUSTOMER SPECIFICATIONS</h3>
                          <div className="space-y-3">
                            {parsedBrief.specs.map((spec, index) => {
                              const [key, ...valueParts] = spec.split(':');
                              const value = valueParts.join(':').trim();
                              return (
                                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-800">
                                  <span className="text-xs text-gray-400">{key.replace('•', '').trim()}</span>
                                  <span className="text-sm font-medium text-white">{value || 'Not specified'}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Design Instructions */}
                      {parsedBrief.design && (
                        <div>
                          <h3 className="text-sm font-medium text-primary mb-3">DESIGN INSTRUCTIONS</h3>
                          <div className="bg-slate-800/50 rounded-lg p-4">
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">
                              {parsedBrief.design.join('\n').replace('DESIGN INSTRUCTIONS:', '').trim()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Delivery Expectations */}
                    {parsedBrief.delivery && (
                      <div className="mt-6 pt-6 border-t border-gray-800">
                        <h3 className="text-sm font-medium text-primary mb-3">DELIVERY EXPECTATIONS</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {parsedBrief.delivery.map((item, index) => {
                            const [key, ...valueParts] = item.split(':');
                            const value = valueParts.join(':').trim();
                            if (!value) return null;
                            return (
                              <div key={index} className="flex justify-between items-center">
                                <span className="text-xs text-gray-400">{key.replace('•', '').trim()}</span>
                                <span className="text-sm font-medium text-white">{value}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Assets Summary */}
            {brief && (brief.logo || brief.image || brief.voiceNote || brief.video) && (
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
                <div 
                  className="p-4 sm:p-6 cursor-pointer hover:bg-slate-800/50 transition-colors flex items-center justify-between"
                  onClick={() => toggleSection('assets')}
                >
                  <h2 className="text-lg sm:text-xl font-semibold text-white">Uploaded Assets</h2>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${expandedSections.assets ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {expandedSections.assets && (
                  <div className="p-4 sm:p-6 pt-0 sm:pt-0 border-t border-gray-800">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {brief.logo && (
                        <a 
                          href={getImageUrl(brief.logo)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-2 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition"
                        >
                          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                            <span className="text-xl">🎨</span>
                          </div>
                          <span className="text-xs text-gray-300">Logo</span>
                        </a>
                      )}
                      
                      {brief.image && (
                        <a 
                          href={getImageUrl(brief.image)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-2 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition"
                        >
                          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-xl">🖼️</span>
                          </div>
                          <span className="text-xs text-gray-300">Reference</span>
                        </a>
                      )}
                      
                      {brief.voiceNote && (
                        <a 
                          href={getImageUrl(brief.voiceNote)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-2 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition"
                        >
                          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-xl">🎤</span>
                          </div>
                          <span className="text-xs text-gray-300">Voice Note</span>
                        </a>
                      )}
                      
                      {brief.video && (
                        <a 
                          href={getImageUrl(brief.video)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-2 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition"
                        >
                          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-xl">🎥</span>
                          </div>
                          <span className="text-xs text-gray-300">Video</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {order && (
              <>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="flex-1"
                    onClick={() => router.push(`/products/${productId}`)}
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back to Edit
                    </span>
                  </Button>
                  
                  <Button
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    onClick={() => router.push('/checkout')}
                  >
                    <span className="flex items-center justify-center gap-2">
                      Proceed to Checkout
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Need to make changes? You can edit your order or contact our support team for assistance.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}