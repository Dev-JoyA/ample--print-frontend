'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { invoiceService } from '@/services/invoiceService';
import { shippingService } from '@/services/shippingService';

export default function OrderHistoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;
  useAuthCheck();
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [orderInvoice, setOrderInvoice] = useState(null); // Invoice for order items
  const [shipping, setShipping] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch order details
      const orderResponse = await orderService.getById(orderId);
      const orderData = orderResponse?.order || orderResponse?.data || orderResponse;
      setOrder(orderData);
      
      // Fetch order invoice if exists (this is for the order items, not shipping)
      if (orderData?.invoiceId) {
        try {
          const invoiceId = typeof orderData.invoiceId === 'object' 
            ? orderData.invoiceId._id || orderData.invoiceId 
            : orderData.invoiceId;
          
          console.log('Fetching order invoice with ID:', invoiceId);
          
          if (invoiceId && typeof invoiceId === 'string') {
            const invoiceResponse = await invoiceService.getById(invoiceId);
            const invoiceData = invoiceResponse?.data || invoiceResponse;
            setOrderInvoice(invoiceData);
          }
        } catch (err) {
          console.error('Failed to fetch order invoice:', err);
        }
      }
      
      // Fetch shipping if exists (this is the shipping selection, not an invoice)
      if (orderData?.shippingId) {
        try {
          const shippingId = typeof orderData.shippingId === 'object' 
            ? orderData.shippingId._id || orderData.shippingId 
            : orderData.shippingId;
          
          console.log('Fetching shipping with ID:', shippingId);
          
          if (shippingId && typeof shippingId === 'string') {
            const shippingResponse = await shippingService.getById(shippingId);
            const shippingData = shippingResponse?.data || shippingResponse;
            setShipping(shippingData);
          }
        } catch (err) {
          console.error('Failed to fetch shipping:', err);
        }
      }
      
    } catch (err) {
      console.error('Failed to fetch order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'yellow',
      'OrderReceived': 'blue',
      'FilesUploaded': 'purple',
      'AwaitingInvoice': 'orange',
      'InvoiceSent': 'red',
      'DesignUploaded': 'indigo',
      'UnderReview': 'yellow',
      'Approved': 'green',
      'InProduction': 'blue',
      'Completed': 'green',
      'Shipped': 'teal',
      'Delivered': 'green',
      'Cancelled': 'red'
    };
    return colors[status] || 'gray';
  };

  const getMessageFromUrl = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('message');
    }
    return null;
  };

  const message = getMessageFromUrl();

  if (loading) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-white">Loading order details...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <p className="text-red-400">{error || 'Order not found'}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 text-primary hover:text-primary-dark"
            >
              Go Back
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Order History
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Order Details</h1>
              <p className="text-gray-400">
                Order #{order.orderNumber}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>
        </div>

        {/* Success Message (if coming from shipping) */}
        {message && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
            <p className="text-green-400">
              ✓ Shipping information saved successfully! An admin will review your shipping selection.
            </p>
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Order Date</p>
                <p className="text-white">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Amount</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(order.totalAmount)}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Payment Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  order.paymentStatus === 'Completed' 
                    ? 'bg-green-900/50 text-green-400 border border-green-700' 
                    : order.paymentStatus === 'PartPayment'
                    ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
                    : 'bg-gray-900/50 text-gray-400 border border-gray-700'
                }`}>
                  {order.paymentStatus || 'Pending'}
                </span>
              </div>
              {order.amountPaid > 0 && (
                <div>
                  <p className="text-sm text-gray-400">Amount Paid</p>
                  <p className="text-green-400">{formatCurrency(order.amountPaid)}</p>
                </div>
              )}
              {order.remainingBalance > 0 && (
                <div>
                  <p className="text-sm text-gray-400">Remaining Balance</p>
                  <p className="text-yellow-400">{formatCurrency(order.remainingBalance)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Items</h2>
          
          <div className="space-y-4">
            {order.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-slate-800/30 rounded-lg">
                <div>
                  <p className="text-white font-medium">{item.productName}</p>
                  <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-primary font-bold">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                  <p className="text-xs text-gray-400">{formatCurrency(item.price)} each</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Information (if shipping has been selected) */}
        {shipping && (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Shipping Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  shipping.shippingMethod === 'pickup' 
                    ? 'bg-purple-900/50 text-purple-400 border border-purple-700'
                    : 'bg-blue-900/50 text-blue-400 border border-blue-700'
                }`}>
                  {shipping.shippingMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-yellow-400">Awaiting Invoice</span>
              </div>
              
              {shipping.shippingMethod === 'delivery' && shipping.address && (
                <>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Delivery Address</p>
                    <p className="text-white">
                      {shipping.address.street}, {shipping.address.city}, {shipping.address.state}, {shipping.address.country}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Recipient</p>
                    <p className="text-white">{shipping.recipientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Phone</p>
                    <p className="text-white">{shipping.recipientPhone}</p>
                  </div>
                </>
              )}
              
              {shipping.shippingMethod === 'pickup' && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Pickup Location</p>
                  <p className="text-white">Our Office - 5, Boyle Street, Somolu, Lagos</p>
                </div>
              )}
              
              {shipping.metadata?.pickupNotes && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Notes</p>
                  <p className="text-white text-sm bg-slate-800/50 p-3 rounded-lg">
                    {shipping.metadata.pickupNotes}
                  </p>
                </div>
              )}
              
              {/* Shipping Invoice Status */}
              <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-yellow-400">
                    <span className="font-medium">Shipping invoice pending:</span> An admin will generate a shipping invoice soon. You'll be notified when it's ready for payment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Invoice Information (for order items) */}
        {orderInvoice && (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Order Invoice</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <p className="text-sm text-gray-400">Invoice Number</p>
                <p className="text-white">{orderInvoice.invoiceNumber}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-gray-400">Status</p>
                <StatusBadge status={orderInvoice.status} />
              </div>
              {orderInvoice.remainingAmount > 0 && (
                <div className="flex justify-between">
                  <p className="text-sm text-gray-400">Amount Due</p>
                  <p className="text-yellow-400 font-bold">{formatCurrency(orderInvoice.remainingAmount)}</p>
                </div>
              )}
              {orderInvoice.status !== 'Paid' && orderInvoice.status !== 'Cancelled' && (
                <div className="mt-4">
                  <Link href={`/payment?invoiceId=${orderInvoice._id}`}>
                    <Button variant="primary" size="sm">
                      Pay Now
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/order-history">
            <Button variant="secondary">
              Back to Order History
            </Button>
          </Link>
          
          {order.status === 'Completed' && !order.shippingId && (
            <Link href={`/shipping?orderId=${order._id}`}>
              <Button variant="warning">
                Select Shipping Method
              </Button>
            </Link>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}