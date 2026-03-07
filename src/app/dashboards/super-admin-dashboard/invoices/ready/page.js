'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { invoiceService } from '@/services/invoiceService';
import { orderService } from '@/services/orderService';
import { customerBriefService } from '@/services/customerBriefService';

export default function ReadyForInvoicePage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchReadyOrders();
  }, []);

  const fetchReadyOrders = async () => {
    try {
      setLoading(true);
      const response = await invoiceService.getOrdersReadyForInvoice({ limit: 50 });
      setOrders(response?.orders || []);
    } catch (err) {
      console.error('Failed to fetch ready orders:', err);
      setError('Failed to load orders ready for invoice');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      setLoadingDetails(true);
      setSelectedOrder(orderId);
      
      // Fetch order details
      const orderResponse = await orderService.getById(orderId);
      const orderData = orderResponse?.order || orderResponse?.data || orderResponse;
      
      // Fetch briefs for each product
      const itemsWithBriefs = await Promise.all(
        orderData.items.map(async (item) => {
          const productId = item.productId._id || item.productId;
          try {
            const briefResponse = await customerBriefService.getByOrderAndProduct(orderId, productId);
            const briefs = briefResponse?.data;
            
            // Determine brief status
            let briefStatus = 'no-brief';
            if (briefs?.customer) {
              if (briefs.admin || briefs.superAdmin) {
                briefStatus = 'responded';
              } else if (briefs.customer.viewed) {
                briefStatus = 'viewed';
              } else {
                briefStatus = 'pending';
              }
            }
            
            return {
              ...item,
              briefs: briefs,
              briefStatus
            };
          } catch (err) {
            console.log(`No brief for product ${productId}`);
            return {
              ...item,
              briefs: null,
              briefStatus: 'no-brief'
            };
          }
        })
      );
      
      setOrderDetails({
        ...orderData,
        items: itemsWithBriefs
      });
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      alert('Failed to load order details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateInvoice = (orderId) => {
    router.push(`/dashboards/super-admin-dashboard/invoices/create?orderId=${orderId}`);
  };

  const getBriefStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-600/20 text-yellow-400';
      case 'responded': return 'bg-green-600/20 text-green-400';
      case 'viewed': return 'bg-purple-600/20 text-purple-400';
      default: return 'bg-gray-600/20 text-gray-400';
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const getCustomerName = (order) => {
    if (order.userId?.fullname) return order.userId.fullname;
    if (order.userId?.email) return order.userId.email.split('@')[0];
    return 'Customer';
  };

  if (loading) {
    return (
      <DashboardLayout userRole="super-admin">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-white">Loading orders ready for invoice...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="super-admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Ready for Invoice</h1>
            <p className="text-gray-400">Orders that are ready for invoice generation</p>
          </div>
          <Button variant="secondary" onClick={() => router.push('/dashboards/super-admin-dashboard/invoices')}>
            View All Invoices
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Orders Grid */}
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-gray-800">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-white mb-2">No orders ready for invoice</h3>
            <p className="text-gray-400">Orders become ready when all products have briefs that don't need response</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden hover:border-primary/50 transition cursor-pointer group"
                onClick={() => fetchOrderDetails(order._id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-mono text-primary">#{order.orderNumber}</p>
                      <h3 className="text-white font-semibold mt-1">{getCustomerName(order)}</h3>
                    </div>
                    <StatusBadge status={order.status} className="text-xs" />
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-400">
                      {order.items?.length} product{order.items?.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateInvoice(order._id);
                    }}
                  >
                    Create Invoice
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && orderDetails && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-slate-900 border-b border-gray-800 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Order Products & Briefs</h2>
                  <p className="text-sm text-gray-400 mt-1">Order #{orderDetails.orderNumber}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setOrderDetails(null);
                  }}
                  className="text-gray-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {loadingDetails ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    {/* Customer Info */}
                    <div className="bg-slate-800/30 rounded-lg p-4">
                      <h3 className="text-white font-medium mb-2">Customer</h3>
                      <p className="text-white">{getCustomerName(orderDetails)}</p>
                      <p className="text-sm text-gray-400">{orderDetails.userId?.email}</p>
                    </div>

                    {/* Products with Briefs */}
                    <div>
                      <h3 className="text-white font-medium mb-4">Products & Briefs</h3>
                      <div className="space-y-4">
                        {orderDetails.items.map((item, index) => (
                          <div key={index} className="bg-slate-800/30 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="text-white font-medium">{item.productName}</h4>
                                <p className="text-sm text-gray-400">
                                  Quantity: {item.quantity} × ₦{item.price.toLocaleString()}
                                </p>
                              </div>
                              <p className="text-primary font-bold">
                                ₦{(item.price * item.quantity).toLocaleString()}
                              </p>
                            </div>

                            {/* Brief Status */}
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm text-gray-400">Brief status:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBriefStatusColor(item.briefStatus)}`}>
                                {item.briefStatus === 'no-brief' ? 'No Brief Required' :
                                 item.briefStatus === 'pending' ? 'Needs Response' :
                                 item.briefStatus === 'responded' ? 'Responded' : 'Viewed'}
                              </span>
                            </div>

                            {/* Brief Details (if exists) */}
                            {item.briefs?.customer && (
                              <div className="mt-3 pt-3 border-t border-gray-700">
                                <p className="text-xs text-primary mb-2">Customer Brief:</p>
                                <p className="text-sm text-gray-300 line-clamp-2">
                                  {item.briefs.customer.description || 'No description'}
                                </p>
                                {item.briefs.customer.image && (
                                  <span className="text-xs text-blue-400 mt-1 inline-block">📷 Has image</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Total */}
                    <div className="bg-slate-800/30 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">Order Total</span>
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(orderDetails.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        variant="primary"
                        size="lg"
                        className="flex-1"
                        onClick={() => {
                          setSelectedOrder(null);
                          setOrderDetails(null);
                          router.push(`/dashboards/super-admin-dashboard/invoices/create?orderId=${orderDetails._id}`);
                        }}
                      >
                        Create Invoice
                      </Button>
                      <Button
                        variant="secondary"
                        size="lg"
                        className="flex-1"
                        onClick={() => {
                          setSelectedOrder(null);
                          setOrderDetails(null);
                        }}
                      >
                        Close
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}