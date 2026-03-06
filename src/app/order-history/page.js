'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import OrderCard from '@/components/cards/OrderCard';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { orderService } from '@/services/orderService';
import { useAuthCheck } from '@/app/lib/auth';

export default function OrderHistoryPage() {
  const router = useRouter();
  useAuthCheck();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Fetch orders when page, filter, or search changes
  useEffect(() => {
    fetchOrders();
  }, [currentPage, filterStatus, searchTerm]);

  const fetchOrders = async () => {
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
      setError('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on new search
    
    // Debounce search to avoid too many API calls
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Wait 500ms after user stops typing before searching
    const timeout = setTimeout(() => {
      if (value.trim() !== searchTerm.trim() || value === '') {
        fetchOrders();
      }
    }, 500);
    
    setSearchTimeout(timeout);
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

  // Calculate stats from filtered orders
  const stats = {
    total: totalOrders,
    delivered: orders.filter(o => o.status === 'Delivered').length,
    processing: orders.filter(o => ['InProduction', 'DesignUploaded', 'Approved'].includes(o.status)).length,
    pending: orders.filter(o => ['Pending', 'OrderReceived', 'FilesUploaded'].includes(o.status)).length
  };

  if (loading && orders.length === 0) {
    return (
      <DashboardLayout userRole="customer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your order history...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Order History</h1>
            <p className="text-gray-400">View all your past and current orders</p>
          </div>
          <Link href="/collections">
            <Button variant="primary" className="gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Order
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
            <p className="text-sm text-gray-400 mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
            <p className="text-sm text-gray-400 mb-1">Delivered</p>
            <p className="text-2xl font-bold text-green-400">{stats.delivered}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
            <p className="text-sm text-gray-400 mb-1">In Production</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.processing}</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-4">
            <p className="text-sm text-gray-400 mb-1">Pending</p>
            <p className="text-2xl font-bold text-blue-400">{stats.pending}</p>
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
            />
          </div>
          <select
            value={filterStatus}
            onChange={handleFilterChange}
            className="bg-slate-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Orders</option>
            <option value="Pending">Pending</option>
            <option value="OrderReceived">Order Received</option>
            <option value="FilesUploaded">Files Uploaded</option>
            <option value="DesignUploaded">Design Uploaded</option>
            <option value="UnderReview">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="InProduction">In Production</option>
            <option value="Completed">Completed</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        {/* Active Filters Indicator */}
        {(searchTerm || filterStatus !== 'all') && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <span className="text-gray-400">Active filters:</span>
            {searchTerm && (
              <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                Search: "{searchTerm}"
              </span>
            )}
            {filterStatus !== 'all' && (
              <span className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                Status: {filterStatus}
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
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Orders List */}
        {orders.length > 0 ? (
          <div className="space-y-4">
            {/* Search Result Summary */}
            {(searchTerm || filterStatus !== 'all') && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                <p className="text-gray-300">
                  Found <span className="text-primary font-bold">{orders.length}</span> orders 
                  {searchTerm && <span> matching "<span className="text-primary font-medium">{searchTerm}</span>"</span>}
                  {filterStatus !== 'all' && <span> with status <span className="text-primary font-medium">{filterStatus}</span></span>}
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
              <Link href="/collections">
                <Button variant="primary">Browse Products</Button>
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
            <div className="flex items-center gap-2">
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
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
                      currentPage === i + 1
                        ? 'bg-primary text-white'
                        : 'text-gray-400 hover:bg-slate-800'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
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
            
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}