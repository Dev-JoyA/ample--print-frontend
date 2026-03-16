'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import OrderCard from '@/components/cards/OrderCard';
import { useAuth, useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';

// Complete OrderStatus enum based on your backend
const OrderStatus = {
  Pending: 'Pending',
  OrderReceived: 'OrderReceived',
  FilesUploaded: 'FilesUploaded',
  AwaitingInvoice: 'AwaitingInvoice',
  InvoiceSent: 'InvoiceSent',
  DesignUploaded: 'DesignUploaded',
  UnderReview: 'UnderReview',
  Approved: 'Approved',
  AwaitingPartPayment: 'AwaitingPartPayment',
  PartPaymentMade: 'PartPaymentMade',
  InProduction: 'InProduction',
  Completed: 'Completed',
  AwaitingFinalPayment: 'AwaitingFinalPayment',
  FinalPaid: 'FinalPaid',
  ReadyForShipping: 'ReadyForShipping',
  Shipped: 'Shipped',
  Cancelled: 'Cancelled',
  Delivered: 'Delivered',
};

// Status display names (for UI)
const StatusDisplayNames = {
  Pending: 'Order Pending',
  OrderReceived: 'Order Received',
  FilesUploaded: 'Brief/Files Uploaded',
  AwaitingInvoice: 'Awaiting Invoice',
  InvoiceSent: 'Invoice Sent',
  DesignUploaded: 'Design Uploaded',
  UnderReview: 'Under Review',
  Approved: 'Design Approved',
  AwaitingPartPayment: 'Awaiting Part Payment',
  PartPaymentMade: 'Part Payment Made',
  InProduction: 'In Production',
  Completed: 'Production Completed',
  AwaitingFinalPayment: 'Awaiting Final Payment',
  FinalPaid: 'Final Payment Made',
  ReadyForShipping: 'Ready For Shipping',
  Shipped: 'Shipped',
  Cancelled: 'Cancelled',
  Delivered: 'Delivered',
};

// Status step order for timeline (in logical flow order)
const StatusFlowOrder = [
  OrderStatus.Pending,
  OrderStatus.OrderReceived,
  OrderStatus.FilesUploaded,
  OrderStatus.AwaitingInvoice,
  OrderStatus.InvoiceSent,
  // Payment related statuses
  OrderStatus.AwaitingPartPayment,
  OrderStatus.PartPaymentMade,
  // Design and production flow
  OrderStatus.DesignUploaded,
  OrderStatus.UnderReview,
  OrderStatus.Approved,
  OrderStatus.InProduction,
  OrderStatus.Completed,
  // Final payment
  OrderStatus.AwaitingFinalPayment,
  OrderStatus.FinalPaid,
  // Shipping
  OrderStatus.ReadyForShipping,
  OrderStatus.Shipped,
  OrderStatus.Delivered,
  OrderStatus.Cancelled,
];

// Function to get phases based on order data
const getStatusPhases = (order) => {
  const basePhases = [
    {
      name: 'Order Placement',
      statuses: [OrderStatus.Pending, OrderStatus.OrderReceived],
      icon: '📋',
      color: 'blue'
    },
    {
      name: 'Brief & Invoice',
      statuses: [OrderStatus.FilesUploaded, OrderStatus.AwaitingInvoice, OrderStatus.InvoiceSent],
      icon: '📄',
      color: 'purple'
    }
  ];

  // Payment Phase (for both full and part payment)
  const paymentPhase = {
    name: order?.requiredPaymentType === 'part' ? 'Initial Deposit' : 'Payment',
    icon: '💰',
    color: order?.requiredPaymentType === 'part' ? 'yellow' : 'blue',
    statuses: []
  };

  // Final Payment Phase (only for part payment, after production)
  const finalPaymentPhase = {
    name: 'Final Payment',
    icon: '💳',
    color: 'green',
    statuses: []
  };

  if (order?.requiredPaymentType === 'part') {
    // For part payment, show deposit phase first
    paymentPhase.statuses = [
      OrderStatus.AwaitingPartPayment,
      OrderStatus.PartPaymentMade
    ];
    paymentPhase.description = 'Pay deposit to start design work';

    // Final payment happens after production
    finalPaymentPhase.statuses = [
      OrderStatus.AwaitingFinalPayment,
      OrderStatus.FinalPaid
    ];
    finalPaymentPhase.description = 'Pay remaining balance after production';
  } else if (order?.requiredPaymentType === 'full') {
    // For full payment, show single payment phase
    paymentPhase.statuses = [OrderStatus.InvoiceSent];
    paymentPhase.description = 'Full payment required';
  }

  const designPhase = {
    name: 'Design & Approval',
    statuses: [OrderStatus.DesignUploaded, OrderStatus.UnderReview, OrderStatus.Approved],
    icon: '🎨',
    color: 'indigo'
  };

  const productionPhase = {
    name: 'Production',
    statuses: [OrderStatus.InProduction, OrderStatus.Completed],
    icon: '⚙️',
    color: 'yellow'
  };

  const shippingPhase = {
    name: 'Shipping & Delivery',
    statuses: [OrderStatus.ReadyForShipping, OrderStatus.Shipped, OrderStatus.Delivered],
    icon: '🚚',
    color: 'orange'
  };

  const cancelledPhase = {
    name: 'Cancelled',
    statuses: [OrderStatus.Cancelled],
    icon: '❌',
    color: 'red'
  };

  // Build phases array in correct order
  const phases = [...basePhases];
  
  // Add payment phase if it has statuses
  if (paymentPhase.statuses.length > 0) {
    phases.push(paymentPhase);
  }
  
  // Design phase comes after payment
  phases.push(designPhase);
  
  // Production phase
  phases.push(productionPhase);
  
  // Add final payment phase if applicable (AFTER production, BEFORE shipping)
  if (finalPaymentPhase.statuses.length > 0) {
    phases.push(finalPaymentPhase);
  }
  
  // Shipping phase comes last (after all payments)
  phases.push(shippingPhase);
  
  // Add cancelled phase at the end
  phases.push(cancelledPhase);
  
  return phases;
};

export default function OrderTrackingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  useAuthCheck();

  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);

  useEffect(() => {
    const orderParam = searchParams.get('order');
    if (orderParam) {
      setOrderNumber(orderParam);
      handleTrack(orderParam);
    }
  }, [searchParams]);

  // Format order number to uppercase (ORD-2026-001 format)
  const formatOrderNumber = (input) => {
    // Remove any whitespace
    let formatted = input.trim();
    
    // If it already has the ORD- prefix, ensure it's uppercase
    if (formatted.toUpperCase().startsWith('ORD-')) {
      // Extract the part after ORD-
      const numberPart = formatted.substring(4);
      return `ORD-${numberPart}`;
    }
    
    // If it's just numbers, add the ORD- prefix
    if (/^\d+$/.test(formatted)) {
      return `ORD-${formatted}`;
    }
    
    // If it has a different format, just uppercase the whole thing
    return formatted.toUpperCase();
  };

  const handleTrack = async (orderNum = orderNumber) => {
    if (!orderNum.trim()) {
      setError('Please enter an order number');
      return;
    }

    const searchTerm = orderNum.trim();
    setOrderNumber(searchTerm);
    setSearchAttempted(true);

    try {
      setLoading(true);
      setError('');
      setTrackedOrder(null);
      
      console.log('🔍 Searching for order:', searchTerm);
      
      // Try search endpoint first
      try {
        const response = await orderService.searchByOrderNumber(searchTerm);
        const orderData = response?.order || response?.data || response;
        
        if (orderData) {
          console.log('✅ Order found via search:', orderData);
          setTrackedOrder(orderData);
          return;
        }
      } catch (searchErr) {
        console.log('❌ Search endpoint failed:', searchErr);
        
        // Handle specific error types
        if (searchErr.status === 404) {
          // Order not found - don't show error yet, try fallback
          console.log('Order not found via search, trying my-orders...');
        } else if (searchErr.status === 401 || searchErr.status === 403) {
          console.log('Authorization error, falling back to my-orders');
        } else {
          console.log('Other error, falling back to my-orders');
        }
      }
      
      // Fallback: Try my-orders method
      console.log('📋 Fetching user orders as fallback...');
      const myOrdersResponse = await orderService.getMyOrders({ limit: 50 });
      
      // Extract orders array
      let orders = [];
      if (myOrdersResponse?.order && Array.isArray(myOrdersResponse.order)) {
        orders = myOrdersResponse.order;
      } else if (myOrdersResponse?.orders && Array.isArray(myOrdersResponse.orders)) {
        orders = myOrdersResponse.orders;
      } else if (Array.isArray(myOrdersResponse)) {
        orders = myOrdersResponse;
      }
      
      console.log(`📊 Found ${orders.length} orders for user`);
      
      if (orders.length === 0) {
        setError('You have no orders yet.');
        return;
      }
      
      // Try multiple matching strategies
      let foundOrder = null;
      const searchLower = searchTerm.toLowerCase();
      
      // Strategy 1: Exact match
      foundOrder = orders.find(o => o.orderNumber === searchTerm);
      
      // Strategy 2: Case-insensitive match
      if (!foundOrder) {
        foundOrder = orders.find(o => 
          o.orderNumber?.toLowerCase() === searchLower
        );
      }
      
      // Strategy 3: Contains match (for partial UUIDs)
      if (!foundOrder && searchTerm.length >= 8) {
        foundOrder = orders.find(o => 
          o.orderNumber?.toLowerCase().includes(searchLower)
        );
      }
      
      // Strategy 4: Check if the order number is a UUID format
      if (!foundOrder && searchTerm.includes('-')) {
        foundOrder = orders.find(o => 
          o.orderNumber?.toLowerCase().includes(searchLower.split('-').join(''))
        );
      }
      
      if (foundOrder) {
        console.log('✅ Order found via my-orders:', foundOrder);
        setTrackedOrder(foundOrder);
      } else {
        // No order found in any method
        setError('Order not found. Please check the order number and try again.');
      }
      
    } catch (err) {
      console.error('❌ Failed to track order:', err);
      
      // Set user-friendly error message
      if (err.userMessage) {
        setError(err.userMessage);
      } else if (err.message?.includes('Network') || err.message?.includes('Failed to fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setError('Please sign in to track your order.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError('');
    handleTrack();
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

  // Get the current step index in the flow
  const getCurrentStepIndex = () => {
    if (!trackedOrder) return -1;
    return StatusFlowOrder.indexOf(trackedOrder.status);
  };

  // Get payment status message based on order data and invoice type
  const getPaymentStatusMessage = () => {
    if (!trackedOrder) return '';
    
    if (trackedOrder.paymentStatus === 'Completed') {
      return 'Payment completed successfully';
    }
    
    if (trackedOrder.requiredPaymentType === 'part') {
      if (trackedOrder.paymentStatus === 'PartPayment') {
        return `Part payment received: ₦${trackedOrder.amountPaid?.toLocaleString()} (Deposit: ₦${trackedOrder.requiredDeposit?.toLocaleString()})`;
      }
      if (trackedOrder.paymentStatus === 'Pending') {
        return `Awaiting part payment - Deposit required: ₦${trackedOrder.requiredDeposit?.toLocaleString()}`;
      }
      if (trackedOrder.paymentStatus === 'Completed') {
        return 'Full payment completed';
      }
    }
    
    if (trackedOrder.requiredPaymentType === 'full') {
      if (trackedOrder.paymentStatus === 'Pending') {
        return `Awaiting full payment: ₦${trackedOrder.totalAmount?.toLocaleString()}`;
      }
      if (trackedOrder.paymentStatus === 'Completed') {
        return 'Full payment received';
      }
    }
    
    // If no invoice yet
    if (!trackedOrder.invoiceId) {
      return 'Invoice not yet generated';
    }
    
    return `Payment status: ${trackedOrder.paymentStatus}`;
  };

  // Check if order is cancelled
  const isCancelled = trackedOrder?.status === OrderStatus.Cancelled;

  if (authLoading) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={user?.role}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Order Tracking</h1>
          <p className="text-gray-400">Track the real-time status of your order</p>
        </div>

        {/* Search Order */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Track Your Order</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter order number (e.g., ORD-2026-001 )"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                className="w-full"
                icon={
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter your order number (supports ORD-2026-001, UUID format, or partial matches)
              </p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => handleTrack()}
              disabled={loading}
              className="sm:w-auto"
            >
              {loading ? 'Tracking...' : 'Track Order'}
            </Button>
          </div>
          
          {/* Error Message with Retry Button */}
          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
                <button
                  onClick={handleRetry}
                  className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition whitespace-nowrap"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Details */}
        {trackedOrder && (
          <div className="space-y-6">
            {/* Order Summary Card */}
            <OrderCard 
              order={{
                id: trackedOrder._id,
                orderNumber: trackedOrder.orderNumber,
                productName: trackedOrder.items?.[0]?.productName || 'Multiple Items',
                productImage: getImageUrl(trackedOrder.items?.[0]?.productId?.images?.[0]),
                orderedDate: new Date(trackedOrder.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                }).replace(/\//g, '-'),
                totalAmount: trackedOrder.totalAmount,
                status: trackedOrder.status,
                itemsCount: trackedOrder.items?.length || 1,
                paymentStatus: trackedOrder.paymentStatus
              }}
              onClick={() => router.push(`/orders/${trackedOrder._id}`)}
            />

            {/* Cancelled Order Warning */}
            {isCancelled && (
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
                <div className="text-5xl mb-4">❌</div>
                <h3 className="text-xl font-bold text-white mb-2">Order Cancelled</h3>
                <p className="text-gray-400">
                  This order has been cancelled. Please contact support for more information.
                </p>
              </div>
            )}

            {/* Status Timeline */}
            {!isCancelled && (
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Order Status Timeline</h2>
                
                {/* Payment Info Banner */}
                {trackedOrder.invoiceId && trackedOrder.requiredPaymentType && (
                  <div className={`mb-6 p-4 rounded-lg ${
                    trackedOrder.requiredPaymentType === 'part' 
                      ? 'bg-yellow-900/20 border border-yellow-800' 
                      : 'bg-blue-900/20 border border-blue-800'
                  }`}>
                    <p className={`text-sm flex items-center gap-2 ${
                      trackedOrder.requiredPaymentType === 'part' 
                        ? 'text-yellow-400' 
                        : 'text-blue-400'
                    }`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {getPaymentStatusMessage()}
                      {trackedOrder.requiredPaymentType === 'part' && (
                        <span className="text-xs bg-yellow-900/30 px-2 py-0.5 rounded-full">
                          Part Payment Plan
                        </span>
                      )}
                      {trackedOrder.requiredPaymentType === 'full' && (
                        <span className="text-xs bg-blue-900/30 px-2 py-0.5 rounded-full">
                          Full Payment
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Timeline by Phases */}
                <div className="space-y-8">
                  {getStatusPhases(trackedOrder).map((phase, phaseIndex) => {
                    // Skip cancelled phase if order is not cancelled
                    if (phase.name === 'Cancelled' && !isCancelled) return null;
                    
                    // Skip empty phases
                    if (phase.statuses.length === 0) return null;
                    
                    // Find which status in this phase is current (if any)
                    const currentStatusInPhase = phase.statuses.find(
                      status => status === trackedOrder.status
                    );
                    
                    const isPhaseCompleted = phase.statuses.every(
                      status => StatusFlowOrder.indexOf(status) <= getCurrentStepIndex()
                    );
                    
                    const isPhaseActive = !!currentStatusInPhase;
                    
                    return (
                      <div key={phase.name} className="relative">
                        {/* Phase Header */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isPhaseCompleted || isPhaseActive
                              ? `bg-${phase.color}-900/30`
                              : 'bg-gray-800'
                          }`}>
                            <span className="text-xl">{phase.icon}</span>
                          </div>
                          <div>
                            <h3 className={`font-semibold ${
                              isPhaseCompleted || isPhaseActive
                                ? 'text-white'
                                : 'text-gray-500'
                            }`}>
                              {phase.name}
                            </h3>
                            {phase.description && (
                              <p className="text-xs text-gray-500">{phase.description}</p>
                            )}
                            {isPhaseActive && (
                              <p className="text-xs text-red-400">
                                Current: {StatusDisplayNames[trackedOrder.status]}
                              </p>
                            )}
                          </div>
                          {isPhaseCompleted && (
                            <span className="ml-auto text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-full border border-green-800">
                              Completed
                            </span>
                          )}
                        </div>

                        {/* Status Steps within Phase */}
                        <div className="ml-13 pl-4 border-l-2 border-gray-800 space-y-4">
                          {phase.statuses.map((status, statusIndex) => {
                            const isCompleted = StatusFlowOrder.indexOf(status) < getCurrentStepIndex();
                            const isCurrent = status === trackedOrder.status;
                            
                            return (
                              <div key={status} className="relative flex items-start gap-3">
                                <div className="absolute -left-[25px] top-1">
                                  <div className={`w-4 h-4 rounded-full ${
                                    isCompleted
                                      ? 'bg-green-500'
                                      : isCurrent
                                      ? 'bg-red-500 animate-pulse'
                                      : 'bg-gray-700'
                                  }`}></div>
                                </div>

                                {/* Status Content */}
                                <div className="flex-1 pb-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className={`text-sm font-medium ${
                                      isCompleted || isCurrent
                                        ? 'text-white'
                                        : 'text-gray-500'
                                    }`}>
                                      {StatusDisplayNames[status]}
                                    </p>
                                    {isCurrent && (
                                      <span className="px-2 py-0.5 bg-red-600/20 text-red-400 rounded-full text-xs border border-red-700">
                                        Current
                                      </span>
                                    )}
                                    {isCompleted && (
                                      <span className="text-green-500 text-xs flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Done
                                      </span>
                                    )}
                                  </div>

                                  {/* Status-specific details */}
                                  {isCurrent && (
                                    <div className="mt-2 text-sm text-gray-400">
                                      {status === OrderStatus.AwaitingPartPayment && (
                                        <p>Awaiting initial deposit of ₦{trackedOrder.requiredDeposit?.toLocaleString()}</p>
                                      )}
                                      {status === OrderStatus.PartPaymentMade && (
                                        <p>Deposit received. Design work will begin soon.</p>
                                      )}
                                      {status === OrderStatus.DesignUploaded && (
                                        <p>Your design has been uploaded and is ready for your review.</p>
                                      )}
                                      {status === OrderStatus.UnderReview && (
                                        <p>Please review the design and provide feedback or approve.</p>
                                      )}
                                      {status === OrderStatus.Approved && (
                                        <p>Design approved! Your order will now proceed to production.</p>
                                      )}
                                      {status === OrderStatus.InProduction && (
                                        <p>Your order is currently being printed/produced.</p>
                                      )}
                                      {status === OrderStatus.Completed && (
                                        <p>Production is complete! Final payment is now required for shipping.</p>
                                      )}
                                      {status === OrderStatus.AwaitingFinalPayment && (
                                        <p>Awaiting final payment of ₦{trackedOrder.remainingBalance?.toLocaleString()} before shipping</p>
                                      )}
                                      {status === OrderStatus.FinalPaid && (
                                        <p>Final payment received. Your order will be prepared for shipping.</p>
                                      )}
                                      {status === OrderStatus.ReadyForShipping && (
                                        <p>Your order is packed and ready to be shipped.</p>
                                      )}
                                      {status === OrderStatus.Shipped && (
                                        <p>Your order has been shipped and is on its way to you.</p>
                                      )}
                                      {status === OrderStatus.Delivered && (
                                        <p>Your order has been delivered. Thank you for your business!</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payment & Shipping Status */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold">Payment Status</h3>
                </div>
                <div className="flex items-center justify-between">
                  <StatusBadge status={trackedOrder.paymentStatus} type="payment" />
                  <span className="text-sm text-gray-400">
                    Paid: ₦{trackedOrder.amountPaid?.toLocaleString()}
                  </span>
                </div>
                <div className="mt-3 text-sm text-gray-400">
                  Total: ₦{trackedOrder.totalAmount?.toLocaleString()}
                </div>
                {trackedOrder.requiredPaymentType === 'part' && trackedOrder.requiredDeposit && (
                  <div className="mt-3 text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded-lg">
                    Required Deposit: ₦{trackedOrder.requiredDeposit.toLocaleString()}
                  </div>
                )}
                {trackedOrder.remainingBalance > 0 && trackedOrder.status === 'Completed' && (
                  <div className="mt-3 text-xs text-orange-400 bg-orange-900/20 p-2 rounded-lg">
                    Final Payment Due: ₦{trackedOrder.remainingBalance.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold">Shipping Status</h3>
                </div>
                <StatusBadge 
                  status={trackedOrder.shippingId ? 'Ready for Shipping' : 'Pending'} 
                  type="order" 
                />
                {trackedOrder.shippingId && (
                  <button 
                    onClick={() => router.push(`/shipping/${trackedOrder.shippingId}`)}
                    className="mt-3 text-sm text-red-400 hover:text-red-300"
                  >
                    View Shipping Details →
                  </button>
                )}
                {trackedOrder.status === 'Completed' && (
                  <p className="mt-3 text-xs text-green-400">
                    Production complete. {trackedOrder.remainingBalance > 0 ? 'Final payment required before shipping.' : 'Ready for shipping.'}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center pt-4">
              <Link href={`/orders/${trackedOrder._id}`}>
                <Button variant="secondary" className="gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Full Details
                </Button>
              </Link>
              <Link href="/order-history">
                <Button variant="ghost" className="gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14v-6a4 4 0 00-4-4h-1" />
                  </svg>
                  All Orders
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!trackedOrder && !loading && !error && !searchAttempted && (
          <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-gray-800">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-400 text-lg mb-2">Enter an order number to track your order</p>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              You can find your order number in your order confirmation email or in your order history.
              Format examples: ORD-2026-001 or 82097b5f-bbb0-4999-950d-3b155f484f85
            </p>
          </div>
        )}

        {/* No Results State */}
        {!trackedOrder && !loading && error && searchAttempted && (
          <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-gray-800">
            <div className="text-6xl mb-4">❓</div>
            <p className="text-gray-400 text-lg mb-2">No order found</p>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              We couldn't find an order with that number. Please check the number and try again, 
              or contact support if you need assistance.
            </p>
            <button
              onClick={() => {
                setOrderNumber('');
                setError('');
                setSearchAttempted(false);
              }}
              className="mt-4 text-red-400 hover:text-red-300 text-sm"
            >
              Clear and try again
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}