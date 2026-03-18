'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { orderService } from '@/services/orderService';

const SearchBar = ({ 
  placeholder = 'Search orders by number...', 
  userRole = 'customer'
}) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  // Only show for admin and super-admin
  if (userRole === 'customer') {
    return (
      <div className="my-3 ml-[12rem] flex-1 max-w-2xl">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Track your order..."
            className="w-[20rem] pl-10 pr-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl text-white text-[14px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            onFocus={() => router.push('/order-tracking')}
            readOnly
          />
        </div>
      </div>
    );
  }

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3) {
        searchOrders();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const searchOrders = async () => {
    if (query.length < 3) return;
    
    setLoading(true);
    try {
      let orders = [];
      
      // Check if query looks like an order number (contains ORD-)
      const isOrderNumber = query.toUpperCase().includes('ORD-');
      
      if (isOrderNumber) {
        // Try exact match first
        try {
          const response = await orderService.searchByOrderNumber(query.toUpperCase());
          const orderData = response?.order || response?.data || response;
          if (orderData) {
            orders = [orderData];
          }
        } catch (err) {
          console.log('Order not found by exact number');
          
          // If exact match fails, try searching by partial order number
          try {
            const filterResponse = await orderService.filter({ 
              search: query.toUpperCase(),
              limit: 10
            });
            orders = filterResponse?.order || [];
          } catch (filterErr) {
            console.log('No orders found');
          }
        }
      } else {
        // Search by customer name/email
        const response = await orderService.filter({ 
          search: query,
          limit: 10
        });
        orders = response?.order || [];
      }
      
      setResults(orders);
      setShowResults(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    // Convert to uppercase for order numbers
    const value = e.target.value.toUpperCase();
    setQuery(value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.length >= 3) {
      searchOrders();
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

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'text-yellow-400',
      'OrderReceived': 'text-blue-400',
      'FilesUploaded': 'text-purple-400',
      'AwaitingInvoice': 'text-orange-400',
      'InvoiceSent': 'text-red-400',
      'DesignUploaded': 'text-indigo-400',
      'UnderReview': 'text-yellow-400',
      'Approved': 'text-green-400',
      'InProduction': 'text-blue-400',
      'Completed': 'text-green-400',
      'Shipped': 'text-teal-400',
      'Delivered': 'text-green-400',
      'Cancelled': 'text-red-400'
    };
    return colors[status] || 'text-gray-400';
  };

  return (
    <div ref={searchRef} className="relative my-3 ml-[12rem] flex-1 max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-200">
          {loading ? (
            <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder={placeholder}
          className="w-[20rem] pl-10 pr-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl text-white text-[14px] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent uppercase"
          style={{ textTransform: 'uppercase' }}
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e1e1e] border border-[#333333] rounded-xl shadow-2xl max-h-[70vh] overflow-y-auto z-50">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span>📦</span> Orders ({results.length})
            </h3>
            <div className="space-y-3">
              {results.map((order) => (
                <div key={order._id} className="bg-[#2a2a2a] rounded-lg overflow-hidden">
                  {/* Order Summary */}
                  <Link href={`/dashboards/${userRole === 'super-admin' ? 'super' : 'admin'}-dashboard/orders/${order._id}`}>
                    <div className="p-3 hover:bg-[#3a3a3a] transition cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-lg">📦</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{order.orderNumber}</p>
                            <p className="text-xs text-gray-400">
                              {getCustomerName(order)} • {order.items?.length} items
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-primary font-bold text-sm">{formatCurrency(order.totalAmount)}</p>
                          <span className={`text-xs ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {showResults && query.length >= 3 && results.length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e1e1e] border border-[#333333] rounded-xl shadow-2xl p-8 text-center z-50">
          <p className="text-gray-400">No orders found for "{query}"</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;