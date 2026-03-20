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
    estimatedDelivery: ''
  });

  const [stats, setStats] = useState({
    total: 0,
    needingInvoice: 0,
    pending: 0,
    shipped: 0,
    delivered: 0,
    pickup: 0,
    delivery: 0
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
            invoiceStatus
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
        shippingService.filter({ status: 'delivered' })
      ]);
      
      const allRecords = await shippingService.getAll({ limit: 1000 });
      const allData = allRecords?.data || [];
      
      const pickupCount = allData.filter(s => s.shippingMethod === 'pickup').length;
      const deliveryCount = allData.filter(s => s.shippingMethod === 'delivery').length;
      
      setStats({
        total: all?.total || allData.length,
        needingInvoice: needingInvoice?.data?.length || 0,
        pending: pending?.data?.length || 0,
        shipped: shipped?.data?.length || 0,
        delivered: delivered?.data?.length || 0,
        pickup: pickupCount,
        delivery: deliveryCount
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleGenerateInvoice = async (shipping) => {
    try {
      setUpdatingId(shipping._id);
      const orderId = typeof shipping.orderId === 'object' 
        ? shipping.orderId._id 
        : shipping.orderId;
      router.push(`/dashboards/admin-dashboard/shipping-invoices/create?shippingId=${shipping._id}&orderId=${orderId}`);
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
        estimatedDelivery: trackingData.estimatedDelivery ? new Date(trackingData.estimatedDelivery) : undefined
      });
      setShowTrackingModal(false);
      setSelectedShipping(null);
      setTrackingData({ trackingNumber: '', carrier: '', estimatedDelivery: '' });
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
      const shipping = shippingRecords.find(s => s._id === shippingId);
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
      const shipping = shippingRecords.find(s => s._id === shippingId);
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

  const getMethodIcon = (method) => method === 'pickup' ? '🏢' : '🚚';

  const getMethodColor = (method) => method === 'pickup' 
    ? 'bg-purple-900/30 text-purple-400 border-purple-700' 
    : 'bg-blue-900/30 text-blue-400 border-blue-700';

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-900/30 text-yellow-400 border-yellow-700',
      'shipped': 'bg-blue-900/30 text-blue-400 border-blue-700',
      'delivered': 'bg-green-900/30 text-green-400 border-green-700'
    };
    return colors[status] || 'bg-gray-900/30 text-gray-400 border-gray-700';
  };

  const getPaymentBadge = (shipping) => {
    if (shipping.shippingMethod === 'pickup') {
      return (
        <span className="px-2 py-1 bg-purple-900/30 text-purple-400 rounded-full text-xs font-medium">
          Pickup
        </span>
      );
    }
    if (shipping.metadata?.pickupNotes?.includes('Pay on delivery')) {
      return (
        <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-medium">
          Pay on Delivery
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded-full text-xs font-medium">
        Prepaid
      </span>
    );
  };

  const getActionButtons = (shipping) => {
    const isUpdating = updatingId === shipping._id;
    
    if (shipping.shippingMethod === 'pickup') {
      return (
        <div className="flex flex-col gap-2 w-full">
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
            <span className="text-sm text-green-400 bg-green-900/20 px-4 py-2 rounded-lg text-center border border-green-800">
              ✓ Picked Up
            </span>
          )}
        </div>
      );
    }
    
    if (shipping.shippingMethod === 'delivery') {
      if (shipping.metadata?.pickupNotes?.includes('Pay on delivery')) {
        return (
          <div className="flex flex-col gap-2 w-full">
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
              <span className="text-sm text-green-400 bg-green-900/20 px-4 py-2 rounded-lg text-center border border-green-800">
                ✓ Delivered
              </span>
            )}
          </div>
        );
      }
      
      return (
        <div className="flex flex-col gap-2 w-full">
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
                <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-3 text-center">
                  <p className="text-yellow-400 text-sm font-medium">Invoice Sent</p>
                  <p className="text-xs text-gray-400 mt-1">Awaiting payment</p>
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
            <span className="text-sm text-green-400 bg-green-900/20 px-4 py-2 rounded-lg text-center border border-green-800">
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
      day: 'numeric' 
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
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400 text-sm sm:text-base">Loading shipping records...</p>
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
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Shipping Management</h1>
            <p className="text-gray-400 text-sm sm:text-base">Manage all shipping, pickups, and deliveries</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-gray-800 p-3 sm:p-4">
              <p className="text-gray-400 text-xs sm:text-sm">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-yellow-800 p-3 sm:p-4">
              <p className="text-gray-400 text-xs sm:text-sm">Awaiting Processing</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-400">{stats.needingInvoice}</p>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-blue-800 p-3 sm:p-4">
              <p className="text-gray-400 text-xs sm:text-sm">Pending</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-400">{stats.pending}</p>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-teal-800 p-3 sm:p-4">
              <p className="text-gray-400 text-xs sm:text-sm">Shipped</p>
              <p className="text-xl sm:text-2xl font-bold text-teal-400">{stats.shipped}</p>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-green-800 p-3 sm:p-4">
              <p className="text-gray-400 text-xs sm:text-sm">Delivered</p>
              <p className="text-xl sm:text-2xl font-bold text-green-400">{stats.delivered}</p>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-purple-800 p-3 sm:p-4">
              <p className="text-gray-400 text-xs sm:text-sm">Pickup</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-400">{stats.pickup}</p>
            </div>
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-xl border border-blue-800 p-3 sm:p-4">
              <p className="text-gray-400 text-xs sm:text-sm">Delivery</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-400">{stats.delivery}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1 sm:gap-2 ${
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
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {shippingRecords.length === 0 ? (
            <div className="bg-slate-900/50 rounded-xl border border-gray-800 p-12 sm:p-16 text-center">
              <div className="text-5xl sm:text-7xl mb-4 opacity-50">🚚</div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">No shipping records found</h3>
              <p className="text-gray-400 text-sm sm:text-base">
                Shipping records will appear here once customers select shipping methods
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              {shippingRecords.map((shipping) => {
                const orderId = typeof shipping.orderId === 'object' 
                  ? shipping.orderId._id 
                  : shipping.orderId;
                
                return (
                  <div
                    key={shipping._id}
                    className="bg-gradient-to-br from-slate-900 to-slate-950 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all hover:shadow-xl hover:shadow-black/20"
                  >
                    <div className="p-4 sm:p-5 border-b border-gray-800">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center text-xl sm:text-2xl">
                            {getMethodIcon(shipping.shippingMethod)}
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-white">
                              Order #{shipping.orderNumber}
                            </h3>
                            <p className="text-xs text-gray-400">
                              Created {formatDate(shipping.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getMethodColor(shipping.shippingMethod)}`}>
                            {shipping.shippingMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(shipping.status)}`}>
                            {shipping.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
                      <div className="bg-slate-800/30 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-2">CUSTOMER DETAILS</p>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <p className="text-white font-medium text-sm">{shipping.recipientName || 'N/A'}</p>
                            <p className="text-xs sm:text-sm text-gray-400">{shipping.recipientPhone}</p>
                          </div>
                          {getPaymentBadge(shipping)}
                        </div>
                      </div>

                      {shipping.address && (
                        <div className="bg-slate-800/30 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-2">DELIVERY ADDRESS</p>
                          <p className="text-white text-sm">
                            {shipping.address.street}
                          </p>
                          <p className="text-gray-400 text-xs sm:text-sm">
                            {shipping.address.city}, {shipping.address.state}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-slate-800/30 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Invoice</p>
                          {shipping.shippingInvoiceId ? (
                            <div>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                shipping.invoiceStatus === 'Paid' 
                                  ? 'bg-green-900/30 text-green-400' 
                                  : shipping.invoiceStatus === 'Sent'
                                  ? 'bg-yellow-900/30 text-yellow-400'
                                  : 'bg-blue-900/30 text-blue-400'
                              }`}>
                                {shipping.invoiceStatus || 'Generated'}
                              </span>
                            </div>
                          ) : (
                            <p className="text-sm text-yellow-400">None</p>
                          )}
                        </div>

                        <div className="bg-slate-800/30 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Tracking</p>
                          {shipping.trackingNumber ? (
                            <div>
                              <p className="text-sm text-white truncate">{shipping.trackingNumber}</p>
                              {shipping.carrier && (
                                <p className="text-xs text-gray-400">{shipping.carrier}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">Not added</p>
                          )}
                        </div>

                        <div className="bg-slate-800/30 rounded-lg p-3 sm:col-span-2">
                          <p className="text-xs text-gray-500 mb-1">Shipping Cost</p>
                          <p className="text-lg sm:text-xl font-bold text-primary">
                            {formatCurrency(shipping.shippingCost)}
                          </p>
                        </div>

                        {shipping.metadata?.pickupNotes && (
                          <div className="bg-slate-800/30 rounded-lg p-3 sm:col-span-2">
                            <p className="text-xs text-gray-500 mb-1">Notes</p>
                            <p className="text-sm text-gray-300">{shipping.metadata.pickupNotes}</p>
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        {getActionButtons(shipping)}
                      </div>

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
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-900 rounded-xl border border-gray-800 max-w-lg w-full">
                <div className="p-5 sm:p-6 border-b border-gray-800">
                  <h3 className="text-lg sm:text-xl font-bold text-white">Add Tracking Information</h3>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Order #{selectedShipping.orderNumber}
                  </p>
                </div>
                
                <div className="p-5 sm:p-6 space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Tracking Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={trackingData.trackingNumber}
                      onChange={(e) => setTrackingData({ ...trackingData, trackingNumber: e.target.value })}
                      placeholder="Enter tracking number"
                      className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 sm:py-3 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Carrier
                    </label>
                    <input
                      type="text"
                      value={trackingData.carrier}
                      onChange={(e) => setTrackingData({ ...trackingData, carrier: e.target.value })}
                      placeholder="e.g., DHL, FedEx, UPS"
                      className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 sm:py-3 text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Estimated Delivery Date
                    </label>
                    <input
                      type="date"
                      value={trackingData.estimatedDelivery}
                      onChange={(e) => setTrackingData({ ...trackingData, estimatedDelivery: e.target.value })}
                      className="w-full bg-slate-800 border border-gray-700 rounded-lg px-4 py-2 sm:py-3 text-white text-sm"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowTrackingModal(false);
                        setSelectedShipping(null);
                        setTrackingData({ trackingNumber: '', carrier: '', estimatedDelivery: '' });
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