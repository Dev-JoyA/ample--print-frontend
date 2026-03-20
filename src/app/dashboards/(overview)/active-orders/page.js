'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import OrderCard from '@/components/cards/OrderCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SEOHead from '@/components/common/SEOHead';
import { METADATA } from '@/lib/metadata';
import { useProtectedRoute } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';

const OrderStatus = {
  Pending: "Pending",
  OrderReceived: "OrderReceived",
  FilesUploaded: "FilesUploaded",
  AwaitingInvoice: "AwaitingInvoice",
  InvoiceSent: "InvoiceSent",
  DesignUploaded: "DesignUploaded",
  UnderReview: "UnderReview",
  Approved: "Approved",
  AwaitingPartPayment: "AwaitingPartPayment",
  PartPaymentMade: "PartPaymentMade",
  InProduction: "InProduction",
  Completed: "Completed",
  AwaitingFinalPayment: "AwaitingFinalPayment",
  FinalPaid: "FinalPaid",
  ReadyForShipping: "ReadyForShipping",
  Shipped: "Shipped",
  Cancelled: "Cancelled",
  Delivered: "Delivered",
};

const ACTIVE_STATUSES = [
  OrderStatus.Pending,
  OrderStatus.OrderReceived,
  OrderStatus.FilesUploaded,
  OrderStatus.AwaitingInvoice,
  OrderStatus.InvoiceSent,
  OrderStatus.DesignUploaded,
  OrderStatus.UnderReview,
  OrderStatus.Approved,
  OrderStatus.AwaitingPartPayment,
  OrderStatus.PartPaymentMade,
  OrderStatus.InProduction,
  OrderStatus.AwaitingFinalPayment,
  OrderStatus.FinalPaid,
];

const EDITABLE_STATUSES = [
  OrderStatus.Pending,
  OrderStatus.OrderReceived,
  OrderStatus.FilesUploaded
];

