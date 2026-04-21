'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import Button from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import SEOHead from '@/components/common/SEOHead';
import { useAuthCheck } from '@/app/lib/auth';
import { orderService } from '@/services/orderService';
import { METADATA } from '@/lib/metadata';

export default function OrderManagementPage() {
  const router = useRouter();
  useAuthCheck();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getAll({ limit: 100 });
      let allOrders = [];
      if (response?.order && Array.isArray(response.order)) {
        allOrders = response.order;
      } else if (response?.orders && Array.isArray(response.orders)) {
        allOrders = response.orders;
      } else if (Array.isArray(response)) {
        allOrders = response;
      }
      setOrders(allOrders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await orderService.updateStatus(orderId, newStatus);
      await fetchOrders();
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Approved': 'green',
      'InProduction': 'blue',
      'Completed': 'purple',
      'AwaitingFinalPayment': 'yellow',
      'FinalPaid': 'green',
      'Cancelled': 'red',
      'PartPaymentMade': 'blue',
      'AwaitingPartPayment': 'orange'
    };
    return colors[status] || 'gray';
  };

  const getCustomerName = (order) => {
    if (order.userId?.fullname) return order.userId.fullname;
    if (order.userId?.email) return order.userId.email.split('@')[0];
    return 'Customer';
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toLocaleString() || '0'}`;
  };

  const isDepositOrder = (order) => {
    return order.requiredPaymentType === 'part';
  };

  const hasRemainingBalance = (order) => {
    return order.remainingBalance > 0;
  };

  const isFullyPaid = (order) => {
    return order.remainingBalance === 0 || order.paymentStatus === 'Completed';
  };

  const getActionButton = (order) => {
    if (updatingOrderId === order._id) {
      return (
        <Button variant="primary" size="sm" disabled className="min-w-[100px] sm:min-w-[120px]">
          <span className="flex items-center justify-center gap-2 text-xs sm:text-sm">
            <svg className="animate-spin h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Updating...
          </span>
        </Button>
      );
    }

    // Approved -> Start Production
    if (order.status === 'Approved') {
      return (
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleUpdateStatus(order._id, 'InProduction')}
          className="min-w-[100px] sm:min-w-[120px] text-xs sm:text-sm"
        >
          Start Production
        </Button>
      );
    }
    
    // InProduction -> Complete Production
    if (order.status === 'InProduction') {
      // For deposit orders with remaining balance, go to AwaitingFinalPayment
      // For full payment orders or deposit orders fully paid, go to Completed
      const isDepositWithBalance = isDepositOrder(order) && hasRemainingBalance(order);
      const nextStatus = isDepositWithBalance ? 'AwaitingFinalPayment' : 'Completed';
      
      const buttonText = isDepositWithBalance 
        ? 'Complete Production (Awaiting Final Payment)'
        : 'Complete Production';
      
      return (
        <Button
          variant="success"
          size="sm"
          onClick={() => handleUpdateStatus(order._id, nextStatus)}
          className="min-w-[100px] sm:min-w-[120px] text-xs sm:text-sm"
        >
          {buttonText}
        </Button>
      );
    }
    
    // Completed - Show status message based on payment type
    if (order.status === 'Completed') {
      if (isDepositOrder(order)) {
        if (hasRemainingBalance(order)) {
          return (
            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-800 whitespace-nowrap">
              ⚠️ Balance: {formatCurrency(order.remainingBalance)} - Should be AwaitingFinalPayment
            </span>
          );
        } else {
          return (
            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-green-900/30 text-green-400 border border-green-800 whitespace-nowrap">
              ✓ Fully Paid - Ready for Shipping
            </span>
          );
        }
      } else {
        if (isFullyPaid(order)) {
          return (
            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-green-900/30 text-green-400 border border-green-800 whitespace-nowrap">
              ✓ Fully Paid - Ready for Shipping
            </span>
          );
        } else {
          return (
            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-800 whitespace-nowrap">
              ⏳ Awaiting Full Payment
            </span>
          );
        }
      }
    }
    
    // AwaitingFinalPayment - Show final payment status
    if (order.status === 'AwaitingFinalPayment') {
      if (isFullyPaid(order)) {
        return (
          <Button
            variant="success"
            size="sm"
            onClick={() => handleUpdateStatus(order._id, 'Completed')}
            className="min-w-[100px] sm:min-w-[120px] text-xs sm:text-sm"
          >
            Mark as Complete
          </Button>
        );
      } else {
        return (
          <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-800 whitespace-nowrap">
            ⏳ Balance: {formatCurrency(order.remainingBalance)}
          </span>
        );
      }
    }
    
    // FinalPaid - Allow marking as complete
    if (order.status === 'FinalPaid') {
      if (isFullyPaid(order)) {
        return (
          <Button
            variant="success"
            size="sm"
            onClick={() => handleUpdateStatus(order._id, 'Completed')}
            className="min-w-[100px] sm:min-w-[120px] text-xs sm:text-sm"
          >
            Mark as Complete
          </Button>
        );
      } else {
        return (
          <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-red-900/30 text-red-400 border border-red-800 whitespace-nowrap">
            ⚠️ Payment Error
          </span>
        );
      }
    }
    
    // ReadyForShipping or Shipped
    if (order.status === 'ReadyForShipping' || order.status === 'Shipped') {
      return (
        <Link href={`/dashboards/admin-dashboard/shipping?orderId=${order._id}`}>
          <Button variant="secondary" size="sm" className="min-w-[100px] sm:min-w-[120px] text-xs sm:text-sm">
            View Shipping
          </Button>
        </Link>
      );
    }
    
    // Delivered
    if (order.status === 'Delivered') {
      return (
        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-green-900/30 text-green-400 border border-green-800 whitespace-nowrap">
          ✓ Delivered
        </span>
      );
    }
    
    // Cancelled
    if (order.status === 'Cancelled') {
      return (
        <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-red-900/30 text-red-400 border border-red-800 whitespace-nowrap">
          ✗ Cancelled
        </span>
      );
    }
    
    return null;
  };

  const getStatusMessage = (order) => {
    if (order.status === 'AwaitingFinalPayment') {
      return `Paid: ${formatCurrency(order.amountPaid)} | Balance: ${formatCurrency(order.remainingBalance)} - Awaiting final payment to complete order`;
    }
    
    if (order.status === 'Completed') {
      if (isDepositOrder(order)) {
        if (hasRemainingBalance(order)) {
          return `⚠️ ERROR: Deposit order with balance ${formatCurrency(order.remainingBalance)} should be in AwaitingFinalPayment status`;
        } else {
          return `Fully paid: ${formatCurrency(order.totalAmount)} - Customer can select shipping`;
        }
      } else {
        if (isFullyPaid(order)) {
          return `Fully paid: ${formatCurrency(order.totalAmount)} - Customer can select shipping`;
        } else {
          return `Payment pending: ${formatCurrency(order.totalAmount)} - Customer needs to pay`;
        }
      }
    }
    
    if (order.status === 'InProduction') {
      if (isDepositOrder(order) && hasRemainingBalance(order)) {
        return `Deposit paid: ${formatCurrency(order.amountPaid)}. After production, will require final payment of ${formatCurrency(order.remainingBalance)}`;
      }
      return `Order is in production`;
    }
    
    if (order.status === 'Approved') {
      if (isDepositOrder(order) && hasRemainingBalance(order)) {
        return `Deposit paid: ${formatCurrency(order.amountPaid)}. Ready to start production`;
      }
      return `Design approved. Ready to start production`;
    }
    
    return null;
  };

  const tabs = [
    { id: 'all', label: 'All Orders', color: 'gray' },
    { id: 'Approved', label: 'Approved', color: 'green' },
    { id: 'InProduction', label: 'In Production', color: 'blue' },
    { id: 'AwaitingFinalPayment', label: 'Awaiting Payment', color: 'yellow' },
    { id: 'Completed', label: 'Completed', color: 'purple' },
    { id: 'FinalPaid', label: 'Final Paid', color: 'green' },
    { id: 'Cancelled', label: 'Cancelled', color: 'red' },
  ];

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeTab);

  const getCountByStatus = (status) => {
    if (status === 'all') return orders.length;
    return orders.filter(o => o.status === status).length;
  };

  if (loading) {
    return (
      <>
        <SEOHead {...METADATA.dashboard.admin} />
        <DashboardLayout userRole="admin">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="relative text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-400 mt-4 text-sm sm:text-base">Loading orders...</p>
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
        <div className="space-y-5 sm:space-y-6 px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Order Management</h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Track production and payment status</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboards/admin-dashboard/shipping">
                <Button variant="secondary" size="sm" className="text-xs sm:text-sm">
                  Go to Shipping Management
                </Button>
              </Link>
              <Button
                variant="secondary"
                onClick={fetchOrders}
                size="sm"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
              <p className="text-xs sm:text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="border-b border-gray-800 overflow-x-auto pb-px">
            <nav className="flex gap-1 min-w-max">
              {tabs.map((tab) => {
                const count = getCountByStatus(tab.id);
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                      isActive 
                        ? `border-${tab.color}-500 text-${tab.color}-400` 
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className={`ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full text-xs ${
                        isActive ? `bg-${tab.color}-900/50 text-${tab.color}-400` : 'bg-gray-800 text-gray-400'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-slate-900/50 rounded-xl border border-gray-800 p-8 sm:p-12 text-center">
              <div className="text-4xl sm:text-5xl mb-3 opacity-50">📋</div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">No orders found</h3>
              <p className="text-xs sm:text-sm text-gray-400">
                {activeTab === 'all' 
                  ? "There are no orders in the system yet" 
                  : `No orders with status: ${activeTab}`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-slate-900/50 border border-gray-800 rounded-lg hover:border-gray-700 transition-all p-3 sm:p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-base sm:text-xl">📦</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm sm:text-base font-semibold text-white">{order.orderNumber}</h3>
                          <StatusBadge status={order.status} size="sm" />
                          {isDepositOrder(order) && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-900/50 text-blue-400">
                              Deposit: {formatCurrency(order.requiredDeposit)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {getCustomerName(order)} • {order.items?.length} item(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base sm:text-lg font-bold text-white">{formatCurrency(order.totalAmount)}</p>
                      <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div className="bg-slate-800/30 rounded-lg p-2">
                      <p className="text-xs font-medium text-gray-400 mb-1">Products</p>
                      <div className="space-y-1">
                        {order.items?.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-gray-300 truncate max-w-[120px] sm:max-w-[150px]">{item.productName}</span>
                            <span className="text-primary font-medium ml-2">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                        {order.items?.length > 2 && (
                          <p className="text-xs text-gray-500">+{order.items.length - 2} more</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-2">
                      <p className="text-xs font-medium text-gray-400 mb-1">Payment Details</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Status:</span>
                          <span className={`inline-block px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.paymentStatus === 'Completed' 
                              ? 'bg-green-900/50 text-green-400' 
                              : order.paymentStatus === 'PartPayment'
                              ? 'bg-yellow-900/50 text-yellow-400'
                              : 'bg-gray-900/50 text-gray-400'
                          }`}>
                            {order.paymentStatus || 'Pending'}
                          </span>
                        </div>
                        {order.requiredPaymentType && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Type:</span>
                            <span className="text-white capitalize">{order.requiredPaymentType}</span>
                          </div>
                        )}
                        {order.amountPaid > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Paid:</span>
                            <span className="text-green-400">{formatCurrency(order.amountPaid)}</span>
                          </div>
                        )}
                        {order.remainingBalance > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Balance:</span>
                            <span className="text-yellow-400">{formatCurrency(order.remainingBalance)}</span>
                          </div>
                        )}
                        {order.requiredDeposit > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Deposit:</span>
                            <span className="text-blue-400">{formatCurrency(order.requiredDeposit)}</span>
                          </div>
                        )}
                      </div>
                      
                      {getStatusMessage(order) && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <p className="text-xs text-gray-400">{getStatusMessage(order)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-gray-800">
                    {getActionButton(order)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}