'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { useAuthCheck } from '@/app/lib/auth';
import { shippingService } from '@/services/shippingService';
import { orderService } from '@/services/orderService';
import { invoiceService } from '@/services/invoiceService';
import { METADATA } from '@/lib/metadata';

export default function AdminShippingPage() {
  const router = useRouter();
  useAuthCheck();

  const [shippingRecords, setShippingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingData, setTrackingData] = useState({
    trackingNumber: '',
    carrier: '',
    driverName: '',
    driverPhone: '',
    estimatedDelivery: '',
  });

  const [stats, setStats] = useState({
    total: 0,
    needingInvoice: 0,
    pending: 0,
    shipped: 0,
    delivered: 0,
    pickup: 0,
    delivery: 0,
  });

  useEffect(() => {
    fetchShippingRecords();
  }, [activeTab]);

  const fetchShippingRecords = async () => {
    try {
      setLoading(true);

      let response;
      if (activeTab === 'all') {
        response = await shippingService.getAll({ limit: 100 });
      } else if (activeTab === 'needing-invoice') {
        response = await shippingService.getNeedingInvoice();
      } else if (activeTab === 'pending') {
        response = await shippingService.getPending();
      } else {
        const filterResponse = await shippingService.filter({ status: activeTab });
        response = { data: filterResponse.data };
      }

      const shippingData = response?.data || [];

      const shippingWithDetails = await Promise.all(
        shippingData.map(async (shipping) => {
          let orderDetails = null;
          if (shipping.orderId && typeof shipping.orderId === 'string') {
            try {
              const orderRes = await orderService.getById(shipping.orderId);
              orderDetails = orderRes?.order || orderRes?.data;
            } catch (err) {
              console.error('Failed to fetch order:', err);
            }
          }

          let invoiceStatus = null;
          if (shipping.shippingInvoiceId) {
            try {
              const invoiceRes = await invoiceService.getById(shipping.shippingInvoiceId);
              const invoiceData = invoiceRes?.data || invoiceRes;
              invoiceStatus = invoiceData?.status;
            } catch (err) {
              console.error('Failed to fetch invoice:', err);
            }
          }

          return {
            ...shipping,
            orderDetails,
            invoiceStatus,
          };
        })
      );

      setShippingRecords(shippingWithDetails);
      await fetchStats();
    } catch (err) {
      console.error('Failed to fetch shipping records:', err);
      setError('Failed to load shipping records');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [all, needingInvoice, pending, shipped, delivered] = await Promise.all([
        shippingService.getAll({ limit: 1 }),
        shippingService.getNeedingInvoice(),
        shippingService.getPending(),
        shippingService.filter({ status: 'shipped' }),
        shippingService.filter({ status: 'delivered' }),
      ]);

      const allRecords = await shippingService.getAll({ limit: 1000 });
      const allData = allRecords?.data || [];

      const pickupCount = allData.filter((s) => s.shippingMethod === 'pickup').length;
      const deliveryCount = allData.filter((s) => s.shippingMethod === 'delivery').length;

      setStats({
        total: all?.total || allData.length,
        needingInvoice: needingInvoice?.data?.length || 0,
        pending: pending?.data?.length || 0,
        shipped: shipped?.data?.length || 0,
        delivered: delivered?.data?.length || 0,
        pickup: pickupCount,
        delivery: deliveryCount,
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleGenerateInvoice = async (shipping) => {
    try {
      setUpdatingId(shipping._id);
      const orderId =
        typeof shipping.orderId === 'object' ? shipping.orderId._id : shipping.orderId;
      router.push(
        `/dashboards/admin-dashboard/shipping-invoices/create?shippingId=${shipping._id}&orderId=${orderId}`
      );
    } catch (err) {
      console.error('Failed to generate invoice:', err);
      alert('Failed to generate invoice');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateTracking = async () => {
    if (!trackingData.trackingNumber) {
      alert('Please enter a tracking number');
      return;
    }

    try {
      setUpdatingId(selectedShipping._id);
      await shippingService.updateTracking(selectedShipping._id, {
        trackingNumber: trackingData.trackingNumber,
        carrier: trackingData.carrier,
        driverName: trackingData.driverName,
        driverPhone: trackingData.driverPhone,
        estimatedDelivery: trackingData.estimatedDelivery
          ? new Date(trackingData.estimatedDelivery)
          : undefined,
      });
      setShowTrackingModal(false);
      setSelectedShipping(null);
      setTrackingData({
        trackingNumber: '',
        carrier: '',
        driverName: '',
        driverPhone: '',
        estimatedDelivery: '',
      });
      await fetchShippingRecords();
    } catch (err) {
      console.error('Failed to update tracking:', err);
      alert('Failed to update tracking');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAsShipped = async (shippingId) => {
    try {
      setUpdatingId(shippingId);
      await shippingService.updateStatus(shippingId, 'shipped');
      const shipping = shippingRecords.find((s) => s._id === shippingId);
      if (shipping?.orderId?._id) {
        await orderService.updateStatus(shipping.orderId._id, 'Shipped');
      }
      await fetchShippingRecords();
    } catch (err) {
      console.error('Failed to mark as shipped:', err);
      alert('Failed to mark as shipped');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAsDelivered = async (shippingId) => {
    try {
      setUpdatingId(shippingId);
      await shippingService.updateStatus(shippingId, 'delivered');
      const shipping = shippingRecords.find((s) => s._id === shippingId);
      if (shipping?.orderId?._id) {
        await orderService.updateStatus(shipping.orderId._id, 'Delivered');
      }
      await fetchShippingRecords();
    } catch (err) {
      console.error('Failed to mark as delivered:', err);
      alert('Failed to mark as delivered');
    } finally {
      setUpdatingId(null);
    }
  };

  const getMethodIcon = (method) => (method === 'pickup' ? '🏢' : '🚚');

  const getMethodColor = (method) =>
    method === 'pickup'
      ? 'bg-purple-900/30 text-purple-400 border-purple-700'
      : 'bg-blue-900/30 text-blue-400 border-blue-700';

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
      shipped: 'bg-blue-900/30 text-blue-400 border-blue-700',
      delivered: 'bg-green-900/30 text-green-400 border-green-700',
    };
    return colors[status] || 'bg-gray-900/30 text-gray-400 border-gray-700';
  };

  const getPaymentBadge = (shipping) => {
    if (shipping.shippingMethod === 'pickup') {
      return (
        <span className="rounded-full bg-purple-900/30 px-2 py-1 text-xs font-medium text-purple-400">
          Pickup
        </span>
      );
    }
    if (shipping.metadata?.pickupNotes?.includes('Pay on delivery')) {
      return (
        <span className="rounded-full bg-green-900/30 px-2 py-1 text-xs font-medium text-green-400">
          Pay on Delivery
        </span>
      );
    }
    return (
      <span className="rounded-full bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-400">
        Prepaid
      </span>
    );
  };

  const getActionButtons = (shipping) => {
    const isUpdating = updatingId === shipping._id;

    if (shipping.shippingMethod === 'pickup') {
      return (
        <div className="flex w-full flex-col gap-2">
          {shipping.status === 'pending' && (
            <Button
              variant="success"
              size="sm"
              onClick={() => handleMarkAsDelivered(shipping._id)}
              disabled={isUpdating}
              className="w-full text-sm"
            >
              {isUpdating ? 'Processing...' : '📦 Mark as Picked Up'}
            </Button>
          )}
          {shipping.status === 'delivered' && (
            <span className="rounded-lg border border-green-800 bg-green-900/20 px-4 py-2 text-center text-sm text-green-400">
              ✓ Picked Up
            </span>
          )}
        </div>
      );
    }

    if (shipping.shippingMethod === 'delivery') {
      if (shipping.metadata?.pickupNotes?.includes('Pay on delivery')) {
        return (
          <div className="flex w-full flex-col gap-2">
            {shipping.status === 'pending' && (
              <>
                <Button
                  variant="warning"
                  size="sm"
                  onClick={() => {
                    setSelectedShipping(shipping);
                    setShowTrackingModal(true);
                  }}
                  disabled={isUpdating}
                  className="w-full text-sm"
                >
                  📋 Add Tracking
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleMarkAsShipped(shipping._id)}
                  disabled={isUpdating}
                  className="w-full text-sm"
                >
                  {isUpdating ? 'Processing...' : '🚚 Mark Shipped'}
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleMarkAsDelivered(shipping._id)}
                  disabled={isUpdating}
                  className="w-full text-sm"
                >
                  {isUpdating ? 'Processing...' : '✅ Mark Delivered'}
                </Button>
              </>
            )}
            {shipping.status === 'shipped' && (
              <Button
                variant="success"
                size="sm"
                onClick={() => handleMarkAsDelivered(shipping._id)}
                disabled={isUpdating}
                className="w-full text-sm"
              >
                {isUpdating ? 'Processing...' : '✅ Mark Delivered'}
              </Button>
            )}
            {shipping.status === 'delivered' && (
              <span className="rounded-lg border border-green-800 bg-green-900/20 px-4 py-2 text-center text-sm text-green-400">
                ✓ Delivered
              </span>
            )}
          </div>
        );
      }

      return (
        <div className="flex w-full flex-col gap-2">
          {!shipping.shippingInvoiceId && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleGenerateInvoice(shipping)}
              disabled={isUpdating}
              className="w-full text-sm"
            >
              {isUpdating ? 'Processing...' : '💰 Generate Invoice'}
            </Button>
          )}

          {shipping.shippingInvoiceId && (
            <>
              {shipping.invoiceStatus === 'Sent' && (
                <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-3 text-center">
                  <p className="text-sm font-medium text-yellow-400">Invoice Sent</p>
                  <p className="mt-1 text-xs text-gray-400">Awaiting payment</p>
                </div>
              )}

              {shipping.invoiceStatus === 'Paid' && shipping.status === 'pending' && (
                <>
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => {
                      setSelectedShipping(shipping);
                      setShowTrackingModal(true);
                    }}
                    disabled={isUpdating}
                    className="w-full text-sm"
                  >
                    📋 Add Tracking
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleMarkAsShipped(shipping._id)}
                    disabled={isUpdating}
                    className="w-full text-sm"
                  >
                    {isUpdating ? 'Processing...' : '🚚 Mark Shipped'}
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleMarkAsDelivered(shipping._id)}
                    disabled={isUpdating}
                    className="w-full text-sm"
                  >
                    {isUpdating ? 'Processing...' : '✅ Mark Delivered'}
                  </Button>
                </>
              )}

              {shipping.invoiceStatus === 'Paid' && shipping.status === 'shipped' && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleMarkAsDelivered(shipping._id)}
                  disabled={isUpdating}
                  className="w-full text-sm"
                >
                  {isUpdating ? 'Processing...' : '✅ Mark Delivered'}
                </Button>
              )}
            </>
          )}

          {shipping.status === 'delivered' && (
            <span className="rounded-lg border border-green-800 bg-green-900/20 px-4 py-2 text-center text-sm text-green-400">
              ✓ Delivered
            </span>
          )}
        </div>
      );
    }
  };

  const formatCurrency = (amount) => `₦${amount?.toLocaleString() || '0'}`;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const tabs = [
    { id: 'all', label: 'All Shipping', icon: '📦' },
    { id: 'needing-invoice', label: 'Awaiting Processing', icon: '💰' },
    { id: 'pending', label: 'Pending', icon: '⏳' },
    { id: 'shipped', label: 'Shipped', icon: '🚚' },
    { id: 'delivered', label: 'Delivered', icon: '✅' },
  ];

  if (loading) {
    return (
      <>
        <SEOHead {...METADATA.dashboard.admin} />
        <DashboardLayout userRole="admin">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent sm:h-12 sm:w-12"></div>
              <p className="text-sm text-gray-400 sm:text-base">Loading shipping records...</p>
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
        <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
              Shipping Management
            </h1>
            <p className="text-sm text-gray-400 sm:text-base">
              Manage all shipping, pickups, and deliveries
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 md:grid-cols-4 lg:grid-cols-7">
            <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-slate-900 to-slate-950 p-3 sm:p-4">
              <p className="text-xs text-gray-400 sm:text-sm">Total</p>
              <p className="text-xl font-bold text-white sm:text-2xl">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-yellow-800 bg-gradient-to-br from-slate-900 to-slate-950 p-3 sm:p-4">
              <p className="text-xs text-gray-400 sm:text-sm">Awaiting Processing</p>
              <p className="text-xl font-bold text-yellow-400 sm:text-2xl">
                {stats.needingInvoice}
              </p>
            </div>
            <div className="rounded-xl border border-blue-800 bg-gradient-to-br from-slate-900 to-slate-950 p-3 sm:p-4">
              <p className="text-xs text-gray-400 sm:text-sm">Pending</p>
              <p className="text-xl font-bold text-blue-400 sm:text-2xl">{stats.pending}</p>
            </div>
            <div className="rounded-xl border border-teal-800 bg-gradient-to-br from-slate-900 to-slate-950 p-3 sm:p-4">
              <p className="text-xs text-gray-400 sm:text-sm">Shipped</p>
              <p className="text-xl font-bold text-teal-400 sm:text-2xl">{stats.shipped}</p>
            </div>
            <div className="rounded-xl border border-green-800 bg-gradient-to-br from-slate-900 to-slate-950 p-3 sm:p-4">
              <p className="text-xs text-gray-400 sm:text-sm">Delivered</p>
              <p className="text-xl font-bold text-green-400 sm:text-2xl">{stats.delivered}</p>
            </div>
            <div className="rounded-xl border border-purple-800 bg-gradient-to-br from-slate-900 to-slate-950 p-3 sm:p-4">
              <p className="text-xs text-gray-400 sm:text-sm">Pickup</p>
              <p className="text-xl font-bold text-purple-400 sm:text-2xl">{stats.pickup}</p>
            </div>
            <div className="rounded-xl border border-blue-800 bg-gradient-to-br from-slate-900 to-slate-950 p-3 sm:p-4">
              <p className="text-xs text-gray-400 sm:text-sm">Delivery</p>
              <p className="text-xl font-bold text-blue-400 sm:text-2xl">{stats.delivery}</p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-4 sm:text-sm ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
            <Button
              variant="secondary"
              onClick={fetchShippingRecords}
              size="sm"
              className="ml-auto text-sm"
            >
              Refresh
            </Button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {shippingRecords.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-slate-900/50 p-12 text-center sm:p-16">
              <div className="mb-4 text-5xl opacity-50 sm:text-7xl">🚚</div>
              <h3 className="mb-2 text-xl font-semibold text-white sm:text-2xl">
                No shipping records found
              </h3>
              <p className="text-sm text-gray-400 sm:text-base">
                Shipping records will appear here once customers select shipping methods
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-2">
              {shippingRecords.map((shipping) => {
                const orderId =
                  typeof shipping.orderId === 'object' ? shipping.orderId._id : shipping.orderId;

                return (
                  <div
                    key={shipping._id}
                    className="overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-slate-900 to-slate-950 transition-all hover:border-gray-700 hover:shadow-xl hover:shadow-black/20"
                  >
                    <div className="border-b border-gray-800 p-4 sm:p-5">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xl sm:h-10 sm:w-10 sm:text-2xl">
                            {getMethodIcon(shipping.shippingMethod)}
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-white sm:text-lg">
                              Order #{shipping.orderNumber}
                            </h3>
                            <p className="text-xs text-gray-400">
                              Created {formatDate(shipping.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-medium ${getMethodColor(shipping.shippingMethod)}`}
                          >
                            {shipping.shippingMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(shipping.status)}`}
                          >
                            {shipping.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
                      <div className="rounded-lg bg-slate-800/30 p-3">
                        <p className="mb-2 text-xs text-gray-500">CUSTOMER DETAILS</p>
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {shipping.recipientName || 'N/A'}
                            </p>
                            <p className="text-xs text-gray-400 sm:text-sm">
                              {shipping.recipientPhone}
                            </p>
                          </div>
                          {getPaymentBadge(shipping)}
                        </div>
                      </div>

                      {shipping.address && (
                        <div className="rounded-lg bg-slate-800/30 p-3">
                          <p className="mb-2 text-xs text-gray-500">DELIVERY ADDRESS</p>
                          <p className="text-sm text-white">{shipping.address.street}</p>
                          <p className="text-xs text-gray-400 sm:text-sm">
                            {shipping.address.city}, {shipping.address.state}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-slate-800/30 p-3">
                          <p className="mb-1 text-xs text-gray-500">Invoice</p>
                          {shipping.shippingInvoiceId ? (
                            <div>
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${
                                  shipping.invoiceStatus === 'Paid'
                                    ? 'bg-green-900/30 text-green-400'
                                    : shipping.invoiceStatus === 'Sent'
                                      ? 'bg-yellow-900/30 text-yellow-400'
                                      : 'bg-blue-900/30 text-blue-400'
                                }`}
                              >
                                {shipping.invoiceStatus || 'Generated'}
                              </span>
                            </div>
                          ) : (
                            <p className="text-sm text-yellow-400">None</p>
                          )}
                        </div>

                        <div className="rounded-lg bg-slate-800/30 p-3">
                          <p className="mb-1 text-xs text-gray-500">Tracking</p>
                          {shipping.trackingNumber ? (
                            <div>
                              <p className="truncate text-sm text-white">
                                {shipping.trackingNumber}
                              </p>
                              {shipping.carrier && (
                                <p className="text-xs text-gray-400">{shipping.carrier}</p>
                              )}
                              {shipping.driverName && (
                                <p className="text-xs text-gray-400">
                                  Driver: {shipping.driverName}
                                </p>
                              )}
                              {shipping.driverPhone && (
                                <p className="text-xs text-gray-400">
                                  Contact: {shipping.driverPhone}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">Not added</p>
                          )}
                        </div>

                        <div className="rounded-lg bg-slate-800/30 p-3 sm:col-span-2">
                          <p className="mb-1 text-xs text-gray-500">Shipping Cost</p>
                          <p className="text-lg font-bold text-primary sm:text-xl">
                            {formatCurrency(shipping.shippingCost)}
                          </p>
                        </div>

                        {shipping.metadata?.pickupNotes && (
                          <div className="rounded-lg bg-slate-800/30 p-3 sm:col-span-2">
                            <p className="mb-1 text-xs text-gray-500">Notes</p>
                            <p className="text-sm text-gray-300">{shipping.metadata.pickupNotes}</p>
                          </div>
                        )}
                      </div>

                      <div className="pt-2">{getActionButtons(shipping)}</div>

                      {orderId && (
                        <div className="text-right">
                          <Link
                            href={`/dashboards/admin-dashboard/orders/${orderId}`}
                            className="text-xs text-primary hover:text-primary-dark"
                          >
                            View Order Details →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showTrackingModal && selectedShipping && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="w-full max-w-lg rounded-xl border border-gray-800 bg-slate-900">
                <div className="border-b border-gray-800 p-5 sm:p-6">
                  <h3 className="text-lg font-bold text-white sm:text-xl">
                    Add Tracking Information
                  </h3>
                  <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                    Order #{selectedShipping.orderNumber}
                  </p>
                </div>

                <div className="space-y-4 p-5 sm:p-6">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                      Tracking Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={trackingData.trackingNumber}
                      onChange={(e) =>
                        setTrackingData({ ...trackingData, trackingNumber: e.target.value })
                      }
                      placeholder="Enter tracking number"
                      className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-sm text-white sm:py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                      Carrier
                    </label>
                    <input
                      type="text"
                      value={trackingData.carrier}
                      onChange={(e) =>
                        setTrackingData({ ...trackingData, carrier: e.target.value })
                      }
                      placeholder="e.g., DHL, FedEx, UPS"
                      className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-sm text-white sm:py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                      Driver Name
                    </label>
                    <input
                      type="text"
                      value={trackingData.driverName}
                      onChange={(e) =>
                        setTrackingData({ ...trackingData, driverName: e.target.value })
                      }
                      placeholder="Enter driver's name"
                      className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-sm text-white sm:py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                      Driver Phone Number
                    </label>
                    <input
                      type="tel"
                      value={trackingData.driverPhone}
                      onChange={(e) =>
                        setTrackingData({ ...trackingData, driverPhone: e.target.value })
                      }
                      placeholder="Enter driver's phone number"
                      className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-sm text-white sm:py-3"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-300 sm:text-sm">
                      Estimated Delivery Date
                    </label>
                    <input
                      type="date"
                      value={trackingData.estimatedDelivery}
                      onChange={(e) =>
                        setTrackingData({ ...trackingData, estimatedDelivery: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-700 bg-slate-800 px-4 py-2 text-sm text-white sm:py-3"
                    />
                  </div>

                  <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowTrackingModal(false);
                        setSelectedShipping(null);
                        setTrackingData({
                          trackingNumber: '',
                          carrier: '',
                          driverName: '',
                          driverPhone: '',
                          estimatedDelivery: '',
                        });
                      }}
                      className="flex-1 text-sm"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleUpdateTracking}
                      disabled={!trackingData.trackingNumber || updatingId === selectedShipping._id}
                      className="flex-1 text-sm"
                    >
                      {updatingId === selectedShipping._id ? 'Saving...' : 'Save Tracking'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}
