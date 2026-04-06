'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { orderService } from '@/services/orderService';
import { useAuthCheck } from '@/app/lib/auth';
import { METADATA } from '@/lib/metadata';

function AdminOrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  
  useAuthCheck();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState(filterParam || 'all');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    setActiveFilter(filterParam || 'all');
    setCurrentPage(1);
  }, [filterParam]);

  useEffect(() => {
    fetchOrders();
  }, [activeFilter, currentPage, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: 10
      };

      switch(activeFilter) {
        case 'paid':
          params.paymentStatus = 'Completed';
          break;
        case 'design-ready':
          params.status = 'DesignUploaded';
          break;
        case 'ready-to-ship':
          params.status = 'ReadyForShipping';
          break;
        case 'completed':
          params.status = 'Delivered';
          break;
      }

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      console.log('Fetching orders with params:', params);
      
      const response = await orderService.getAll(params);
      console.log('Orders response:', response);
      
      let ordersData = [];
      if (response?.order && Array.isArray(response.order)) {
        ordersData = response.order;
        setTotalOrders(response.total || ordersData.length);
        setTotalPages(Math.ceil((response.total || ordersData.length) / (response.limit || 10)) || 1);
      } else if (Array.isArray(response)) {
        ordersData = response;
        setTotalOrders(ordersData.length);
        setTotalPages(1);
      }
      
      setOrders(ordersData);
      setError('');
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
    
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => fetchOrders(), 500);
    setSearchTimeout(timeout);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseModal = () => {
    setSelectedOrder(null);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCustomerName = (order) => {
    if (order.userId?.profile) {
      const profile = order.userId.profile;
      if (profile.firstName || profile.lastName) {
        return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
      }
      if (profile.userName) {
        return profile.userName;
      }
    }
    if (order.userId?.email) return order.userId.email.split('@')[0];
    return 'Customer';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActiveFilter('all');
    router.push('/dashboards/admin-dashboard/orders?filter=all');
  };

  const getFilterTitle = () => {
    switch(activeFilter) {
      case 'paid': return 'Paid Orders';
      case 'design-ready': return 'Design Ready Orders';
      case 'ready-to-ship': return 'Ready to Ship Orders';
      case 'completed': return 'Completed Orders';
      default: return 'All Orders';
    }
  };

  if (loading && orders.length === 0) {
    return (
      <>
        <SEOHead {...METADATA.dashboard.admin} />
        <DashboardLayout userRole="admin">
          <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
            <div className="flex justify-center items-center min-h-[60vh]">
              <div className="relative text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-gray-400 mt-4 text-sm sm:text-base">Loading orders...</p>
              </div>
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
        <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Orders</h1>
                <p className="text-gray-400 text-sm sm:text-base">View and manage all customer orders</p>
              </div>
              <Link href="/dashboards/admin-dashboard">
                <Button variant="secondary" className="gap-2 text-sm sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l2-2m-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  Back to Dashboard
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => router.push('/dashboards/admin-dashboard/orders?filter=all')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                  activeFilter === 'all' 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                }`}
              >
                All Orders
              </button>
              <button
                onClick={() => router.push('/dashboards/admin-dashboard/orders?filter=paid')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                  activeFilter === 'paid' 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' 
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                }`}
              >
                Paid Orders
              </button>
              <button
                onClick={() => router.push('/dashboards/admin-dashboard/orders?filter=design-ready')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                  activeFilter === 'design-ready' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                }`}
              >
                Design Ready
              </button>
              <button
                onClick={() => router.push('/dashboards/admin-dashboard/orders?filter=ready-to-ship')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                  activeFilter === 'ready-to-ship' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                }`}
              >
                Ready to Ship
              </button>
              <button
                onClick={() => router.push('/dashboards/admin-dashboard/orders?filter=completed')}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                  activeFilter === 'completed' 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' 
                    : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                }`}
              >
                Completed
              </button>
            </div>

            <div className="mb-6">
              <div className="relative">
                <Input
                  placeholder="Search by order number, customer name, or product name..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-10 text-sm"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {(activeFilter !== 'all' || searchTerm) && (
              <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-300">
                  {activeFilter !== 'all' && <span>Showing <span className="text-primary font-semibold">{getFilterTitle()}</span></span>}
                  {activeFilter !== 'all' && searchTerm && <span> </span>}
                  {searchTerm && <span>matching "<span className="text-primary">{searchTerm}</span>"</span>}
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            {loading && orders.length === 0 && (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {!loading && orders.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      onClick={() => handleViewOrder(order)}
                      className="bg-slate-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer group"
                    >
                      <div className="p-4 sm:p-5 border-b border-gray-800">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <span className="text-xs sm:text-sm font-mono text-primary group-hover:text-primary-light transition">
                            #{order.orderNumber}
                          </span>
                          <StatusBadge status={order.status} className="text-xs" />
                        </div>
                        <h3 className="text-white font-semibold truncate text-sm sm:text-base">
                          {getCustomerName(order)}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">
                          {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div className="p-4 sm:p-5 space-y-3">
                        <div className="space-y-2">
                          {order.items?.slice(0, 2).map((item, idx) => (
                            <div key={idx} className="text-xs sm:text-sm text-gray-300 flex justify-between">
                              <span className="truncate flex-1">• {item.productName}</span>
                              <span className="text-gray-400 ml-2">×{item.quantity}</span>
                            </div>
                          ))}
                          {order.items?.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{order.items.length - 2} more items
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                          <div>
                            <p className="text-xs text-gray-500">Total Amount</p>
                            <p className="text-base sm:text-lg font-bold text-primary">
                              {formatCurrency(order.totalAmount)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Payment</p>
                            <span className={`inline-block px-1.5 sm:px-2 py-1 rounded-full text-xs font-medium ${
                              order.paymentStatus === 'Completed' ? 'bg-green-600/20 text-green-400' :
                              order.paymentStatus === 'PartPayment' ? 'bg-yellow-600/20 text-yellow-400' :
                              'bg-gray-600/20 text-gray-400'
                            }`}>
                              {order.paymentStatus || 'Pending'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 sm:gap-4 mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                        currentPage === 1
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-white hover:bg-slate-800'
                      }`}
                    >
                      Previous
                    </button>
                    <span className="text-xs sm:text-sm text-gray-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                        currentPage === totalPages
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-white hover:bg-slate-800'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}

            {!loading && orders.length === 0 && (
              <div className="text-center py-12 sm:py-16 bg-slate-900/30 rounded-xl border border-gray-800">
                <div className="text-5xl sm:text-6xl mb-4">📦</div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No orders found</h3>
                <p className="text-sm sm:text-base text-gray-400 mb-6">
                  {searchTerm 
                    ? `No orders match "${searchTerm}"`
                    : activeFilter !== 'all'
                    ? `No ${activeFilter.replace('-', ' ')} orders found`
                    : 'No orders have been placed yet'}
                </p>
                {(searchTerm || activeFilter !== 'all') && (
                  <Button 
                    variant="primary" 
                    onClick={clearFilters}
                    className="text-sm"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}

            {selectedOrder && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div className="bg-slate-900 rounded-2xl border border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-slate-900 border-b border-gray-800 p-4 sm:p-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white">Order Details</h2>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">#{selectedOrder.orderNumber}</p>
                    </div>
                    <button
                      onClick={handleCloseModal}
                      className="text-gray-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                    <div className="bg-slate-800/30 rounded-lg p-4">
                      <h3 className="text-white font-medium mb-3 flex items-center gap-2 text-sm sm:text-base">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Customer Information
                      </h3>
                      <div className="space-y-2">
                        <p className="text-white text-sm sm:text-base">{getCustomerName(selectedOrder)}</p>
                        <p className="text-xs sm:text-sm text-gray-400">{selectedOrder.userId?.email || 'No email'}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-white font-medium mb-3 flex items-center gap-2 text-sm sm:text-base">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Order Items
                      </h3>
                      <div className="space-y-3">
                        {selectedOrder.items?.map((item, index) => (
                          <div key={index} className="bg-slate-800/30 rounded-lg p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                              <div className="flex-1">
                                <h4 className="text-white font-medium text-sm sm:text-base">{item.productName}</h4>
                                <p className="text-xs sm:text-sm text-gray-400">
                                  Quantity: {item.quantity} × ₦{item.price.toLocaleString()}
                                </p>
                              </div>
                              <p className="text-primary font-bold text-sm sm:text-base">
                                ₦{(item.price * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-4">
                      <h3 className="text-white font-medium mb-3 flex items-center gap-2 text-sm sm:text-base">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Order Summary
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-400">Subtotal</span>
                          <span className="text-white">{formatCurrency(selectedOrder.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-400">Amount Paid</span>
                          <span className="text-green-400">{formatCurrency(selectedOrder.amountPaid || 0)}</span>
                        </div>
                        {selectedOrder.remainingBalance > 0 && (
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-gray-400">Remaining Balance</span>
                            <span className="text-yellow-400">{formatCurrency(selectedOrder.remainingBalance)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-700">
                          <span className="text-white font-medium text-sm sm:text-base">Total</span>
                          <span className="text-lg sm:text-xl font-bold text-primary">{formatCurrency(selectedOrder.totalAmount)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-400 mb-1">Order Status</p>
                          <StatusBadge status={selectedOrder.status} />
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs sm:text-sm text-gray-400 mb-1">Payment Status</p>
                          <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                            selectedOrder.paymentStatus === 'Completed' ? 'bg-green-600/20 text-green-400' :
                            selectedOrder.paymentStatus === 'PartPayment' ? 'bg-yellow-600/20 text-yellow-400' :
                            'bg-gray-600/20 text-gray-400'
                          }`}>
                            {selectedOrder.paymentStatus || 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link href={`/dashboards/admin-dashboard/design-upload?orderId=${selectedOrder._id}`} className="flex-1">
                        <Button variant="primary" size="lg" className="w-full text-sm">
                          Upload Design
                        </Button>
                      </Link>
                      <Button 
                        variant="secondary" 
                        size="lg" 
                        onClick={handleCloseModal}
                        className="flex-1 text-sm"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={null}>
      <AdminOrdersPageContent />
    </Suspense>
  );
}