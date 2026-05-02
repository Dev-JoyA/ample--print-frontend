'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { invoiceService } from '@/services/invoiceService';
import { shippingService } from '@/services/shippingService';
import { customerBriefService } from '@/services/customerBriefService';
import { profileService } from '@/services/profileService';
import { METADATA } from '@/lib/metadata';
import { getImageUrl } from '@/lib/imageUtils';

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;
  useAuthCheck();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [shipping, setShipping] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [itemsWithBriefs, setItemsWithBriefs] = useState([]);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [expandedProductBrief, setExpandedProductBrief] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);

      const orderResponse = await orderService.getById(orderId);
      const orderData = orderResponse?.order || orderResponse?.data || orderResponse;

      if (!orderData) throw new Error('Order not found');

      setOrder(orderData);

      // Fetch customer profile
      if (orderData?.userId) {
        const rawUserId =
          typeof orderData.userId === 'object'
            ? orderData.userId._id || orderData.userId
            : orderData.userId;
        const userIdStr = rawUserId?.toString ? rawUserId.toString() : rawUserId;

        if (userIdStr) {
          try {
            const profileResponse = await profileService.getUserById(userIdStr);
            const userData = profileResponse?.user || profileResponse?.data || profileResponse;
            if (userData) setCustomerProfile(userData);
          } catch (err) {
            console.error('Failed to fetch customer profile:', err);
          }
        }
      }

      // Fetch invoice by orderId directly
      try {
        const invoiceResponse = await invoiceService.getByOrderId(orderId);
        const invoiceData = invoiceResponse?.data || invoiceResponse?.invoice || invoiceResponse;
        if (invoiceData && invoiceData._id) setInvoice(invoiceData);
      } catch (err) {
        console.error('No invoice found for order:', err);
      }

      // Fetch shipping by orderId directly
      try {
        const shippingResponse = await shippingService.getByOrderId(orderId);
        const shippingData =
          shippingResponse?.data || shippingResponse?.shipping || shippingResponse;
        if (shippingData && shippingData._id) setShipping(shippingData);
      } catch (err) {
        console.error('No shipping found for order:', err);
      }

      // Fetch briefs per item
      if (orderData?.items) {
        const itemsWithBriefsData = await Promise.all(
          orderData.items.map(async (item) => {
            const productId = item.productId?._id || item.productId;
            try {
              const briefResponse = await customerBriefService.getByOrderAndProduct(
                orderId,
                productId
              );
              const briefData = briefResponse?.data || briefResponse;

              let customerBrief = null;
              let adminBrief = null;
              let allMessages = [];

              if (Array.isArray(briefData)) {
                allMessages = briefData;
                customerBrief = briefData.find((b) => b.role === 'customer');
                adminBrief = briefData.find((b) => b.role === 'admin' || b.role === 'super-admin');
              } else if (briefData?.customer) {
                customerBrief = briefData.customer;
                adminBrief = briefData.admin || briefData.superAdmin;
                allMessages = [customerBrief, adminBrief].filter(Boolean);
              }

              allMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

              return {
                ...item,
                hasBrief: !!customerBrief,
                hasAdminResponse: !!adminBrief,
                briefId: customerBrief?._id,
                customerBrief,
                adminBrief,
                allMessages,
                briefConversation: briefData,
              };
            } catch {
              return {
                ...item,
                hasBrief: false,
                hasAdminResponse: false,
                briefId: null,
                customerBrief: null,
                adminBrief: null,
                allMessages: [],
                briefConversation: null,
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

  const formatCurrency = (amount) => `₦${amount?.toLocaleString() || '0'}`;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCustomerName = () => {
    if (customerProfile?.firstName || customerProfile?.lastName) {
      return `${customerProfile.firstName || ''} ${customerProfile.lastName || ''}`.trim();
    }
    if (customerProfile?.fullname) return customerProfile.fullname;
    const userId = order?.userId;
    if (typeof userId === 'object') {
      if (userId?.fullname) return userId.fullname;
      if (userId?.email) return userId.email.split('@')[0];
    }
    return 'Customer';
  };

  const getCustomerEmail = () => {
    if (customerProfile?.email) return customerProfile.email;
    const userId = order?.userId;
    if (typeof userId === 'object' && userId?.email) return userId.email;
    return 'N/A';
  };

  const getRoleBadge = (role) => {
    const roleLower = role?.toLowerCase();
    switch (roleLower) {
      case 'customer':
        return (
          <span className="rounded-full bg-blue-600/20 px-2 py-1 text-xs font-medium text-blue-400">
            Customer
          </span>
        );
      case 'admin':
        return (
          <span className="rounded-full bg-green-600/20 px-2 py-1 text-xs font-medium text-green-400">
            Admin
          </span>
        );
      case 'super-admin':
      case 'superadmin':
        return (
          <span className="rounded-full bg-purple-600/20 px-2 py-1 text-xs font-medium text-purple-400">
            Super Admin
          </span>
        );
      default:
        return null;
    }
  };

  const getNextStatusAction = () => {
    if (!order) return null;
    const actions = {
      Approved: { label: 'Start Production', status: 'InProduction', color: 'primary' },
      InProduction: { label: 'Complete Production', status: 'Completed', color: 'success' },
      Completed:
        order.paymentStatus === 'Completed'
          ? { label: 'Ready for Shipping', status: 'ReadyForShipping', color: 'success' }
          : { label: 'Await Balance', status: 'AwaitingFinalPayment', color: 'warning' },
      ReadyForShipping: { label: 'Mark Shipped', status: 'Shipped', color: 'primary' },
      Shipped: { label: 'Mark Delivered', status: 'Delivered', color: 'success' },
    };
    return actions[order.status] || null;
  };

  const nextAction = getNextStatusAction();

  const renderAttachment = (url, label) => {
    if (!url) return null;
    return (
      <a
        href={getImageUrl(url)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
      >
        <span>📎</span> {label}
      </a>
    );
  };

  if (loading) {
    return (
      <>
        <SEOHead {...METADATA.dashboard.admin} />
        <DashboardLayout userRole="admin">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent sm:h-16 sm:w-16"></div>
                <p className="text-gray-400">Loading order details...</p>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <SEOHead {...METADATA.dashboard.admin} />
        <DashboardLayout userRole="admin">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="py-16 text-center">
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
      </>
    );
  }

  return (
    <>
      <SEOHead {...METADATA.dashboard.admin} />
      <DashboardLayout userRole="admin">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="text-sm sm:text-base">Back to Orders</span>
            </button>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 sm:h-16 sm:w-16">
                  <span className="text-2xl sm:text-4xl">📦</span>
                </div>
                <div>
                  <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
                    Order Details
                  </h1>
                  <p className="text-sm text-gray-400 sm:text-base lg:text-lg">
                    Order #{order.orderNumber}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
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

          <div className="mb-6 overflow-x-auto border-b border-gray-800">
            <nav className="flex min-w-max gap-4 sm:gap-6">
              {[
                { key: 'details', label: 'Order Details' },
                {
                  key: 'briefs',
                  label: 'Customer Briefs',
                  badge: itemsWithBriefs.filter((i) => i.hasBrief).length || null,
                },
                {
                  key: 'shipping',
                  label: 'Shipping Info',
                  badge: shipping ? shipping.status : null,
                  disabled: !shipping,
                },
                {
                  key: 'invoice',
                  label: 'Invoice',
                  badge: invoice ? invoice.status : null,
                  disabled: !invoice,
                },
              ].map(({ key, label, badge, disabled }) => (
                <button
                  key={key}
                  onClick={() => !disabled && setActiveTab(key)}
                  disabled={disabled}
                  className={`border-b-2 px-1 pb-4 text-xs font-medium transition sm:text-sm ${
                    activeTab === key
                      ? 'border-primary text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {label}
                  {badge && (
                    <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs text-primary sm:ml-2 sm:px-2">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'details' && (
            <div className="space-y-5 sm:space-y-6">
              <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-5 backdrop-blur-sm sm:p-6">
                <h2 className="mb-4 text-base font-semibold text-white sm:text-lg">
                  Customer Information
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                  <div>
                    <p className="mb-1 text-xs text-gray-400 sm:text-sm">Name</p>
                    <p className="text-base text-white sm:text-lg">{getCustomerName()}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-gray-400 sm:text-sm">Email</p>
                    <p className="text-base text-white sm:text-lg">{getCustomerEmail()}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-5 backdrop-blur-sm sm:p-6">
                <h2 className="mb-4 text-base font-semibold text-white sm:text-lg">
                  Order Summary
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
                  <div>
                    <p className="mb-1 text-xs text-gray-400 sm:text-sm">Total Amount</p>
                    <p className="text-2xl font-bold text-primary sm:text-3xl">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-gray-400 sm:text-sm">Amount Paid</p>
                    <p className="text-xl font-bold text-green-400 sm:text-2xl">
                      {formatCurrency(order.amountPaid || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-gray-400 sm:text-sm">Remaining Balance</p>
                    <p
                      className={`text-xl font-bold sm:text-2xl ${order.remainingBalance > 0 ? 'text-yellow-400' : 'text-green-400'}`}
                    >
                      {formatCurrency(order.remainingBalance || 0)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                  <div>
                    <p className="mb-1 text-xs text-gray-400 sm:text-sm">Payment Status</p>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium sm:text-sm ${
                        order.paymentStatus === 'Completed'
                          ? 'border border-green-700 bg-green-900/50 text-green-400'
                          : order.paymentStatus === 'PartPayment'
                            ? 'border border-yellow-700 bg-yellow-900/50 text-yellow-400'
                            : 'border border-gray-700 bg-gray-900/50 text-gray-400'
                      }`}
                    >
                      {order.paymentStatus || 'Pending'}
                    </span>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-gray-400 sm:text-sm">Order Date</p>
                    <p className="text-sm text-white sm:text-base">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-5 backdrop-blur-sm sm:p-6">
                <h2 className="mb-4 text-base font-semibold text-white sm:text-lg">Items</h2>
                <div className="space-y-4">
                  {itemsWithBriefs.map((item, index) => (
                    <div key={index} className="rounded-lg bg-slate-800/30 p-4">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex-1">
                          <h3 className="text-base font-medium text-white sm:text-lg">
                            {item.productName}
                          </h3>
                          <p className="text-xs text-gray-400 sm:text-sm">
                            Quantity: {item.quantity}
                          </p>
                          {item.productSnapshot?.material && (
                            <p className="mt-1 text-xs text-gray-500">
                              Material: {item.productSnapshot.material}
                            </p>
                          )}
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-lg font-bold text-primary sm:text-xl">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                          <p className="text-xs text-gray-400">{formatCurrency(item.price)} each</p>
                        </div>
                      </div>

                      {item.hasBrief && (
                        <div className="mt-3 border-t border-gray-700 pt-3">
                          <button
                            onClick={() =>
                              setExpandedProductBrief(expandedProductBrief === index ? null : index)
                            }
                            className="flex items-center gap-2 text-sm text-blue-400 transition hover:text-blue-300"
                          >
                            <span>📋</span>
                            <span>View Full Conversation</span>
                            {item.hasAdminResponse && (
                              <span className="rounded-full bg-green-900/30 px-2 py-0.5 text-xs text-green-400">
                                Admin Responded
                              </span>
                            )}
                          </button>

                          {expandedProductBrief === index && item.allMessages.length > 0 && (
                            <div className="mt-4 max-h-96 space-y-4 overflow-y-auto">
                              {item.allMessages.map((msg, idx) => (
                                <div
                                  key={idx}
                                  className={`flex ${msg.role === 'customer' ? 'justify-start' : 'justify-end'}`}
                                >
                                  <div
                                    className={`max-w-[85%] rounded-xl p-3 ${msg.role === 'customer' ? 'border border-blue-800/50 bg-blue-900/20' : 'border border-green-800/50 bg-green-900/20'}`}
                                  >
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                      {getRoleBadge(msg.role)}
                                      <span className="text-xs text-gray-500">
                                        {formatDate(msg.createdAt)}
                                      </span>
                                      {msg.hasOwnDesign === true && (
                                        <span className="text-xs text-green-400">
                                          ✓ Has own design
                                        </span>
                                      )}
                                      {msg.hasOwnDesign === false && (
                                        <span className="text-xs text-yellow-400">
                                          ✏️ Needs design assistance
                                        </span>
                                      )}
                                    </div>
                                    {msg.description && (
                                      <p className="mb-2 whitespace-pre-wrap text-sm text-white">
                                        {msg.description}
                                      </p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                      {msg.image && renderAttachment(msg.image, 'Image')}
                                      {msg.logo && renderAttachment(msg.logo, 'Logo')}
                                      {msg.voiceNote &&
                                        renderAttachment(msg.voiceNote, 'Voice Note')}
                                      {msg.video && renderAttachment(msg.video, 'Video')}
                                    </div>
                                  </div>
                                </div>
                              ))}
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

          {activeTab === 'briefs' && (
            <div className="space-y-5 sm:space-y-6">
              {itemsWithBriefs.filter((i) => i.hasBrief).length === 0 ? (
                <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-8 text-center backdrop-blur-sm sm:p-12">
                  <div className="mb-4 text-5xl opacity-50 sm:text-6xl">📋</div>
                  <h3 className="mb-2 text-lg font-semibold text-white sm:text-xl">
                    No Customization Briefs
                  </h3>
                  <p className="text-sm text-gray-400 sm:text-base">
                    This order has no customization briefs yet
                  </p>
                </div>
              ) : (
                itemsWithBriefs
                  .filter((i) => i.hasBrief)
                  .map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-gray-800 bg-slate-900/50 p-5 backdrop-blur-sm sm:p-6"
                    >
                      <h3 className="mb-4 text-base font-semibold text-white sm:text-lg">
                        {item.productName}
                      </h3>
                      <div className="max-h-96 space-y-4 overflow-y-auto">
                        {item.allMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${msg.role === 'customer' ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-xl p-3 ${msg.role === 'customer' ? 'border border-blue-800/50 bg-blue-900/20' : 'border border-green-800/50 bg-green-900/20'}`}
                            >
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                {getRoleBadge(msg.role)}
                                <span className="text-xs text-gray-500">
                                  {formatDate(msg.createdAt)}
                                </span>
                                {msg.hasOwnDesign === true && (
                                  <span className="text-xs text-green-400">✓ Has own design</span>
                                )}
                                {msg.hasOwnDesign === false && (
                                  <span className="text-xs text-yellow-400">
                                    ✏️ Needs design assistance
                                  </span>
                                )}
                              </div>
                              {msg.description && (
                                <p className="mb-2 whitespace-pre-wrap text-sm text-white">
                                  {msg.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                {msg.image && renderAttachment(msg.image, 'Image')}
                                {msg.logo && renderAttachment(msg.logo, 'Logo')}
                                {msg.voiceNote && renderAttachment(msg.voiceNote, 'Voice Note')}
                                {msg.video && renderAttachment(msg.video, 'Video')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {activeTab === 'shipping' && shipping && (
            <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-5 backdrop-blur-sm sm:p-6">
              <h2 className="mb-4 text-base font-semibold text-white sm:text-lg">
                Shipping Information
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                <div>
                  <p className="mb-1 text-xs text-gray-400 sm:text-sm">Shipping Method</p>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium sm:text-sm ${shipping.shippingMethod === 'pickup' ? 'border border-purple-700 bg-purple-900/50 text-purple-400' : 'border border-blue-700 bg-blue-900/50 text-blue-400'}`}
                  >
                    {shipping.shippingMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                  </span>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-400 sm:text-sm">Shipping Status</p>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium sm:text-sm ${
                      shipping.status === 'delivered'
                        ? 'border border-green-700 bg-green-900/50 text-green-400'
                        : shipping.status === 'shipped'
                          ? 'border border-blue-700 bg-blue-900/50 text-blue-400'
                          : 'border border-yellow-700 bg-yellow-900/50 text-yellow-400'
                    }`}
                  >
                    {shipping.status}
                  </span>
                </div>
              </div>

              {shipping.shippingMethod === 'delivery' && (
                <>
                  <div className="mt-5 sm:mt-6">
                    <p className="mb-1 text-xs text-gray-400 sm:text-sm">Recipient</p>
                    <p className="text-sm text-white sm:text-base">{shipping.recipientName}</p>
                    <p className="text-xs text-gray-400 sm:text-sm">{shipping.recipientPhone}</p>
                  </div>
                  {shipping.address && (
                    <div className="mt-4">
                      <p className="mb-1 text-xs text-gray-400 sm:text-sm">Delivery Address</p>
                      <p className="text-sm text-white">
                        {shipping.address.street}, {shipping.address.city}, {shipping.address.state}
                      </p>
                    </div>
                  )}
                </>
              )}

              {shipping.shippingMethod === 'pickup' && (
                <div className="mt-5 sm:mt-6">
                  <p className="mb-1 text-xs text-gray-400 sm:text-sm">Pickup Location</p>
                  <p className="text-sm text-white">5, Boyle Street, Somolu, Lagos</p>
                </div>
              )}

              {shipping.trackingNumber && (
                <div className="mt-4">
                  <p className="mb-1 text-xs text-gray-400 sm:text-sm">Tracking Number</p>
                  <p className="font-mono text-sm text-white">{shipping.trackingNumber}</p>
                  {shipping.carrier && (
                    <p className="mt-1 text-xs text-gray-400">Carrier: {shipping.carrier}</p>
                  )}
                  {shipping.driverName && (
                    <p className="text-xs text-gray-400">Driver: {shipping.driverName}</p>
                  )}
                  {shipping.driverPhone && (
                    <p className="text-xs text-gray-400">Driver Phone: {shipping.driverPhone}</p>
                  )}
                </div>
              )}

              {shipping.metadata?.pickupNotes && (
                <div className="mt-4">
                  <p className="mb-1 text-xs text-gray-400 sm:text-sm">Notes</p>
                  <p className="rounded-lg bg-slate-800/30 p-3 text-sm text-white">
                    {shipping.metadata.pickupNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'invoice' && invoice && (
            <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-5 backdrop-blur-sm sm:p-6">
              <div className="mb-5 flex flex-col justify-between gap-4 sm:mb-6 sm:flex-row sm:items-center">
                <h2 className="text-base font-semibold text-white sm:text-lg">Invoice Details</h2>
                <Link href={`/dashboards/admin-dashboard/invoices/${invoice._id}`}>
                  <Button variant="secondary" size="sm">
                    View Full Invoice
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                <div>
                  <p className="mb-1 text-xs text-gray-400 sm:text-sm">Invoice Number</p>
                  <p className="text-sm text-white sm:text-base">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-400 sm:text-sm">Invoice Type</p>
                  <p className="text-sm capitalize text-white sm:text-base">
                    {invoice.invoiceType}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-400 sm:text-sm">Status</p>
                  <StatusBadge status={invoice.status} />
                </div>
                <div>
                  <p className="mb-1 text-xs text-gray-400 sm:text-sm">Total Amount</p>
                  <p className="text-xl font-bold text-primary sm:text-2xl">
                    {formatCurrency(invoice.totalAmount)}
                  </p>
                </div>
              </div>

              {invoice.items && (
                <div className="mt-5 sm:mt-6">
                  <p className="mb-3 text-xs text-gray-400 sm:text-sm">Items</p>
                  <div className="space-y-2">
                    {invoice.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-slate-800/30 p-3"
                      >
                        <span className="text-sm text-white">{item.description}</span>
                        <span className="text-sm font-medium text-primary">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
