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
import { customerBriefService } from '@/services/customerBriefService';

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;
  useAuthCheck();
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [shipping, setShipping] = useState(null);
  const [itemsWithBriefs, setItemsWithBriefs] = useState([]);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [expandedBrief, setExpandedBrief] = useState(null);

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
      
      // Fetch invoice if exists
      if (orderData?.invoiceId) {
        try {
          const invoiceId = typeof orderData.invoiceId === 'object' 
            ? orderData.invoiceId._id || orderData.invoiceId 
            : orderData.invoiceId;
          
          if (invoiceId && typeof invoiceId === 'string') {
            const invoiceResponse = await invoiceService.getById(invoiceId);
            const invoiceData = invoiceResponse?.data || invoiceResponse;
            setInvoice(invoiceData);
          }
        } catch (err) {
          console.error('Failed to fetch invoice:', err);
        }
      }
      
      // Fetch shipping if exists
      if (orderData?.shippingId) {
        try {
          const shippingId = typeof orderData.shippingId === 'object' 
            ? orderData.shippingId._id || orderData.shippingId 
            : orderData.shippingId;
          
          if (shippingId && typeof shippingId === 'string') {
            const shippingResponse = await shippingService.getById(shippingId);
            const shippingData = shippingResponse?.data || shippingResponse;
            setShipping(shippingData);
          }
        } catch (err) {
          console.error('Failed to fetch shipping:', err);
        }
      }
      
      // Fetch briefs for each item
      if (orderData?.items) {
        const itemsWithBriefsData = await Promise.all(
          orderData.items.map(async (item) => {
            const productId = item.productId?._id || item.productId;
            try {
              const briefResponse = await customerBriefService.getByOrderAndProduct(orderId, productId);
              const briefData = briefResponse?.data || briefResponse;
              
              return {
                ...item,
                hasBrief: !!briefData?.customer,
                hasAdminResponse: !!briefData?.admin,
                briefId: briefData?.customer?._id,
                briefConversation: briefData
              };
            } catch (err) {
              return {
                ...item,
                hasBrief: false,
                hasAdminResponse: false,
                briefId: null,
                briefConversation: null
              };
            }
          })
        );
        setItemsWithBriefs(itemsWithBriefsData);
      }
      
    } catch (err) {
      console.error('Failed to fetch order:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      await orderService.updateStatus(orderId, newStatus);
      await fetchOrderDetails();
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCustomerName = () => {
    if (!order) return 'Customer';
    if (order.userId?.fullname) return order.userId.fullname;
    if (order.userId?.email) return order.userId.email.split('@')[0];
    return 'Customer';
  };

  const getCustomerEmail = () => {
    return order?.userId?.email || 'N/A';
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

  const getNextStatusAction = () => {
    if (!order) return null;
    
    const actions = {
      'Approved': { label: 'Start Production', status: 'InProduction', color: 'primary' },
      'InProduction': { label: 'Complete Production', status: 'Completed', color: 'success' },
      'Completed': order.paymentStatus === 'Completed' 
        ? { label: 'Ready for Shipping', status: 'ReadyForShipping', color: 'success' }
        : { label: 'Await Balance', status: 'AwaitingFinalPayment', color: 'warning' },
      'ReadyForShipping': { label: 'Mark Shipped', status: 'Shipped', color: 'primary' },
      'Shipped': { label: 'Mark Delivered', status: 'Delivered', color: 'success' },
    };
    
    return actions[order.status] || null;
  };

  const nextAction = getNextStatusAction();

  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading order details...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout userRole="admin">
        <div className="max-w-7xl mx-auto px-4 py-8">
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
    <DashboardLayout userRole="admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <span className="text-4xl">📦</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Order Details</h1>
                <p className="text-gray-400 text-lg">Order #{order.orderNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={order.status} size="lg" />
              {nextAction && (
                <Button
                  variant={nextAction.color}
                  onClick={() => handleUpdateStatus(nextAction.status)}
                  disabled={updating}
                >
                  {updating ? 'Updating...' : nextAction.label}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 mb-6">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-4 px-1 font-medium text-sm border-b-2 transition ${
                activeTab === 'details'
                  ? 'border-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Order Details
            </button>
            <button
              onClick={() => setActiveTab('briefs')}
              className={`pb-4 px-1 font-medium text-sm border-b-2 transition ${
                activeTab === 'briefs'
                  ? 'border-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Customer Briefs
              {itemsWithBriefs.some(i => i.hasBrief) && (
                <span className="ml-2 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                  {itemsWithBriefs.filter(i => i.hasBrief).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`pb-4 px-1 font-medium text-sm border-b-2 transition ${
                activeTab === 'shipping'
                  ? 'border-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
              disabled={!shipping}
            >
              Shipping Info
              {shipping && (
                <span className="ml-2 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                  Active
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('invoice')}
              className={`pb-4 px-1 font-medium text-sm border-b-2 transition ${
                activeTab === 'invoice'
                  ? 'border-primary text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
              disabled={!invoice}
            >
              Invoice
              {invoice && (
                <span className="ml-2 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                  {invoice.status}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Order Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Customer Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Name</p>
                  <p className="text-white text-lg">{getCustomerName()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Email</p>
                  <p className="text-white text-lg">{getCustomerEmail()}</p>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(order.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Amount Paid</p>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(order.amountPaid || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Remaining Balance</p>
                  <p className={`text-2xl font-bold ${order.remainingBalance > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                    {formatCurrency(order.remainingBalance || 0)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Payment Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    order.paymentStatus === 'Completed' 
                      ? 'bg-green-900/50 text-green-400 border border-green-700' 
                      : order.paymentStatus === 'PartPayment'
                      ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
                      : 'bg-gray-900/50 text-gray-400 border border-gray-700'
                  }`}>
                    {order.paymentStatus || 'Pending'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Order Date</p>
                  <p className="text-white">{formatDate(order.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Items</h2>
              <div className="space-y-4">
                {itemsWithBriefs.map((item, index) => (
                  <div key={index} className="bg-slate-800/30 rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-white font-medium text-lg">{item.productName}</h3>
                        <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                        {item.productSnapshot?.material && (
                          <p className="text-xs text-gray-500 mt-1">Material: {item.productSnapshot.material}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-bold text-xl">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                        <p className="text-xs text-gray-400">{formatCurrency(item.price)} each</p>
                      </div>
                    </div>
                    
                    {/* Brief Indicator */}
                    {item.hasBrief && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <button
                          onClick={() => setExpandedBrief(expandedBrief === index ? null : index)}
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition"
                        >
                          <span>📋</span>
                          <span className="text-sm">View Customization Brief</span>
                          {item.hasAdminResponse && (
                            <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">
                              Admin Responded
                            </span>
                          )}
                        </button>
                        
                        {expandedBrief === index && item.briefConversation?.customer && (
                          <div className="mt-3 bg-slate-900/50 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-2">Customer Request:</p>
                            <p className="text-sm text-white mb-3">
                              {item.briefConversation.customer.description || 'No description'}
                            </p>
                            {item.briefConversation.customer.image && (
                              <a 
                                href={item.briefConversation.customer.image}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300"
                              >
                                📷 View Reference Image
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Briefs Tab */}
        {activeTab === 'briefs' && (
          <div className="space-y-6">
            {itemsWithBriefs.filter(i => i.hasBrief).length === 0 ? (
              <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-12 text-center">
                <div className="text-6xl mb-4 opacity-50">📋</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Customization Briefs</h3>
                <p className="text-gray-400">This order has no customization briefs yet</p>
              </div>
            ) : (
              itemsWithBriefs.filter(i => i.hasBrief).map((item, index) => (
                <div key={index} className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">{item.productName}</h3>
                  
                  {/* Customer Brief */}
                  {item.briefConversation?.customer && (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-blue-400 bg-blue-900/30 px-2 py-1 rounded-full">Customer</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(item.briefConversation.customer.createdAt)}
                        </span>
                      </div>
                      <div className="bg-slate-800/30 rounded-lg p-4">
                        <p className="text-white whitespace-pre-wrap mb-3">
                          {item.briefConversation.customer.description || 'No description provided'}
                        </p>
                        
                        {/* Attachments */}
                        <div className="flex flex-wrap gap-2">
                          {item.briefConversation.customer.image && (
                            <a href={item.briefConversation.customer.image} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                              <span>📷</span> Reference Image
                            </a>
                          )}
                          {item.briefConversation.customer.logo && (
                            <a href={item.briefConversation.customer.logo} target="_blank" rel="noopener noreferrer"
                               className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300">
                              <span>🎨</span> Logo
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Response */}
                  {item.briefConversation?.admin && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-green-400 bg-green-900/30 px-2 py-1 rounded-full">Admin</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(item.briefConversation.admin.createdAt)}
                        </span>
                      </div>
                      <div className="bg-slate-800/30 rounded-lg p-4">
                        <p className="text-white whitespace-pre-wrap">
                          {item.briefConversation.admin.description || 'No response description'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Shipping Tab */}
        {activeTab === 'shipping' && shipping && (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Shipping Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Shipping Method</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  shipping.shippingMethod === 'pickup' 
                    ? 'bg-purple-900/50 text-purple-400 border border-purple-700'
                    : 'bg-blue-900/50 text-blue-400 border border-blue-700'
                }`}>
                  {shipping.shippingMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                </span>
              </div>
              
              <div>
                <p className="text-sm text-gray-400 mb-1">Shipping Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  shipping.status === 'delivered' 
                    ? 'bg-green-900/50 text-green-400 border border-green-700'
                    : shipping.status === 'shipped'
                    ? 'bg-blue-900/50 text-blue-400 border border-blue-700'
                    : 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
                }`}>
                  {shipping.status}
                </span>
              </div>
            </div>

            {shipping.shippingMethod === 'delivery' && (
              <>
                <div className="mt-6">
                  <p className="text-sm text-gray-400 mb-1">Recipient</p>
                  <p className="text-white">{shipping.recipientName}</p>
                  <p className="text-sm text-gray-400">{shipping.recipientPhone}</p>
                </div>

                {shipping.address && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-1">Delivery Address</p>
                    <p className="text-white">
                      {shipping.address.street}, {shipping.address.city}, {shipping.address.state}
                    </p>
                  </div>
                )}
              </>
            )}

            {shipping.shippingMethod === 'pickup' && (
              <div className="mt-6">
                <p className="text-sm text-gray-400 mb-1">Pickup Location</p>
                <p className="text-white">5, Boyle Street, Somolu, Lagos</p>
              </div>
            )}

            {shipping.trackingNumber && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-1">Tracking Number</p>
                <p className="text-white">{shipping.trackingNumber}</p>
                {shipping.carrier && (
                  <p className="text-sm text-gray-400">Carrier: {shipping.carrier}</p>
                )}
              </div>
            )}

            {shipping.metadata?.pickupNotes && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-1">Notes</p>
                <p className="text-white bg-slate-800/30 rounded-lg p-3">{shipping.metadata.pickupNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* Invoice Tab */}
        {activeTab === 'invoice' && invoice && (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Invoice Details</h2>
              <Link href={`/dashboards/admin-dashboard/invoices/${invoice._id}`}>
                <Button variant="secondary" size="sm">
                  View Full Invoice
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Invoice Number</p>
                <p className="text-white text-lg">{invoice.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Invoice Type</p>
                <p className="text-white text-lg capitalize">{invoice.invoiceType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <StatusBadge status={invoice.status} />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(invoice.totalAmount)}</p>
              </div>
            </div>

            {invoice.items && (
              <div className="mt-6">
                <p className="text-sm text-gray-400 mb-3">Items</p>
                <div className="space-y-2">
                  {invoice.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                      <span className="text-white">{item.description}</span>
                      <span className="text-primary font-medium">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}