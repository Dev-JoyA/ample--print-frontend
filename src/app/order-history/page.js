'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import OrderCard from '@/components/cards/OrderCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { orderService } from '@/services/orderService';
import { useAuth, useAuthCheck } from '@/app/lib/auth';

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
  Pending: 'Pending',
  OrderReceived: 'Order Received',
  FilesUploaded: 'Files Uploaded',
  AwaitingInvoice: 'Awaiting Invoice',
  InvoiceSent: 'Invoice Sent',
  DesignUploaded: 'Design Uploaded',
  UnderReview: 'Under Review',
  Approved: 'Approved',
  AwaitingPartPayment: 'Awaiting Part Payment',
  PartPaymentMade: 'Part Payment Made',
  InProduction: 'In Production',
  Completed: 'Completed',
  AwaitingFinalPayment: 'Awaiting Final Payment',
  FinalPaid: 'Final Paid',
  ReadyForShipping: 'Ready For Shipping',
  Shipped: 'Shipped',
  Cancelled: 'Cancelled',
  Delivered: 'Delivered',
};

export default function OrderHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  useAuthCheck(); // This will redirect to login if not authenticated

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Wait for auth to be ready before fetching orders
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchOrders();
    }
  }, [authLoading, isAuthenticated, currentPage, filterStatus]);

  // Handle search with debounce
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      const timeout = setTimeout(() => {
        setCurrentPage(1);
        fetchOrders();
      }, 500);
      
      setSearchTimeout(timeout);
      
      return () => clearTimeout(timeout);
    }
  }, [searchTerm, authLoading, isAuthenticated]);

  const fetchOrders = async () => {
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Build query params for backend
      const params = {
        page: currentPage,
        limit: 10
      };

      // Add status filter if not 'all'
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      // Add search term if present
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      console.log('Fetching orders with params:', params);
      
      const response = await orderService.getMyOrders(params);
      console.log('Orders response:', response);
      
      // Extract orders from response
      let ordersData = [];
      let total = 0;
      let limit = 10;
      
      if (response?.order && Array.isArray(response.order)) {
        ordersData = response.order;
        total = response.total || ordersData.length;
        limit = response.limit || 10;
      } else if (Array.isArray(response)) {
        ordersData = response;
        total = ordersData.length;
      } else if (response?.data?.order) {
        ordersData = response.data.order;
        total = response.data.total || ordersData.length;
        limit = response.data.limit || 10;
      }
      
      setOrders(ordersData);
      setTotalOrders(total);
      setTotalPages(Math.ceil(total / limit) || 1);
      setError('');
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      
      // Handle 401 Unauthorized error
      if (err.status === 401) {
        // Auth check will handle redirect
        console.log('Unauthorized, will redirect to login');
      } else {
        setError('Failed to load order history');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1); // Reset to first page on filter change
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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate stats from ACTUAL orders data
  const stats = {
    total: totalOrders,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    inProduction: orders.filter(o => 
      ['InProduction', 'DesignUploaded', 'Approved'].includes(o.status)
    ).length,
    pending: orders.filter(o => 
      ['Pending', 'OrderReceived', 'FilesUploaded', 'AwaitingInvoice', 'InvoiceSent', 'UnderReview'].includes(o.status)
    ).length,
    paymentPending: orders.filter(o => 
      o.paymentStatus === 'Pending' || 
      o.paymentStatus === 'PartPayment' || 
      o.paymentStatus === 'AwaitingPartPayment' ||
      o.paymentStatus === 'AwaitingFinalPayment'
    ).length
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Checking authentication...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading while orders are being fetched
  if (loading && orders.length === 0) {
    return (
      <DashboardLayout userRole={user?.role}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your order history...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={user?.role}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Order History</h1>
            <p className="text-gray-400">View all your past and current orders</p>
          </div>
          <Link href="/collections/all/products">
            <Button variant="primary" className="gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Order
            </Button>
          </Link>
        </div>

        {/* Stats Cards - Now showing actual counts */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-all">
            <p className="text-sm text-gray-400 mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-all">
            <p className="text-sm text-gray-400 mb-1">Delivered</p>
            <p className="text-2xl font-bold text-green-400">{stats.delivered}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-all">
            <p className="text-sm text-gray-400 mb-1">In Production</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.inProduction}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-all">
            <p className="text-sm text-gray-400 mb-1">Pending</p>
            <p className="text-2xl font-bold text-blue-400">{stats.pending}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-all">
            <p className="text-sm text-gray-400 mb-1">Payment Due</p>
            <p className="text-2xl font-bold text-orange-400">{stats.paymentPending}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by order number or product name..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full"
              icon={
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <select
            value={filterStatus}
            onChange={handleFilterChange}
            className="bg-slate-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-600 min-w-[200px]"
          >
            <option value="all">All Orders</option>
            <option value="Pending">Pending</option>
            <option value="OrderReceived">Order Received</option>
            <option value="FilesUploaded">Files Uploaded</option>
            <option value="AwaitingInvoice">Awaiting Invoice</option>
            <option value="InvoiceSent">Invoice Sent</option>
            <option value="DesignUploaded">Design Uploaded</option>
            <option value="UnderReview">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="AwaitingPartPayment">Awaiting Part Payment</option>
            <option value="PartPaymentMade">Part Payment Made</option>
            <option value="InProduction">In Production</option>
            <option value="Completed">Completed</option>
            <option value="AwaitingFinalPayment">Awaiting Final Payment</option>
            <option value="FinalPaid">Final Paid</option>
            <option value="ReadyForShipping">Ready For Shipping</option>
            <option value="Shipped">Shipped</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        {/* Active Filters Indicator */}
        {(searchTerm || filterStatus !== 'all') && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <span className="text-gray-400">Active filters:</span>
            {searchTerm && (
              <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded-full text-xs border border-red-800">
                Search: "{searchTerm}"
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded-full text-xs border border-red-800">
                Status: {StatusDisplayNames[filterStatus] || filterStatus}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setCurrentPage(1);
              }}
              className="text-xs text-gray-400 hover:text-white underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && orders.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Orders List */}
        {orders.length > 0 ? (
          <div className="space-y-4">
            {/* Search Result Summary */}
            {(searchTerm || filterStatus !== 'all') && (
              <div className="bg-red-900/10 border border-red-800/30 rounded-lg p-4 mb-4">
                <p className="text-gray-300">
                  Found <span className="text-red-400 font-bold">{orders.length}</span> orders 
                  {searchTerm && <span> matching "<span className="text-red-400 font-medium">{searchTerm}</span>"</span>}
                  {filterStatus !== 'all' && <span> with status <span className="text-red-400 font-medium">{StatusDisplayNames[filterStatus] || filterStatus}</span></span>}
                  {totalOrders > orders.length && (
                    <span> (showing page {currentPage} of {totalPages})</span>
                  )}
                </p>
              </div>
            )}
            
            {orders.map((order) => (
              <OrderCard 
                key={order._id} 
                order={{
                  id: order._id,
                  orderNumber: order.orderNumber,
                  productName: order.items?.[0]?.productName || 'Multiple Items',
                  productImage: getImageUrl(order.items?.[0]?.productId?.images?.[0] || order.items?.[0]?.productSnapshot?.image),
                  orderedDate: new Date(order.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  }).replace(/\//g, '-'),
                  totalAmount: order.totalAmount,
                  status: order.status,
                  itemsCount: order.items?.length || 1,
                  paymentStatus: order.paymentStatus
                }}
                onClick={() => router.push(`/orders/${order._id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-gray-800">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-400 text-lg mb-2">No orders found</p>
            <p className="text-gray-500 text-sm mb-6">
              {searchTerm || filterStatus !== 'all'
                ? `No orders matching your ${searchTerm ? 'search' : 'filter'} criteria`
                : 'Start by creating your first order'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Link href="/collections/all/products">
                <Button variant="primary">Browse Products</Button>
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                currentPage === 1
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-white hover:bg-slate-800'
              }`}
            >
              ← Previous
            </button>
            
            <div className="flex items-center gap-2">
              {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 3 + i;
                }
                if (pageNum <= totalPages) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                        currentPage === pageNum
                          ? 'bg-red-600 text-white'
                          : 'text-gray-400 hover:bg-slate-800'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                currentPage === totalPages
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-white hover:bg-slate-800'
              }`}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}