export default function ActiveOrdersPage() {
  const router = useRouter();
  const { isLoading: authLoading, user } = useProtectedRoute({
    redirectTo: '/auth/sign-in'
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [addingToOrder, setAddingToOrder] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchActiveOrders();
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => 
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items?.some(item => 
          item.productName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders]);

  const fetchActiveOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching active orders for user:', user?._id);
      
      let ordersData = [];
      
      try {
        console.log('Attempting getUserActiveOrders...');
        const response = await orderService.getUserActiveOrders();
        console.log('getUserActiveOrders response:', response);
        
        if (response.orders && Array.isArray(response.orders)) {
          ordersData = response.orders;
          console.log('Found orders in response.orders:', ordersData.length);
        } else if (response.data?.orders && Array.isArray(response.data.orders)) {
          ordersData = response.data.orders;
          console.log('Found orders in response.data.orders:', ordersData.length);
        } else if (Array.isArray(response)) {
          ordersData = response;
          console.log('Found orders in response array:', ordersData.length);
        } else if (response.data && Array.isArray(response.data)) {
          ordersData = response.data;
          console.log('Found orders in response.data:', ordersData.length);
        }
      } catch (err) {
        console.log('getUserActiveOrders failed:', err.message);
      }
      
      if (ordersData.length === 0) {
        try {
          console.log('Attempting getMyOrders as fallback...');
          const response = await orderService.getMyOrders({ limit: 100 });
          console.log('getMyOrders response:', response);
          
          if (response.order && Array.isArray(response.order)) {
            ordersData = response.order;
            console.log('Found orders in response.order:', ordersData.length);
          } else if (response.orders && Array.isArray(response.orders)) {
            ordersData = response.orders;
            console.log('Found orders in response.orders:', ordersData.length);
          } else if (response.data?.order && Array.isArray(response.data.order)) {
            ordersData = response.data.order;
            console.log('Found orders in response.data.order:', ordersData.length);
          } else if (response.data?.orders && Array.isArray(response.data.orders)) {
            ordersData = response.data.orders;
            console.log('Found orders in response.data.orders:', ordersData.length);
          } else if (Array.isArray(response)) {
            ordersData = response;
            console.log('Found orders in response array:', ordersData.length);
          } else if (response.data && Array.isArray(response.data)) {
            ordersData = response.data;
            console.log('Found orders in response.data:', ordersData.length);
          }
        } catch (err) {
          console.log('getMyOrders failed:', err.message);
        }
      }
      
      console.log('Total orders fetched:', ordersData.length);
      console.log('All orders:', ordersData.map(o => ({ 
        id: o._id, 
        orderNumber: o.orderNumber, 
        status: o.status,
        createdAt: o.createdAt
      })));
      
      const activeOrders = ordersData
        .filter(order => {
          if (!order || !order.status) return false;
          if (order.status === OrderStatus.Completed) return false;
          if (order.status === OrderStatus.Shipped) return false;
          if (order.status === OrderStatus.ReadyForShipping) return false;
          if (order.status === OrderStatus.Delivered) return false;
          if (order.status === OrderStatus.Cancelled) return false;
          
          return ACTIVE_STATUSES.includes(order.status);
        })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      
      console.log('Active orders after filtering:', activeOrders.length);
      console.log('Active orders details:', activeOrders.map(o => ({ 
        orderNumber: o.orderNumber, 
        status: o.status 
      })));
      
      setOrders(activeOrders);
      setFilteredOrders(activeOrders);
      
    } catch (err) {
      console.error('Failed to fetch active orders:', err);
      setError('Unable to load your active orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (orderId) => {
    setAddingToOrder(orderId);
    sessionStorage.setItem('addingToOrderId', orderId);
    router.push('/collections/all/products');
  };

  const canAddProduct = (order) => {
    return EDITABLE_STATUSES.includes(order.status);
  };

  const getStatusMessage = (order) => {
    if (!canAddProduct(order)) {
      return "Cannot add products - order already in processing";
    }
    return "You can add more products to this order";
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-');
    } catch {
      return 'Invalid date';
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout userRole="customer">
        <SEOHead {...METADATA.dashboard.customer} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your active orders...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="customer">
      <SEOHead {...METADATA.dashboard.customer} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Active Orders</h1>
            <p className="text-gray-400 text-sm sm:text-base">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} in progress
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/new-order" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full sm:w-auto gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Order
              </Button>
            </Link>
            <Link href="/order-history" className="w-full sm:w-auto">
              <Button variant="outline" size="md" className="w-full sm:w-auto">
                View All Orders
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-200 text-sm flex-1">{error}</p>
            <button 
              onClick={fetchActiveOrders}
              className="text-sm text-red-400 hover:text-red-300 underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search by order number or product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            icon={
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-slate-900/50 rounded-xl border border-gray-800 p-8 sm:p-12 text-center">
            {searchTerm ? (
              <>
                <p className="text-gray-400 mb-3">No orders match your search</p>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="text-primary hover:text-primary-dark text-sm transition"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <div className="text-5xl sm:text-6xl mb-4">📦</div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No Active Orders</h3>
                <p className="text-gray-400 text-sm sm:text-base mb-6">You don't have any active orders at the moment</p>
                
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 p-3 bg-gray-800 rounded-lg text-left overflow-x-auto">
                    <p className="text-xs text-gray-400">Check the browser console (F12) for detailed logs</p>
                  </div>
                )}
                
                <Link href="/collections">
                  <Button variant="primary" size="lg">
                    Start Shopping
                  </Button>
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {filteredOrders.map((order) => (
              <div 
                key={order._id} 
                className="bg-slate-900/30 rounded-xl border border-gray-800 overflow-hidden"
              >
                <OrderCard 
                  order={{
                    id: order._id,
                    orderNumber: order.orderNumber || 'N/A',
                    productName: order.items?.[0]?.productName || 'Multiple Items',
                    orderedDate: formatDate(order.createdAt),
                    totalAmount: order.totalAmount || 0,
                    status: order.status || 'Unknown',
                    itemsCount: order.items?.length || 1
                  }}
                  onClick={() => router.push(`/orders/${order._id}`)}
                />
                
                {canAddProduct(order) && (
                  <div className="px-4 sm:px-6 pb-4 pt-2 border-t border-gray-800 mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-sm text-gray-400 text-center sm:text-left">
                        {getStatusMessage(order)}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddProduct(order._id)}
                        className="gap-2 w-full sm:w-auto"
                        disabled={addingToOrder === order._id}
                      >
                        {addingToOrder === order._id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Products
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {!canAddProduct(order) && !['Completed', 'Shipped', 'Delivered', 'Cancelled'].includes(order.status) && (
                  <div className="px-4 sm:px-6 pb-4 pt-2 border-t border-gray-800 mt-2">
                    <p className="text-sm text-yellow-500 text-center sm:text-left">
                      ⚠️ {getStatusMessage(order)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 rounded-lg border border-gray-800 p-4">
              <p className="text-gray-400 text-sm">Total Active Orders</p>
              <p className="text-2xl font-bold text-white">{orders.length}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg border border-gray-800 p-4">
              <p className="text-gray-400 text-sm">Editable Orders</p>
              <p className="text-2xl font-bold text-white">
                {orders.filter(o => EDITABLE_STATUSES.includes(o.status)).length}
              </p>
            </div>
            <div className="bg-slate-900/50 rounded-lg border border-gray-800 p-4 sm:col-span-2 lg:col-span-1">
              <p className="text-gray-400 text-sm">Total Value</p>
              <p className="text-2xl font-bold text-white">
                ₦{orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}